// =========================================
// 中牟田美容クリニック の動きをつけるファイル
// =========================================

const header = document.querySelector('.header');
const spBar = document.querySelector('.sp-bar');
const flow = document.querySelector('.flow');
let lastY = window.scrollY;

// --- 1. スクロールに合わせて動くもの ---
function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;

  // 一番上の金色の線：どこまで読んだか
  document.documentElement.style.setProperty('--progress', max > 0 ? y / max : 0);

  // ヘッダー：少しスクロールしたら背景をつける。下に進むと隠れ、上に戻すと出てくる
  header.classList.toggle('is-scrolled', y > 40);
  header.classList.toggle('is-hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
  lastY = y;

  // スマホの下の予約ボタン：トップを過ぎたら出てくる
  spBar.classList.toggle('is-show', y > window.innerHeight * 0.6);

  // 写真をゆっくりずらして、奥行きを出す（パララックス）
  document.querySelectorAll('[data-parallax]').forEach((img) => {
    const rect = img.parentElement.getBoundingClientRect();
    const center = rect.top + rect.height / 2 - window.innerHeight / 2;
    img.style.transform = `translateY(${center * -0.12}px)`;
  });

  // 「初めての方へ」の縦線：読み進めるほど金色に塗られていく
  const r = flow.getBoundingClientRect();
  const rate = (window.innerHeight * 0.6 - r.top) / r.height;
  flow.style.setProperty('--flow', Math.min(Math.max(rate, 0), 1));
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

// --- 2. 画面に入ったら表示する ---
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal, .img-reveal').forEach((el) => {
  // 同じ並びにあるものは、順番に少しずつ遅れて出てくる
  const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
  const order = siblings.indexOf(el);
  if (order > 0) el.style.setProperty('--delay', `${Math.min(order, 5) * 0.12}s`);
  observer.observe(el);
});

// --- 3. スマホ用メニュー（三本線ボタン）を開く・閉じる ---
const toggle = document.querySelector('.menu-toggle');

toggle.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  header.classList.remove('is-hidden');
});

// メニューの中のリンクを押したら閉じる
document.querySelectorAll('.nav a').forEach((link) => {
  link.addEventListener('click', () => {
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', false);
  });
});

// メニューの項目に「何番目か」をつける（順番に出てくるため）
document.querySelectorAll('.nav li').forEach((li, n) => li.style.setProperty('--n', n));

// --- 4. 予約・電話ボタン：見本サイトなので、お知らせを出す ---
const toast = document.querySelector('.toast');
let toastTimer;

document.querySelectorAll('[data-demo]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    toast.textContent = 'ポートフォリオ用の見本サイトのため、予約・お問い合わせはできません。';
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-show'), 3000);
  });
});

// --- お知らせ：Google スプレッドシートから読み込む ---
// ▼ スプレッドシートを「ウェブに公開」したときの CSV のアドレスを、'' の中に貼ります。
//   空のままなら、HTML に書いてある見本のお知らせがそのまま出ます。
//   表の形：1行目は見出し（日付・ラベル・お知らせ）、2行目から上に新しいものを書く
const NEWS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQb6KTQ4xnryv_Zibtyi7G_zoycQjCbXRbKtKwFSmK34e0qAi_Q5ClNtHoxy1fZxMF_r3S2sMyCzQkB/pub?gid=0&single=true&output=csv';
const NEWS_MAX = 3; // 表示するお知らせの数（上から順に）

// CSV（カンマ区切りの文字）を、表の形（行と列）に直す
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// 表を読んで [{ date, tag, text }, ...] にする。読めないときは null（見本のお知らせのまま）
async function fetchNews() {
  if (!NEWS_SHEET_URL) return null;
  try {
    const res = await fetch(NEWS_SHEET_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    const items = parseCSV(await res.text())
      .slice(1)
      .map((r) => ({ date: (r[0] || '').trim(), tag: (r[1] || '').trim(), text: (r[2] || '').trim() }))
      .filter((n) => n.text)
      .slice(0, NEWS_MAX);
    return items.length ? items : null;
  } catch (err) {
    console.warn('お知らせを読み込めませんでした', err);
    return null;
  }
}

// 「2026.11.10」「2026/11/10」「2026年11月10日」を、機械が読める日付（2026-11-10）にする
function toISODate(s) {
  const m = s.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : '';
}

// 文字は textContent で入れる（表に何を書かれても、安全に文字として出す）
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

// このサイトは「日付」と「お知らせ」だけを出す（ラベルの列は使わない）
async function loadNews() {
  const list = document.getElementById('news-list');
  const items = await fetchNews();
  if (!list || !items) return;
  list.replaceChildren(...items.map((n) => {
    const li = el('li');
    const time = el('time', '', n.date);
    const iso = toISODate(n.date);
    if (iso) time.dateTime = iso;
    li.append(time, el('span', '', n.text));
    return li;
  }));
}

loadNews();

// --- お問い合わせフォーム：Google フォームに送る ---
// ▼ Google フォームの「事前入力したURL」からわかる、送り先と各項目の番号を入れます。
//   空のままなら送信されず、「見本サイトです」のお知らせが出ます。
const FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLScgiELNOjB4mdJCId9XrqPbh0EW2xpZPlCn-K_FMWHMxLIwpg/formResponse';
const FORM_FIELDS = {
  name: 'entry.1857026686',    // お名前
  email: 'entry.898107338',    // メールアドレス
  tel: 'entry.948347038',      // 電話番号
  kind: 'entry.101444983',     // ご相談の種類
  message: 'entry.588597065',  // ご相談内容
};

const contactForm = document.querySelector('#contact-form');

if (contactForm) {
  const errorBox = contactForm.querySelector('.form-error');
  const doneBox = document.querySelector('.contact-done');
  const sendBtn = contactForm.querySelector('button[type="submit"]');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.textContent = '';

    // 入力もれ・メールアドレスの形をチェック
    contactForm.querySelectorAll('[aria-invalid]').forEach((f) => f.removeAttribute('aria-invalid'));
    const bad = [...contactForm.elements].filter((f) => f.willValidate && !f.checkValidity());
    if (bad.length) {
      bad.forEach((f) => f.setAttribute('aria-invalid', 'true'));
      errorBox.textContent = '入力されていない項目、または形がちがう項目があります。';
      bad[0].focus();
      return;
    }

    // Google フォームとつなぐ前は、送らずにお知らせだけ出す
    if (!FORM_ACTION) {
      toast.textContent = 'ポートフォリオ用の見本サイトのため、まだ送信はされません。';
      toast.classList.add('is-show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('is-show'), 3000);
      return;
    }

    const data = new FormData(contactForm);
    const body = new URLSearchParams();
    Object.entries(FORM_FIELDS).forEach(([key, entry]) => {
      if (entry) body.append(entry, data.get(key) || '');
    });

    sendBtn.disabled = true;
    sendBtn.textContent = '送信中…';
    try {
      // Google フォームは返事の中身を見せてくれないので、送れたら完了とみなす
      await fetch(FORM_ACTION, { method: 'POST', mode: 'no-cors', body });
      contactForm.hidden = true;
      doneBox.hidden = false;
      doneBox.focus();
    } catch {
      errorBox.textContent = '送信できませんでした。通信の状態を確かめて、もう一度お試しください。';
      sendBtn.disabled = false;
      sendBtn.textContent = '送信する';
    }
  });
}
