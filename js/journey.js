/* The pinned journey: hero -> drift from project to project along a dotted
   route -> dive into the sea of screenshots. One scrubbed GSAP timeline
   drives a virtual camera; render() projects everything to the screen. */
(function () {
  const P = window.PORTFOLIO;
  const $ = (s, r) => (r || document).querySelector(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const sstep = (a, b, v) => smooth(clamp((v - a) / (b - a), 0, 1));
  const pad = (n) => String(n).padStart(2, "0");
  const SVGNS = "http://www.w3.org/2000/svg";
  const Y_PATTERN = [0, -0.16, 0.2, -0.1, 0.22, -0.18, 0.12, -0.2];

  window.createJourney = function (projects, shots, allShots, scrollTo) {
    const root = $(".journey");
    const svg = $(".drift__svg"), route = $(".drift__route"), trail = $(".drift__trail"), decor = $(".drift__decor");
    const nodesEl = $(".drift__nodes"), marker = $(".drift__marker"), drift = $(".drift");
    const dust = $(".drift__dust"), dctx = dust.getContext("2d");
    const seaCanvas = $(".sea"), veil = $(".sea__veil");
    const hudLabel = $("[data-hud-label]"), dotsEl = $(".hud__dots");
    const n = projects.length;

    const sea = window.createSea(seaCanvas, allShots);
    const tileCount = sea ? sea.count : 3312;

    const cam = { l: 0, z: 1, ox: 0, world: 1 };       // l = distance along the route
    const seaState = { p: 0, a: 0, n: 0 };
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, on: false };
    let vw = 1, vh = 1, mobile = false, D = 300, spacing = 1000, oy = 0;
    let stations = [], sats = [], lens = [], L = 1, tl = null, live = true, current = -1;

    /* ---------- DOM (built once) ---------- */
    function makeNode(shot, sat, href) {
      const el = document.createElement(sat ? "div" : "a");
      el.className = "node" + (sat ? " node--sat" : "");
      if (!sat) { el.href = href || "#"; el.dataset.cursor = "View"; if (href && href !== "#") { el.target = "_blank"; el.rel = "noopener"; } }
      el.innerHTML = '<div class="node__glow"></div><div class="node__ring"></div><div class="node__cover"></div>';
      const cover = el.lastChild;
      const blur = document.createElement("canvas");
      blur.width = shot.tiny.width; blur.height = shot.tiny.height;
      blur.getContext("2d").drawImage(shot.tiny, 0, 0);
      cover.appendChild(blur);
      let sharp = null;
      if (!sat) {
        sharp = new Image();
        sharp.alt = "";
        sharp.src = shot.url;
        cover.appendChild(sharp);
      }
      nodesEl.appendChild(el);
      return { el: el, sharp: sharp, x: 0, y: 0 };
    }

    projects.forEach(function (p, i) {
      const s = makeNode(shots[i], false, p.url);
      s.el.setAttribute("aria-label", p.title);
      s.i = i;
      stations.push(s);
      // two small blurred neighbours per station
      [1, 2].forEach(function (k) {
        const t = makeNode(allShots[(i * 2 + k + n) % allShots.length], true);
        t.parent = s; t.k = k;
        t.line = document.createElementNS(SVGNS, "line");
        t.line.setAttribute("class", "tie");
        decor.appendChild(t.line);
        sats.push(t);
      });

      const side = i % 2 === 0 ? "left" : "right";   // text sits opposite the cover
      const panel = document.createElement("article");
      panel.className = "panel panel--" + side;
      panel.innerHTML =
        '<p class="mono panel__step"><b>' + pad(i + 1) + "</b> / " + pad(n) + " · " + p.kind + "</p>" +
        '<h2 class="panel__title">' + p.title + "</h2>" +
        '<p class="panel__kind">' + p.kind + " · " + p.year + "</p>" +
        '<p class="panel__blurb">' + p.blurb + "</p>" +
        '<p class="mono panel__meta">' + p.stack + "</p>" +
        '<a class="pill panel__link" href="' + p.url + '">View project &#8599;</a>';
      $(".panels").appendChild(panel);
      s.panel = panel;

      const dot = document.createElement("button");
      dot.className = "hud__dot";
      dot.setAttribute("aria-label", "Go to " + p.title);
      dot.addEventListener("click", function () { go(i); });
      dotsEl.appendChild(dot);
      s.dot = dot;
    });

    const beats = P.beats.slice(0, n - 1).map(function (b) {
      const el = document.createElement("div");
      el.className = "beat";
      el.innerHTML = '<h2 class="beat__title">' + b.title + '</h2><p class="beat__text">' + b.text + "</p>";
      $(".beats").appendChild(el);
      return el;
    });

    const rings = [0, 1, 2, 3].map(function () {
      const c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("class", "dash");
      decor.appendChild(c);
      return c;
    });

    const stars = [];
    for (let i = 0; i < 150; i++) stars.push({ x: Math.random(), y: Math.random(), d: 0.08 + Math.random() * 0.4, r: 0.5 + Math.random() * 1.1 });

    /* ---------- layout (re-run on resize) ---------- */
    function layout() {
      vw = root.clientWidth; vh = root.clientHeight;
      mobile = vw < 820;
      D = mobile ? Math.min(vw * 0.82, vh * 0.42) : Math.min(vh * 0.64, vw * 0.4);
      spacing = mobile ? vw * 1.3 : Math.max(vw * 0.95, 780);
      oy = mobile ? -vh * 0.17 : 0;
      nodesEl.style.setProperty("--d", D + "px");

      stations.forEach(function (s, i) {
        s.x = i * spacing;
        s.y = Y_PATTERN[i % Y_PATTERN.length] * vh * (mobile ? 0.6 : 1);
      });
      sats.forEach(function (t) {
        // keep neighbours off the text: one above/below the cover, one on its far side
        const i = t.parent.i, away = mobile ? (t.k === 1 ? -1 : 1) : (i % 2 === 0 ? 1 : -1), flip = i % 2 ? -1 : 1;
        if (t.k === 1) {
          t.x = t.parent.x - away * spacing * 0.07;
          t.y = t.parent.y - (mobile ? 1 : flip) * Math.max(D * 0.72, vh * 0.36);   // phones: always above, text sits below
        } else {
          t.x = t.parent.x + away * spacing * (0.36 + 0.04 * (i % 3));
          t.y = t.parent.y + flip * vh * (0.1 + 0.06 * (i % 3));
        }
        t.line.setAttribute("x1", t.x); t.line.setAttribute("y1", t.y);
        t.line.setAttribute("x2", t.parent.x); t.line.setAttribute("y2", t.parent.y);
      });
      rings.forEach(function (c, i) {
        const s = stations[Math.min(n - 1, i * 2)];
        c.setAttribute("cx", s.x + spacing * 0.4);
        c.setAttribute("cy", s.y + vh * (i % 2 ? 0.5 : -0.4));
        c.setAttribute("r", spacing * (0.55 + i * 0.12));
      });

      // route: a smooth curve through every station, then diving down to the sea
      const last = stations[n - 1];
      const pts = [{ x: -spacing * 0.9, y: vh * 0.3 }]
        .concat(stations)
        .concat([{ x: last.x + spacing * 0.42, y: last.y + vh * 0.55 }, { x: last.x + spacing * 0.3, y: last.y + vh * 1.7 }]);
      let d = "M" + pts[0].x + " " + pts[0].y;
      lens = [0];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        d += " C" + (p1.x + (p2.x - p0.x) / 6) + " " + (p1.y + (p2.y - p0.y) / 6) + " " +
          (p2.x - (p3.x - p1.x) / 6) + " " + (p2.y - (p3.y - p1.y) / 6) + " " + p2.x + " " + p2.y;
        route.setAttribute("d", d);
        lens.push(route.getTotalLength());
      }
      trail.setAttribute("d", d);
      L = lens[lens.length - 1];
      trail.style.strokeDasharray = L;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dust.width = vw * dpr; dust.height = vh * dpr;
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (sea) sea.resize();
    }

    /* ---------- timeline ---------- */
    function build() {
      if (tl) { tl.scrollTrigger.kill(); tl.kill(); }
      gsap.set([".hero", ".panel", ".panel > *", ".beat", ".sea__copy", ".sea__copy > *"], { clearProps: "all" });
      layout();

      const sideOx = (i) => (mobile ? 0 : (i % 2 === 0 ? 1 : -1) * vw * 0.2);
      const at = (i) => lens[i + 1];                     // route distance of station i
      Object.assign(cam, { l: at(0), z: mobile ? 0.9 : 0.84, ox: sideOx(0), world: 1 });
      Object.assign(seaState, { p: 0, a: 0, n: 0 });

      tl = gsap.timeline({ defaults: { ease: "none" } });
      const show = (el, t, dur) => tl.fromTo(el.children, { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: dur || 0.4, stagger: 0.05, ease: "power2.out" }, t).set(el, { autoAlpha: 1 }, t);
      const hide = (el, t) => tl.to(el.children, { autoAlpha: 0, y: -40, duration: 0.28, stagger: 0.03, ease: "power1.in" }, t);

      // hero hands over to the first project
      tl.to(".hero", { xPercent: mobile ? 0 : -18, y: mobile ? -30 : 0, autoAlpha: 0, duration: 0.45, ease: "power1.in" }, 0.1);
      tl.to(cam, { z: 1, duration: 0.8, ease: "sine.inOut" }, 0.1);
      show(stations[0].panel, 0.55);

      let t = 1.0;
      stations.forEach(function (s, i) {
        tl.addLabel("s" + i, t);
        t += 0.7;                                          // dwell on the project
        hide(s.panel, t);
        if (i < n - 1) {
          tl.to(cam, { l: at(i + 1), duration: 1.4, ease: "power1.inOut" }, t + 0.1);
          tl.to(cam, { ox: sideOx(i + 1), duration: 1.4, ease: "sine.inOut" }, t + 0.1);
          tl.to(cam, { z: 0.7, duration: 0.7, ease: "sine.inOut" }, t + 0.1);
          tl.to(cam, { z: 1, duration: 0.7, ease: "sine.inOut" }, t + 0.8);
          if (beats[i]) { show(beats[i], t + 0.3, 0.3); hide(beats[i], t + 0.95); }
          show(stations[i + 1].panel, t + 1.25);
          t += 1.7;
        }
      });

      // leave the route and dive into the sea
      tl.to(cam, { l: L, duration: 1.5, ease: "power1.in" }, t + 0.1);
      tl.to(cam, { ox: 0, z: 0.62, duration: 1.5, ease: "sine.inOut" }, t + 0.1);
      tl.to(cam, { world: 0, duration: 0.8 }, t + 0.7);
      tl.to(seaState, { a: 1, duration: 0.9 }, t + 0.5);
      tl.to(seaState, { p: 1, duration: 2.3, ease: "power2.out" }, t + 0.5);
      tl.addLabel("sea", t + 2.4);
      show($(".sea__copy"), t + 1.7, 0.5);
      tl.to(seaState, { n: tileCount, duration: 0.9, ease: "power2.out" }, t + 1.7);
      tl.to({}, { duration: 0.5 }, t + 2.8);

      ScrollTrigger.create({
        animation: tl,
        trigger: root,
        start: "top top",
        end: function () { return "+=" + tl.duration() * window.innerHeight * 0.85; },
        pin: true,
        scrub: 0.7,
        refreshPriority: 1,   // measured first, so triggers below account for the pin
        anticipatePin: 1
      });
      render(0);
    }

    function go(i) {
      const st = tl.scrollTrigger;
      const label = i >= n ? "sea" : "s" + clamp(i, 0, n - 1);
      scrollTo(st.start + (tl.labels[label] / tl.duration()) * (st.end - st.start));
    }
    $("[data-hud-prev]").addEventListener("click", function () { go(Math.max(0, (seaState.a > 0.5 ? n : current) - 1)); });
    $("[data-hud-next]").addEventListener("click", function () { go(current === -2 ? n : current + 1); });

    /* ---------- per-frame projection ---------- */
    function place(o, cx, cy, pt, z, scale, opacity) {
      const sx = cx + (o.x - pt.x) * z, sy = cy + (o.y - pt.y) * z;
      const r = D * scale * 0.9;
      const vis = opacity > 0.01 && sx > -r && sx < vw + r && sy > -r && sy < vh + r;
      o.el.style.visibility = vis ? "visible" : "hidden";
      if (!vis) return;
      o.el.style.transform = "translate3d(" + (sx - D / 2) + "px," + (sy - D / 2 + (o.bob || 0)) + "px,0) scale(" + scale + ")";
      o.el.style.opacity = opacity;
    }

    function render(time) {
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;

      if (cam.world > 0.002) {
        const pt = route.getPointAtLength(cam.l), z = cam.z;
        const cx = vw / 2 + cam.ox - mouse.x * 14, cy = vh / 2 + oy - mouse.y * 10;
        drift.style.opacity = cam.world;
        drift.style.visibility = "visible";
        svg.setAttribute("viewBox", (pt.x - cx / z) + " " + (pt.y - cy / z) + " " + (vw / z) + " " + (vh / z));
        trail.style.strokeDashoffset = L - cam.l;

        let best = 0, bestI = 0;
        stations.forEach(function (s, i) {
          const f = smooth(clamp(1 - Math.hypot(s.x - pt.x, s.y - pt.y) / (spacing * 0.62), 0, 1));
          if (f > best) { best = f; bestI = i; }
          s.bob = Math.sin(time * 0.9 + i * 1.7) * 7 * f;
          place(s, cx, cy, pt, z, (0.4 + 0.6 * f) * z, 0.5 + 0.5 * f);
          s.sharp.style.opacity = sstep(0.55, 0.96, f);
          s.el.style.pointerEvents = f > 0.9 ? "auto" : "none";
        });
        sats.forEach(function (t, i) {
          t.bob = Math.sin(time * 0.6 + i) * 5;
          place(t, cx, cy, pt, z, 0.3 * z, 0.8);
        });
        marker.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
        marker.style.opacity = 1 - best * 0.85;

        dctx.clearRect(0, 0, vw, vh);
        dctx.fillStyle = "rgba(244,241,234,0.5)";
        stars.forEach(function (s) {
          const x = (((s.x * vw - pt.x * s.d * z) % vw) + vw) % vw;
          const y = (((s.y * vh - pt.y * s.d * z) % vh) + vh) % vh;
          dctx.globalAlpha = 0.25 + s.d;
          dctx.fillRect(x, y, s.r, s.r);
        });

        if (bestI !== current && seaState.a < 0.5) {
          current = bestI;
          stations.forEach(function (s, i) { s.dot.classList.toggle("is-on", i === current); });
          hudLabel.innerHTML = pad(current + 1) + " / " + pad(n) + " · " + projects[current].kind;
        }
      } else {
        drift.style.visibility = "hidden";
      }

      if (seaState.a > 0.5 && current !== -2) {
        current = -2;
        stations.forEach(function (s) { s.dot.classList.remove("is-on"); });
        hudLabel.textContent = "The archive";
      } else if (seaState.a <= 0.5 && current === -2) {
        current = -1;
      }

      seaCanvas.style.opacity = seaState.a;
      veil.style.opacity = seaState.a * sstep(0.5, 1, seaState.p);
      $("[data-sea-count]").textContent = Math.round(seaState.n).toLocaleString("en-US");
      if (sea && seaState.a > 0.002) sea.render(time, seaState.p, mouse);
    }

    /* ---------- wiring ---------- */
    root.addEventListener("pointermove", function (e) {
      const r = root.getBoundingClientRect();
      mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      mouse.on = e.pointerType !== "touch";
    });
    root.addEventListener("pointerleave", function () { mouse.on = false; mouse.tx = 0; mouse.ty = 0; });

    build();
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) { live = entries[0].isIntersecting; }).observe(root);
    }
    gsap.ticker.add(function (time) { if (live) render(time); });

    let lastW = window.innerWidth, timer;
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        // phones fire resize when the address bar hides; only rebuild on real changes
        if (window.innerWidth === lastW && mobile) { layout(); return; }
        lastW = window.innerWidth;
        // rebuilding removes the pin for a moment, which would make the page jump:
        // remember where we were (inside the journey, or as a plain offset) and go back
        const old = tl.scrollTrigger, y = window.scrollY;
        const inside = y >= old.start && y <= old.end;
        const prog = old.progress, after = y - old.end;
        build();
        ScrollTrigger.refresh();
        const st = tl.scrollTrigger;
        if (inside) window.scrollTo(0, st.start + prog * (st.end - st.start));
        else if (after > 0) window.scrollTo(0, st.end + after);
        ScrollTrigger.update();
      }, 200);
    });

    return { go: go };
  };
})();
