/* The "sea": thousands of screenshot tiles riding a slow wave (WebGL2).
   All tiles are drawn in one instanced call from a single texture atlas,
   so the same handful of projects can be repeated as often as needed. */
(function () {
  const COLS = 72, ROWS = 46;            // 3,312 tiles
  const PITCH_X = 1.42, PITCH_Z = 0.92;  // spacing between tile centres
  const TILE_W = 1.28, TILE_D = 0.8;     // 16:10 tiles
  const A_COLS = 8, A_ROWS = 12, CELL_W = 256, CELL_H = 160;
  const FOV = 42 * Math.PI / 180;

  const VERT = `#version 300 es
  layout(location=0) in vec2 a_pos;
  layout(location=1) in vec2 i_off;
  layout(location=2) in vec3 i_cell;
  uniform mat4 u_vp;
  uniform float u_time, u_amp, u_W, u_hover;
  uniform vec2 u_tile, u_mouse, u_fog;
  uniform vec3 u_eye;
  out vec2 v_uv; out vec2 v_local; out float v_shade; out float v_fog;
  float wave(vec2 p, float t) {
    return 0.85 * sin(p.x * 0.17 + t * 0.55) * cos(p.y * 0.2 - t * 0.35)
         + 0.4 * sin((p.x * 0.6 + p.y) * 0.31 + t * 0.8)
         + 0.18 * sin(p.x * 0.7 - t * 1.1);
  }
  void main() {
    float x = mod(i_off.x + u_time * 0.3 + u_W * 0.5, u_W) - u_W * 0.5;
    vec2 centre = vec2(x, i_off.y);
    vec2 p = centre + a_pos * u_tile;
    float h = wave(p, u_time);
    float d = distance(centre, u_mouse);
    float lift = exp(-d * d * 0.1) * u_hover;
    vec3 wp = vec3(p.x, h * u_amp + lift * 1.3, p.y);
    gl_Position = u_vp * vec4(wp, 1.0);
    vec2 l = a_pos + 0.5;
    v_local = l;
    vec2 inset = vec2(0.012, 0.02);
    v_uv = (i_cell.xy + inset + l * (1.0 - 2.0 * inset)) * vec2(1.0 / ${A_COLS}.0, 1.0 / ${A_ROWS}.0);
    v_fog = smoothstep(u_fog.x, u_fog.y, distance(wp, u_eye));
    float edge = smoothstep(u_W * 0.5, u_W * 0.5 - 6.0, abs(x));
    v_shade = (0.6 + 0.4 * smoothstep(-1.2, 1.2, h)) * (0.76 + 0.24 * i_cell.z) * edge + lift * 0.3;
  }`;

  const FRAG = `#version 300 es
  precision highp float;
  in vec2 v_uv; in vec2 v_local; in float v_shade; in float v_fog;
  uniform sampler2D u_tex;
  out vec4 o;
  void main() {
    vec2 q = abs(v_local - 0.5) * vec2(1.6, 1.0) - (vec2(0.8, 0.5) - 0.07);
    if (length(max(q, 0.0)) - 0.07 > 0.0) discard;
    float a = 1.0 - v_fog;
    o = vec4(texture(u_tex, v_uv).rgb * v_shade * a, a);
  }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const lerp = (a, b, t) => a + (b - a) * t;

  function mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
    return o;
  }

  function buildAtlas(shots) {
    const c = document.createElement("canvas");
    c.width = A_COLS * CELL_W; c.height = A_ROWS * CELL_H;
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high";
    for (let r = 0; r < A_ROWS; r++) for (let col = 0; col < A_COLS; col++) {
      const shot = shots[(col + r * 3) % shots.length];
      g.drawImage(shot.canvas, col * CELL_W, r * CELL_H, CELL_W, CELL_H);
    }
    return c;
  }

  window.createSea = function (canvas, shots) {
    const gl = canvas.getContext("webgl2", { antialias: true, alpha: true });
    if (!gl) return null;

    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { console.warn("Sea disabled:", e); return null; }
    gl.useProgram(prog);
    const U = {};
    ["u_vp", "u_time", "u_amp", "u_W", "u_hover", "u_tile", "u_mouse", "u_fog", "u_eye", "u_tex"].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });

    // geometry: one quad, instanced
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const count = COLS * ROWS;
    const W = COLS * PITCH_X;
    const inst = new Float32Array(count * 5);
    let seed = 7;
    const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    let k = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      inst[k++] = (c + 0.5) * PITCH_X - W / 2;
      inst[k++] = 15 - r * PITCH_Z;
      inst[k++] = Math.floor(rnd() * A_COLS);
      inst[k++] = Math.floor(rnd() * A_ROWS);
      inst[k++] = rnd();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, inst, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 20, 8);
    gl.vertexAttribDivisor(2, 1);

    // texture atlas
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, buildAtlas(shots));
    } catch (e) { console.warn("Sea disabled:", e); return null; }
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.uniform1i(U.u_tex, 0);
    gl.uniform1f(U.u_W, W);
    gl.uniform2f(U.u_tile, TILE_W, TILE_D);

    let aspect = 1, hover = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      aspect = w / h;
    }

    /* time: seconds · p: 0..1 camera approach · mouse: {x, y} in -1..1, {on} */
    function render(time, p, mouse) {
      const eye = [mouse.x * 1.4, lerp(5, 6.6, p) - mouse.y * 0.4, lerp(46, 13, p)];
      const target = [0, lerp(0.5, 1.9, p), lerp(20, -6, p)];
      const z = norm(sub(eye, target));
      const x = norm(cross([0, 1, 0], z));
      const y = cross(z, x);
      const view = new Float32Array([
        x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
        -dot(x, eye), -dot(y, eye), -dot(z, eye), 1
      ]);
      const f = 1 / Math.tan(FOV / 2), near = 0.1, far = 120;
      const proj = new Float32Array([
        f / aspect, 0, 0, 0, 0, f, 0, 0,
        0, 0, (far + near) / (near - far), -1,
        0, 0, 2 * far * near / (near - far), 0
      ]);

      // where the pointer hits the water (y = 0)
      const th = Math.tan(FOV / 2);
      const dir = [0, 1, 2].map(function (i) {
        return -z[i] + x[i] * mouse.x * th * aspect + y[i] * -mouse.y * th;
      });
      let on = 0, mx = 0, mz = 0;
      if (mouse.on && dir[1] < -0.01) {
        const t = -eye[1] / dir[1];
        if (t < 40) { on = 1; mx = eye[0] + dir[0] * t; mz = eye[2] + dir[2] * t; }
      }
      hover += (on - hover) * 0.08;

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(U.u_vp, false, mul(proj, view));
      gl.uniform1f(U.u_time, time);
      gl.uniform1f(U.u_amp, lerp(0.45, 1, p));
      gl.uniform1f(U.u_hover, hover);
      if (on) gl.uniform2f(U.u_mouse, mx, mz);
      gl.uniform2f(U.u_fog, 14, 44);
      gl.uniform3f(U.u_eye, eye[0], eye[1], eye[2]);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
    }

    resize();
    return { render: render, resize: resize, count: count };
  };
})();
