// Real-time 3D on Home. The hero uses two full-size layers, one behind the text and one in
// front, so objects really pass behind and over the headline.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/RoundedBoxGeometry.js';

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOV = 30;
const DISTANCE = 8;

function stage(el, fov) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 820 ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 50);

  const api = { renderer, scene, camera, tick: null, visible: true };
  const draw = (time) => {
    if (api.tick) api.tick(time / 1000);
    renderer.render(scene, camera);
  };
  const fit = () => {
    const { clientWidth: w, clientHeight: h } = el;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (api.onFit) api.onFit(w / h);
    draw(performance.now());
  };
  new ResizeObserver(fit).observe(el);
  new IntersectionObserver((entries) => { api.visible = entries[0].isIntersecting; }).observe(el);
  api.start = () => {
    fit();
    el.classList.add('live');
    if (calm) return;
    renderer.setAnimationLoop((time) => { if (api.visible) draw(time); });
  };
  api.draw = () => draw(performance.now());
  return api;
}

function glaze(color, extra) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide, ...extra,
  });
}

function lights(scene) {
  const key = new THREE.DirectionalLight('#fff1dc', 2.4);
  key.position.set(3, 4, 5);
  const rim = new THREE.PointLight('#ff8a4c', 40, 20);
  rim.position.set(-4, -2, 2);
  scene.add(key, rim);
}

// Each object is built twice, once per layer, and shown in whichever layer it is in right now
const OBJECTS = [
  { make: () => new THREE.SphereGeometry(0.2, 40, 28), color: '#8fb9a6', lane: 0.98, tall: 0.62, speed: 0.13, start: 0.4 },
  { make: () => new THREE.TorusGeometry(0.2, 0.075, 24, 64), color: '#c8501e', lane: 0.8, tall: 0.42, speed: 0.17, start: 1.6 },
  { make: () => new RoundedBoxGeometry(0.3, 0.3, 0.3, 6, 0.07), color: '#f6f1e8', lane: 0.9, tall: 0.74, speed: 0.11, start: 2.7 },
  { make: () => new THREE.SphereGeometry(0.11, 32, 24), color: '#c8501e', lane: 0.66, tall: 0.3, speed: 0.21, start: 3.6 },
  { make: () => new THREE.CapsuleGeometry(0.09, 0.26, 10, 24), color: '#8fb9a6', lane: 0.74, tall: 0.56, speed: 0.15, start: 4.5 },
  { make: () => new THREE.TorusGeometry(0.13, 0.05, 20, 48), color: '#f6f1e8', lane: 1.04, tall: 0.34, speed: 0.12, start: 5.4 },
  { make: () => new THREE.SphereGeometry(0.14, 32, 24), color: '#1a6cc0', lane: 0.86, tall: 0.5, speed: 0.19, start: 6 },
];

function addObjects(scene) {
  return OBJECTS.map((item) => {
    const mesh = new THREE.Mesh(item.make(), glaze(item.color));
    scene.add(mesh);
    return mesh;
  });
}

const easeOutBack = (x) => {
  const c = 1.45;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};
const clamp01 = (x) => Math.min(1, Math.max(0, x));

