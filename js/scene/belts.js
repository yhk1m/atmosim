// © 2026 김용현
import * as THREE from 'three';
import { itczLat } from '../astro.js';

const LOW = 0xff6655, HIGH = 0x5588ff; // 저압=붉은 / 고압=푸른
const BELTS = [
  { lat: [-4, 4],    color: LOW,  follow: 1 },   // 적도 저압대 (ITCZ 완전 추종)
  { lat: [26, 34],   color: HIGH, follow: 0.6 }, // 아열대 고압대(북)
  { lat: [-34, -26], color: HIGH, follow: 0.6 },
  { lat: [56, 64],   color: LOW,  follow: 0.3 }, // 한대전선 저압대(북)
  { lat: [-64, -56], color: LOW,  follow: 0.3 },
  { lat: [82, 90],   color: HIGH, follow: 0 },   // 극고압
  { lat: [-90, -82], color: HIGH, follow: 0 },
];
const R = 1.012;

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
  // ITCZ: 굵은 노란 링
  const itcz = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.01, 8, 128),
    new THREE.MeshBasicMaterial({ color: 0xffdd33 }),
  );
  itcz.rotation.x = Math.PI / 2;
  group.add(belts, itcz);

  let built = NaN; // 마지막으로 띠를 만든 ITCZ 위도 (0.3° 이상 변할 때만 재생성)
  function rebuild(shift) {
    belts.children.forEach((m) => m.geometry.dispose());
    belts.clear();
    for (const b of BELTS) {
      const lo = THREE.MathUtils.clamp(b.lat[0] + shift * b.follow, -90, 90);
      const hi = THREE.MathUtils.clamp(b.lat[1] + shift * b.follow, -90, 90);
      belts.add(bandMesh(lo, hi, b.color));
    }
  }

  function update(state) {
    belts.visible = state.toggles.belts;
    itcz.visible = state.toggles.itcz;
    const lat = itczLat(state.dayOfYear);
    if (belts.visible && !(Math.abs(lat - built) < 0.3)) { rebuild(lat); built = lat; }
    if (itcz.visible) {
      const r = THREE.MathUtils.degToRad(lat);
      const c = Math.cos(r) * 1.02;
      itcz.scale.set(c, c, 1);
      itcz.position.y = Math.sin(r) * 1.02;
    }
  }
  return { group, update };
}
