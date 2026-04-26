/* ============================================
   LAKAM — Main JS
   Navbar scroll, mobile menu, reveal, lightbox
   ============================================ */

(() => {
  // ==== Navbar scroll state ====
  const navbar = document.getElementById('navbar');
  let lastY = window.pageYOffset || document.documentElement.scrollTop || 0;

  const onScroll = () => {
    const y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (y > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    if (y > 100 && y > lastY) navbar.classList.add('hidden');
    else if (y < lastY || y < 50) navbar.classList.remove('hidden');

    lastY = y;
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ==== Mobile menu ====
  const toggle = document.getElementById('menuToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
      });
    });
  }

  // ==== Reveal on scroll ====
  const reveals = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );
  reveals.forEach((el) => io.observe(el));

  // ==== Lightbox ====
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  if (lightbox) {
    document.querySelectorAll('.gallery-item').forEach((item) => {
      item.addEventListener('click', () => {
        const src = item.dataset.img;
        if (src) {
          lightboxImg.src = src;
          lightbox.classList.add('open');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    };

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
  }

  // ==== Smooth scroll for anchor links (in case scroll-behavior fails) ====
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
