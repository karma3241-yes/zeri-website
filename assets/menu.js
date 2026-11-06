// Full-screen menu: toggling, keyboard handling and the glow that follows the pointer.
(function () {
  var button = document.querySelector('.menu-btn');
  var menu = document.getElementById('site-menu');
  if (!button || !menu) return;
  var root = document.documentElement;
  var page = document.querySelector('.z');

  function others() {
    return Array.prototype.filter.call(page.children, function (el) {
      return el !== button && el !== menu;
    });
  }
  function setOpen(open) {
    menu.classList.toggle('open', open);
    menu.inert = !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    root.style.overflow = open ? 'hidden' : '';
    others().forEach(function (el) { el.inert = open; });
  }
  menu.inert = true;
  button.addEventListener('click', function () {
    setOpen(!menu.classList.contains('open'));
  });
  addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && menu.classList.contains('open')) {
      setOpen(false);
      button.focus();
    }
  });
  menu.addEventListener('click', function (event) {
    if (event.target.closest('a')) setOpen(false);
  });
  menu.addEventListener('pointermove', function (event) {
    menu.style.setProperty('--gx', event.clientX + 'px');
    menu.style.setProperty('--gy', event.clientY + 'px');
  }, { passive: true });
})();
