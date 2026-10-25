/* ソエギ サイト共通の動き（全ページ）。ページにあるものだけが動く */
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  function $(id) { return document.getElementById(id); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function h1(n) { return (Math.round(n * 10) / 10).toString(); }
  function yen(n) { return Math.round(n).toLocaleString('ja-JP'); }

  /* ---------- load choreography ---------- */
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('is-ready'); }); });

  /* ---------- header: scrolled state ---------- */
  var hd = $('hd');
  function onScroll() { hd.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var menuBtn = $('menu-btn'), gnav = $('gnav');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    gnav.classList.toggle('is-open', open);
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  gnav.addEventListener('click', function (e) { if (e.target.closest('a')) { setMenu(false); } });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (menuBtn.getAttribute('aria-expanded') === 'true' && !e.target.closest('#gnav') && !e.target.closest('#menu-btn')) { setMenu(false); }
  });

  /* ---------- current section in nav ---------- */
  var cbar = $('cbar'), contactEl = $('contact');
  if ('IntersectionObserver' in window) {
    var links = {};
    each(gnav.querySelectorAll('a[href]'), function (a) {
      var u = a.getAttribute('href'), i = u.indexOf('#');
      if (i < 0) { return; }
      var p = u.slice(0, i) || location.pathname;
      if (p !== location.pathname && !(p === '/' && /^\/(index\.html)?$/.test(location.pathname))) { return; }
      links[u.slice(i + 1)] = a;
    });
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = links[en.target.id];
        if (!a) { return; }
        if (en.isIntersecting) {
          each(gnav.querySelectorAll('a'), function (x) { if (x.getAttribute('aria-current') === 'true') { x.removeAttribute('aria-current'); } });
          a.setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var el = $(id); if (el) { navIO.observe(el); } });

    /* hide the mobile call bar while the contact section is on screen */
    if (cbar && contactEl) {
      new IntersectionObserver(function (en) { cbar.classList.toggle('is-hidden', en[0].isIntersecting); }, { threshold: 0.15 }).observe(contactEl);
    }
  }

  /* ---------- measure sheet ---------- */
  if ($('sheet-rows')) {
  
  var SHEETS = [
    { rows: [['見積書の作成', 20, 7, '時間', '月'], ['求人原稿の作成', 6, 1.5, '時間', '月'], ['問い合わせ対応', 12, 5, '時間', '月']],
      ft: '3つ合わせて、月38時間が13.5時間に', sub: 'お客さまごとに、この表をおつくりします' },
    { rows: [['見積りを返すまで', 3, 1, '日', ''], ['問い合わせに返信するまで', 24, 3, '時間', ''], ['求人を出すまで', 14, 3, '日', '']],
      ft: '早く返せるほど、受注や応募につながります', sub: '作業時間だけでなく、こうした数字も一緒に測ります' }
  ];
  var sheetRows = $('sheet-rows'), sheetFt = $('sheet-ft');
  var sheetTimers = [];

  function countTo(el, from, to, unit, dur) {
    if (RM) { el.textContent = h1(to) + unit; return; }
    var t0 = null;
    function st(t) {
      if (!t0) { t0 = t; }
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = h1(from + (to - from) * e) + unit;
      if (p < 1) { requestAnimationFrame(st); }
    }
    requestAnimationFrame(st);
  }

  function renderSheet(i, drawBefore) {
    sheetTimers.forEach(clearTimeout); sheetTimers = [];
    var s = SHEETS[i];
    sheetRows.innerHTML = s.rows.map(function (r) {
      var ratio = r[2] / r[1];
      var start = RM ? ratio : 1;
      return '<div class="mrow"><span class="mname">' + r[0] + '</span>' +
        '<div class="dimrow"><span class="k">導入前</span><div class="dim" style="--p:' + (drawBefore && !RM ? 0 : 1) + '"><i class="l"></i><i class="r"></i></div><span class="v">' + h1(r[1]) + r[3] + '</span></div>' +
        '<div class="dimrow af"><span class="k">導入後</span><div class="dim" data-to="' + ratio + '" style="--p:' + (drawBefore && !RM ? 0 : start) + '"><i class="l"></i><i class="r"></i></div><span class="v" data-from="' + r[1] + '" data-to="' + r[2] + '" data-unit="' + r[3] + '">' + h1(RM ? r[2] : r[1]) + r[3] + '</span></div>' +
        '<div class="mdelta">' + r[4] + h1(r[1] - r[2]) + r[3] + '短く</div></div>';
    }).join('');
    sheetFt.innerHTML = '<b>' + s.ft + '</b><small>' + s.sub + '</small>';
    if (RM) { return; }

    var befores = sheetRows.querySelectorAll('.dimrow:not(.af) .dim');
    var afters = sheetRows.querySelectorAll('.af .dim');
    var shrinkAt = 120;
    if (drawBefore) {
      /* draw both lines out to the "before" length once the sheet has faded in */
      sheetRows.offsetWidth;
      sheetTimers.push(setTimeout(function () {
        each(befores, function (d) { d.style.setProperty('--p', 1); });
        each(afters, function (d) { d.style.setProperty('--p', 1); });
      }, 500));
      shrinkAt = 1650;
    }
    /* then shrink the "after" line to its measured length */
    sheetTimers.push(setTimeout(function () {
      each(afters, function (d, k) {
        sheetTimers.push(setTimeout(function () {
          d.style.setProperty('--p', d.getAttribute('data-to'));
          var v = d.parentNode.querySelector('.v');
          countTo(v, parseFloat(v.getAttribute('data-from')), parseFloat(v.getAttribute('data-to')), v.getAttribute('data-unit'), 1000);
        }, k * 110));
      });
    }, shrinkAt));
  }

  var sheetBtns = document.querySelectorAll('[data-sheet]');
  each(sheetBtns, function (b) {
    b.addEventListener('click', function () {
      if (b.getAttribute('aria-pressed') === 'true') { return; }
      each(sheetBtns, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      renderSheet(parseInt(b.getAttribute('data-sheet'), 10), false);
    });
  });
  /* hero load: draw the first sheet after the headline has begun to rise */
  if (!RM) { renderSheet(0, true); }
  }

  /* ---------- tree: 1期（3ヶ月）。木が育ち、終えるときだけ添え木が外れる ---------- */
  var MONTH_TAGS = ['お伺い（1回）', 'オンラインで振り返り', '数字を見て、続けるか決める', '手順書をお渡しします'];
  var STAGE = [0, 1, 3, 5, 6]; /* 月 → 木の育ち（data-m の何番目まで見せるか） */
  function buildRuler(svg) {
    var g = svg.querySelector('.ruler');
    if (!g) { return; }
    var d = 'M36 214V46', ns = 'http://www.w3.org/2000/svg';
    for (var y = 214, k = 0; y >= 46; y -= 12, k++) { d += 'M36 ' + y + 'h' + (k % 4 === 0 ? -8 : -4); }
    var p = document.createElementNS(ns, 'path');
    p.setAttribute('class', 'rl'); p.setAttribute('d', d);
    g.appendChild(p);
  }
  function setTree(svg, m) {
    var stage = STAGE[m] || 1;
    var s = 0.55 + 0.09 * (stage - 1);
    svg.querySelector('.tree-g').style.transform = 'scale(' + s + ')';
    each(svg.querySelectorAll('.tp'), function (p) { p.classList.toggle('on', parseInt(p.getAttribute('data-m'), 10) <= stage); });
    svg.querySelector('.stake').classList.toggle('gone', m >= 4);
    var tip = m >= 4 ? 50 : 67;
    var top = 214 - (214 - tip) * s;
    var mk = svg.querySelector('.mk');
    if (mk) { mk.style.transform = 'translateY(' + top.toFixed(1) + 'px)'; }
  }
  var tree = $('tree');
  if (tree) {
    buildRuler(tree);
    /* minis in the "name" block */
    each(document.querySelectorAll('[data-mini]'), function (box) {
      var c = tree.cloneNode(true);
      c.removeAttribute('id'); c.removeAttribute('hidden');
      c.setAttribute('aria-hidden', 'true');
      c.removeAttribute('role'); c.removeAttribute('aria-labelledby');
      var t = c.querySelector('title'); if (t) { t.remove(); }
      var mk = c.querySelector('.mk'); if (mk) { mk.remove(); }
      var lb = c.querySelector('.sk-lb'); if (lb) { lb.remove(); }
      var ld = c.querySelector('.sk-ld'); if (ld) { ld.remove(); }
      c.classList.add('static');
      box.appendChild(c);
      setTree(c, parseInt(box.getAttribute('data-mini'), 10));
    });

    /* press the first mini to watch it grow through the period */
    var playBtn = document.querySelector('.mini-play');
    if (playBtn) {
      var playing = false;
      playBtn.addEventListener('click', function () {
        if (playing) { return; }
        playing = true;
        var svg = playBtn.querySelector('svg.tree'), cap = $('mini-cap'), orig = cap.textContent, m = 1;
        playBtn.setAttribute('aria-busy', 'true');
        svg.classList.remove('static');
        function step() {
          m++;
          setTree(svg, m);
          cap.textContent = m < 4 ? m + 'ヶ月目' : '終えるとき：添え木が外れる';
          setTimeout(m < 4 ? step : reset, m < 4 ? 600 : 2000);
        }
        function reset() {
          svg.style.opacity = '0';
          setTimeout(function () {
            svg.classList.add('static');
            setTree(svg, 1);
            svg.getBoundingClientRect();
            svg.style.opacity = '';
            cap.textContent = orig;
            playBtn.removeAttribute('aria-busy');
            playing = false;
          }, 280);
        }
        setTimeout(step, 120);
      });
    }

    var gmLabel = $('gm-label'), gmTag = $('gm-tag'), monthEls = document.querySelectorAll('.month');
    if (gmLabel && gmTag && monthEls.length) {
      tree.classList.add('static');
      setTree(tree, 1);
      tree.getBoundingClientRect();
      requestAnimationFrame(function () { tree.classList.remove('static'); });
      var curM = 1;
      var setMonth = function (m) {
        if (m === curM) { return; }
        curM = m;
        setTree(tree, m);
        gmLabel.textContent = m < 4 ? m + 'ヶ月目' : '終える場合';
        gmTag.textContent = MONTH_TAGS[m - 1];
        each(monthEls, function (el) { el.classList.toggle('is-on', parseInt(el.getAttribute('data-m'), 10) === m); });
      };
      if ('IntersectionObserver' in window) {
        var mIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) { setMonth(parseInt(en.target.getAttribute('data-m'), 10)); } });
        }, { rootMargin: '-50% 0px -40% 0px' });
        each(monthEls, function (el) { mIO.observe(el); });
      }
    }
  }

  /* ---------- flow: rail drawn by scroll ---------- */
  var stepsEl = document.querySelector('.steps');
  if (stepsEl && 'IntersectionObserver' in window) {
    var stepEls = stepsEl.querySelectorAll('.step'), railOn = false, railTick = false;
    function updRail() {
      railTick = false;
      var r = stepsEl.getBoundingClientRect(), line = window.innerHeight * 0.62;
      var p = (line - (r.top + 24)) / Math.max(1, r.height - 48);
      stepsEl.style.setProperty('--prog', Math.max(0, Math.min(1, p)).toFixed(4));
      each(stepEls, function (el) {
        var n = el.querySelector('.step-n').getBoundingClientRect();
        el.classList.toggle('is-passed', n.top + n.height / 2 < line);
      });
    }
    function reqRail() { if (railOn && !railTick) { railTick = true; requestAnimationFrame(updRail); } }
    new IntersectionObserver(function (en) { railOn = en[0].isIntersecting; if (railOn) { reqRail(); } }, { rootMargin: '10% 0px 10% 0px' }).observe(stepsEl);
    window.addEventListener('scroll', reqRail, { passive: true });
    window.addEventListener('resize', reqRail);
  }

  /* ---------- the three tasks: steps now vs. after ---------- */
  if (document.querySelector('.entry')) {
  
  var BA = {
    est: [['似た案件の見積書をフォルダから探す', 'コピーして、品目を一つずつ書き換える', '単価と数量を打ち直す', '計算が合っているかを確かめる', '宛名と日付を直して送る'],
          ['品目・数量・納期などの条件を入れる', '過去の見積書をもとに、下書きが出る', '確かめて、必要なところだけ直す', '送る']],
    job: [['去年の原稿を探す', '何を書けばいいか、手が止まる', '書いては消してをくり返す', '忙しさにまぎれて、出しそびれる'],
          ['来てほしい人を、聞き取り票に書く', '書き方の違う原稿案が3つ出る', '選んで、言い回しを直す', 'ハローワークや求人サイトに出す']],
    mail: [['似たメールを過去の送信から探す', '一から返信を書く', '担当によって、文面や答えが変わる'],
           ['届いた問い合わせを貼り付ける', '決めておいた答えから、返信の下書きが出る', '確かめて送る']]
  };
  var entryEl = document.querySelector('.entry'), baCtl = document.querySelector('.ba-ctl');
  var baBoxes = entryEl.querySelectorAll('[data-ba]');
  function baItems(list) { return list.map(function (t, i) { return '<li style="--i:' + i + '"><span class="tx">' + t + '</span></li>'; }).join(''); }
  each(baBoxes, function (box) {
    var d = BA[box.getAttribute('data-ba')];
    box.innerHTML = '<p class="ba-meta"><span class="ba-k">いまの手順</span><b class="ba-c">' + d[0].length + 'つ</b></p>' +
      '<div class="ba-lists"><ol class="ba-before">' + baItems(d[0]) + '</ol><ol class="ba-after" aria-hidden="true">' + baItems(d[1]) + '</ol></div>';
  });
  baCtl.hidden = false;
  var baBtns = baCtl.querySelectorAll('[data-bav]');
  each(baBtns, function (b) {
    b.addEventListener('click', function () {
      var v = parseInt(b.getAttribute('data-bav'), 10);
      each(baBtns, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      entryEl.classList.toggle('is-after', v === 1);
      each(baBoxes, function (box) {
        var d = BA[box.getAttribute('data-ba')][v];
        box.querySelector('.ba-k').textContent = v ? '導入後の手順' : 'いまの手順';
        box.querySelector('.ba-c').textContent = d.length + 'つ';
        box.querySelector('.ba-before').setAttribute('aria-hidden', v ? 'true' : 'false');
        box.querySelector('.ba-after').setAttribute('aria-hidden', v ? 'false' : 'true');
      });
    });
  });
  }

  /* ---------- savings check（メニューを選べる） ---------- */
  if ($('calc-h')) {
    var calcWage = 5000, calcFee = 50000, calcName = '仕組みづくり';
    var HINT = { 5000: '時給5,000円として計算します', 1500: '時給1,500円（社会保険込み）として計算します', 2000: '時給2,000円として計算します' };
    var man = function (n) { return (n / 10000) + '万円'; };
    function tween(el, to, fmt) {
      var from = (typeof el._v === 'number') ? el._v : to;
      el._v = to;
      if (el._raf) { cancelAnimationFrame(el._raf); }
      if (RM || from === to) { el.textContent = fmt(to); return; }
      var t0 = null, dur = 380;
      function st(t) {
        if (!t0) { t0 = t; }
        var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(p < 1 ? from + (to - from) * e : to);
        if (p < 1) { el._raf = requestAnimationFrame(st); }
      }
      el._raf = requestAnimationFrame(st);
    }
    function fillRange(inp) {
      var min = +inp.min, max = +inp.max;
      inp.style.setProperty('--fill', ((inp.value - min) / (max - min) * 100) + '%');
    }
    function calc() {
      var hIn = $('calc-h'), rIn = $('calc-r');
      var hrs = parseInt(hIn.value, 10), rate = parseInt(rIn.value, 10);
      $('calc-h-o').textContent = hrs; $('calc-r-o').textContent = rate;
      fillRange(hIn); fillRange(rIn);
      var saved = hrs * rate / 100, val = saved * calcWage, be = calcFee / calcWage;
      tween($('calc-saved'), saved, h1);
      tween($('calc-yen'), val, yen);
      tween($('calc-be'), Math.round(be * 10) / 10, h1);
      $('calc-bar').style.transform = 'scaleX(' + Math.min(val / (calcFee * 2), 1) + ')';
      $('calc-fee-l').textContent = '月' + man(calcFee) + 'の元が取れる目安';
      $('calc-meter-l').textContent = calcName + ' 月' + man(calcFee);
      $('calc-meter-r').textContent = man(calcFee * 2);
      var v;
      if (val >= calcFee * 1.05) { v = '時間の削減だけで、月' + man(calcFee) + 'を上回ります。お試し導入で、この数字が本当に出るかを確かめましょう。'; }
      else if (val >= calcFee * 0.95) { v = '時間の削減だけで、ちょうど月' + man(calcFee) + 'に届きます。'; }
      else if (val >= calcFee * 0.5) { v = 'あと月' + h1(Math.max(0, be - saved)) + '時間の削減で届きます。見積りの回答の速さや求人の応募数など、お金に直結する数字も一緒に測ると、判断が変わることがあります。'; }
      else { v = '時間の削減だけでは、割に合わない可能性があります。無理におすすめはしません。作業量が多い別の業務がないか、無料相談で一緒に探しましょう。'; }
      $('calc-verdict').textContent = v;
      $('calc-who-h').textContent = HINT[calcWage];
      $('calc-menu-h').textContent = calcName + ' 月' + man(calcFee) + 'で計算します';
    }
    var whoBtns = document.querySelectorAll('#calc-who button');
    each(whoBtns, function (b) {
      b.addEventListener('click', function () {
        calcWage = parseInt(b.getAttribute('data-w'), 10);
        each(whoBtns, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        calc();
      });
    });
    var menuBtns = document.querySelectorAll('#calc-menu button');
    each(menuBtns, function (b) {
      b.addEventListener('click', function () {
        calcFee = parseInt(b.getAttribute('data-fee'), 10);
        calcName = b.getAttribute('data-name');
        each(menuBtns, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        calc();
      });
    });
    $('calc-h').addEventListener('input', calc);
    $('calc-r').addEventListener('input', calc);
    calc();
  }

  /* ---------- cursor: a warm pool of light, drawn behind the text ---------- */
  (function () {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) { return; }
    var cv = document.createElement('canvas');
    cv.className = 'cursor-fx';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    var R = 250;
    var dpr = 1, vw = 0, vh = 0, light = '', lightA = 0;
    var tx = 0, ty = 0, x = 0, y = 0, a = 0, ta = 0, seen = false;
    var running = false, last = 0, idle = null;

    function readColors() {
      var cs = getComputedStyle(root);
      light = cs.getPropertyValue('--fx-light').trim(); lightA = parseFloat(cs.getPropertyValue('--fx-light-a'));
    }
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      vw = window.innerWidth; vh = window.innerHeight;
      cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);
      if (a < 0.01) { return; }
      var g = ctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, 'rgba(' + light + ',' + (lightA * a) + ')');
      g.addColorStop(0.35, 'rgba(' + light + ',' + (lightA * 0.8 * a) + ')');
      g.addColorStop(0.7, 'rgba(' + light + ',' + (lightA * 0.32 * a) + ')');
      g.addColorStop(1, 'rgba(' + light + ',0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - R, y - R, R * 2, R * 2);
    }
    function tick(now) {
      var dt = Math.min(now - last, 50); last = now;
      var k = RM ? 1 : 1 - Math.pow(0.8, dt / 16.67);
      /* switch on gently, switch off quickly */
      var ka = RM ? 1 : 1 - Math.pow(ta > a ? 0.88 : 0.78, dt / 16.67);
      x += (tx - x) * k; y += (ty - y) * k;
      a += (ta - a) * ka;
      draw();
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.2 || Math.abs(ta - a) > 0.004) { requestAnimationFrame(tick); }
      else { running = false; a = ta; draw(); }
    }
    function kick() {
      if (running || document.hidden) { return; }
      running = true; last = performance.now(); requestAnimationFrame(tick);
    }
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') { return; }
      tx = e.clientX; ty = e.clientY;
      if (!seen) { x = tx; y = ty; seen = true; }
      ta = 1;
      clearTimeout(idle);
      idle = setTimeout(function () { ta = 0; kick(); }, 450);
      kick();
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { clearTimeout(idle); ta = 0; kick(); });
    window.addEventListener('resize', function () { size(); draw(); });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { readColors(); draw(); });
    size(); readColors();
  })();

  /* ---------- copy buttons ---------- */
  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* leave text selectable */ }
      ta.remove();
    }
  }
  each(document.querySelectorAll('[data-copy], [data-copy-text]'), function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-copy');
      var text = id ? $(id).value : b.getAttribute('data-copy-text');
      var msg = b.parentNode.querySelector('.copied');
      copyText(text, function () {
        msg.textContent = 'コピーしました';
        clearTimeout(b._t); b._t = setTimeout(function () { msg.textContent = ''; }, 3000);
      });
    });
  });

  /* ---------- reel: デモの見本（トップ）。見えている間だけ自動で切り替える ---------- */
  var reel = $('reel');
  if (reel) {
    var tabs = reel.querySelectorAll('[data-scene]'), scenes = reel.querySelectorAll('.scene');
    var cur = 0, timer = null, userPaused = false, visible = false;
    function typeIn(el) {
      var full = el.getAttribute('data-text') || el.textContent;
      if (RM) { el.textContent = full; return; }
      var chars = Array.from(full), i = 0, step = Math.max(1, Math.ceil(chars.length / 45));
      el.textContent = '';
      (function tick() {
        i = Math.min(chars.length, i + step);
        el.textContent = chars.slice(0, i).join('');
        if (i < chars.length) { setTimeout(tick, 32); }
      })();
    }
    function show(n, auto) {
      cur = n;
      each(scenes, function (s, k) {
        var on = k === n;
        s.hidden = !on; s.classList.toggle('is-on', on);
      });
      each(tabs, function (t, k) { t.setAttribute('aria-selected', k === n ? 'true' : 'false'); t.tabIndex = k === n ? 0 : -1; });
      var sc = scenes[n];
      each(sc.querySelectorAll('.zone i[data-w]'), function (b) { b.style.width = '0'; b.getBoundingClientRect(); b.style.width = b.getAttribute('data-w') + '%'; });
      each(sc.querySelectorAll('.typed'), typeIn);
      if (!auto) { userPaused = true; stop(); }
    }
    function stop() { clearInterval(timer); timer = null; }
    function start() { if (RM || userPaused || timer || !visible) { return; } timer = setInterval(function () { show((cur + 1) % scenes.length, true); }, 6500); }
    each(tabs, function (t, k) {
      t.addEventListener('click', function () { show(k, false); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) { return; }
        e.preventDefault();
        var n = (cur + d + tabs.length) % tabs.length;
        show(n, false); tabs[n].focus();
      });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) { start(); } else { stop(); } }, { threshold: 0.3 }).observe(reel);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) { stop(); } else { start(); } });
  }
})();
