
      (function () {
        const DURATION = 10;
        const overlay = document.getElementById("promo-overlay");
        const closeBtn = document.getElementById("promo-close");
        const skipBtn = document.getElementById("promo-skip");
        const circle = document.getElementById("promo-timer-circle");
        const numEl = document.getElementById("promo-timer-num");
        if (!overlay) return;

        const CIRCUMFERENCE = 95.5;
        let timer,
          secondsLeft = DURATION;

        function open() {
          overlay.classList.add("visible");
          document.body.style.overflow = "hidden";
          startTimer();
        }
        function close() {
          overlay.classList.remove("visible");
          document.body.style.overflow = "";
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

        closeBtn?.addEventListener("click", close);
        skipBtn?.addEventListener("click", close);
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) close();
        });
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape") close();
        });

        // Cargar configuración dinámica desde la API
        fetch("https://cea-backend-production.up.railway.app/api/public/promo")
          .then((r) => r.json())
          .then((cfg) => {
            // Si está desactivado, no mostrar
            if (cfg.promo_activo === "0") return;

            // Título
            const titleEl = document.getElementById("promo-title");
            if (titleEl && cfg.promo_titulo)
              titleEl.textContent = cfg.promo_titulo;

            // Descripción
            const descEl = document.getElementById("promo-desc");
            if (descEl && cfg.promo_descripcion)
              descEl.textContent = cfg.promo_descripcion;

            // Badge — texto + estilos personalizados
            const badgeEl = document.getElementById("promo-badge");
            if (badgeEl) {
              if (cfg.promo_badge) badgeEl.textContent = cfg.promo_badge;
              if (cfg.promo_badge_bg)
                badgeEl.style.background = cfg.promo_badge_bg;
              if (cfg.promo_badge_color)
                badgeEl.style.color = cfg.promo_badge_color;
              if (cfg.promo_badge_size)
                badgeEl.style.fontSize = cfg.promo_badge_size + "px";
              badgeEl.style.fontWeight =
                cfg.promo_badge_bold === "1" ? "800" : "500";
              badgeEl.style.textAlign = cfg.promo_badge_align || "left";
              badgeEl.style.direction =
                cfg.promo_badge_align === "right" ? "rtl" : "ltr";
            }

            // Link WhatsApp
            const waEl = document.getElementById("promo-cta-wa");
            if (waEl) {
              if (cfg.promo_wa_link) waEl.href = cfg.promo_wa_link;
              if (cfg.promo_wa_texto)
                waEl.innerHTML =
                  '<i class="fa-brands fa-whatsapp"></i> ' + cfg.promo_wa_texto;
            }

            // Media: solo imagen O video — mutuamente excluyentes
            const mediaEl = document.getElementById("promo-media");
            if (mediaEl && cfg.promo_media_src) {
              const tipo = cfg.promo_media_tipo || "imagen";
              // Limpiar todo: placeholder, img anterior, iframe anterior
              mediaEl
                .querySelectorAll("img, iframe, .promo-placeholder")
                .forEach((el) => el.remove());

              if (tipo === "video") {
                let src = cfg.promo_media_src;
                const ytMatch = src.match(
                  /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/,
                );
                if (ytMatch)
                  src =
                    "https://www.youtube.com/embed/" +
                    ytMatch[1] +
                    "?autoplay=1&mute=1";
                const iframe = document.createElement("iframe");
                iframe.src = src;
                iframe.allow = "autoplay; encrypted-media";
                iframe.allowFullscreen = true;
                mediaEl.insertBefore(iframe, mediaEl.firstChild);
              } else {
                const img = document.createElement("img");
                img.src = cfg.promo_media_src;
                img.alt = cfg.promo_titulo || "Promocion";
                mediaEl.insertBefore(img, mediaEl.firstChild);
              }
            }

            // Abrir después de 1.2s
            setTimeout(open, 1200);
          })
          .catch(() => {
            // Si falla la API, no mostrar el modal (solo se activa desde el dashboard)
          });
      })();