/* ミツミル（架空）の動き。依存なし。
   方針：HTML に完成した内容を書いておき、JavaScript は「見せ方」だけを足す。
   JavaScript が動かないときや「動きを減らす」設定のときは、最初から全部が見える。 */
(() => {
  'use strict';
  window.__mm = true; // head の小さなスクリプトに「app.js が引き継いだ」と知らせる
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement;
  const hasIO = 'IntersectionObserver' in window;

  /* 1. ヒーローの見積デモ：行が1つずつ、光が通ったあとに現れる（早回し） */
  const demo = $('#demo');
  if (demo) {
    const steps = $$('[data-step]', demo);
    const rows = steps.filter(s => s.classList.contains('est__r'));
    const rest = steps.filter(s => !s.classList.contains('est__r'));
    const st = $('[data-demo-st]', demo);
    const tm = $('[data-demo-time]', demo);
    const btn = $('[data-demo-btn]', demo);
    const meter = $('.hero__meter');
    const DONE = st.textContent;
    const MSG = ['依頼のメモを読んでいます…', '単価表から品目を探しています…', '下書きを作っています…'];
    const T = 4300; // 全体の長さ（ミリ秒）。画面に「早回し」と書いている
    const SHOWN = 28; // 画面の時計の最後の表示（秒・例）
    let timers = [];
    let raf = 0;
    const fmt = s => '00:' + String(s).padStart(2, '0');
    const stop = () => { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf); };
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));

    const finish = () => {
      stop();
      steps.forEach(s => s.classList.add('is-on'));
      demo.classList.remove('is-playing');
      html.classList.remove('demo-wait');
      st.textContent = DONE;
      tm.textContent = fmt(SHOWN);
      if (meter) meter.style.transform = '';
      btn.textContent = 'もう一度再生';
    };

    const play = () => {
      stop();
      steps.forEach(s => s.classList.remove('is-on'));
      demo.classList.add('is-playing');
      html.classList.remove('demo-wait');
      btn.textContent = '止める';
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - t0) / T);
        tm.textContent = fmt(Math.round(p * SHOWN));
        if (meter) meter.style.transform = `scaleX(${p})`;
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      st.textContent = MSG[0];
      at(450, () => { st.textContent = MSG[1]; });
      at(950, () => { st.textContent = MSG[2]; });
      // 最初の行は早めに出す（待たされている感じを作らない）
      rows.forEach((r, i) => at(700 + i * 520, () => r.classList.add('is-on')));
      const end = 700 + rows.length * 520 + 100;
      rest.forEach((r, i) => at(end + i * 320, () => r.classList.add('is-on')));
      at(T, finish);
    };

    if (reduce) {
      finish(); // 動きを減らす設定：完成した下書きをそのまま見せる。再生ボタンも出さない
    } else {
      btn.hidden = false;
      btn.addEventListener('click', () => (demo.classList.contains('is-playing') ? finish() : play()));
      play();
    }
  }

  /* 2. 業種の帯：止める／流すボタン（自動で動き続けるものは、止められるようにする） */
  const tags = $('.tags');
  const tbtn = $('[data-tags-btn]');
  if (tags && tbtn && !reduce) {
    tbtn.hidden = false;
    tbtn.addEventListener('click', () => {
      const paused = tags.classList.toggle('is-paused');
      tbtn.setAttribute('aria-pressed', String(paused));
    });
  }

  /* 3. 画面の外にある光は止める（見えない動きに電池を使わない） */
  if (hasIO) {
    $$('.aurora:not(.is-still), .ring').forEach(el => {
      new IntersectionObserver(([e]) => el.classList.toggle('is-off', !e.isIntersecting)).observe(el);
    });
  }

  /* 4. ある晩のログ：画面に入ったら一度だけ、上から1行ずつ出す。
     最初から見えている位置なら何もしない（読み込み直後に隠すと、ちらつくため） */
  if (hasIO && !reduce) {
    $$('[data-reveal]').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight * 0.9) return;
      el.classList.add('is-pre');
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        el.classList.remove('is-pre');
      }, { threshold: 0.35 });
      io.observe(el);
    });
  }

  /* 5. フォームは送らない（サンプル） */
  $$('form[data-sample]').forEach(f => {
    f.addEventListener('submit', e => {
      e.preventDefault();
      const msg = $('[data-form-msg]', f);
      if (msg) msg.textContent = 'サンプルのため送信されません。入力した内容は、どこにも送られていません。';
    });
  });

  /* 6. プラン：月の下書きの数を入れると、3つのプランの使用量メーターと「1件あたり」が変わる（金額は例） */
  const cnt = $('#cnt-n');
  if (cnt) {
    const out = $('#cnt-out');
    const plans = $$('[data-plan]');
    const names = { trial: 'お試し', std: 'スタンダード', team: 'チーム' };
    const yearly = $('#bill-y');
    const yen = v => Math.round(v).toLocaleString('ja-JP');
    const update = () => {
      let n = Math.round(Number(cnt.value));
      if (!Number.isFinite(n) || n < 1) n = 1;
      if (n > 500) n = 500;
      const bill = yearly && yearly.checked ? 'y' : 'm';
      // 収まるいちばん小さいプランを「合う」とする（上限0は上限なし）
      const fit = plans.find(el => { const lim = Number(el.dataset.limit); return lim === 0 || n <= lim; });
      plans.forEach(el => {
        const lim = Number(el.dataset.limit);
        const use = $('[data-use]', el);
        const bar = $('.use__bar i', el);
        const nTxt = $('[data-use-n]', el);
        const st = $('[data-use-st]', el);
        const price = Number(el.dataset[bill]);
        const over = lim > 0 && n > lim;
        use.classList.toggle('is-over', over);
        bar.style.setProperty('--u', lim === 0 ? 1 : Math.min(1, n / lim));
        nTxt.textContent = lim === 0 ? `${n}件・上限なし` : `${n} / ${lim}件`;
        st.textContent = over ? '上限を超えます' : price ? `1件あたり 約${yen(price / n)}円` : '14日間は0円（例）';
        el.classList.toggle('is-fit', el === fit);
      });
      const b = document.createElement('b');
      b.textContent = names[fit.dataset.plan];
      out.replaceChildren(`月に${n}件なら、`, b, `に収まります（${bill === 'y' ? '年払い' : '月払い'}・例）。`);
    };
    // −／＋ボタンは JavaScript があるときだけ出す（なくても数字は直接入れられる）
    $$('[data-step]').forEach(btn => {
      btn.hidden = false;
      btn.addEventListener('click', () => {
        const v = Math.max(1, Math.min(500, (Number(cnt.value) || 0) + Number(btn.dataset.step)));
        cnt.value = v;
        update();
      });
    });
    cnt.addEventListener('input', update);
    cnt.addEventListener('change', () => { cnt.value = Math.max(1, Math.min(500, Math.round(Number(cnt.value)) || 1)); update(); });
    $$('input[name="bill"]').forEach(r => r.addEventListener('change', update));
    update();
  }
})();