async function heroZ(backEl, frontEl) {
  const back = stage(backEl, FOV);
  const front = stage(frontEl, FOV);
  back.camera.position.z = DISTANCE;
  front.camera.position.z = DISTANCE;
  lights(back.scene);
  lights(front.scene);

  const svg = await (await fetch('assets/zeri-z.svg')).text();
  const material = glaze('#1a6cc0');
  const blades = [];
  new SVGLoader().parse(svg).paths.forEach((path) => {
    SVGLoader.createShapes(path).forEach((shape) => {
      blades.push(new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
        depth: 20, bevelEnabled: true, bevelThickness: 4, bevelSize: 3, bevelSegments: 8, curveSegments: 32,
      }), material));
    });
  });
  const group = new THREE.Group();
  blades.forEach((blade) => group.add(blade));
  const box = new THREE.Box3().setFromObject(group);
  const centre = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  blades.forEach((blade, i) => {
    blade.geometry.translate(-centre.x, -centre.y, -centre.z);
    blade.userData.from = new THREE.Vector3([1.1, -1.25, 0.9][i % 3] * 150, [-0.9, 0.2, 1][i % 3] * 150, 60);
    blade.userData.spin = [1.4, -1.1, 0.9][i % 3];
  });
  const rig = new THREE.Group();
  rig.add(group);
  back.scene.add(rig);

  const backObjects = addObjects(back.scene);
  const frontObjects = addObjects(front.scene);

  const view = { halfW: 3.8, halfH: 2.14, size: 1 };
  const fitScene = (aspect) => {
    view.halfH = Math.tan((FOV / 2) * (Math.PI / 180)) * DISTANCE;
    view.halfW = view.halfH * aspect;
    const wide = aspect >= 1.05;
    const width = wide ? Math.min(view.halfW * 1.05, 4.7) : view.halfW * 1.2;
    view.size = Math.min(1, Math.max(0.55, view.halfW / 3.8));
    const scale = width / size.x;
    group.scale.set(scale, -scale, scale);
    rig.position.set(wide ? view.halfW * 0.44 : 0, wide ? 0.05 : -view.halfH * 0.54, 0);
    rig.userData.y = rig.position.y;
  };
  back.onFit = fitScene;

  const pointer = { x: 0, y: 0 };
  addEventListener('pointermove', (event) => {
    pointer.x = event.clientX / innerWidth - 0.5;
    pointer.y = event.clientY / innerHeight - 0.5;
  }, { passive: true });

  let revealedAt = calm ? -100 : null;
  const reveal = () => { if (revealedAt === null) revealedAt = performance.now() / 1000; };
  addEventListener('zeri:reveal', reveal);
  if (window.zeriRevealed) reveal();

  const look = { x: 0, y: 0 };
  const frame = (t) => {
    const clock = calm ? 3 : t;
    const since = revealedAt === null ? -1 : t - revealedAt;
    rig.visible = since >= 0;

    blades.forEach((blade, i) => {
      const p = easeOutBack(clamp01((since - i * 0.11) / 1.25));
      blade.position.copy(blade.userData.from).multiplyScalar(1 - p);
      blade.rotation.z = (1 - p) * blade.userData.spin;
      blade.visible = since - i * 0.11 >= 0;
    });

    const sway = calm ? -0.42 : Math.sin(t * 0.45) * 0.42;
    rig.rotation.y += (sway + pointer.x * 0.7 - rig.rotation.y) * 0.05;
    rig.rotation.x += (0.16 + pointer.y * 0.4 - rig.rotation.x) * 0.05;
    if (rig.userData.y !== undefined) rig.position.y = rig.userData.y + (calm ? 0 : Math.sin(t * 0.8) * 0.07);

    look.x += (pointer.x * 0.5 - look.x) * 0.06;
    look.y += (-pointer.y * 0.3 - look.y) * 0.06;
    [back, front].forEach((s) => {
      s.camera.position.x = look.x;
      s.camera.position.y = look.y;
      s.camera.lookAt(0, 0, 0);
    });

    OBJECTS.forEach((item, i) => {
      const a = item.start + clock * item.speed;
      const depth = Math.sin(a);
      const grow = clamp01((since - 0.5 - i * 0.09) / 0.7);
      const x = Math.cos(a) * item.lane * view.halfW;
      const y = Math.sin(a * 1.7 + i) * item.tall * view.halfH;
      [backObjects[i], frontObjects[i]].forEach((mesh, layer) => {
        mesh.position.set(x, y, depth * 1.8);
        mesh.rotation.set(clock * 0.4 + i, clock * 0.55, 0);
        mesh.scale.setScalar((easeOutBack(grow) || 0.0001) * view.size);
        mesh.visible = since >= 0 && (layer === 0 ? depth < 0 : depth >= 0);
      });
    });
  };
  back.tick = frame;
  front.tick = frame;

  // Compile everything now, while the loading screen is still up
  back.renderer.compile(back.scene, back.camera);
  front.renderer.compile(front.scene, front.camera);
  back.start();
  front.start();
  window.zeriReady = true;
  dispatchEvent(new Event('zeri:ready'));
}

function canUse3D() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch (error) {
    return false;
  }
}

function finished() {
  window.zeriReady = true;
  dispatchEvent(new Event('zeri:ready'));
}

if (canUse3D()) {
  heroZ(document.getElementById('z3d'), document.getElementById('z3d-front')).catch(finished);
} else {
  finished();
}
