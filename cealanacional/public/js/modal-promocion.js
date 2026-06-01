
(function() {
  const DURATION = 10;
  const overlay  = document.getElementById('promo-overlay');
  const closeBtn = document.getElementById('promo-close');
  const skipBtn  = document.getElementById('promo-skip');
  const circle   = document.getElementById('promo-timer-circle');
  const numEl    = document.getElementById('promo-timer-num');
  if (!overlay) return;

  const CIRCUMFERENCE = 95.5;
  let timer, secondsLeft = DURATION;

  function open() {
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    startTimer();
  }
  function close() {
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
    clearInterval(timer);
  }
  function startTimer() {
    secondsLeft = DURATION;
    numEl.textContent = secondsLeft;
    circle.style.strokeDashoffset = 0;
    timer = setInterval(() => {
      secondsLeft--;
      numEl.textContent = secondsLeft;
      const offset = CIRCUMFERENCE * (1 - secondsLeft / DURATION);
      circle.style.strokeDashoffset = offset;
      if (secondsLeft <= 0) close();
    }, 1000);
  }

  closeBtn?.addEventListener('click', close);
  skipBtn?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // Cargar configuracion exclusiva de Mocoa desde la API
  fetch('https://cea-backend-production.up.railway.app/api/public/promo-mocoa')
    .then(r => r.json())
    .then(cfg => {
      if (cfg.mocoa_promo_activo === '0') return;

      const titleEl = document.getElementById('promo-title');
      if (titleEl && cfg.mocoa_promo_titulo) titleEl.textContent = cfg.mocoa_promo_titulo;

      const descEl = document.getElementById('promo-desc');
      if (descEl && cfg.mocoa_promo_descripcion) descEl.textContent = cfg.mocoa_promo_descripcion;

      // Badge — texto + estilos personalizados
      const badgeEl = document.getElementById('promo-badge');
      if (badgeEl) {
        if (cfg.mocoa_promo_badge)       badgeEl.textContent = cfg.mocoa_promo_badge;
        if (cfg.mocoa_promo_badge_bg)    badgeEl.style.background = cfg.mocoa_promo_badge_bg;
        if (cfg.mocoa_promo_badge_color) badgeEl.style.color = cfg.mocoa_promo_badge_color;
        if (cfg.mocoa_promo_badge_size)  badgeEl.style.fontSize = cfg.mocoa_promo_badge_size + 'px';
        badgeEl.style.fontWeight = cfg.mocoa_promo_badge_bold === '1' ? '800' : '500';
        badgeEl.style.textAlign  = cfg.mocoa_promo_badge_align || 'left';
        badgeEl.style.direction  = (cfg.mocoa_promo_badge_align === 'right') ? 'rtl' : 'ltr';
      }

      const waEl = document.getElementById('promo-cta-wa');
      if (waEl) {
        if (cfg.mocoa_promo_wa_link) waEl.href = cfg.mocoa_promo_wa_link;
        if (cfg.mocoa_promo_wa_texto) waEl.innerHTML = '<i class="fa-brands fa-whatsapp"></i> ' + cfg.mocoa_promo_wa_texto;
      }

      // Media: solo imagen O video — mutuamente excluyentes
      const mediaEl = document.getElementById('promo-media');
      if (mediaEl && cfg.mocoa_promo_media_src) {
        const tipo = cfg.mocoa_promo_media_tipo || 'imagen';
        mediaEl.querySelectorAll('img, iframe, .promo-placeholder').forEach(el => el.remove());
        if (tipo === 'video') {
          let src = cfg.mocoa_promo_media_src;
          const yt = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
          if (yt) src = 'https://www.youtube.com/embed/' + yt[1] + '?autoplay=1&mute=1';
          const iframe = document.createElement('iframe');
          iframe.src = src;
          iframe.allow = 'autoplay; encrypted-media';
          iframe.allowFullscreen = true;
          mediaEl.insertBefore(iframe, mediaEl.firstChild);
        } else {
          const img = document.createElement('img');
          img.src = cfg.mocoa_promo_media_src;
          img.alt = cfg.mocoa_promo_titulo || 'Promocion Mocoa';
          mediaEl.insertBefore(img, mediaEl.firstChild);
        }
      }

      setTimeout(open, 1200);
    })
    .catch(() => {
      // Si falla la API, no mostrar el modal (solo se activa desde el dashboard)
    });
})();