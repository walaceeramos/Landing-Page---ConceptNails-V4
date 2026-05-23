const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { google } = require('googleapis');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

// Duração dos procedimentos em minutos
const SERVICE_DURATIONS = {
  'Nail art': 180,       // 3 horas
  'Alongamento': 180,    // 3 horas
  'Blindagem': 120,      // 2 horas
  'Esmaltação': 90       // 1.5 horas
};

// Blocos fixos de atendimento no estúdio (Horário de Caldas Novas - GO)
const STANDARD_SLOTS = ['08:00', '11:00', '14:00', '17:00'];
const TIMEZONE_OFFSET = '-03:00'; // Caldas Novas - GO (America/Sao_Paulo)

// Inicializar Google Calendar API
let calendar = null;
let isDemoMode = false;

if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !CALENDAR_ID) {
  console.warn('⚠️ ATENÇÃO: Credenciais do Google Agenda ausentes no arquivo .env.');
  console.warn('⚠️ O backend funcionará em MOCK/DEMO MODE (Horários simulados).');
  isDemoMode = true;
} else {
  try {
    const auth = new google.auth.JWT(
      SERVICE_ACCOUNT_EMAIL,
      null,
      PRIVATE_KEY,
      ['https://www.googleapis.com/auth/calendar']
    );
    calendar = google.calendar({ version: 'v3', auth });
    console.log('✅ Google Calendar API inicializada com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao inicializar a autenticação do Google Agenda:', error.message);
    console.warn('⚠️ Revertendo para MOCK/DEMO MODE.');
    isDemoMode = true;
  }
}

/**
 * Endpoint: Verificar disponibilidade de horários
 * GET /api/available-slots?date=YYYY-MM-DD&service=Alongamento
 */
app.get('/api/available-slots', async (req, res) => {
  const { date, service } = req.query;

  if (!date || !service) {
    return res.status(400).json({ error: 'Os parâmetros "date" (YYYY-MM-DD) e "service" são obrigatórios.' });
  }

  const duration = SERVICE_DURATIONS[service] || 180; // 3h padrão

  // --- SE FOR DEMO MODE ---
  if (isDemoMode) {
    // Retorna todos os slots livres, simulando o das 11:00 ocupado para demonstração visual
    const mockSlots = STANDARD_SLOTS.map(time => ({
      time,
      available: time !== '11:00'
    }));
    return res.json({ slots: mockSlots, demo: true });
  }

  // --- CONSULTA REAL GOOGLE CALENDAR ---
  try {
    // Definir período de consulta (do início do primeiro bloco até o fim do último bloco mais a duração)
    const timeMin = `${date}T08:00:00${TIMEZONE_OFFSET}`;
    const timeMax = `${date}T20:00:00${TIMEZONE_OFFSET}`;

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone: 'America/Sao_Paulo',
        items: [{ id: CALENDAR_ID }]
      }
    });

    const busyIntervals = response.data.calendars[CALENDAR_ID].busy || [];

    // Avaliar cada slot padrão
    const slotsWithAvailability = STANDARD_SLOTS.map(slotTime => {
      const slotStart = new Date(`${date}T${slotTime}:00${TIMEZONE_OFFSET}`);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000); // Soma duração em ms

      // Verificar se coincide com algum período de ocupação
      const isBusy = busyIntervals.some(busy => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);

        // Há sobreposição se: slot inicia antes do busy terminar E slot termina depois do busy começar
        return slotStart.getTime() < busyEnd.getTime() && slotEnd.getTime() > busyStart.getTime();
      });

      return {
        time: slotTime,
        available: !isBusy
      };
    });

    res.json({ slots: slotsWithAvailability });
  } catch (error) {
    console.error('❌ Erro ao consultar disponibilidade no Google Agenda:', error.message);
    res.status(500).json({ error: 'Erro interno ao consultar agenda. Tente novamente mais tarde.' });
  }
});

/**
 * Endpoint: Confirmar e Criar agendamento
 * POST /api/book
 */
app.post('/api/book', async (req, res) => {
  const { nome, telefone, servico, dia, horario, decoracao, observacoes } = req.body;

  if (!nome || !telefone || !servico || !dia || !horario) {
    return res.status(400).json({ error: 'Os campos nome, telefone, servico, dia e horario são obrigatórios.' });
  }

  const duration = SERVICE_DURATIONS[servico] || 180;

  // --- SE FOR DEMO MODE ---
  if (isDemoMode) {
    return res.json({ success: true, message: 'Agendamento simulado com sucesso (Demo Mode).', demo: true });
  }

  // --- FLUXO REAL GOOGLE CALENDAR ---
  try {
    const slotStart = new Date(`${dia}T${horario}:00${TIMEZONE_OFFSET}`);
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    // 1. Double-Check de disponibilidade (Garantir exclusão mútua no último segundo)
    const checkResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: slotStart.toISOString(),
        timeMax: slotEnd.toISOString(),
        timeZone: 'America/Sao_Paulo',
        items: [{ id: CALENDAR_ID }]
      }
    });

    const busyIntervals = checkResponse.data.calendars[CALENDAR_ID].busy || [];
    const isBusy = busyIntervals.some(busy => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      return slotStart.getTime() < busyEnd.getTime() && slotEnd.getTime() > busyStart.getTime();
    });

    if (isBusy) {
      return res.status(409).json({ error: 'Desculpe, este horário foi reservado por outra cliente há instantes. Por favor, escolha outra opção.' });
    }

    // 2. Criar Evento no Google Calendar
    const event = {
      summary: `💅 ${nome} - ${servico}`,
      description: `📋 Ficha de Agendamento:\n` +
                   `• Cliente: ${nome}\n` +
                   `• Telefone: ${telefone}\n` +
                   `• Serviço: ${servico}\n` +
                   `• Decoração: ${decoracao || 'Nenhuma'}\n` +
                   `• Observações: ${observacoes || 'Nenhuma'}`,
      start: {
        dateTime: slotStart.toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      end: {
        dateTime: slotEnd.toISOString(),
        timeZone: 'America/Sao_Paulo'
      },
      reminders: {
        useDefault: true
      }
    };

    const createdEvent = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event
    });

    res.json({
      success: true,
      message: 'Agendamento criado com sucesso no Google Agenda!',
      eventId: createdEvent.data.id
    });

  } catch (error) {
    console.error('❌ Erro ao criar evento no Google Agenda:', error.message);
    res.status(500).json({ error: 'Erro interno ao realizar agendamento no Google Agenda.' });
  }
});

// Inicializar Servidor Express
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`);
});
