/* 湯の宿 しづく庵（架空）— 季節の切り替えと、窓の中の季節の演出（依存なし）
   ・季節は html[data-season] に入れる。色はすべて CSS 側（style.css）が受け持つ
   ・初期値は <head> の小さなスクリプトが「今の月」から決めている（画面がちらつかないように）
   ・選んだ季節は localStorage に覚える。使えない環境（プライベートモードなど）でも動くよう try/catch
   ・キャンバスは、画面外・タブが裏・「動きを減らす」設定のときは描画ループを止める */
(() => {
  'use strict';
  const root = document.documentElement;
  const KEY = 'shizukuan-season';
  const SEASONS = ['haru', 'natsu', 'aki', 'fuyu'];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ───── 季節の切り替え ───── */
  const buttons = [...document.querySelectorAll('[data-season-btn]')];
  const nows = [...document.querySelectorAll('[data-season-now]')];
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const listeners = [];

  function apply(season, save) {
    if (!SEASONS.includes(season)) return;
    root.dataset.season = season;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.seasonBtn === season)));
    // 「いまの景色」の文字は、押したボタンの data-caption から取る（文字は HTML に書いてある）
    const src = buttons.find(b => b.dataset.seasonBtn === season);
    if (src) nows.forEach(n => { n.textContent = src.dataset.caption; });
    scenes.forEach(s => { const l = s.getAttribute('data-label-' + season); if (l) s.setAttribute('aria-label', l); });
    if (save) { try { localStorage.setItem(KEY, season); } catch (e) { /* 覚えられなくても切り替えはできる */ } }
    listeners.forEach(fn => fn(season));
  }
  buttons.forEach(b => b.addEventListener('click', () => apply(b.dataset.seasonBtn, true)));
  // 矢印キーで同じグループ内の季節を移る（Tab でも各ボタンに移れる）
  document.querySelectorAll('.season').forEach(group => {
    group.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      const list = [...group.querySelectorAll('[data-season-btn]')];
      const i = list.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      const next = list[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length];
      next.focus();
    });
  });
  apply(root.dataset.season || 'aki', false);

  /* ───── 窓の中の演出（春：花びら／夏：蛍／秋：紅葉／冬：雪） ───── */
  // 粒の数の上限。面積に応じて減らす（小さな画面では少なく）
  const CAP = { haru: 34, natsu: 26, aki: 22, fuyu: 90 };
  const PER = { haru: 22000, natsu: 26000, aki: 30000, fuyu: 7000 };

  function sprite(size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    return c;
  }
  // 花びら：先に小さな切れ込みのある楕円
  const petal = (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#fbe3ea'); g.addColorStop(1, '#e7a7ba');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(s * .5, s * .95);
    ctx.bezierCurveTo(s * .05, s * .7, s * .12, s * .15, s * .42, s * .1);
    ctx.lineTo(s * .5, s * .2);
    ctx.lineTo(s * .58, s * .1);
    ctx.bezierCurveTo(s * .88, s * .15, s * .95, s * .7, s * .5, s * .95);
    ctx.fill();
  };
  // 紅葉：五つに分かれた葉（もみじ）
  const maple = color => (ctx, s) => {
    ctx.translate(s / 2, s / 2);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.62;
      const r = i === 2 ? s * .46 : (i === 0 || i === 4 ? s * .3 : s * .4);
      ctx.lineTo(Math.cos(a - .2) * r * .35, Math.sin(a - .2) * r * .35);
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a + .2) * r * .35, Math.sin(a + .2) * r * .35);
    }
    ctx.lineTo(0, s * .12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = s * .04;
    ctx.beginPath(); ctx.moveTo(0, s * .05); ctx.lineTo(0, s * .42); ctx.stroke();
  };
  const glow = (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(246,255,190,1)');
    g.addColorStop(.18, 'rgba(214,240,120,.75)');
    g.addColorStop(.5, 'rgba(170,220,90,.18)');
    g.addColorStop(1, 'rgba(170,220,90,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  };
  const flake = (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(.55, 'rgba(255,255,255,.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  };
  let SPR = null;
  const sprites = () => SPR || (SPR = {
    petal: sprite(32, petal),
    leaves: ['#b8361e', '#d4692a', '#9c2a1c', '#dc9a34'].map(c => sprite(40, maple(c))),
    glow: sprite(48, glow),
    flake: sprite(16, flake),
  });

  const rand = (a, b) => a + Math.random() * (b - a);

  function make(kind, w, h, anywhere) {
    // anywhere：最初の配置を画面全体に散らす（途中から降り始めたように見せる）
    const y0 = anywhere ? rand(0, h) : rand(-h * .2, -10);
    switch (kind) {
      case 'haru': return { x: rand(0, w), y: y0, s: rand(9, 16), vy: rand(14, 28), vx: rand(6, 18), r: rand(0, 6.28), vr: rand(-1, 1), p: rand(0, 6.28), f: rand(.6, 1.4) };
      case 'aki': return { x: rand(0, w), y: y0, s: rand(13, 22), vy: rand(18, 34), vx: rand(-4, 10), r: rand(0, 6.28), vr: rand(-1.2, 1.2), p: rand(0, 6.28), f: rand(.5, 1.1), c: Math.floor(rand(0, 4)) };
      case 'natsu': return { x: rand(0, w), y: rand(h * .35, h * .9), s: rand(14, 26), vx: rand(-8, 8), vy: rand(-5, 5), p: rand(0, 6.28), f: rand(.35, .8) };
      default: { const d = rand(.35, 1); return { x: rand(0, w), y: y0, s: 2 + d * 4.5, vy: 12 + d * 34, vx: rand(-3, 6), p: rand(0, 6.28), f: rand(.4, 1), d }; }
    }
  }

  function Fx(canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, kind = root.dataset.season, parts = [], raf = 0, last = 0, onScreen = false, t = 0;

    function count() { return Math.min(CAP[kind], Math.round((w * h) / PER[kind])); }
    function seed() { parts = Array.from({ length: count() }, () => make(kind, w, h, true)); }
    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // 高精細の画面でも2倍まで
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (parts.length !== count()) seed();
    }
    function draw() {
      const S = sprites();
      ctx.clearRect(0, 0, w, h);
      if (kind === 'natsu') ctx.globalCompositeOperation = 'lighter';
      for (const q of parts) {
        if (kind === 'natsu') {
          // 蛍：ゆっくり明滅する
          const a = Math.max(0, Math.sin(t * q.f + q.p)) ** 2;
          if (a < .02) continue;
          ctx.globalAlpha = a;
          ctx.drawImage(S.glow, q.x - q.s / 2, q.y - q.s / 2, q.s, q.s);
        } else if (kind === 'fuyu') {
          ctx.globalAlpha = .55 + q.d * .45;
          ctx.drawImage(S.flake, q.x - q.s / 2, q.y - q.s / 2, q.s, q.s);
        } else {
          // 花びら・紅葉：回転しながら、裏返るように縦につぶれる
          const img = kind === 'haru' ? S.petal : S.leaves[q.c];
          ctx.globalAlpha = kind === 'haru' ? .9 : .95;
          ctx.save();
          ctx.translate(q.x, q.y);
          ctx.rotate(q.r);
          ctx.scale(1, Math.cos(t * q.f + q.p) * .8 + .2 * Math.sign(Math.cos(t * q.f + q.p) || 1));
          ctx.drawImage(img, -q.s / 2, -q.s / 2, q.s, q.s);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    function step(dt) {
      t += dt;
      for (let i = 0; i < parts.length; i++) {
        const q = parts[i];
        if (kind === 'natsu') {
          q.vx += rand(-6, 6) * dt; q.vy += rand(-6, 6) * dt;
          q.vx = Math.max(-12, Math.min(12, q.vx)); q.vy = Math.max(-8, Math.min(8, q.vy));
          q.x += q.vx * dt; q.y += q.vy * dt;
          if (q.y < h * .3) q.vy += 4 * dt;
          if (q.y > h * .95) q.vy -= 4 * dt;
          if (q.x < -20) q.x = w + 20; else if (q.x > w + 20) q.x = -20;
        } else {
          const sway = Math.sin(t * q.f + q.p) * (kind === 'fuyu' ? 10 : 22);
          q.x += (q.vx + sway) * dt; q.y += q.vy * dt;
          if (q.r !== undefined) q.r += q.vr * dt;
          if (q.y > h + 24 || q.x > w + 40 || q.x < -40) parts[i] = make(kind, w, h, false);
        }
      }
    }
    function frame(now) {
      const dt = Math.min(.05, (now - (last || now)) / 1000);
      last = now;
      step(dt); draw();
      raf = requestAnimationFrame(frame);
    }
    const shouldRun = () => onScreen && !document.hidden && !reduce.matches;
    function update() {
      if (shouldRun()) { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
      else {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        if (reduce.matches) draw(); // 動きを減らす設定：止まった一枚だけを描く
      }
    }
    function setKind(k) { kind = k; t = 0; seed(); draw(); update(); }

    new ResizeObserver(() => { resize(); if (!raf) draw(); }).observe(canvas);
    new IntersectionObserver(es => { onScreen = es[0].isIntersecting; update(); }).observe(canvas);
    resize(); seed(); draw();
    return { update, setKind };
  }

  if (!('IntersectionObserver' in window) || !('ResizeObserver' in window)) return;
  const fx = [...document.querySelectorAll('canvas[data-fx]')].map(c => Fx(c));
  listeners.push(s => fx.forEach(f => f.setKind(s)));
  document.addEventListener('visibilitychange', () => fx.forEach(f => f.update()));
  const onReduce = () => fx.forEach(f => f.update());
  if (reduce.addEventListener) reduce.addEventListener('change', onReduce); else reduce.addListener(onReduce);
})();
