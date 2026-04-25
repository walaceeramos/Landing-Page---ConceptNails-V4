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

const form = document.getElementById('bookingForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = document.getElementById('nome')?.value.trim() || '';
    const servico = document.getElementById('servico')?.value.trim() || 'Não informado';
    const dia = document.getElementById('dia')?.value.trim() || 'Não informado';
    const horario = document.getElementById('horario')?.value.trim() || 'Não informado';

    const linhas = [
      'Olá! Quero agendar um horário na ConceptNails.',
      nome ? `Meu nome é ${nome}.` : '',
      `Serviço: ${servico}`,
      `Melhor dia: ${dia}`,
      `Melhor horário: ${horario}`
    ].filter(Boolean);

    const mensagem = encodeURIComponent(linhas.join('\n'));
    window.open(`https://wa.me/5564992385744?text=${mensagem}`, '_blank');
  });
}

const revealItems = document.querySelectorAll(
  '.hero-copy, .hero-visual, .trust-item, .section-heading, .gallery-item, .service-card, .diff-card, .faq-card, .booking-copy, .booking-card, .quick-card'
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
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

