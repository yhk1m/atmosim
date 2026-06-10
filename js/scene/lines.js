// © 2026 김용현
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// key별로 켜고 끌 수 있는 위도선 묶음. 30·60도선은 대기대순환 경계(점선), 라벨은 한 칸 바깥(1.32)에 배치해 겹침 방지.
const LINES = [
  { lat: 0,      name: '적도(0°)',          key: 'latEq',     dashed: false, opacity: 0.55, labelDist: 1.18 },
  { lat: 23.44,  name: '북회귀선(23.5°N)',  key: 'latTropic', dashed: false, opacity: 0.35, labelDist: 1.18 },
  { lat: -23.44, name: '남회귀선(23.5°S)',  key: 'latTropic', dashed: false, opacity: 0.35, labelDist: 1.18 },
  { lat: 30,     name: '30°N',             key: 'lat3060',   dashed: true,  opacity: 0.35, labelDist: 1.32 },
  { lat: -30,    name: '30°S',             key: 'lat3060',   dashed: true,  opacity: 0.35, labelDist: 1.32 },
  { lat: 60,     name: '60°N',             key: 'lat3060',   dashed: true,  opacity: 0.35, labelDist: 1.32 },
  { lat: -60,    name: '60°S',             key: 'lat3060',   dashed: true,  opacity: 0.35, labelDist: 1.32 },
  { lat: 66.56,  name: '북극권(66.5°N)',    key: 'latPolar',  dashed: true,  opacity: 0.35, labelDist: 1.18 },
  { lat: -66.56, name: '남극권(66.5°S)',    key: 'latPolar',  dashed: true,  opacity: 0.35, labelDist: 1.18 },
];
const WIND_LABELS = [
  { lat: 16, name: '북동무역풍', cls: 'label-trade', key: 'trade' },
  { lat: -16, name: '남동무역풍', cls: 'label-trade', key: 'trade' },
  { lat: 45, name: '편서풍', cls: 'label-west', key: 'west' },
  { lat: -45, name: '편서풍', cls: 'label-west', key: 'west' },
  { lat: 73, name: '극동풍', cls: 'label-polarwind', key: 'polarwind' },
  { lat: -73, name: '극동풍', cls: 'label-polarwind', key: 'polarwind' },
];
const R = 1.015;

function latCircle(latDeg, dashed, opacity) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const r = R * Math.cos(lat), y = R * Math.sin(lat);
  const pts = [];
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
  }
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color: 0xffffff, transparent: true, opacity, dashSize: 0.05, gapSize: 0.035 })
    : new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity });
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
  if (dashed) line.computeLineDistances();
  return line;
}

// side: +1 = +X쪽(위도선 라벨), -1 = 반대편(바람 라벨) — 한쪽 쏠림 방지
function textLabel(text, cls, latDeg, dist, side = 1) {
  const div = document.createElement('div');
  div.className = `label ${cls}`;
  div.textContent = text;
  const obj = new CSS2DObject(div);
  const lat = THREE.MathUtils.degToRad(latDeg);
  obj.position.set(side * dist * Math.cos(lat), dist * Math.sin(lat), 0);
  return obj;
}

export function createLines() {
  const group = new THREE.Group();
  const latObjs = [];
  for (const l of LINES) {
    const line = latCircle(l.lat, l.dashed, l.opacity);
    const label = textLabel(l.name, 'label-lat', l.lat, l.labelDist, 1);
    group.add(line, label);
    latObjs.push({ line, label, key: l.key });
  }
  const windObjs = []; // 바람 라벨은 해당 바람 토글에 연동 (위도선 토글과 무관)
  for (const w of WIND_LABELS) {
    const obj = textLabel(w.name, `label-wind ${w.cls}`, w.lat, 1.2, -1);
    group.add(obj);
    windObjs.push({ obj, key: w.key });
  }
  function update(state) {
    // r160 CSS2DRenderer는 부모 그룹 visible을 무시 → 라벨 자체 플래그로 제어
    for (const { line, label, key } of latObjs) {
      line.visible = state.toggles[key];
      label.visible = state.toggles[key];
    }
    for (const { obj, key } of windObjs) obj.visible = state.toggles[key];
  }
  return { group, update };
}
