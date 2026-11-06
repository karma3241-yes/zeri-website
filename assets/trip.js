// Take a trip: scrolling drives a car through the valley, past the real app screens.
(function () {
  var trip = document.querySelector('.trip');
  if (!trip || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  trip.classList.add('on');

  var WORLD_W = 4000;
  var WORLD_H = 900;
  var START = 240;
  var END = 3660;
  var stage = trip.querySelector('.trip-stage');
  var world = trip.querySelector('.trip-world');
  var car = trip.querySelector('.trip-car');
  var layers = trip.querySelectorAll('.trip-layer');
  var stops = Array.prototype.slice.call(trip.querySelectorAll('.trip-stop'));
  var caption = trip.querySelector('.trip-caption');
  var title = caption.querySelector('h3');
  var line = caption.querySelector('p');
  var eta = trip.querySelector('.trip-hud b');
  var positions = stops.map(function (stop) { return parseFloat(stop.dataset.x); });

  function roadY(x) {
    return 640 + 40 * Math.sin(x / 420) + 22 * Math.sin(x / 170);
  }

  var scale = 1;
  var visible = 1440;
  function measure() {
    scale = stage.clientHeight / WORLD_H;
    visible = stage.clientWidth / scale;
  }
  measure();
  addEventListener('resize', function () { measure(); wanted = read(); draw(wanted); });

  function read() {
    var box = trip.getBoundingClientRect();
    var length = box.height - stage.clientHeight;
    return Math.min(1, Math.max(0, -box.top / length));
  }

  var active = -1;
  function draw(p) {
    var x = START + (END - START) * p;
    var y = roadY(x);
    var slope = (roadY(x + 12) - roadY(x - 12)) / 24;
    car.style.transform = 'translate(' + x + 'px,' + y + 'px) rotate(' + Math.atan(slope) + 'rad)';
    car.style.setProperty('--spin', x * 1.6 + 'deg');

    // The camera follows the car, then settles on each screen as the car reaches it
    var lead = Math.min(visible * 0.38, 620);
    var camera = x - lead;
    var inner = Math.min(visible * 0.22, 170);
    var outer = Math.min(visible * 0.55, 380);
    var closest = 0;
    positions.forEach(function (stopX, i) {
      if (Math.abs(x - stopX) < Math.abs(x - positions[closest])) closest = i;
    });
    var distance = Math.abs(x - positions[closest]);
    var settle = 1 - Math.min(1, Math.max(0, (distance - inner) / (outer - inner)));
    settle = settle * settle * (3 - 2 * settle);
    camera += (positions[closest] - visible / 2 - camera) * settle;
    camera = Math.min(WORLD_W - visible, Math.max(0, camera));
    world.style.transform = 'translate3d(' + -camera * scale + 'px,0,0) scale(' + scale + ')';
    layers.forEach(function (layer) {
      var depth = parseFloat(layer.dataset.depth);
      layer.style.transform = 'translate3d(' + -camera * scale * depth + 'px,0,0)';
    });

    var day = Math.min(1, Math.max(0, (p - 0.45) / 0.5));
    stage.style.setProperty('--day', day.toFixed(3));
    stage.style.setProperty('--intro', Math.max(0, 1 - p / 0.07).toFixed(3));
    var end = Math.min(1, Math.max(0, (p - 0.93) / 0.05));
    stage.style.setProperty('--end', end.toFixed(3));
    stage.style.setProperty('--end-vis', end > 0 ? 'visible' : 'hidden');

    var nearest = -1;
    positions.forEach(function (stopX, i) {
      var near = Math.abs(x - stopX) < outer * 0.85;
      stops[i].classList.toggle('near', near);
      if (near) nearest = i;
    });
    if (nearest !== active) {
      active = nearest;
      if (nearest >= 0) {
        title.textContent = stops[nearest].querySelector('h3').textContent;
        line.textContent = stops[nearest].querySelector('p').textContent;
      }
      stage.style.setProperty('--cap', nearest >= 0 ? '1' : '0');
    }
    var minutes = Math.ceil((1 - p) * 4);
    eta.textContent = minutes > 0 ? minutes + ' min' : 'Arrived';
  }

  var wanted = read();
  var shown = wanted;
  var running = false;
  function step() {
    shown += (wanted - shown) * 0.14;
    if (Math.abs(wanted - shown) < 0.0004) {
      shown = wanted;
      running = false;
    }
    draw(shown);
    if (running) requestAnimationFrame(step);
  }
  addEventListener('scroll', function () {
    wanted = read();
    if (!running) {
      running = true;
      requestAnimationFrame(step);
    }
  }, { passive: true });
  draw(shown);
})();
