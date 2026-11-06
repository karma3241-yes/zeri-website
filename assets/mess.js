// Mess to order: the sorter, the service diagrams and content settling on scroll.
(function () {
  function seeded(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
    return function () {
      h = Math.imul(h ^ (h >>> 15), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }

  // Content drops in slightly scattered, then lines up
  var settle = document.querySelectorAll('.svc, .feat li, .ledger > div, .big-line, .steps li');
  var settleWatch = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      settleWatch.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  settle.forEach(function (el, i) {
    var rand = seeded(el.textContent + i);
    el.classList.add('settle');
    el.style.setProperty('--sx', Math.round(rand() * 80 - 40) + 'px');
    el.style.setProperty('--sy', Math.round(rand() * 40 + 24) + 'px');
    el.style.setProperty('--sr', (rand() * 6 - 3).toFixed(1) + 'deg');
    settleWatch.observe(el);
  });

  // Service diagrams start messy and sort themselves once seen
  var diagrams = document.querySelectorAll('.ba');
  function setDiagram(el, sorted) {
    el.classList.toggle('in', sorted);
    var button = el.parentNode.querySelector('.ba-toggle');
    button.textContent = sorted ? 'See before' : 'See after';
  }
  var diagramWatch = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      diagramWatch.unobserve(entry.target);
      setTimeout(function () { setDiagram(entry.target, true); }, 500);
    });
  }, { threshold: 0.35 });
  diagrams.forEach(function (el) {
    setDiagram(el, false);
    el.parentNode.querySelector('.ba-toggle').addEventListener('click', function () {
      diagramWatch.unobserve(el);
      setDiagram(el, !el.classList.contains('in'));
    });
    diagramWatch.observe(el);
  });

  // The booking chart fills in once seen
  var tapeWatch = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      tapeWatch.unobserve(entry.target);
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.tape').forEach(function (el) { tapeWatch.observe(el); });

})();
