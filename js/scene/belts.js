// © 2026 김용현
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { itczLat } from '../astro.js';

const LOW = 0xff6655, HIGH = 0x5588ff; // 저압=붉은 / 고압=푸른
const BELTS = [
  { lat: [-4, 4],    color: LOW,  follow: 1 },   // 적도 저압대 (ITCZ 완전 추종)
  { lat: [26, 34],   color: HIGH, follow: 0.6 }, // 아열대 고압대(북)
  { lat: [-34, -26], color: HIGH, follow: 0.6 },
  { lat: [56, 64],   color: LOW,  follow: 0.3 }, // 고위도 저압대(북)
  { lat: [-64, -56], color: LOW,  follow: 0.3 },
  { lat: [82, 90],   color: HIGH, follow: 0 },   // 극고압
  { lat: [-90, -82], color: HIGH, follow: 0 },
];
// 명칭 라벨 — 위도선 라벨(+X, 1.18)과 같은 쪽 바깥(1.42)에 배치: "적도 — 적도 저압대"처럼 겹으로 읽힘
const BELT_LABELS = [
  { mid: 0,   follow: 1,   name: '적도 저압대',   cls: 'label-low' },
  { mid: 30,  follow: 0.6, name: '아열대 고압대', cls: 'label-high' },
  { mid: -30, follow: 0.6, name: '아열대 고압대', cls: 'label-high' },
  { mid: 60,  follow: 0.3, name: '고위도 저압대', cls: 'label-low' },
  { mid: -60, follow: 0.3, name: '고위도 저압대', cls: 'label-low' },
  { mid: 80,  follow: 0,   name: '극고압대',     cls: 'label-high' },
  { mid: -80, follow: 0,   name: '극고압대',     cls: 'label-high' },
];
const R = 1.012;
const LABEL_R = 1.42;

function bandMesh(latLo, latHi, color) {
  // SphereGeometry의 theta는 북극에서 잰 극각
  const thetaStart = THREE.MathUtils.degToRad(90 - latHi);
  const thetaLen = THREE.MathUtils.degToRad(latHi - latLo);
  return new THREE.Mesh(
    new THREE.SphereGeometry(R, 64, 8, 0, Math.PI * 2, thetaStart, thetaLen),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }),
  );
}

export function createBelts() {
  const group = new THREE.Group();
  const belts = new THREE.Group();
  const labels = new THREE.Group();
  group.add(belts, labels);

  const labelObjs = BELT_LABELS.map((def) => {
    const div = document.createElement('div');
    div.className = `label label-belt ${def.cls}`;
    div.textContent = def.name;
    const obj = new CSS2DObject(div);
    labels.add(obj);
    return { obj, def };
  });

  let built = NaN; // 마지막으로 띠를 만든 ITCZ 위도 (0.3° 이상 변할 때만 재생성)
  function rebuild(shift) {
    belts.children.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
    belts.clear();
    for (const b of BELTS) {
      const lo = THREE.MathUtils.clamp(b.lat[0] + shift * b.follow, -90, 90);
      const hi = THREE.MathUtils.clamp(b.lat[1] + shift * b.follow, -90, 90);
      belts.add(bandMesh(lo, hi, b.color));
    }
    for (const { obj, def } of labelObjs) { // 라벨도 계절 이동 추종
      const lat = THREE.MathUtils.degToRad(def.mid + shift * def.follow);
      obj.position.set(LABEL_R * Math.cos(lat), LABEL_R * Math.sin(lat), 0);
    }
  }

  function update(state) {
    const on = state.toggles.belts;
    belts.visible = on;
    labels.visible = on;
    // r160 CSS2DRenderer는 부모 그룹 visible을 무시 → 라벨 자체 플래그로 제어
    for (const { obj } of labelObjs) obj.visible = on;
    if (!on) return;
    const lat = itczLat(state.dayOfYear);
    if (!(Math.abs(lat - built) < 0.3)) { rebuild(lat); built = lat; }
  }
  return { group, update };
}
