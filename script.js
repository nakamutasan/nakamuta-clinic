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
