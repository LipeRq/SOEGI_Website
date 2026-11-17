/* べにさや農園（架空）— 動きの部品（依存なし）
   1. 「動きを止める」ボタン（花びら・さくらんぼの揺れ・流れる帯・荷札の揺れをまとめて止める）
   2. ヒーローの花びら（キャンバス）：上限36枚。画面外・タブが裏・動きを減らす設定・止めるボタンで描画ループを止める
   3. 農園の一年：読んでいる作業日誌の章に合わせて、アーチ窓の標本枠（data-scene）と季節バッジを切り替える
   4. FAX注文用紙の印刷ボタン */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const onChange = [];

  /* 1. 動きを止める（次のページでも同じ状態にする。保存できない環境でも動く） */
  const KEY = 'benisaya-still';
  const btns = [...document.querySelectorAll('[data-still], [data-motion-toggle]')];
  let still = false;
  try { still = localStorage.getItem(KEY) === '1'; } catch { /* 保存できなくても続ける */ }
  const applyStill = () => {
    root.classList.toggle('is-still', still);
    btns.forEach(b => b.setAttribute('aria-pressed', String(still)));
    onChange.forEach(f => f());
  };
  btns.forEach(b => b.addEventListener('click', () => {
    still = !still;
    try { localStorage.setItem(KEY, still ? '1' : '0'); } catch { /* 同上 */ }
    applyStill();
  }));

  /* 2. 花びら（キャンバス #petals / .petals） */
  const cv = document.querySelector('#petals, .petals');
  if (cv && cv.getContext) {
    const ctx = cv.getContext('2d');
    const MAX = 36;                       // 粒の上限（広い画面でもこれ以上は増やさない）
    const COLORS = ['#F7B7C7', '#F49DB3', '#FAD0DB', '#FFFFFF', '#F2A3B8'];
    let seed = 42;
    const nextRand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const rand = (a, b) => a + nextRand() * (b - a);
    let W = 0, H = 0, list = [], raf = 0, last = 0, seen = true;

    const make = top => ({
      x: rand(-20, W), y: top ? rand(-60, -12) : rand(0, H),
      s: rand(5, 10.5), r: rand(0, 6.3), vr: rand(-1.1, 1.1),
      vy: rand(20, 42), sw: rand(12, 30), ph: rand(0, 6.3), fq: rand(.5, 1.3), fl: rand(0, 6.3),
      c: COLORS[(nextRand() * COLORS.length) | 0],
    });

    const draw = dt => {
      ctx.clearRect(0, 0, W, H);
      for (const p of list) {
        if (dt) {
          p.ph += dt * p.fq; p.fl += dt * 2.4; p.r += p.vr * dt;
          p.y += p.vy * dt; p.x += (Math.sin(p.ph) * p.sw + 10) * dt;
          if (p.y > H + 16 || p.x > W + 24) Object.assign(p, make(true));
        }
        const k = Math.cos(p.fl);
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, .3 + .7 * Math.abs(k));
        ctx.globalAlpha = k < 0 ? .78 : .95;
        ctx.fillStyle = p.c;
        const s = p.s;
        ctx.beginPath();
        ctx.moveTo(0, s);
        ctx.bezierCurveTo(-s * .95, s * .35, -s * .75, -s * .8, -s * .2, -s);
        ctx.lineTo(0, -s * .7);
        ctx.lineTo(s * .2, -s);
        ctx.bezierCurveTo(s * .75, -s * .8, s * .95, s * .35, 0, s);
        ctx.fill();
        ctx.restore();
      }
    };

    const resize = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nw = Math.round(r.width), nh = Math.round(r.height);
      if (nw === W && nh === H && list.length) return;
      W = nw; H = nh;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(MAX, Math.round((W * H) / 24000));
      while (list.length < n) list.push(make(false));
      list.length = n;
      draw(0); // 止まっているときも、1枚の絵として花びらを見せる
    };

    const loop = t => {
      if (reduce.matches || still || document.hidden || !seen) { raf = 0; return; }
      const dt = Math.min((t - last) / 1000, .05);
      last = t; draw(dt);
      raf = requestAnimationFrame(loop);
    };
    const update = () => {
      const run = seen && !document.hidden && !still && !reduce.matches;
      if (run && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
      else if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
    };

    new IntersectionObserver(es => { seen = es[es.length - 1].isIntersecting; update(); }).observe(cv);
    document.addEventListener('visibilitychange', update);
    reduce.addEventListener('change', update);
    onChange.push(update);
    let rt = 0;
    new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(resize, 120); }).observe(cv);
    resize();
  }

  /* 3. 農園の一年：画面の真ん中を通った章を「いまの場面」にする */
  const story = document.querySelector('.story');
  if (story && 'IntersectionObserver' in window) {
    const links = [...story.querySelectorAll('.steps a')];
    const set = scene => {
      if (!scene || story.dataset.scene === scene) return;
      story.dataset.scene = scene;
      links.forEach(a => {
        if (a.getAttribute('href') === '#ch-' + scene) a.setAttribute('aria-current', 'step');
        else a.removeAttribute('aria-current');
      });
    };
    links.forEach(a => {
      a.addEventListener('click', () => {
        const h = a.getAttribute('href') || '';
        if (h.startsWith('#ch-')) set(h.slice(4));
      });
    });
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) set(e.target.dataset.scene); });
    }, { rootMargin: '-58% 0px -40% 0px' });
    story.querySelectorAll('.ch').forEach(c => io.observe(c));
  }

  /* 4. 印刷（FAX注文用紙だけが出る印刷用のスタイルあり） */
  document.querySelectorAll('[data-print]').forEach(b => b.addEventListener('click', () => window.print()));

  applyStill();
})();
