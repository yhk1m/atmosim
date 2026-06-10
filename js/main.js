// © 2026 김용현
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { getState, setState } from './state.js';
import { createSun } from './scene/sun.js';
import { createOrbit } from './scene/orbit.js';
import { createEarth } from './scene/earth.js';
import { createWind } from './scene/wind.js';

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
const labelRenderer = new CSS2DRenderer({ element: document.getElementById('labels') });

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05080f);
scene.add(new THREE.AmbientLight(0x334455, 0.6));

const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 500);

const sun = createSun();
scene.add(sun.group);
const orbit = createOrbit();
scene.add(orbit.group);
const earth = createEarth();
scene.add(earth.system);
const wind = createWind();
earth.tilted.add(wind.group);

earth.update(getState());
camera.position.copy(earth.system.position).add(new THREE.Vector3(0, 1.5, 4));
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(earth.system.position);
controls.minDistance = 1.6;
controls.maxDistance = 150;
controls.enableDamping = true;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const ROT_RATE = (2 * Math.PI) / 6; // 1배속: 6초에 1자전
const REV_RATE = 365 / 120;         // 1배속: 120초에 1공전 (일/초)
const prevPos = earth.system.position.clone();
let last = performance.now();

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  const s = getState();

  if (s.rotating) s.rotationAngle += ROT_RATE * s.rotationSpeed * dt;
  if (s.revolving) {
    let d = s.dayOfYear + REV_RATE * s.revolutionSpeed * dt;
    if (d > 365) d -= 365;
    setState({ dayOfYear: d });
  }

  earth.update(s, dt);
  wind.update(s, dt);

  // 카메라가 지구를 따라가도록 (상대 오프셋 유지)
  const delta = earth.system.position.clone().sub(prevPos);
  camera.position.add(delta);
  controls.target.copy(earth.system.position);
  prevPos.copy(earth.system.position);
  controls.update();

  // 줌 거리별 라벨 페이드 (가까우면 절기 라벨 숨김, 멀면 지구 라벨 숨김)
  const dist = camera.position.distanceTo(controls.target);
  document.body.classList.toggle('near', dist < 10);
  document.body.classList.toggle('far', dist >= 10);

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
