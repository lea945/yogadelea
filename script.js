/* Yogalea — scripts */
(function () {
  'use strict';

  /* ---------- Planning ---------- */
  var DAYS = [['Lundi', 'Lun'], ['Mardi', 'Mar'], ['Mercredi', 'Mer'], ['Jeudi', 'Jeu'], ['Vendredi', 'Ven']];
  var SCHEDULE = [
    [{ time: '17:30', duration: '60 min', name: 'Yoga adapté', level: 'Tous niveaux', place: 'En ligne' }],
    [{ time: '12:15', duration: '30 min', name: 'Méditation', level: 'Tous niveaux', place: 'En ligne' }],
    [{ time: '12:15', duration: '30 min', name: 'Méditation', level: 'Tous niveaux', place: 'En ligne' },
     { time: '18:45', duration: '60 min', name: 'Hatha yoga', level: 'Tous niveaux', place: 'En ligne' }],
    [{ time: '12:15', duration: '30 min', name: 'Méditation', level: 'Tous niveaux', place: 'En ligne' }],
    []
  ];
  var currentDay = 0;
  var booked = {};
  var daysEl = document.getElementById('days');
  var sessionsEl = document.getElementById('sessions');
  var headEl = document.getElementById('sessions-head');

  function renderDays() {
    daysEl.innerHTML = DAYS.map(function (d, i) {
      return '<button class="day' + (i === currentDay ? ' is-active' : '') + '" role="tab" aria-selected="' + (i === currentDay) + '" data-day="' + i + '">' +
        '<span class="only-desktop">' + d[0] + '</span><span class="only-mobile">' + d[1] + '</span></button>';
    }).join('');
  }

  function renderSessions() {
    var list = SCHEDULE[currentDay] || [];
    headEl.style.visibility = list.length ? '' : 'hidden';
    if (!list.length) {
      sessionsEl.innerHTML = '<p class="no-session">Pas de cours collectif ce jour.</p>';
      return;
    }
    sessionsEl.innerHTML = list.map(function (s, i) {
      var key = currentDay + '-' + i, isBooked = !!booked[key];
      return '<div class="session">' +
        '<div class="session-time"><strong>' + s.time + '</strong><span>' + s.duration + '</span></div>' +
        '<div class="session-info">' +
          '<div class="session-title"><span class="session-name">' + s.name + '</span><div><span class="session-level">' + s.level + '</span></div></div>' +
          '<span class="session-place">' + s.place + '</span>' +
          '<div class="session-book"><button class="btn-book' + (isBooked ? ' is-booked' : '') + '" data-key="' + key + '">' + (isBooked ? 'Réservé ✓' : 'Réserver') + '</button></div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  daysEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-day]');
    if (!btn) return;
    currentDay = +btn.dataset.day;
    renderDays();
    renderSessions();
  });
  sessionsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-key]');
    if (!btn) return;
    booked[btn.dataset.key] = !booked[btn.dataset.key];
    renderSessions();
  });
  renderDays();
  renderSessions();

  /* ---------- Menu mobile ---------- */
  var menu = document.getElementById('menu');
  var openBtn = document.getElementById('menu-open');
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  openBtn.addEventListener('click', function () { setMenu(true); });
  document.getElementById('menu-close').addEventListener('click', function () { setMenu(false); });
  menu.querySelectorAll('[data-close-menu]').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 760) setMenu(false); });

  /* ---------- Lettre d'information ---------- */
  var form = document.getElementById('newsletter');
  var thanks = document.getElementById('newsletter-thanks');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = form.email.value;
    var btn = form.querySelector('button');
    btn.disabled = true;
    function done() { form.hidden = true; thanks.hidden = false; }
    fetch('https://formsubmit.co/ajax/leyogadelea@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email: email, _subject: 'Nouvelle inscription à la lettre Yogalea', _template: 'table' })
    }).then(function (r) {
      if (!r.ok) throw new Error();
      done();
    }).catch(function () {
      window.location.href = 'mailto:leyogadelea@gmail.com?subject=' + encodeURIComponent('Inscription à la lettre Yogalea') +
        '&body=' + encodeURIComponent('Je souhaite recevoir les actualités : ' + email);
      done();
    });
  });

  /* ---------- Dégradé animé du header (WebGL) ---------- */
  var PALETTE = ['#e6c1a4', '#94574d', '#5a3242'];
  var canvas = document.getElementById('hero-canvas');
  var gl = canvas && canvas.getContext('webgl2', { antialias: false, alpha: false });
  if (!gl) return;

  var vs = '#version 300 es\nin vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}';
  var fs = [
    '#version 300 es',
    'precision highp float;',
    'uniform vec2 iResolution; uniform float iTime;',
    'uniform vec3 uColor1; uniform vec3 uColor2; uniform vec3 uColor3;',
    'out vec4 fragColor;',
    'const float uTimeSpeed=2.6, uWarpFrequency=5.0, uWarpSpeed=2.0, uWarpAmplitude=50.0;',
    'const float uBlendSoftness=0.05, uRotationAmount=500.0, uNoiseScale=0.55, uGrainAmount=0.04, uGrainScale=1.6;',
    'const float uContrast=1.5, uZoom=0.9;',
    'mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}',
    'vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i),f),dot(-1.0+2.0*hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(-1.0+2.0*hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);return 0.5+0.5*n;}',
    'void main(){',
    '  float t=iTime*uTimeSpeed;',
    '  vec2 uv=gl_FragCoord.xy/iResolution.xy;',
    '  float ratio=iResolution.x/iResolution.y;',
    '  vec2 tuv=(uv-0.5)/uZoom;',
    '  float degree=noise(vec2(t*0.1,tuv.x*tuv.y)*uNoiseScale);',
    '  tuv.y*=1.0/ratio;',
    '  tuv*=Rot(radians((degree-0.5)*uRotationAmount+180.0));',
    '  tuv.y*=ratio;',
    '  float warpTime=t*uWarpSpeed;',
    '  tuv.x+=sin(tuv.y*uWarpFrequency+warpTime)/uWarpAmplitude;',
    '  tuv.y+=sin(tuv.x*(uWarpFrequency*1.5)+warpTime)/(uWarpAmplitude*0.5);',
    '  float s=uBlendSoftness;',
    '  float edge0=-0.3-s, edge1=0.2+s, v0=0.5+s, v1=-0.3-s;',
    '  vec3 layer1=mix(uColor3,uColor2,smoothstep(edge0,edge1,tuv.x));',
    '  vec3 layer2=mix(uColor2,uColor1,smoothstep(edge0,edge1,tuv.x));',
    '  vec3 col=mix(layer1,layer2,smoothstep(v0,v1,tuv.y));',
    '  float grain=fract(sin(dot(uv*uGrainScale,vec2(12.9898,78.233)))*43758.5453);',
    '  col+=(grain-0.5)*uGrainAmount;',
    '  col=(col-0.5)*uContrast+0.5;',
    '  fragColor=vec4(clamp(col,0.0,1.0),1.0);',
    '}'
  ].join('\n');

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var v = shader(gl.VERTEX_SHADER, vs), f = shader(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  function hex(c) { return [1, 3, 5].map(function (i) { return parseInt(c.slice(i, i + 2), 16) / 255; }); }
  ['uColor1', 'uColor2', 'uColor3'].forEach(function (n, i) { gl.uniform3fv(gl.getUniformLocation(prog, n), hex(PALETTE[i])); });
  var uRes = gl.getUniformLocation(prog, 'iResolution');
  var uTime = gl.getUniformLocation(prog, 'iTime');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }).observe(canvas);
  }
  var t0 = performance.now();
  function draw(now) {
    if (visible) {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      var h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, reduced ? 0 : (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    if (!reduced) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
