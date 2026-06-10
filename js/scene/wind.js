// © 2026 김용현
import * as THREE from 'three';
import { itczLat } from '../astro.js';

// ew: 동서 흐름 방향(+1 동향), ns: 화살표가 가리키는 남북 성분(+1 북향)
const BANDS = [
  { lat: [5, 28],    ew: -1, ns: -0.7, color: 0xff5533 }, // 북동무역풍 → 남서쪽으로
  { lat: [-28, -5],  ew: -1, ns: 0.7,  color: 0xff5533 }, // 남동무역풍 → 북서쪽으로
  { lat: [32, 58],   ew: 1,  ns: 0.4,  color: 0x3388ff }, // 편서풍(북) → 북동쪽으로
  { lat: [-58, -32], ew: 1,  ns: -0.4, color: 0x3388ff }, // 편서풍(남) → 남동쪽으로
  { lat: [63, 82],   ew: -1, ns: -0.4, color: 0xbb66ff }, // 극동풍(북)
  { lat: [-82, -63], ew: -1, ns: 0.4,  color: 0xbb66ff }, // 극동풍(남)
];
const PER_BAND = 24; // 경도 8열 × 위도 3행
const R = 1.035;
const FLOW = 14; // 흐름 속도 (도/초)

function makeArrow(color) {
  const g = new THREE.Group(); // +Y 방향을 가리키는 화살표
  const mat = new THREE.MeshBasicMaterial({ color });
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.05, 8), mat);
  head.position.y = 0.05;
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.07), mat);
  g.add(head, tail);
  return g;
}

// 위도·경도 지점에 놓고, 그 지점의 동/북 벡터 합성 방향으로 회전
function place(obj, latDeg, lonDeg, ew, ns) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  const pos = new THREE.Vector3(
    R * Math.cos(lat) * Math.cos(lon),
    R * Math.sin(lat),
    -R * Math.cos(lat) * Math.sin(lon),
  );
  obj.position.copy(pos);
  const up = pos.clone().normalize();
  const north = new THREE.Vector3(0, 1, 0).addScaledVector(up, -up.y).normalize();
  const east = new THREE.Vector3().crossVectors(north, up); // 경도 증가 방향
  const dir = east.multiplyScalar(ew).addScaledVector(north, ns).normalize();
  obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
}

export function createWind() {
  const group = new THREE.Group();
  const arrows = [];
  for (const band of BANDS) {
    const [lo, hi] = band.lat;
    for (let i = 0; i < PER_BAND; i++) {
      const mesh = makeArrow(band.color);
      group.add(mesh);
      arrows.push({
        mesh, band,
        lat: lo + ((i % 3) + 0.5) * ((hi - lo) / 3),
        lon: Math.floor(i / 3) * 45 + (i % 3) * 15,
      });
    }
  }
  function update(state, dt) {
    group.visible = state.toggles.wind;
    if (!group.visible) return;
    const shiftBase = itczLat(state.dayOfYear); // 바람 띠 전체가 ITCZ 따라 이동(극 쪽일수록 약하게)
    for (const ar of arrows) {
      ar.lon += ar.band.ew * FLOW * dt;
      ar.lon = ((ar.lon % 360) + 360) % 360; // 경도 누적 방지
      const shift = shiftBase * (1 - Math.abs(ar.lat) / 90);
      place(ar.mesh, ar.lat + shift, ar.lon, ar.band.ew, ar.band.ns);
    }
  }
  return { group, update };
}
