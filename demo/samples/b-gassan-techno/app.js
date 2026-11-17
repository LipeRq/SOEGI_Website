/* 月山テクノワークス（架空）サンプルの動き。依存なし。
   ・スマホのメニュー（JavaScript が無ければ、ナビは最初から全部並んで見える）
   ・検査成績書の測定値が、測定器の表示のように揺れてから落ち着く（「動きを減らす」設定では何もしない）
   ・見積りフォームは送信しない（サンプルのため）
   ・設備ページの絞り込み（JavaScript が無ければ、表は全部見える） */
(() => {
  const d = document;
  d.documentElement.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ───── メニュー ─────
  const menuBtn = d.querySelector('.hd__menu');
  const nav = d.getElementById('gnav');
  if (menuBtn && nav) {
    const set = open => { menuBtn.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); };
    menuBtn.addEventListener('click', () => set(menuBtn.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    d.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { set(false); menuBtn.focus(); }
    });
  }

  // ───── 測定値が落ち着く表示 ─────
  const table = d.querySelector('.rep__tbl');
  if (table && !reduce.matches && 'IntersectionObserver' in window) {
    const cells = [...table.querySelectorAll('.ro[data-v]')];
    const timers = [];
    const rafs = [];
    const stopAll = () => {
      timers.forEach(clearTimeout);
      rafs.forEach(cancelAnimationFrame);
      for (const el of cells) {
        el.textContent = el.dataset.v;
        el.classList.remove('is-run');
      }
    };
    reduce.addEventListener?.('change', e => { if (e.matches) stopAll(); });

    const run = (el, delay) => {
      const v = el.dataset.v;
      const dec = (v.split('.')[1] || '').length;
      const target = parseFloat(v);
      const amp = Math.pow(10, -dec) * 30;
      const dur = 1100;
      let start = 0;
      const tick = now => {
        if (reduce.matches) { stopAll(); return; }
        if (!start) start = now;
        const t = Math.min(1, (now - start) / dur);
        if (t >= 1) { el.textContent = v; el.classList.remove('is-run'); return; }
        const k = Math.pow(1 - t, 2.2);
        const shown = Math.max(0, target + (Math.random() * 2 - 1) * amp * k);
        el.textContent = shown.toFixed(dec);
        rafs.push(requestAnimationFrame(tick));
      };
      timers.push(setTimeout(() => {
        if (reduce.matches) return;
        el.classList.add('is-run');
        rafs.push(requestAnimationFrame(tick));
      }, delay));
    };

    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting) || reduce.matches) return;
      io.disconnect();
      cells.forEach((el, i) => run(el, i * 140));
    }, { threshold: 0.45 });
    io.observe(table);
  }

  // ───── 見積りフォーム（送信しない） ─────
  const form = d.querySelector('form[data-sample]');
  if (form) {
    const msg = form.querySelector('.form__msg');
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (msg) msg.textContent = 'サンプルのため送信されません。（実際のサイトでは、ここで受付完了となる）';
    });
  }

  // ───── 設備の絞り込み ─────
  const flt = d.querySelector('.flt');
  if (flt) {
    flt.hidden = false;
    const rows = [...d.querySelectorAll('.eq tbody tr')];
    const out = flt.querySelector('.flt__count');
    const empty = d.querySelector('.eq__empty');
    const total = rows.reduce((n, r) => n + Number(r.dataset.n || 0), 0);
    const apply = () => {
      const p = flt.elements.proc.value;
      const m = flt.elements.mat.value;
      let units = 0, kinds = 0;
      for (const r of rows) {
        const procs = r.dataset.proc.split(' ');
        const mats = r.dataset.mat.split(' ');
        const show = (!p || procs.includes(p)) && (!m || mats.includes(m) || mats.includes('all'));
        r.hidden = !show;
        for (const t of r.querySelectorAll('[data-m]')) t.classList.toggle('is-hit', !!m && t.dataset.m === m);
        if (show) { kinds++; units += Number(r.dataset.n || 0); }
      }
      out.innerHTML = (p || m)
        ? `<span>該当 <span class="num">${units}</span> 台（${kinds}機種）</span><span>／全${total}台</span>`
        : `<span>全設備 <span class="num">${total}</span> 台</span><span>（${rows.length}機種）</span>`;
      if (empty) empty.hidden = kinds > 0;
    };
    flt.addEventListener('change', apply);
    flt.addEventListener('reset', () => setTimeout(apply, 0));
    apply();
  }
})();
