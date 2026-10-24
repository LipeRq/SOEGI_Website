/* 無料相談のお申し込みフォーム。入力は demo.withsoegi.jp の /api/inquiry に送り、メールでソエギに届く（保存はしない） */
(function () {
  'use strict';
  var form = document.getElementById('inq');
  if (!form) { return; }
  var ENDPOINT = 'https://demo.withsoegi.jp/api/inquiry';
  var PHONE = '080-9018-2777';
  var TIMES = [['any', 'いつでも'], ['am', '午前（9〜12時）'], ['noon', '昼（12〜15時）'], ['pm', '夕方（15〜19時）']];
  var err = document.getElementById('f-err');
  var send = document.getElementById('f-send');
  var done = document.getElementById('f-done');

  // 日本時間の「明日」から45日先まで
  function jst(offsetDays) {
    var d = new Date(Date.now() + 9 * 3600 * 1000 + offsetDays * 86400 * 1000);
    return d.toISOString().slice(0, 10);
  }
  var slots = document.getElementById('slots');
  for (var i = 1; i <= 3; i += 1) {
    var row = document.createElement('div');
    row.className = 'f-slot';
    var lab = document.createElement('span');
    lab.className = 'f-slot-n';
    lab.textContent = '第' + i + '希望';
    var date = document.createElement('input');
    date.type = 'date'; date.name = 'date' + i; date.min = jst(1); date.max = jst(45);
    date.setAttribute('aria-label', '第' + i + '希望の日付');
    var time = document.createElement('select');
    time.name = 'time' + i;
    time.setAttribute('aria-label', '第' + i + '希望の時間帯');
    TIMES.forEach(function (t) { var o = document.createElement('option'); o.value = t[0]; o.textContent = t[1]; time.appendChild(o); });
    row.appendChild(lab); row.appendChild(date); row.appendChild(time);
    slots.appendChild(row);
  }

  function show(msg) { err.textContent = msg; if (msg) { err.focus && err.setAttribute('tabindex', '-1'); } }
  function val(n) { return (form.elements[n].value || '').trim(); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    show('');
    if (!val('name')) { show('お名前を入力してください。'); form.elements.name.focus(); return; }
    if (!val('phone') && !val('email')) { show('電話番号かメールアドレスのどちらかを入力してください。'); form.elements.phone.focus(); return; }
    if (!form.elements.agree.checked) { show('「個人情報の使いみち」を読んで、チェックを入れてください。'); form.elements.agree.focus(); return; }
    var body = {
      name: val('name'), company: val('company'), phone: val('phone'), email: val('email'),
      method: (form.querySelector('input[name="method"]:checked') || {}).value || 'online',
      slots: [1, 2, 3].map(function (n) { return { date: val('date' + n), time: val('time' + n) }; }).filter(function (s) { return s.date; }),
      note: val('note'), website: val('website'), agree: true
    };
    send.disabled = true; var label = send.textContent; send.textContent = '送っています…';
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) { ctl.abort(); } }, 20000);
    fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok) {
          form.hidden = true; done.hidden = false; done.focus();
          done.scrollIntoView({ block: 'center' });
        } else {
          show((res.j && res.j.error) || '送信できませんでした。お手数ですが、お電話（' + PHONE + '）でご連絡ください。');
        }
      })
      .catch(function () { show('送信できませんでした。通信の状態をご確認のうえ、もう一度お試しください。うまくいかない場合は、お電話（' + PHONE + '）でご連絡ください。'); })
      .then(function () { clearTimeout(timer); send.disabled = false; send.textContent = label; });
  });
}());
