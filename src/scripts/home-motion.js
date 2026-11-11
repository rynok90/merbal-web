/* merbal.lat home v2 — pantallas que se arman, luz, imán, sin bucles caricaturescos */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches && window.matchMedia("(hover: hover)").matches;
  const params = new URLSearchParams(location.search);
  const shot = params.get("shot") || "";
  if (shot) document.body.classList.add("shot");
  if (shot === "full") document.body.classList.add("shot-full");

  const nav = document.getElementById("nav");
  const menuBtn = document.querySelector(".menu-btn");
  const prod = document.getElementById("nav-productos");
  const prodBtn = prod && prod.querySelector(".nav-dd-btn");
  function closeProductos() {
    if (!prod) return;
    prod.classList.remove("is-open");
    if (prodBtn) prodBtn.setAttribute("aria-expanded", "false");
  }
  function openProductos() {
    if (!prod) return;
    prod.classList.add("is-open");
    if (prodBtn) prodBtn.setAttribute("aria-expanded", "true");
  }
  if (prodBtn && prod) {
    prodBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !prod.classList.contains("is-open");
      if (open) openProductos(); else closeProductos();
    });
    document.addEventListener("click", (e) => {
      if (!prod.contains(e.target)) closeProductos();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeProductos();
    });
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      if (!open) closeProductos();
    });
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
        closeProductos();
      })
    );
  }

  const form = document.getElementById("form-contacto");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const ok = document.getElementById("form-ok");
      const data = new FormData(form);
      const payload = {
        nombre: String(data.get("nombre") || "").trim(),
        email: String(data.get("email") || "").trim(),
        empresa: String(data.get("empresa") || "").trim(),
        mensaje: String(data.get("mensaje") || "").trim(),
        division: String(data.get("division") || "").trim(),
        vertical: "",
        website: String(data.get("website") || "").trim(),
      };
      const button = form.querySelector('[type="submit"]');
      if (button) button.disabled = true;
      const endpoint = form.getAttribute("data-endpoint") || "/.netlify/functions/contact";
      let message = "No se pudo enviar. Inténtalo de nuevo.";
      let failed = true;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (response.ok && body && body.ok) {
          message = "Recibimos tu mensaje. Te contestamos desde MERBAL.";
          failed = false;
          form.reset();
        }
      } catch (err) {
        message = "No se pudo enviar. Inténtalo de nuevo.";
      }
      if (ok) {
        ok.textContent = message;
        ok.classList.toggle("is-error", failed);
        ok.classList.add("show");
      }
      if (button) button.disabled = false;
    });
  }

  const ups = [...document.querySelectorAll(".in-up")];
  if (reduced || shot) {
    ups.forEach((el) => el.classList.add("is-in"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.18 });
    ups.forEach((el) => io.observe(el));
  }

  function tickHours(scene) {
    const el = scene.querySelector(".hours[data-hours]");
    if (!el) return;
    const [th, tm] = (el.dataset.hours || "2:14").split(":").map(Number);
    const target = th * 60 + tm;
    if (scene.classList.contains("is-done") || scene.classList.contains("is-mid") || reduced) {
      el.textContent = `${String(th).padStart(2, "0")}:${String(tm).padStart(2, "0")}`;
      return;
    }
    const start = performance.now();
    const dur = 1400;
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const v = Math.round(target * t);
      el.textContent = `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function armScene(scene, mode) {
    if (!scene) return;
    scene.classList.remove("is-play", "is-mid", "is-done");
    if (mode === "mid") {
      scene.classList.add("is-mid");
      tickHours(scene);
      return;
    }
    if (mode === "done" || reduced || scene.dataset.played === "1") {
      scene.classList.add("is-done");
      tickHours(scene);
      return;
    }
    scene.classList.add("is-play");
    tickHours(scene);
    const dur = Number(scene.dataset.dur) || 2600;
    window.setTimeout(() => {
      scene.classList.add("is-done");
      scene.dataset.played = "1";
    }, dur);
  }

  function scenesIn(root) {
    return [...(root || document).querySelectorAll(".scene, .js-scene")];
  }

  const copies = [...document.querySelectorAll(".sol-copy")];
  const panels = [...document.querySelectorAll(".stage-panel")];
  const indexLinks = [...document.querySelectorAll(".story-index a")];

  let activeId = "";
  function setActive(id) {
    if (!id || id === activeId) return;
    activeId = id;
    panels.forEach((p) => {
      const on = p.dataset.id === id;
      p.classList.toggle("is-on", on);
      if (!on) return;
      scenesIn(p).forEach((s) => {
        let mode = "play";
        if (forceMid && s.classList.contains("scene-access")) mode = "mid";
        else if (forceMid || forceDone || reduced || s.dataset.played === "1") mode = "done";
        armScene(s, mode);
      });
    });
    indexLinks.forEach((a) => a.classList.toggle("is-on", a.dataset.target === id));
  }

  const forceDone = ["full", "hero", "access", "anuve", "consola", "guard", "seguridad", "access-final", "menu"].includes(shot);
  const forceMid = shot === "access-mid";

  if (forceMid) {
    scenesIn().forEach((s) => armScene(s, s.classList.contains("scene-access") ? "mid" : "done"));
  } else if (forceDone || reduced) {
    scenesIn().forEach((s) => armScene(s, "done"));
  } else {
    // Hero: armar al cargar
    document.querySelectorAll(".hero-visual .scene").forEach((s) => armScene(s, "play"));
  }

  if (copies.length) {
    if (!forceMid && !forceDone) setActive(copies[0].dataset.id);
    if (!shot && "IntersectionObserver" in window) {
      const io2 = new IntersectionObserver((entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setActive(vis.target.dataset.id);
      }, { rootMargin: "-35% 0px -35% 0px", threshold: [0.2, 0.5, 0.8] });
      copies.forEach((c) => io2.observe(c));

      // móvil: cada escena apilada se arma al entrar
      const io3 = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          scenesIn(en.target).forEach((s) => armScene(s, s.dataset.played === "1" ? "done" : "play"));
        });
      }, { threshold: 0.35 });
      document.querySelectorAll(".device-mobile").forEach((el) => io3.observe(el));
    }

    // Si el observer no dispara, el scroll igual cambia de módulo y arma la pantalla.
    const armMobile = (el) => {
      scenesIn(el).forEach((s) => {
        if (s.dataset.armed === "1") return;
        s.dataset.armed = "1";
        armScene(s, s.dataset.played === "1" ? "done" : "play");
      });
    };
    const syncFromScroll = () => {
      if (!copies.length || shot) return;
      const line = window.innerHeight * 0.42;
      let best = null;
      let bestDist = Infinity;
      copies.forEach((copy) => {
        const rect = copy.getBoundingClientRect();
        if (rect.bottom < 64 || rect.top > window.innerHeight - 48) return;
        const dist = Math.abs(rect.top + Math.min(rect.height, window.innerHeight) * 0.35 - line);
        if (dist < bestDist) {
          bestDist = dist;
          best = copy;
        }
      });
      if (best) setActive(best.dataset.id);
      document.querySelectorAll(".device-mobile").forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) armMobile(el);
      });
    };
    syncFromScroll();
    window.addEventListener("scroll", syncFromScroll, { passive: true });
  }

  if (shot === "access" || shot === "access-final" || shot === "access-mid") {
    setActive("access");
    const el = document.getElementById("sol-access");
    if (el) el.scrollIntoView({ block: "center" });
  }
  if (shot === "anuve") {
    setActive("anuve");
    const el = document.getElementById("sol-anuve");
    if (el) el.scrollIntoView({ block: "center" });
  }
  if (shot === "consola") {
    setActive("consola");
    const el = document.getElementById("sol-consola");
    if (el) el.scrollIntoView({ block: "center" });
  }
  if (shot === "guard") {
    setActive("guard");
    const el = document.getElementById("sol-guard");
    if (el) el.scrollIntoView({ block: "center" });
  }
  if (shot === "menu") {
    document.body.classList.add("shot-menu");
    openProductos();
    window.scrollTo(0, 0);
  }
  if (shot === "seguridad") {
    const el = document.getElementById("seguridad");
    if (el) el.scrollIntoView({ block: "start" });
  }
  if (shot === "hero") window.scrollTo(0, 0);

  const header = document.querySelector(".site-header");
  const dark = document.getElementById("seguridad-red");
  function headerTheme() {
    if (!header || !dark) return;
    const r = dark.getBoundingClientRect();
    const on = r.top < 48 && r.bottom > 48;
    header.classList.toggle("is-dark", on);
  }
  headerTheme();
  window.addEventListener("scroll", headerTheme, { passive: true });

  const vid = document.querySelector(".dron-video");
  if (vid) {
    if (reduced) {
      vid.pause();
      vid.removeAttribute("autoplay");
      vid.preload = "none";
      try { vid.currentTime = 0; } catch (e) {}
    } else if (shot === "seguridad") {
      vid.pause();
      try { vid.currentTime = 2.4; } catch (e) {}
    } else {
      const startVideo = () => {
        const pending = vid.play();
        if (pending && typeof pending.catch === "function") pending.catch(() => {});
      };
      if ("IntersectionObserver" in window) {
        const ioVid = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            startVideo();
            ioVid.disconnect();
          }
        }, { rootMargin: "240px 0px" });
        ioVid.observe(vid);
      } else {
        startVideo();
      }
    }
  }

  // Luz que sigue al cursor y botones magnéticos — solo escritorio
  if (fine && !reduced && !shot) {
    const glowEls = document.querySelectorAll(".glow-card, form.glass");
    glowEls.forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }, { passive: true });
    });
    document.querySelectorAll(".mag").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22;
        const y = (e.clientY - r.top - r.height / 2) * 0.22;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  window.__merbal = { setActive, armScene };
})();
