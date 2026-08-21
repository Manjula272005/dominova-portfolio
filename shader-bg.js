/**
 * DOMINOVA — Premium WebGL Shader Background
 * Royal Black & Gold / Light Cream & Gold flowing plasma shader.
 * Sits at z-index: -1, position: fixed, pointer-events: none.
 * Performance: 60 FPS via requestAnimationFrame + WebGL GLSL ES 1.00 compliant shader.
 */

(function () {
  'use strict';

  // ─── Vertex Shader ────────────────────────────────────────────────────────
  const VERT_SRC = /* glsl */ `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // ─── Fragment Shader (GLSL ES 1.00 Fully Compatible) ─────────────────────
  const FRAG_SRC = /* glsl */ `
    precision highp float;

    uniform float u_time;
    uniform vec2  u_resolution;
    uniform float u_theme; // 0.0 = dark mode, 1.0 = light mode
    uniform vec2  u_mouse;

    // Smooth noise helpers
    vec3 hash3(vec2 p) {
      vec3 q = vec3(dot(p, vec2(127.1, 311.7)),
                    dot(p, vec2(269.5, 183.3)),
                    dot(p, vec2(419.2, 371.9)));
      return fract(sin(q) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(dot(hash3(i + vec2(0.0, 0.0)).xy - 0.5, f - vec2(0.0, 0.0)),
                     dot(hash3(i + vec2(1.0, 0.0)).xy - 0.5, f - vec2(1.0, 0.0)), u.x),
                  mix(dot(hash3(i + vec2(0.0, 1.0)).xy - 0.5, f - vec2(0.0, 1.0)),
                     dot(hash3(i + vec2(1.0, 1.0)).xy - 0.5, f - vec2(1.0, 1.0)), u.x), u.y);
    }

    float fbm5(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      vec2  shift = vec2(100.0);
      mat2  rot   = mat2(0.87758, 0.47942, -0.47942, 0.87758);
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p  = rot * p * 2.1 + shift;
        a *= 0.5;
      }
      return v;
    }

    float fbm4(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      vec2  shift = vec2(100.0);
      mat2  rot   = mat2(0.87758, 0.47942, -0.47942, 0.87758);
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p  = rot * p * 2.1 + shift;
        a *= 0.5;
      }
      return v;
    }

    float fbm3(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      vec2  shift = vec2(100.0);
      mat2  rot   = mat2(0.87758, 0.47942, -0.47942, 0.87758);
      for (int i = 0; i < 3; i++) {
        v += a * noise(p);
        p  = rot * p * 2.1 + shift;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      uv.x *= u_resolution.x / u_resolution.y;   // aspect ratio fix

      float t = u_time * 0.08;

      // ── Layered flowing FBM plasma ─────────────────────────────────
      vec2 q = vec2(
        fbm5(uv + vec2(0.0, 0.0)),
        fbm5(uv + vec2(5.2, 1.3))
      );

      vec2 r = vec2(
        fbm4(uv + 4.0 * q + vec2(1.7 + t * 0.12, 9.2)),
        fbm4(uv + 4.0 * q + vec2(8.3 + t * 0.08, 2.8))
      );

      float f = fbm3(uv + 4.0 * r + t * 0.05);
      f = clamp(f * 0.5 + 0.5, 0.0, 1.0);

      // ── Dark Mode Palette (Royal Gold & Deep Obsidian) ───────────────
      vec3 d_base = vec3(0.039, 0.039, 0.039);   // #0A0A0A
      vec3 d_dark = vec3(0.060, 0.050, 0.030);   // Rich Obsidian Dark
      vec3 d_mid  = vec3(0.120, 0.095, 0.040);   // Deep Amber Glow
      vec3 d_gold = vec3(0.240, 0.185, 0.065);   // Gold Shimmer Accent
      vec3 d_warm = vec3(0.150, 0.110, 0.040);   // Muted Amber

      // ── Light Mode Palette (Cream & Soft Gold) ──────────────────────
      vec3 l_base = vec3(0.980, 0.980, 0.968);   // #FAFAF7
      vec3 l_dark = vec3(0.956, 0.945, 0.917);   // #F4F1EA
      vec3 l_mid  = vec3(0.929, 0.910, 0.867);   // #EDE8DD
      vec3 l_gold = vec3(0.880, 0.800, 0.620);   // Soft Gold Accent
      vec3 l_warm = vec3(0.940, 0.880, 0.740);   // Pale Gold Shimmer

      vec3 base = mix(d_base, l_base, u_theme);
      vec3 dark = mix(d_dark, l_dark, u_theme);
      vec3 mid  = mix(d_mid,  l_mid,  u_theme);
      vec3 gold = mix(d_gold, l_gold, u_theme);
      vec3 warm = mix(d_warm, l_warm, u_theme);

      // Smooth color transitions
      vec3 col = mix(base, dark, smoothstep(0.0, 0.35, f));
           col = mix(col,  mid,  smoothstep(0.25, 0.60, f));
           col = mix(col,  gold, smoothstep(0.55, 0.85, f));
           col = mix(col,  warm, smoothstep(0.80, 1.00, f));

      // Vignette effect
      float vignette = 1.0 - 0.45 * dot(uv - 0.5, uv - 0.5) * 3.0;
      col = mix(base, col, clamp(vignette * 0.75 + 0.25, 0.0, 1.0));

      col = pow(max(col, vec3(0.0)), vec3(0.95));
      col = clamp(col, 0.0, 1.0);

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  // ─── CSS Fallback ─────────────────────────────────────────────────────────
  const FALLBACK_STYLE = `
    background: #0A0A0A;
  `;

  // ─── Main WebGL Initializer ───────────────────────────────────────────────
  function initShaderBackground() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvas = document.getElementById('dominova-shader-bg');
    if (!canvas) return;

    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: -1;
      pointer-events: none;
      display: block;
      ${FALLBACK_STYLE}
    `;

    if (prefersReduced) return;

    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
    }) || canvas.getContext('experimental-webgl');

    if (!gl) {
      console.warn('[ShaderBG] WebGL not supported on this browser context.');
      return;
    }

    function compileShader(type, src) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('[ShaderBG] Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vert = compileShader(gl.VERTEX_SHADER, VERT_SRC);
    const frag = compileShader(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vert || !frag) return;

    const program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[ShaderBG] Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1,  1, -1, -1,  1,  1,  1]),
      gl.STATIC_DRAW
    );

    const posLoc   = gl.getAttribLocation(program, 'a_position');
    const timeLoc  = gl.getUniformLocation(program, 'u_time');
    const resLoc   = gl.getUniformLocation(program, 'u_resolution');
    const themeLoc = gl.getUniformLocation(program, 'u_theme');
    const mouseLoc = gl.getUniformLocation(program, 'u_mouse');

    gl.useProgram(program);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    let W = 0, H = 0;
    const IS_MOBILE = window.innerWidth < 768;
    function resize() {
      const dpr  = IS_MOBILE ? 0.75 : Math.min(window.devicePixelRatio || 1, 2);
      const newW = Math.floor(window.innerWidth  * dpr);
      const newH = Math.floor(window.innerHeight * dpr);
      if (newW === W && newH === H) return;
      W = newW; H = newH;
      canvas.width  = W;
      canvas.height = H;
      gl.viewport(0, 0, W, H);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    let targetMouseX = 0.5, targetMouseY = 0.5;
    let currentMouseX = 0.5, currentMouseY = 0.5;

    window.addEventListener('mousemove', e => {
      targetMouseX = e.clientX / window.innerWidth;
      targetMouseY = 1.0 - (e.clientY / window.innerHeight);
    }, { passive: true });

    let rafId        = null;
    let startTs      = null;
    let running      = true;
    let currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 1.0 : 0.0;

    function render(ts) {
      if (!running) return;
      if (startTs === null) startTs = ts;
      const elapsed = (ts - startTs) * 0.001;

      resize();

      // Smooth theme transition
      const targetTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 1.0 : 0.0;
      currentTheme += (targetTheme - currentTheme) * 0.08;

      // Fluid 3D mouse parallax lerp
      currentMouseX += (targetMouseX - currentMouseX) * 0.06;
      currentMouseY += (targetMouseY - currentMouseY) * 0.06;

      gl.uniform1f(timeLoc, elapsed);
      gl.uniform2f(resLoc, W, H);
      gl.uniform1f(themeLoc, currentTheme);
      gl.uniform2f(mouseLoc, currentMouseX, currentMouseY);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafId = requestAnimationFrame(render);
    }
    rafId = requestAnimationFrame(render);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        running = false;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      } else {
        running = true;
        startTs = null;
        rafId   = requestAnimationFrame(render);
      }
    });

    window.__shaderBgCleanup = function () {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(buf);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShaderBackground);
  } else {
    initShaderBackground();
  }

})();
