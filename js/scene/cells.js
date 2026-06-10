// © 2026 김용현
import * as THREE from 'three';

// 단면은 tilted 그룹의 XY 평면(경도 0° 자오선)에 그림. x=적도 방향, y=자전축 방향.
// dirSign +1 = 직접 순환(저위도 상승→고공 고위도행→하강→지표 귀환), -1 = 페렐(간접) 역방향
const CELLS = [
  { lat: [0, 30], dirSign: 1 },    // 해들리(북)
  { lat: [30, 60], dirSign: -1 },  // 페렐(북)
  { lat: [60, 90], dirSign: 1 },   // 극세포(북)
  { lat: [0, -30], dirSign: 1 },   // 해들리(남)
  { lat: [-30, -60], dirSign: -1 },// 페렐(남)
  { lat: [-60, -90], dirSign: 1 }, // 극세포(남)
];

function pt(latDeg, alt) {
  const l = THREE.MathUtils.degToRad(latDeg);
  return new THREE.Vector3((1 + alt) * Math.cos(l), (1 + alt) * Math.sin(l), 0);
}

function cellCurve(latA, latB) {
  const pts = [];
  const seg = 16;
  for (let i = 0; i <= seg; i++) pts.push(pt(latA + (latB - latA) * (i / seg), 0.2));  // 고공
  for (let i = 0; i <= seg; i++) pts.push(pt(latB + (latA - latB) * (i / seg), 0.04)); // 지표
  return new THREE.CatmullRomCurve3(pts, true);
}

export function createCells() {
  const group = new THREE.Group();

  // 배경 반투명 단면판 (남극~북극, +X쪽 반원)
  const disc = new THREE.Mesh(
    new THREE.RingGeometry(1.02, 1.28, 64, 1, -Math.PI / 2, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }),
  );
  group.add(disc);

  const movers = [];
  for (const c of CELLS) {
    const curve = cellCurve(c.lat[0], c.lat[1]);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.006, 6, true),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }),
    );
    group.add(tube);
    for (let k = 0; k < 3; k++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.02, 0.05, 8),
        new THREE.MeshBasicMaterial({ color: 0xffee88 }),
      );
      group.add(cone);
      movers.push({ cone, curve, t: k / 3, sign: c.dirSign });
    }
  }

  function update(state, dt) {
    group.visible = state.toggles.cells;
    if (!group.visible) return;
    for (const m of movers) {
      m.t = (m.t + m.sign * dt * 0.06 + 1) % 1;
      const p = m.curve.getPointAt(m.t);
      const tan = m.curve.getTangentAt(m.t).multiplyScalar(m.sign).normalize();
      m.cone.position.copy(p);
      m.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
    }
  }
  return { group, update };
}
