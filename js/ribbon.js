/* Gradiente da marca em movimento.
   Recria em WebGL a onda em S de assets/onda-azul-2.png (fita de luz azul com o fio
   claro no meio) e a faz respirar em loop. Uso: <canvas class="ribbon" data-ribbon>,
   com data-angle (graus, gira a onda) e data-speed opcionais. Sem WebGL, a imagem
   irmã .ribbon-fallback continua visível. */
(() => {
  'use strict';

  const MAX_DPR = 1.5;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FRAG = `
precision highp float;
uniform vec2 res; uniform float t; uniform float ang;
float th(float x){float e=exp(2.*clamp(x,-9.,9.));return (e-1.)/(e+1.);}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec2 uv = gl_FragCoord.xy / res;
  float asp = res.x / res.y;
  vec2 q = uv - .5; q.x *= asp;
  float c = cos(ang), s = sin(ang);
  q = mat2(c,-s,s,c) * q;
  float y = -q.y;                       // 0 no centro, + embaixo
  float k = 4.2 + .8*sin(t*.37);
  float amp = .22 + .03*sin(t*.53);
  float cx = amp * th(-y*k) + .025*sin(y*4.+t*.7);   // a curva em S
  float side = y < 0. ? 1. : -1.;      // em cima a luz fica à esquerda, embaixo à direita
  float d = (cx - q.x) * side;
  float w = .05 + .8*abs(y) + .03*sin(t*.9+y*3.);
  float lit = d > 0. ? exp(-d / w) : exp(d * 90.);
  float lobe = smoothstep(.0, .22, abs(y)) * smoothstep(.8, .08, abs(y)) * (.55 + 1.9*abs(y));
  float I = clamp(lit * lobe, 0., 1.4);
  float edge = exp(-abs(d) * 140.) * smoothstep(.35, 0., abs(y));
  vec3 col = mix(vec3(0.), vec3(.078,.259,.412), smoothstep(0., .35, I));
  col = mix(col, vec3(.565,.733,.867), smoothstep(.3, .85, I));
  col = mix(col, vec3(.949,.969,.98), smoothstep(.85, 1.3, I));
  col += vec3(1.,.93,.86) * edge * .9;
  col += (hash(gl_FragCoord.xy + t) - .5) * .035;   // grão, como na arte original
  gl_FragColor = vec4(col, 1.);
}`;

  function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }

  function setup(canvas) {
    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'res');
    const uT = gl.getUniformLocation(prog, 't');
    gl.uniform1f(gl.getUniformLocation(prog, 'ang'), (Number(canvas.dataset.angle) || 0) * Math.PI / 180);
    const speed = Number(canvas.dataset.speed) || 1;

    let visible = false;
    let raf = 0;
    let time = Math.random() * 20;
    let last = 0;

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };
    const draw = () => { gl.uniform1f(uT, time); gl.drawArrays(gl.TRIANGLES, 0, 3); };
    const frame = (now) => {
      time += Math.min(now - (last || now), 50) / 1000 * speed;
      last = now;
      draw();
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    new ResizeObserver(() => { size(); draw(); }).observe(canvas);
    size();
    draw();
    canvas.classList.add('on');
    if (reduce) return;
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) { last = 0; raf = requestAnimationFrame(frame); }
    }).observe(canvas);
  }

  function init() {
    document.querySelectorAll('canvas[data-ribbon]').forEach((c) => {
      try { setup(c); } catch (err) { console.error('Gradiente animado indisponível:', err); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
