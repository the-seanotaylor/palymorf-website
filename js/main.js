/* ── MAIN JS ────────────────────────────────── */

/* Nav scroll effect */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.style.boxShadow = window.scrollY > 20
    ? '0 2px 20px rgba(26,24,20,0.08)'
    : 'none';
});

/* Mobile hamburger */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

/* Close nav on link click */
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

/* Smooth active nav link highlight */
const sections = document.querySelectorAll('section[id], div[id]');
const navItems = document.querySelectorAll('.nav-links a');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navItems.forEach(a => {
        a.style.color = a.getAttribute('href') === `#${entry.target.id}`
          ? 'var(--ink)'
          : '';
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => observer.observe(s));

/* Fade-up animation on scroll */
const fadeEls = document.querySelectorAll('.founder-card, .step-card, .offer-card');
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '0';
      entry.target.style.animation = `fadeUp 0.5s ease ${i * 0.08}s forwards`;
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
fadeEls.forEach(el => {
  el.style.opacity = '0';
  fadeObserver.observe(el);
});

/* Assessment start button */
document.getElementById('startBtn').addEventListener('click', startAssessment);
document.getElementById('prevBtn').addEventListener('click', prevDomain);
document.getElementById('nextBtn').addEventListener('click', nextDomain);

/* Contact form */
function handleFormSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const success = document.getElementById('formSuccess');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  /* Replace this timeout with a real form handler (Formspree, EmailJS, etc.) */
  setTimeout(() => {
    btn.style.display = 'none';
    success.classList.remove('hidden');
    e.target.reset();
  }, 1000);
}
