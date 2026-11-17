/* D. hair studio NAGORI（架空）— 小さな動きのスクリプト（依存なし）
   1. リンクの文字を1文字ずつに分ける（ホバーで順に入れ替わる演出のため。読み上げ用の文字はそのまま残す）
   2. ヒーローの髪の線画：ポスターの大きさに合わせて毛の束を描き、マウスで「とかせる」ようにする
      （とかす動きは hover: hover かつ pointer: fine のときだけ。動きを減らす設定・画面外では動かさない）
   3. スタイルの横送りボタン
   JavaScript が無くても、文字・料金・予約の案内はすべて読める。 */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');

  /* ── 1. 文字を分ける ── */
  const split = (host) => {
    const full = host.textContent.replace(/\s+/g, ' ').trim();
    const vis = document.createElement('span');
    vis.className = 'split';
    vis.setAttribute('aria-hidden', 'true');
    vis.append(...host.childNodes);
    let i = 0;
    const walk = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const c of child.textContent) {
            if (/\s/.test(c)) { frag.append(c); continue; }
            const s = document.createElement('span');
            s.className = 'ch';
            s.textContent = c;
            s.style.setProperty('--i', i++);
            frag.append(s);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === 1) walk(child);
      }
    };
    walk(vis);
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = full;
    host.append(sr, vis);
  };
  document.querySelectorAll('[data-split], [data-split-inner]').forEach(split);

  /* ── 2. 髪の線画 ── */
  const hero = document.querySelector('[data-hair]');
  const svgs = hero ? hero.querySelectorAll('.hero__hair') : [];
  if (hero && svgs.length === 2) {
    const NS = 'http://www.w3.org/2000/svg';
    const [svgMain, svgAcc] = svgs;
    let strands = [];
    let W = 0, H = 0;

    const rng = (seed) => () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const bez = (p, t) => {
      const u = 1 - t;
      return [
        u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
        u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
      ];
    };
    const tan = (p, t) => {
      const u = 1 - t;
      const x = 3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]);
      const y = 3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1]);
      const l = Math.hypot(x, y) || 1;
      return [x / l, y / l];
    };
    const toD = (xs, ys, ox, oy) => {
      const n = xs.length;
      const X = (k) => xs[k] + ox[k], Y = (k) => ys[k] + oy[k];
      let d = `M${X(0).toFixed(1)} ${Y(0).toFixed(1)}`;
      for (let k = 0; k < n - 1; k++) {
        const k0 = Math.max(k - 1, 0), k3 = Math.min(k + 2, n - 1);
        const c1x = X(k) + (X(k + 1) - X(k0)) / 6, c1y = Y(k) + (Y(k + 1) - Y(k0)) / 6;
        const c2x = X(k + 1) - (X(k3) - X(k)) / 6, c2y = Y(k + 1) - (Y(k3) - Y(k)) / 6;
        d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${X(k + 1).toFixed(1)} ${Y(k + 1).toFixed(1)}`;
      }
      return d;
    };

    const build = (animate) => {
      const r = hero.getBoundingClientRect();
      W = Math.round(r.width); H = Math.round(r.height);
      for (const s of svgs) { s.setAttribute('viewBox', `0 0 ${W} ${H}`); s.textContent = ''; }
      strands = [];
      const rand = rng(7);
      const wide = W > H * 1.05;
      // 束の芯：左上の奥付と右上の縦書きを避け、中央の NAGORI の上を斜めに横切って左下へ抜ける
      const spine = wide
        ? [[W * .58, -H * .04], [W * .82, H * .36], [W * .25, H * .44], [W * .05, H * 1.04]]
        : [[W * 1.06, H * .43], [W * .22, H * .48], [W * .94, H * .82], [W * .04, H * 1.05]];
      const S = wide ? Math.min(W * .085, H * .16) : W * .11;
      const copy = hero.querySelector('.hero__copy');
      if (wide && copy) {
        const c = copy.getBoundingClientRect();
        const cL = c.left - r.left, cB = c.bottom - r.top;
        for (let t = 0; t <= .5; t += .01) {
          const [x, y] = bez(spine, t);
          const w = S * (.14 + 1.05 * t * (1.25 - t));
          if (y > cB) break;
          if (x + w > cL - 12) { spine[1][0] = Math.min(spine[1][0], cL - w - 16); break; }
        }
      }
      const N = wide ? 46 : 16;
      const PTS = 30;
      for (let i = 0; i < N + 3; i++) {
        const stray = i >= N;
        const s0 = stray ? (i % 2 ? -1.05 : 1.05) : -1 + 2 * (i / (N - 1)) + (rand() - .5) * .06;
        const twA = (rand() - .5) * (wide ? .5 : .3), twF = 1 + rand() * 2.2, twP = rand() * 6.28;
        const tEnd = stray ? .62 + rand() * .2 : .78 + rand() * .24;
        const tStart = stray ? .18 + rand() * .2 : rand() * .04;
        const fly = stray ? (s0 > 0 ? 1 : -1) * (.22 + rand() * .2) : 0;
        const flyFrom = tStart + .1;
        const xs = new Float32Array(PTS), ys = new Float32Array(PTS);
        for (let k = 0; k < PTS; k++) {
          const t = tStart + (tEnd - tStart) * (k / (PTS - 1));
          const [cx, cy] = bez(spine, t);
          const [tx, ty] = tan(spine, t);
          const nx = -ty, ny = tx;
          const w = S * (.14 + 1.05 * t * (1.25 - t)) + S * .7 * t ** 4;
          let off = (s0 + twA * Math.sin(Math.PI * twF * t + twP)) * w;
          if (stray && t > flyFrom) { const q = (t - flyFrom) / (tEnd - flyFrom); off += fly * S * Math.sin(q * Math.PI * .8) * 1.4; }
          xs[k] = cx + nx * off; ys[k] = cy + ny * off;
        }
        const accent = i === Math.round(N * .38);
        const el = document.createElementNS(NS, 'path');
        el.setAttribute('pathLength', '1');
        el.setAttribute('stroke-width', accent ? 2 : stray ? .8 : (i % 7 === 3 ? 1.7 : i % 5 === 1 ? .6 : 1.05));
        el.style.setProperty('--i', accent ? N + 6 : i);
        if (animate && !reduce.matches) el.classList.add('draw');
        const st = { xs, ys, ox: new Float32Array(PTS), oy: new Float32Array(PTS), el };
        el.setAttribute('d', toD(xs, ys, st.ox, st.oy));
        (accent ? svgAcc : svgMain).append(el);
        strands.push(st);
      }
    };

    let mx = -1e5, my = -1e5, vx = 0, vy = 0, lastX = 0, lastY = 0, raf = 0, onScreen = true;
    const RADIUS = 120;
    const step = () => {
      raf = 0;
      if (reduce.matches) return;
      let moving = false;
      const R2 = RADIUS * RADIUS;
      for (const s of strands) {
        let changed = false;
        for (let k = 0; k < s.xs.length; k++) {
          const dx = s.xs[k] - mx, dy = s.ys[k] - my;
          const d2 = dx * dx + dy * dy;
          let tx = 0, ty = 0;
          if (d2 < R2) {
            const d = Math.sqrt(d2) || 1;
            const f = 1 - d / RADIUS;
            const push = f * f * 66;
            tx = (dx / d) * push + vx * f * 2.2;
            ty = (dy / d) * push * .55 + vy * f * 2.2;
          }
          const nx = s.ox[k] + (tx - s.ox[k]) * .16, ny = s.oy[k] + (ty - s.oy[k]) * .16;
          if (Math.abs(nx - s.ox[k]) > .04 || Math.abs(ny - s.oy[k]) > .04) changed = true;
          s.ox[k] = nx; s.oy[k] = ny;
        }
        if (changed) { s.el.setAttribute('d', toD(s.xs, s.ys, s.ox, s.oy)); moving = true; }
      }
      vx *= .82; vy *= .82;
      if (moving && onScreen) raf = requestAnimationFrame(step);
    };
    const kick = () => { if (!raf && onScreen && !reduce.matches) raf = requestAnimationFrame(step); };
    hero.addEventListener('pointermove', (e) => {
      if (!fine.matches || reduce.matches || e.pointerType !== 'mouse') return;
      const r = svgMain.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      vx = Math.max(-14, Math.min(14, x - lastX)); vy = Math.max(-14, Math.min(14, y - lastY));
      lastX = mx = x; lastY = my = y;
      kick();
    });
    hero.addEventListener('pointerleave', () => { mx = my = -1e5; vx = vy = 0; kick(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; if (onScreen) kick(); }).observe(hero);
    }

    build(true);
    let lastW = W, timer = 0;
    addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const w = Math.round(hero.getBoundingClientRect().width);
        if (w !== lastW) { lastW = w; build(false); }
      }, 150);
    });
  }

  /* ── 3. スタイルの横送り＋幕開き ── */
  const stylesSec = document.getElementById('styles');
  if (stylesSec && !reduce.matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('has-curtain');
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        stylesSec.classList.add('is-open');
        io.disconnect();
      }
    }, { threshold: 0.12 });
    io.observe(stylesSec);
  }
  const track = document.getElementById('style-track');
  if (track) {
    const btns = [...document.querySelectorAll('[data-scroll]')];
    const amount = () => {
      const li = track.querySelector('li');
      return li ? li.getBoundingClientRect().width + parseFloat(getComputedStyle(li.parentElement).columnGap || '0') : track.clientWidth * .8;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      for (const b of btns) {
        const off = b.dataset.scroll === '-1' ? track.scrollLeft <= 2 : track.scrollLeft >= max;
        b.setAttribute('aria-disabled', String(off));
      }
    };
    for (const b of btns) {
      b.addEventListener('click', () => {
        if (b.getAttribute('aria-disabled') === 'true') return;
        track.scrollBy({ left: Number(b.dataset.scroll) * amount(), behavior: reduce.matches ? 'auto' : 'smooth' });
      });
    }
    track.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }
})();
