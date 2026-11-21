/* Loads each project's screenshot. If a project has no image (or it fails
   to load) a mock "website" is drawn instead, so nothing is ever blank. */
(function () {
  const W = 960, H = 600;

  function rr(g, x, y, w, h, r) {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    g.fill();
  }

  function wrap(g, text, maxW) {
    const lines = [];
    let line = "";
    text.split(" ").forEach(function (word) {
      const test = line ? line + " " + word : word;
      if (g.measureText(test).width > maxW && line) { lines.push(line); line = word; }
      else line = test;
    });
    if (line) lines.push(line);
    return lines;
  }

  function placeholder(p, i) {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const cols = p.colors || ["#141416", "#f4f1ea", "#8a8a8a"];
    const bg = cols[0], fg = cols[1], ac = cols[2];
    const v = i % 3;

    g.fillStyle = bg; g.fillRect(0, 0, W, H);

    // nav
    g.fillStyle = fg;
    g.beginPath(); g.arc(46, 42, 9, 0, Math.PI * 2); g.fill();
    g.font = '600 15px "Inter", sans-serif';
    g.textBaseline = "middle";
    g.fillText(p.title, 66, 43);
    g.globalAlpha = 0.45;
    [0, 1, 2].forEach(function (k) { rr(g, 560 + k * 74, 38, 50, 8, 4); });
    g.globalAlpha = 1;
    g.fillStyle = ac; rr(g, 810, 26, 108, 34, 17);

    // headline
    g.fillStyle = fg;
    g.textBaseline = "alphabetic";
    const size = v === 2 ? 132 : 92;
    g.font = '400 ' + size + 'px "Instrument Serif", serif';
    const maxW = v === 0 ? 430 : 860;
    const lines = wrap(g, p.title, maxW).slice(0, 2);
    g.textAlign = v === 1 ? "center" : "left";
    const tx = v === 1 ? W / 2 : 46;
    let ty = v === 0 ? 220 : v === 1 ? 190 : 230;
    lines.forEach(function (l) { g.fillText(l, tx, ty); ty += size * 0.96; });
    g.textAlign = "left";

    // text lines
    g.globalAlpha = 0.35;
    const lx = v === 1 ? W / 2 - 170 : 46;
    rr(g, lx, ty - size * 0.5, 340, 9, 4);
    rr(g, lx + (v === 1 ? 40 : 0), ty - size * 0.5 + 20, 260, 9, 4);
    g.globalAlpha = 1;

    // blocks
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, ac); grad.addColorStop(1, fg);
    if (v === 0) {
      g.fillStyle = grad; rr(g, 520, 110, 394, 440, 22);
      g.fillStyle = bg; g.globalAlpha = 0.9;
      g.beginPath(); g.arc(717, 330, 96, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
      g.fillStyle = fg; rr(g, 46, ty + 6, 150, 44, 22);
    } else if (v === 1) {
      g.fillStyle = grad; rr(g, 90, 330, 780, 320, 26);
      g.fillStyle = bg; g.globalAlpha = 0.85;
      rr(g, 130, 370, 240, 150, 14); rr(g, 390, 370, 440, 150, 14);
      g.globalAlpha = 1;
    } else {
      [0, 1, 2].forEach(function (k) {
        g.fillStyle = k === 1 ? grad : fg;
        g.globalAlpha = k === 1 ? 1 : 0.12;
        rr(g, 46 + k * 296, 400, 276, 240, 18);
      });
      g.globalAlpha = 1;
    }
    return c;
  }

  // draw an <img> into a 960x600 canvas (cover fit, anchored to the top)
  function fromImage(img) {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    g.drawImage(img, (W - w) / 2, 0, w, h);
    return c;
  }

  function tiny(canvas) {
    const c = document.createElement("canvas");
    c.width = 40; c.height = 25;
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    g.drawImage(canvas, 0, 0, 40, 25);
    return c;
  }

  function loadOne(p, i) {
    return new Promise(function (resolve) {
      function done(canvas, url) {
        resolve({ canvas: canvas, tiny: tiny(canvas), url: url || canvas.toDataURL("image/jpeg", 0.86) });
      }
      if (!p.image) return done(placeholder(p, i));
      const img = new Image();
      img.onload = function () {
        try {
          const c = fromImage(img);
          c.getContext("2d").getImageData(0, 0, 1, 1); // throws if the page was opened as a file://
          done(c, p.image);
        } catch (e) { done(placeholder(p, i)); }
      };
      img.onerror = function () { done(placeholder(p, i)); };
      img.src = p.image;
    });
  }

  window.loadShots = function (projects) {
    const fonts = document.fonts
      ? Promise.all([
          document.fonts.load('92px "Instrument Serif"'),
          document.fonts.load('600 15px "Inter"')
        ]).catch(function () {})
      : Promise.resolve();
    return fonts.then(function () { return Promise.all(projects.map(loadOne)); });
  };
})();
