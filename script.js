// ==========================================================================
// CONCEPTNAILS V3 - INTERATIVIDADE DA LANDING PAGE
// ==========================================================================

// --- MENU MOBILE ---
const toggle = document.querySelector('.menu-toggle');
const header = document.querySelector('.site-header');
const navLinks = document.querySelectorAll('.nav a');

if (toggle && header) {
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    header.classList.toggle('menu-open');
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// --- FORMULÁRIO DE PRÉ-ATENDIMENTO ---
const preForm = document.getElementById('preBookingForm');
const fieldMenor = document.getElementById('p_menor');
const ageFieldContainer = document.getElementById('ageFieldContainer');
const fieldIdade = document.getElementById('p_idade');
const fieldTelefone = document.getElementById('p_telefone');

if (preForm) {
  // 1. Mostrar/Ocultar campo idade de forma condicional
  fieldMenor.addEventListener('change', () => {
    if (fieldMenor.value === 'sim') {
      ageFieldContainer.classList.add('is-visible');
      fieldIdade.setAttribute('required', 'required');
    } else {
      ageFieldContainer.classList.remove('is-visible');
      fieldIdade.removeAttribute('required');
      fieldIdade.value = '';
      clearError(fieldIdade);
    }
  });

  // 2. Máscara em tempo real para Telefone: (XX) XXXXX-XXXX
  fieldTelefone.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Apenas números
    if (value.length > 11) value = value.slice(0, 11); // Limite de 11 dígitos

    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    e.target.value = value;
  });

  // Limpar erros ao digitar ou selecionar
  const fieldsToWatch = preForm.querySelectorAll('input, select, textarea');
  fieldsToWatch.forEach((field) => {
    field.addEventListener('input', () => clearError(field));
    field.addEventListener('change', () => clearError(field));
  });

  // 3. Validação e Submissão do Formulário
  preForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let isValid = true;

    // Elementos principais do formulário
    const nome = document.getElementById('p_nome');
    const servico = document.getElementById('p_servico');
    const checkboxes = preForm.querySelectorAll('.checkboxes-wrapper input[type="checkbox"]');
    const checkErrorMsg = document.getElementById('checkboxes-error');

    // Validar Nome Completo
    if (!nome.value.trim() || nome.value.trim().split(' ').length < 2) {
      showError(nome);
      isValid = false;
    } else {
      clearError(nome);
    }

    // Validar Telefone (Máscara completa exige 11 números, ex: (64) 99999-9999)
    const cleanPhone = fieldTelefone.value.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showError(fieldTelefone);
      isValid = false;
    } else {
      clearError(fieldTelefone);
    }

    // Validar Idade (se for menor)
    if (fieldMenor.value === 'sim') {
      const idadeVal = parseInt(fieldIdade.value, 10);
      if (!fieldIdade.value || isNaN(idadeVal) || idadeVal < 1 || idadeVal >= 18) {
        showError(fieldIdade);
        isValid = false;
      } else {
        clearError(fieldIdade);
      }
    }

    // Validar Serviço desejado
    if (!servico.value) {
      showError(servico);
      isValid = false;
    } else {
      clearError(servico);
    }

    // Validar todos os Checkboxes obrigatórios
    let allChecksChecked = true;
    checkboxes.forEach((cb) => {
      if (!cb.checked) {
        allChecksChecked = false;
      }
    });

    if (!allChecksChecked) {
      checkErrorMsg.style.display = 'block';
      isValid = false;
    } else {
      checkErrorMsg.style.display = 'none';
    }

    // Se todos os campos forem válidos, exibe a tela de sucesso
    if (isValid) {
      showSuccessState();
    }
  });

  // Voltar ao formulário para edição
  const btnBack = document.getElementById('btnBackToForm');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      document.getElementById('formStepContent').style.display = 'block';
      document.getElementById('formSuccessContent').style.display = 'none';
      
      // Scroll suave de volta para o topo do formulário
      preForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
}

// Auxiliares de erro
function showError(input) {
  const group = input.closest('.input-group');
  if (group) group.classList.add('has-error');
}

function clearError(input) {
  const group = input.closest('.input-group');
  if (group) group.classList.remove('has-error');

  // Se for um checkbox, verifica se todos os checkboxes de termos estão marcados para limpar o erro
  if (input.type === 'checkbox') {
    const checkboxes = document.querySelectorAll('.checkboxes-wrapper input[type="checkbox"]');
    const checkErrorMsg = document.getElementById('checkboxes-error');
    if (checkboxes && checkErrorMsg) {
      let allChecked = true;
      checkboxes.forEach((cb) => {
        if (!cb.checked) allChecked = false;
      });
      if (allChecked) {
        checkErrorMsg.style.display = 'none';
      }
    }
  }
}

