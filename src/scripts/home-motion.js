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
    const solutionSelect = form.querySelector('[name="solucion"]');
    const divisionSelect = form.querySelector('[name="division"]');
    const applySolution = (value) => {
      if (!solutionSelect) return;
      const option = [...solutionSelect.options].find((item) => item.value === value);
      if (!option) return;
      solutionSelect.value = value;
      if (divisionSelect && option.dataset.division) divisionSelect.value = option.dataset.division;
    };
    applySolution(new URLSearchParams(location.search).get("solucion") || "");
    if (solutionSelect) {
      solutionSelect.addEventListener("change", () => {
        const option = solutionSelect.selectedOptions[0];
        if (divisionSelect && option && option.dataset.division) divisionSelect.value = option.dataset.division;
      });
    }
    document.querySelectorAll('a[href="/#contacto"]').forEach((link) => {
      link.addEventListener("click", () => {
        if (solutionSelect) solutionSelect.value = "";
        if (divisionSelect) divisionSelect.value = "";
        if (location.search) history.replaceState(null, "", `${location.pathname}#contacto`);
      });
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const ok = document.getElementById("form-ok");
      const data = new FormData(form);
      const chosen = solutionSelect && solutionSelect.value && solutionSelect.selectedOptions[0]
        ? solutionSelect.selectedOptions[0].textContent.trim()
        : "";
      let mensaje = String(data.get("mensaje") || "").trim();
      if (chosen && chosen !== "Contacto general") mensaje = `Solución: ${chosen}\n\n${mensaje}`;
      const payload = {
        nombre: String(data.get("nombre") || "").trim(),
        email: String(data.get("email") || "").trim(),
        empresa: String(data.get("empresa") || "").trim(),
        mensaje,
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

  document.querySelectorAll(".dron-video").forEach((vid) => {
    const photo = () => vid.closest(".ix-photo");
    const playVideo = () => {
      const frame = photo();
      if (reduced || shot) return;
      if (frame && !frame.classList.contains("is-on")) return;
      const pending = vid.play();
      if (pending && typeof pending.catch === "function") pending.catch(() => {});
    };
    if (reduced) {
      vid.pause();
      vid.removeAttribute("autoplay");
      vid.preload = "none";
      try { vid.currentTime = 0; } catch (e) {}
      return;
    }
    if (shot === "seguridad") {
      vid.pause();
      try { vid.currentTime = 2.4; } catch (e) {}
      return;
    }
    if ("IntersectionObserver" in window) {
      const ioVid = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) playVideo();
        else vid.pause();
      }, { threshold: 0.25 });
      ioVid.observe(vid);
    } else {
      playVideo();
    }
  });

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

  function bootReels() {
    const reels = [...document.querySelectorAll("[data-reel]")];
    const reelVisible = (reel) => {
      const panel = reel.closest(".stage-panel");
      if (panel && !panel.classList.contains("is-on")) return false;
      const mobile = reel.closest(".device-mobile");
      if (mobile && getComputedStyle(mobile).display === "none") return false;
      const stage = reel.closest(".stage");
      if (stage && getComputedStyle(stage).display === "none") return false;
      return true;
    };
    reels.forEach((reel) => {
      const slides = [...reel.querySelectorAll(".reel-slide")];
      const dots = [...reel.querySelectorAll(".reel-dot")];
      const cap = reel.querySelector(".reel-cap");
      const view = reel.querySelector(".reel-view");
      if (slides.length < 2) return;
      let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-on")));
      let timer = 0;
      const autoMs = Number(reel.dataset.auto) || 4800;
      const canAuto = !reduced && !shot;
      const show = (next) => {
        index = (next + slides.length) % slides.length;
        slides.forEach((slide, i) => {
          const on = i === index;
          slide.classList.toggle("is-on", on);
          slide.setAttribute("aria-hidden", on ? "false" : "true");
        });
        dots.forEach((dot, i) => {
          const on = i === index;
          dot.classList.toggle("is-on", on);
          if (on) dot.setAttribute("aria-current", "true");
          else dot.removeAttribute("aria-current");
        });
        const slide = slides[index];
        if (cap) cap.textContent = slide.dataset.cap || "";
        if (view && slide.dataset.tone) view.dataset.tone = slide.dataset.tone;
      };
      const stop = () => {
        if (timer) window.clearInterval(timer);
        timer = 0;
      };
      const start = () => {
        if (!canAuto || !reelVisible(reel)) {
          stop();
          return;
        }
        stop();
        timer = window.setInterval(() => show(index + 1), autoMs);
      };
      reel.querySelector(".reel-next")?.addEventListener("click", () => {
        show(index + 1);
        start();
      });
      reel.querySelector(".reel-prev")?.addEventListener("click", () => {
        show(index - 1);
        start();
      });
      dots.forEach((dot, i) => {
        dot.addEventListener("click", () => {
          show(i);
          start();
        });
      });
      reel.addEventListener("mouseenter", stop);
      reel.addEventListener("mouseleave", start);
      reel.addEventListener("focusin", stop);
      reel.addEventListener("focusout", (event) => {
        if (!reel.contains(event.relatedTarget)) start();
      });
      let originX = 0;
      let originY = 0;
      let tracking = false;
      reel.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button, a")) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        tracking = true;
        originX = event.clientX;
        originY = event.clientY;
      });
      reel.addEventListener("pointermove", (event) => {
        if (!tracking || !reel.hasPointerCapture?.(event.pointerId)) {
          if (!tracking) return;
          const dx = event.clientX - originX;
          const dy = event.clientY - originY;
          if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy)) return;
          try { reel.setPointerCapture(event.pointerId); } catch (err) {}
        }
      });
      reel.addEventListener("pointerup", (event) => {
        if (!tracking) return;
        tracking = false;
        const dx = event.clientX - originX;
        const dy = event.clientY - originY;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
          show(index + (dx < 0 ? 1 : -1));
          start();
        }
      });
      reel.addEventListener("pointercancel", () => {
        tracking = false;
      });
      reel._merbalStart = start;
      reel._merbalStop = stop;
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) start();
          else stop();
        }, { threshold: 0.35 });
        io.observe(reel);
      } else {
        start();
      }
    });
    const panels = document.querySelectorAll(".stage-panel");
    if (panels.length && "MutationObserver" in window) {
      const observer = new MutationObserver(() => {
        reels.forEach((reel) => {
          if (typeof reel._merbalStart !== "function") return;
          if (reelVisible(reel)) reel._merbalStart();
          else reel._merbalStop();
        });
      });
      panels.forEach((panel) => observer.observe(panel, { attributes: true, attributeFilter: ["class"] }));
    }
    document.addEventListener("visibilitychange", () => {
      reels.forEach((reel) => {
        if (typeof reel._merbalStart !== "function") return;
        if (document.hidden) reel._merbalStop();
        else reel._merbalStart();
      });
    });
  }

  function bootIx() {
    document.querySelectorAll("[data-ix]").forEach((block) => {
      const tabs = [...block.querySelectorAll("[data-ix-tab]")];
      const photos = [...block.querySelectorAll("[data-ix-photo]")];
      const select = (id) => {
        tabs.forEach((tab) => {
          const on = tab.dataset.ixTab === id;
          tab.classList.toggle("is-on", on);
          tab.setAttribute("aria-selected", on ? "true" : "false");
        });
        photos.forEach((photo) => {
          const on = photo.dataset.ixPhoto === id;
          photo.classList.toggle("is-on", on);
          const video = photo.querySelector("video");
          if (!video) return;
          if (on && !reduced && !shot) {
            const pending = video.play();
            if (pending && typeof pending.catch === "function") pending.catch(() => {});
          } else {
            video.pause();
          }
        });
      };
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => select(tab.dataset.ixTab));
        if (fine) tab.addEventListener("mouseenter", () => select(tab.dataset.ixTab));
      });
      block.addEventListener("keydown", (event) => {
        if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(event.key)) return;
        const current = tabs.findIndex((tab) => tab.classList.contains("is-on"));
        const dir = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
        const next = tabs[(current + dir + tabs.length) % tabs.length];
        if (!next) return;
        event.preventDefault();
        select(next.dataset.ixTab);
        next.focus();
      });
    });
  }

  bootReels();
  bootIx();

  window.__merbal = { setActive, armScene };
})();
