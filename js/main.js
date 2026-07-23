const reveals = document.querySelectorAll(".reveal");
const menuToggle = document.getElementById("menu-toggle");
const navbar = document.getElementById("navbar");
const texts = document.querySelectorAll(".text-slider h3");
const backToTop = document.getElementById("backToTop");
let current = 0;

/* =========================
   SCROLL REVEAL
========================= */
window.addEventListener("scroll", () => {
  reveals.forEach(el => {
    const top = el.getBoundingClientRect().top;
    if (top < window.innerHeight - 100) el.classList.add("active");
  });
});

/* =========================
   MENÚ MOBILE — cierra al hacer clic en un link
========================= */
if (menuToggle && navbar) {
  menuToggle.addEventListener("click", () => {
    navbar.classList.toggle("show");
    const isOpen = navbar.classList.contains("show");
    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.innerHTML = isOpen ? "✕" : "☰";
  });

  // Cerrar menú al hacer clic en cualquier link del navbar
  navbar.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navbar.classList.remove("show");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.innerHTML = "☰";
    });
  });

  // Cerrar al hacer clic fuera del menú
  document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target) && !menuToggle.contains(e.target)) {
      navbar.classList.remove("show");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.innerHTML = "☰";
    }
  });
}

/* =========================
   SLIDER NOSOTROS
========================= */
function changeText() {
  texts[current].classList.remove("active");
  current = (current + 1) % texts.length;
  texts[current].classList.add("active");
}
if (texts.length > 0) {
  texts[0].classList.add("active");
  setInterval(changeText, 3000);
}

/* =========================
   BOTÓN IR ARRIBA
========================= */
if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* =========================
   MODO OSCURO
========================= */
const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeToggle.innerHTML = isDark
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>';
  });
}
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  if (themeToggle) themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
}

/* =========================
   INTERSECTION OBSERVER
========================= */
const hiddenElements = document.querySelectorAll(".hidden");
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    } else {
      entry.target.classList.remove("show");
    }
  });
});
hiddenElements.forEach((el) => observer.observe(el));
