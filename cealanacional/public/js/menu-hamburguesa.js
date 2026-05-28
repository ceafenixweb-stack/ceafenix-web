
      // ── Menú hamburguesa
      const toggle = document.getElementById("menu-toggle");
      const navbar = document.getElementById("navbar");
      toggle?.addEventListener("click", () => {
        const open = navbar.classList.toggle("show");
        toggle.textContent = open ? "✕" : "☰";
        toggle.setAttribute("aria-expanded", open);
      });
      navbar?.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          navbar.classList.remove("show");
          toggle.textContent = "☰";
        });
      });
      document.addEventListener("click", (e) => {
        if (!navbar?.contains(e.target) && !toggle?.contains(e.target)) {
          navbar?.classList.remove("show");
          if (toggle) toggle.textContent = "☰";
        }
      });

      // ── Dark mode
      const themeBtn = document.getElementById("theme-toggle");
      if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        if (themeBtn) themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      }
      themeBtn?.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const dark = document.body.classList.contains("dark-mode");
        localStorage.setItem("theme", dark ? "dark" : "light");
        themeBtn.innerHTML = dark
          ? '<i class="fa-solid fa-sun"></i>'
          : '<i class="fa-solid fa-moon"></i>';
      });

      // ── Formulario de contacto
      // Reemplaza con tus credenciales de https://emailjs.com
      const EJ_KEY = "TU_PUBLIC_KEY";
      const EJ_SERVICE = "TU_SERVICE_ID";
      const EJ_TEMPLATE = "TU_TEMPLATE_ID";
      if (EJ_KEY !== "TU_PUBLIC_KEY") emailjs.init({ publicKey: EJ_KEY });

      const telInput = document.getElementById("cf_tel");
      const telHint = document.getElementById("cf_tel_hint");
      const form = document.getElementById("form-mocoa");
      const submitBtn = document.getElementById("cf_submit");
      const btnText = document.getElementById("cf_btn_text");
      const btnLoad = document.getElementById("cf_btn_load");
      const feedback = document.getElementById("cf_feedback");

      telInput?.addEventListener("input", () => {
        const v = telInput.value.trim();
        if (!v) {
          telInput.className = "";
          return;
        }
        const ok = /^(\+?57)?[3][0-9]{9}$/.test(v.replace(/\s/g, ""));
        telInput.className = ok ? "input-ok" : "input-error";
        telHint.textContent = ok
          ? "✓ Número válido"
          : "Formato: 3XXXXXXXXX o +573XXXXXXXXX";
        telHint.style.color = ok ? "#059669" : "#dc2626";
      });

      form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const tel = telInput.value.trim();
        if (tel && !/^(\+?57)?[3][0-9]{9}$/.test(tel.replace(/\s/g, ""))) {
          telInput.focus();
          return;
        }
        if (EJ_KEY === "TU_PUBLIC_KEY") {
          feedback.className = "cf-feedback err";
          feedback.innerHTML =
            '⚠️ EmailJS no configurado. Por ahora escríbenos por <a href="https://wa.me/573001234568" target="_blank">WhatsApp</a>.';
          feedback.style.display = "block";
          return;
        }
        btnText.style.display = "none";
        btnLoad.style.display = "flex";
        submitBtn.disabled = true;
        feedback.style.display = "none";
        try {
          await emailjs.sendForm(EJ_SERVICE, EJ_TEMPLATE, form);
          feedback.className = "cf-feedback ok";
          feedback.textContent =
            "✅ ¡Mensaje enviado! Te contactaremos pronto.";
          form.reset();
          telInput.className = "";
        } catch (err) {
          feedback.className = "cf-feedback err";
          feedback.innerHTML =
            '❌ Error al enviar. Escríbenos por <a href="https://wa.me/573001234568" target="_blank">WhatsApp</a>.';
        } finally {
          btnText.style.display = "flex";
          btnLoad.style.display = "none";
          submitBtn.disabled = false;
          feedback.style.display = "block";
        }
      });