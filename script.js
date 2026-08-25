(() => {
  const header = document.getElementById("header");
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("nav");
  const links = [...document.querySelectorAll(".nav-link")];
  const sections = [...document.querySelectorAll("main section[id]")];
  const form = document.getElementById("contact-form");
  const formError = document.getElementById("form-error");
  const year = document.getElementById("year");

  if (year) year.textContent = String(new Date().getFullYear());

  const setHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  const closeNav = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
    document.body.classList.remove("nav-open");
  };

  const openNav = () => {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menú");
    document.body.classList.add("nav-open");
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", id);
  });

  toggle.addEventListener("click", () => {
    nav.classList.contains("is-open") ? closeNav() : openNav();
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeNav();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });

  const setActiveLink = () => {
    const position = window.scrollY + 120;
    let current = "inicio";

    for (const section of sections) {
      if (position >= section.offsetTop) current = section.id;
    }

    for (const link of links) {
      const isActive = link.getAttribute("href") === `#${current}`;
      link.classList.toggle("is-active", isActive);
    }
  };

  window.addEventListener("scroll", () => {
    setHeaderState();
    setActiveLink();
  }, { passive: true });

  setHeaderState();
  setActiveLink();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formError.hidden = true;

    const data = new FormData(form);
    const nombre = String(data.get("nombre") || "").trim();
    const email = String(data.get("email") || "").trim();
    const mensaje = String(data.get("mensaje") || "").trim();

    if (!nombre || !email || !mensaje) {
      formError.textContent = "Completa nombre, correo y mensaje para continuar.";
      formError.hidden = false;
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      formError.textContent = "Ingresa un correo electrónico válido.";
      formError.hidden = false;
      return;
    }

    const empresa = String(data.get("empresa") || "").trim();
    const telefono = String(data.get("telefono") || "").trim();
    const servicio = String(data.get("servicio") || "").trim();
    const subject = encodeURIComponent(`Contacto MERBAL — ${nombre}`);
    const body = encodeURIComponent(
      [
        `Nombre: ${nombre}`,
        `Empresa: ${empresa}`,
        `Correo: ${email}`,
        `Teléfono: ${telefono}`,
        `Servicio: ${servicio}`,
        "",
        mensaje,
      ].join("\n")
    );

    window.location.href = `mailto:merbal.tech.comercial@gmail.com?subject=${subject}&body=${body}`;
    form.classList.add("is-sent");
    form.reset();
  });
})();
