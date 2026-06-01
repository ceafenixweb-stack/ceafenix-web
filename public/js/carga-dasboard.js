


        
      // Carga dinámica de media del sitio desde el dashboard
      fetch("https://cea-backend-production.up.railway.app/api/public/site-media")
        .then((r) => r.json())
        .then((m) => {
          // Hero imagen de fondo
          if (m.hero_src) {
            const el = document.getElementById("hero-img-bg");
            if (el) {
              el.style.backgroundImage = "url(" + m.hero_src + ")";
              el.style.backgroundSize = "cover";
              el.style.backgroundPosition = "center";
            }
          }
          // Video de servicios
          if (m.servicios_video_url) {
            const el = document.getElementById("iframe-servicios");
            if (el) el.src = m.servicios_video_url;
          }
          // Textos hero
          if (m.hero_titulo) {
            const el = document.querySelector("#hero .highlight");
            if (el) el.textContent = m.hero_titulo;
          }
          if (m.hero_subtitulo) {
            const el = document.querySelector("#hero > .titulo > p");
            if (el) el.innerHTML = m.hero_subtitulo;
          }
        })
        .catch(() => {});