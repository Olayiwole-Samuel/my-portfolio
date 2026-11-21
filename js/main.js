/* Page setup: content from data.js, smooth scrolling, loader and the
   scroll animations for everything outside the pinned journey. */
(function () {
  const P = window.PORTFOLIO;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const pad = (n) => String(n).padStart(2, "0");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsap.registerPlugin(ScrollTrigger);
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";   // always start at the top

  /* ---------- content ---------- */
  document.title = P.name + " · " + P.role;
  $$("[data-name]").forEach(function (el) { el.textContent = P.name; });
  $("[data-role]").textContent = P.role + (P.available ? " · Available for work" : "");
  $("[data-intro]").textContent = P.intro;
  $$("[data-location]").forEach(function (el) { el.textContent = P.location; });
  $("[data-year]").textContent = new Date().getFullYear();
  $("[data-project-count]").textContent = P.projects.length;
  $("[data-words]").textContent = P.about.statement;
  $(".about__heading").textContent = P.about.heading;
  $(".about__body").textContent = P.about.body;
  const mail = $("[data-email]");
  mail.textContent = P.email;
  mail.href = "mailto:" + P.email;

  $(".stats").innerHTML = P.about.stats.map(function (s) {
    return '<div class="stat"><dt>' + s.label + '</dt><dd><span data-count="' + s.value + '">0</span>' + s.suffix + "</dd></div>";
  }).join("");

  $(".services__list").innerHTML = P.services.map(function (s, i) {
    return '<li class="service"><span class="service__num">' + pad(i + 1) + '</span><h3 class="service__title">' + s.title +
      '</h3><p class="service__text">' + s.text + '</p><ul class="service__tags">' +
      s.tags.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul></li>";
  }).join("");

  $(".index__list").innerHTML = P.projects.map(function (p, i) {
    const ext = p.url && p.url !== "#" ? ' target="_blank" rel="noopener"' : "";
    return '<li><a class="index__row" href="' + p.url + '"' + ext + ' data-i="' + i + '" data-cursor="Open"><span class="index__num">' + pad(i + 1) +
      '</span><span class="index__name">' + p.title + '</span><span class="index__kind">' + p.kind +
      '</span><span class="index__year">' + p.year + '</span><span class="index__arrow">&#8599;</span></a></li>';
  }).join("");

  $(".contact__socials").innerHTML = P.socials.map(function (s) {
    return '<li><a href="' + s.url + '">' + s.label + "</a></li>";
  }).join("");

  function tick() {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " local";
    $$("[data-time]").forEach(function (el) { el.textContent = now; });
  }
  tick(); setInterval(tick, 30000);

  // placeholder links ("#") shouldn't jump to the top
  document.addEventListener("click", function (e) {
    const a = e.target.closest('a[href="#"]');
    if (a) e.preventDefault();
  });

  /* ---------- text splitting ---------- */
  function splitWords(el, masked) {
    const out = [];
    (function walk(node) {
      Array.from(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            if (masked) {
              w.className = "w";
              const inner = document.createElement("span");
              inner.textContent = part;
              w.appendChild(inner);
              out.push(inner);
            } else {
              w.className = "word";
              w.textContent = part;
              out.push(w);
            }
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") walk(child);
      });
    })(el);
    return out;
  }

  const introWords = $$(".intro [data-split]").map(function (el) { return splitWords(el, true); }).flat();
  const heroWords = $$(".hero [data-split]").map(function (el) { return splitWords(el, true); }).flat();
  const INTRO_BITS = ".intro__eyebrow, .intro__row, .intro__foot, .nav > *";
  const HERO_BITS = ".hero__eyebrow, .hero__hint, .hud";
  const statementWords = splitWords($("[data-words]"), false);
  const contactWords = splitWords($("[data-chars]"), true);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  function scrollTo(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.4 });
    else if (typeof target === "number") window.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
    else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }
  $$('a[href^="#"]').forEach(function (a) {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    a.addEventListener("click", function (e) {
      const target = id === "#top" ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      scrollTo(target);
    });
  });

  /* ---------- custom cursor + scrollbar (mouse only) ---------- */
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function cursor() {
    if (!fine) return;
    document.documentElement.classList.add("has-cursor");
    const c = document.createElement("div");
    c.className = "cursor";
    c.innerHTML = '<div class="cursor__ring"></div><div class="cursor__dot"></div>';
    const l = document.createElement("div");
    l.className = "cursor-label";
    l.innerHTML = "<span></span>";
    document.body.append(c, l);
    const ring = c.firstChild, dot = c.lastChild, label = l.firstChild;

    const dx = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2" }), dy = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2" });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    const lx = gsap.quickTo(label, "x", { duration: 0.35, ease: "power3" }), ly = gsap.quickTo(label, "y", { duration: 0.35, ease: "power3" });

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); lx(e.clientX); ly(e.clientY);
      c.classList.add("is-on"); l.classList.add("is-on");
    });
    document.addEventListener("pointerover", function (e) {
      const t = e.target.closest ? e.target.closest("a, button, [data-cursor]") : null;
      const text = t && t.dataset.cursor;
      c.classList.toggle("is-link", !!t && !text);
      c.classList.toggle("is-label", !!text);
      l.classList.toggle("is-label", !!text);
      if (text) label.textContent = text;
    });
    window.addEventListener("pointerdown", function () { c.classList.add("is-down"); });
    window.addEventListener("pointerup", function () { c.classList.remove("is-down"); });
    document.documentElement.addEventListener("pointerleave", function () { c.classList.remove("is-on"); l.classList.remove("is-on"); });
  }

  function scrollbar() {
    if (!fine) return;
    document.documentElement.classList.add("has-sbar");
    const bar = document.createElement("div");
    bar.className = "sbar";
    bar.innerHTML = '<div class="sbar__thumb"></div>';
    document.body.appendChild(bar);
    const thumb = bar.firstChild;
    let max = 1, travel = 1, idle;

    const jump = function (y) {
      if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
    };
    function update() {
      const docH = document.documentElement.scrollHeight, h = bar.clientHeight;
      max = Math.max(1, docH - window.innerHeight);
      const th = Math.max(40, h * window.innerHeight / docH);
      travel = Math.max(1, h - th);
      thumb.style.height = th + "px";
      thumb.style.transform = "translateY(" + (window.scrollY / max) * travel + "px)";
    }
    function wake() {
      update();
      bar.classList.add("is-active");
      clearTimeout(idle);
      idle = setTimeout(function () { bar.classList.remove("is-active"); }, 1200);
    }
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", update);
    ScrollTrigger.addEventListener("refresh", update);

    let startY = 0, startScroll = 0, dragging = false;
    bar.addEventListener("pointerdown", function (e) {
      if (e.target !== thumb) {                      // click on the track: jump there
        const r = bar.getBoundingClientRect();
        jump(((e.clientY - r.top - thumb.offsetHeight / 2) / travel) * max);
        update();
      }
      dragging = true; startY = e.clientY; startScroll = window.scrollY;
      bar.classList.add("is-drag");
      bar.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    bar.addEventListener("pointermove", function (e) {
      if (dragging) jump(Math.min(max, Math.max(0, startScroll + ((e.clientY - startY) / travel) * max)));
    });
    const end = function () { dragging = false; bar.classList.remove("is-drag"); };
    bar.addEventListener("pointerup", end);
    bar.addEventListener("pointercancel", end);
    update();
  }

  /* ---------- sections below the journey ---------- */
  function sections(shots) {
    // intro drifts away as the work rises
    gsap.to(".intro__inner", { yPercent: -18, opacity: 0.15, ease: "none", scrollTrigger: { trigger: ".intro", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".intro__orbits", { yPercent: 22, ease: "none", scrollTrigger: { trigger: ".intro", start: "top top", end: "bottom top", scrub: true } });
    if (!reduced) $$(".orbit").forEach(function (o, i) {
      gsap.to(o, { rotation: i % 2 ? -360 : 360, duration: 40 + i * 25, ease: "none", repeat: -1, svgOrigin: "0 0" });
    });

    // the work section's own heading comes in when you reach it
    ScrollTrigger.create({
      trigger: ".journey", start: "top 55%", once: true,
      onEnter: function () {
        gsap.to(heroWords, { yPercent: 0, duration: 1.1, stagger: 0.05, ease: "power4.out" });
        gsap.to(HERO_BITS, { opacity: 1, duration: 0.8, stagger: 0.05, delay: 0.3 });
        gsap.from(".drift__nodes", { scale: 0.86, opacity: 0, duration: 1.4, ease: "power3.out" });
      }
    });

    // nav flips to dark text over the light sheet
    ScrollTrigger.create({
      trigger: ".light", start: "top 40px", end: "bottom 40px",
      onToggle: function (self) { $(".nav").classList.toggle("is-light", self.isActive); }
    });

    gsap.fromTo(statementWords, { opacity: 0.14 }, {
      opacity: 1, stagger: 0.08, ease: "none",
      scrollTrigger: { trigger: ".about__statement", start: "top 82%", end: "bottom 48%", scrub: true }
    });

    $$("[data-reveal]").forEach(function (el) {
      gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });

    $$("[data-count]").forEach(function (el) {
      const o = { v: 0 };
      gsap.to(o, {
        v: +el.dataset.count, duration: 1.6, ease: "power2.out",
        onUpdate: function () { el.textContent = Math.round(o.v); },
        scrollTrigger: { trigger: el, start: "top 92%" }
      });
    });

    $$(".service").forEach(function (row) {
      const t = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 90%" } });
      t.fromTo(row, { "--line": 0 }, { "--line": 1, duration: 1.1, ease: "power3.inOut" })
        .from(row.children, { y: 34, opacity: 0, duration: 0.8, stagger: 0.07, ease: "power3.out" }, 0.15);
    });

    gsap.from(".index__row", {
      y: 30, opacity: 0, duration: 0.7, stagger: 0.07, ease: "power3.out", clearProps: "all",
      scrollTrigger: { trigger: ".index__list", start: "top 85%" }
    });

    // hover preview that follows the cursor
    const preview = $(".index__preview"), img = $("img", preview);
    gsap.set(preview, { xPercent: -50, yPercent: -50 });
    const qx = gsap.quickTo(preview, "x", { duration: 0.5, ease: "power3" });
    const qy = gsap.quickTo(preview, "y", { duration: 0.5, ease: "power3" });
    const list = $(".index__list");
    list.addEventListener("pointermove", function (e) { qx(e.clientX + 190); qy(e.clientY); });
    $$(".index__row").forEach(function (row) {
      row.addEventListener("pointerenter", function () {
        img.src = shots[+row.dataset.i].url;
        gsap.to(preview, { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out", overwrite: "auto" });
      });
    });
    list.addEventListener("pointerleave", function () {
      gsap.to(preview, { opacity: 0, scale: 0.6, duration: 0.3, ease: "power2.in", overwrite: "auto" });
    });

    gsap.from(contactWords, {
      yPercent: 110, duration: 1.1, stagger: 0.06, ease: "power4.out",
      scrollTrigger: { trigger: ".contact__title", start: "top 85%" }
    });
    gsap.from(".contact__mail, .contact__foot > *", {
      y: 30, opacity: 0, duration: 0.9, stagger: 0.06, ease: "power3.out",
      scrollTrigger: { trigger: ".contact__mail", start: "top 95%" }
    });
  }

  /* ---------- boot ---------- */
  const count = $("[data-loader-count]");
  const prog = { v: 0 };
  const counting = gsap.to(prog, {
    v: 100, duration: reduced ? 0.2 : 1.6, ease: "power2.inOut",
    onUpdate: function () { count.textContent = String(Math.round(prog.v)).padStart(3, "0"); }
  });

  gsap.set(introWords.concat(heroWords), { yPercent: 110 });
  gsap.set(INTRO_BITS + ", " + HERO_BITS, { opacity: 0 });
  cursor();

  window.loadShots(P.projects).then(function (shots) {
    window.scrollTo(0, 0);
    // journey stops = featured projects (or the first six if none are marked)
    let picks = P.projects.map(function (p, i) { return i; }).filter(function (i) { return P.projects[i].featured; });
    if (picks.length < 2) picks = P.projects.map(function (p, i) { return i; }).slice(0, 6);
    window.createJourney(
      picks.map(function (i) { return P.projects[i]; }),
      picks.map(function (i) { return shots[i]; }),
      shots, scrollTo);
    sections(shots);
    scrollbar();
    return counting.then(function () { return shots; });
  }).then(function () {
    const intro = gsap.timeline({
      onComplete: function () {
        document.body.classList.remove("is-loading");
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }
    });
    intro.to(".loader > *", { y: -30, opacity: 0, duration: 0.5, stagger: 0.06, ease: "power2.in" })
      .to(".loader", { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, "-=0.1")
      .set(".loader", { display: "none" })
      .to(introWords, { yPercent: 0, duration: 1.2, stagger: 0.06, ease: "power4.out" }, "-=0.45")
      .to(INTRO_BITS, { opacity: 1, duration: 0.8, stagger: 0.05 }, "-=0.8")
      .from(".intro__orbits", { scale: 0.7, opacity: 0, duration: 1.8, ease: "power3.out" }, "-=1.8");
  }).catch(function (err) {
    console.error(err);
    document.body.classList.remove("is-loading");
    gsap.set(".loader", { display: "none" });
    gsap.set(introWords.concat(heroWords), { yPercent: 0 });
    gsap.set(INTRO_BITS + ", " + HERO_BITS, { opacity: 1 });
    if (lenis) lenis.start();
  });
})();