// 4. Mostrar Tela de Sucesso e gerar link estruturado do WhatsApp
function showSuccessState() {
  const nome = document.getElementById('p_nome').value.trim();
  const telefone = document.getElementById('p_telefone').value.trim();
  const menor = document.getElementById('p_menor').value === 'sim' ? `Sim (Idade: ${document.getElementById('p_idade').value} anos)` : 'Não';
  const servico = document.getElementById('p_servico').value;
  const dia = document.getElementById('p_dia').value.trim() || 'A combinar';
  const horario = document.getElementById('p_horario').value.trim() || 'A combinar';
  const decoracao = document.getElementById('p_decoracao').value.trim() || 'Nenhuma (ou a combinar)';
  const obs = document.getElementById('p_obs').value.trim() || 'Nenhuma';

  // Mensagem estruturada para o WhatsApp
  const msgLinhas = [
    `Olá, ConceptNails! Quero confirmar meu agendamento. Aqui estão meus dados preenchidos:`,
    ``,
    `📌 DADOS DA CLIENTE`,
    `• Nome: ${nome}`,
    `• WhatsApp: ${telefone}`,
    `• É Menor de Idade? ${menor}`,
    ``,
    `💅 DETALHES DO PROCEDIMENTO`,
    `• Serviço: ${servico}`,
    `• Dia pretendido: ${dia}`,
    `• Horário pretendido: ${horario}`,
    `• Decoração: ${decoracao}`,
    `• Observações/Referência: ${obs}`,
    ``,
    `✨ DECLARAÇÃO DE ACEITE`,
    `[x] Confirmo que preenchi os dados corretamente, li e estou 100% de acordo com as regras de agendamento, atrasos e política de sinal (50% não reembolsável em caso de ausência).`
  ];

  const mensagemTexto = msgLinhas.join('\n');
  
  // Injetar resumo na visualização
  const previewBox = document.getElementById('whatsappMessagePreview');
  if (previewBox) {
    previewBox.textContent = mensagemTexto;
  }

  // Injetar nome no cabeçalho
  const clientNameSpan = document.getElementById('success-client-name');
  if (clientNameSpan) {
    clientNameSpan.textContent = nome.split(' ')[0]; // Apenas o primeiro nome
  }

  // Configurar link do WhatsApp no botão final
  const btnWhatsApp = document.getElementById('btnSubmitWhatsApp');
  if (btnWhatsApp) {
    const encodedMessage = encodeURIComponent(mensagemTexto);
    btnWhatsApp.href = `https://wa.me/5564992385744?text=${encodedMessage}`;
  }

  // Ocultar formulário e exibir tela de sucesso suavemente
  document.getElementById('formStepContent').style.display = 'none';
  const successContent = document.getElementById('formSuccessContent');
  successContent.style.display = 'block';

  // Rolar suavemente até o topo do formulário
  preForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// --- CLIQUE EM SERVIÇOS E FLUXO DINÂMICO ---
const serviceLinks = document.querySelectorAll('.service-link-cta');
const serviceHelp = document.querySelector('[data-service-help]');

if (serviceLinks.length > 0 && preForm) {
  serviceLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const selectedService = link.getAttribute('data-service');
      const selectElement = document.getElementById('p_servico');
      
      if (selectElement && selectedService) {
        selectElement.value = selectedService;
        clearError(selectElement);
      }
    });
  });
}

if (serviceHelp && preForm) {
  serviceHelp.addEventListener('click', () => {
    const selectElement = document.getElementById('p_servico');
    if (selectElement) {
      selectElement.value = ''; // Reseta para que escolha ou combine
      clearError(selectElement);
    }
  });
}

// --- SCROLL REVEAL (INTERSECTION OBSERVER) ---
const revealItems = document.querySelectorAll(
  '.hero-copy, .hero-visual, .trust-item, .section-heading, .gallery-item, .service-card, .diff-card, .faq-card, .rules-container, .pre-booking-card, .booking-visual-card, .quick-card'
);

revealItems.forEach((item) => item.classList.add('reveal'));

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

// --- INTERATIVIDADE DE PERSPECTIVA 3D E PARALLAX POR MOUSE (DESATIVADO PARA DEIXAR A IMAGEM TOTALMENTE FIXA) ---
/*
const heroVisual = document.querySelector('.hero-visual');
const heroCard = document.querySelector('.hero-card-perspective');
const heroOrganicShape = document.querySelector('.hero-organic-shape');
const floatingBadges = document.querySelectorAll('.floating-badge');

if (heroVisual && heroCard && heroOrganicShape && window.innerWidth > 820) {
  // Configurações de transição inicial
  heroCard.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
  heroOrganicShape.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
  floatingBadges.forEach(badge => {
    badge.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.3s, border-color 0.3s, box-shadow 0.3s';
  });

  heroVisual.addEventListener('mousemove', (e) => {
    const rect = heroVisual.getBoundingClientRect();
    const x = e.clientX - rect.left; // Coordenada X relativa
    const y = e.clientY - rect.top;  // Coordenada Y relativa
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Fator de escala normalizado (-1 a 1)
    const percentX = (x - centerX) / centerX;
    const percentY = (y - centerY) / centerY;
    
    // 1. Rotação 3D sutil no Card Principal (Foto)
    const tiltMaxX = 6; // Grau máximo de inclinação
    const tiltMaxY = 6;
    const rotateX = (-percentY * tiltMaxY).toFixed(2);
    const rotateY = (percentX * tiltMaxX).toFixed(2);
    heroCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    
    // 2. Translação oposta sutil no Shape Orgânico de Fundo (Pebble Parallax)
    const shapeShiftX = (-percentX * 16).toFixed(1);
    const shapeShiftY = (-percentY * 14).toFixed(1);
    heroOrganicShape.style.transform = `translate(${shapeShiftX}px, ${shapeShiftY}px) scale(1.02)`;
    
    // 3. Efeito Parallax nos Badges Flutuantes de acordo com 'data-depth'
    floatingBadges.forEach(badge => {
      const depth = parseFloat(badge.getAttribute('data-depth')) || 0.15;
      const badgeShiftX = (percentX * depth * 55).toFixed(1);
      const badgeShiftY = (percentY * depth * 55).toFixed(1);
      
      badge.style.transform = `translate3d(${badgeShiftX}px, ${badgeShiftY}px, 0px)`;
    });
  });

  // Redefinir posições quando o mouse sair da seção visual
  heroVisual.addEventListener('mouseleave', () => {
    heroCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
    heroOrganicShape.style.transform = ''; // Restaura a animação CSS organicBreathe perfeitamente!
    floatingBadges.forEach(badge => {
      badge.style.transform = 'translate3d(0px, 0px, 0px)';
    });
  });
}
*/

