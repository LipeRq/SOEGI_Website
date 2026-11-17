/* ソエギ 制作サンプル：「制作メモを見る」ボタンの動き（依存なし・約2KB）
   ボタンを押したときに、同じフォルダの memo.json と metrics.json（あれば）を読んで、制作メモを組み立てる。
   （サンプルのページはすべて同じフォルダに平らに置く。memo.json の形：）
   { "title":"木のいえ 稲穂工務店", "kind":"堅実｜工務店（架空）",
     "persona":"想定したお客様", "problem":"課題", "approach":"方針",
     "techniques":["使った技法", "..."], "notFor":"向かない場面", "notes":["そのほかのメモ"] }
   metrics.json は検査ツールが作る（測った値だけが入る。無ければ「未測定」と出す）。 */
(() => {
  const btn = document.querySelector('[data-soegi-memo]');
  if (!btn) return;
  let memo = null;

  let dlg = null;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const row = (dl, k, v) => {
    if (!v || (Array.isArray(v) && !v.length)) return;
    dl.appendChild(el('dt', '', k));
    const dd = el('dd');
    if (Array.isArray(v)) { const ul = el('ul'); v.forEach(x => ul.appendChild(el('li', '', x))); dd.appendChild(ul); } else dd.textContent = v;
    dl.appendChild(dd);
  };

  const metricsBox = async () => {
    const box = el('div', 'soegi-memo__m');
    box.appendChild(el('h3', '', '測った数値'));
    let m = null;
    try { const r = await fetch('metrics.json', { cache: 'no-cache' }); if (r.ok) m = await r.json(); } catch { /* 無ければ未測定 */ }
    if (!m) { box.appendChild(el('p', '', '未測定です。測った数値だけをここに載せます。')); return box; }
    const t = el('table');
    for (const [k, v] of m.rows ?? []) { const tr = el('tr'); tr.appendChild(el('th', '', k)); tr.appendChild(el('td', '', v)); t.appendChild(tr); }
    box.appendChild(t);
    box.appendChild(el('p', '', `測った日：${m.measuredAt ?? '不明'}。条件：${m.conditions ?? '不明'}。`));
    for (const n of m.notes ?? []) box.appendChild(el('p', '', n));
    return box;
  };

  const build = async () => {
    dlg = el('dialog', 'soegi-memo');
    dlg.setAttribute('aria-labelledby', 'soegi-memo-t');
    const inner = el('div', 'soegi-memo__in');
    const hd = el('div', 'soegi-memo__hd');
    const h = el('h2'); h.id = 'soegi-memo-t';
    h.appendChild(document.createTextNode('制作メモ　' + (memo.title ?? '')));
    if (memo.kind) h.appendChild(el('small', '', memo.kind));
    const x = el('button', 'soegi-memo__x', '×'); x.type = 'button'; x.setAttribute('aria-label', '閉じる');
    x.addEventListener('click', () => dlg.close());
    hd.append(h, x);
    const bd = el('div', 'soegi-memo__bd');
    const dl = el('dl');
    row(dl, '想定したお客様', memo.persona);
    row(dl, '課題', memo.problem);
    row(dl, '方針', memo.approach);
    row(dl, '使った技法', memo.techniques);
    row(dl, '向かない場面', memo.notFor);
    row(dl, 'そのほか', memo.notes);
    bd.append(dl, await metricsBox());
    const note = el('p', 'soegi-memo__m'); note.style.cssText = 'font-size:.8rem;color:#465056';
    note.textContent = 'この会社・商品・数字・お客様の声はすべて架空です。実績ではなく、制作の見本です。';
    bd.appendChild(note);
    inner.append(hd, bd);
    dlg.appendChild(inner);
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => btn.focus());
    document.body.appendChild(dlg);
  };

  btn.addEventListener('click', async () => {
    if (!dlg) {
      try {
        const r = await fetch('memo.json', { cache: 'no-cache' });
        if (!r.ok) throw new Error(String(r.status));
        memo = await r.json();
      } catch { memo = { title: '', notes: ['制作メモを読み込めませんでした。'] }; }
      await build();
    }
    dlg.showModal();
  });
})();
