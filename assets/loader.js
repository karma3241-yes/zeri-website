// Loading screen on Home. It stays up until the fonts, the page and the 3D are ready.
(function () {
  var el = document.getElementById('loader');
  if (!el) return;
  var root = document.documentElement;
  root.style.overflow = 'hidden';

  var seen = false;
  try {
    seen = sessionStorage.getItem('zeri-intro') === '1';
    sessionStorage.setItem('zeri-intro', '1');
  } catch (error) { /* private mode: just play the full intro */ }
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var minimum = calm ? 300 : seen ? 900 : 2400;
  var started = Date.now();

  var weights = { fonts: 20, page: 30, three: 50 };
  var done = {};
  var target = 6;
  var shown = 0;
  function mark(name) {
    if (done[name]) return;
    done[name] = true;
    target = 6;
    Object.keys(done).forEach(function (key) { target += weights[key]; });
    target = Math.min(100, target);
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { mark('fonts'); });
  else mark('fonts');
  if (document.readyState === 'complete') mark('page');
  else addEventListener('load', function () { mark('page'); });
  if (window.zeriReady) mark('three');
  addEventListener('zeri:ready', function () { mark('three'); });
  setTimeout(function () { ['fonts', 'page', 'three'].forEach(mark); target = 100; }, 7000);

  var count = el.querySelector('.l-count');
  var bar = el.querySelector('.l-bar i');
  var word = el.querySelector('.l-word');
  var words = ['Shaping', 'Glazing', 'Firing', 'Ready'];

  var timer = setInterval(function () {
    var limit = Math.min(target, 12 + ((Date.now() - started) / minimum) * 88);
    shown += (limit - shown) * 0.12;
    if (limit - shown < 0.6) shown = limit;
    var value = Math.round(shown);
    count.textContent = (value < 10 ? '00' : value < 100 ? '0' : '') + value;
    bar.style.transform = 'scaleX(' + shown / 100 + ')';
    word.textContent = words[Math.min(3, Math.floor(shown / 33.4))];
    if (value >= 100 && Date.now() - started >= minimum) finish();
  }, 30);

  function finish() {
    clearInterval(timer);
    el.classList.add('out');
    setTimeout(function () {
      window.zeriRevealed = true;
      dispatchEvent(new Event('zeri:reveal'));
    }, calm ? 0 : 320);
    setTimeout(function () {
      root.style.overflow = '';
      el.remove();
    }, calm ? 350 : 1350);
  }
})();
