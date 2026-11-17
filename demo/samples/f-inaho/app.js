/* 木のいえ 稲穂工務店（架空）：小さな動きだけ（依存なし）。
   ・文字の大きさ（標準／大）：aria-pressed で状態を示す。localStorage は try/catch で扱う
   ・家の断面図（修理の目安）：番号ボタンや修理カードを選ぶと、断面図の丸印とカードが連動して光る
   ・施工事例の絞り込み：CSS の :has() と連動。件数の読み上げと URL の ?type= の読み書き
   ・相談の申し込みフォーム：送らない（サンプル）。押したら「送信されません」と表示する
   ・印刷ボタン */
(() => {
  const root = document.documentElement;

  // 1. 文字の大きさ
  const fsBtns = [...document.querySelectorAll('button[data-fs-set]')];
  const applyFs = v => {
    if (v === 'l') root.dataset.fs = 'l'; else delete root.dataset.fs;
    fsBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.fsSet === (v === 'l' ? 'l' : 'm'))));
  };
  applyFs(root.dataset.fs);
  fsBtns.forEach(b => b.addEventListener('click', () => {
    applyFs(b.dataset.fsSet);
    try { localStorage.setItem('inaho-fs', b.dataset.fsSet); } catch (e) { /* 保存できなくても切り替えは効いている */ }
  }));

  // 2. 家の断面図と修理カードの連動
  const repairBtns = [...document.querySelectorAll('[data-repair-btn]')];
  const repairPins = [...document.querySelectorAll('[data-repair-pin]')];
  const repairCards = [...document.querySelectorAll('[data-repair-card]')];
  if (repairBtns.length) {
    const selectRepair = id => {
      repairBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.repairBtn === id)));
      repairPins.forEach(p => p.classList.toggle('is-active', p.dataset.repairPin === id));
      repairCards.forEach(c => c.classList.toggle('is-active', c.dataset.repairCard === id));
    };
    repairBtns.forEach(b => b.addEventListener('click', () => selectRepair(b.dataset.repairBtn)));
    repairPins.forEach(p => {
      p.addEventListener('click', () => {
        const id = p.dataset.repairPin;
        selectRepair(id);
        const card = repairCards.find(c => c.dataset.repairCard === id);
        if (card) {
          const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
        }
      });
    });
    repairCards.forEach(c => {
      c.addEventListener('mouseenter', () => selectRepair(c.dataset.repairCard));
      c.addEventListener('click', () => selectRepair(c.dataset.repairCard));
    });
    selectRepair('1');
  }

  // 3. 施工事例の絞り込み
  const filt = document.querySelector('[data-filter]');
  if (filt) {
    const cases = [...document.querySelectorAll('.case')];
    const out = document.querySelector('[data-filter-count]');
    const hasHas = !!(window.CSS && CSS.supports && CSS.supports('selector(:has(*))'));
    const update = writeUrl => {
      const v = (filt.querySelector('input:checked') || {}).value || 'all';
      let shown = 0;
      cases.forEach(c => {
        const on = v === 'all' || c.dataset.type.split(' ').includes(v);
        if (!hasHas) c.hidden = !on;
        if (on) shown++;
      });
      if (out) out.textContent = `${cases.length}軒のうち、${shown}軒を出しています。`;
      if (writeUrl) {
        try {
          const u = new URL(location.href);
          if (v === 'all') u.searchParams.delete('type'); else u.searchParams.set('type', v);
          history.replaceState(null, '', u);
        } catch (e) { /* URL を書き換えられなくても絞り込みは効く */ }
      }
    };
    const q = new URLSearchParams(location.search).get('type');
    if (q) { const r = [...filt.querySelectorAll('input')].find(i => i.value === q); if (r) r.checked = true; }
    filt.addEventListener('change', () => update(true));
    update(false);
  }

  // 4. 相談の申し込みフォーム（サンプルなので送らない）
  const form = document.querySelector('form[data-sample]');
  if (form) {
    const st = form.querySelector('[data-form-status]');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const missing = [...form.querySelectorAll('[required]')]
        .filter(el => !el.checkValidity())
        .map(el => el.dataset.name || (el.labels && el.labels[0] ? el.labels[0].textContent.replace(/必須/g, '').trim() : ''));
      st.textContent = '';
      const p = document.createElement('p');
      p.innerHTML = '<b>これはサンプルのため、送信されません。</b>実際のサイトでは、ここで送信が終わり、確認のメールが届きます。';
      st.appendChild(p);
      if (missing.length) {
        const p2 = document.createElement('p');
        p2.textContent = '実際のサイトなら、次の項目の入力をお願いする表示が出ます：';
        const ul = document.createElement('ul');
        [...new Set(missing)].forEach(m => { const li = document.createElement('li'); li.textContent = m; ul.appendChild(li); });
        st.append(p2, ul);
      }
      st.hidden = false;
      st.focus();
    });
  }

  // 5. 印刷
  document.querySelectorAll('.print-btn').forEach(b => {
    b.hidden = false;
    b.addEventListener('click', () => window.print());
  });
})();
