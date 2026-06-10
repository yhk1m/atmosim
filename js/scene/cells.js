// © 2026 김용현
import * as THREE from 'three';

// 단면은 tilted 그룹의 XY 평면(경도 0° 자오선)에 그림. x=적도 방향, y=자전축 방향.
// dirSign +1 = 직접 순환(저위도 상승→고공 고위도행→하강→지표 귀환), -1 = 페렐(간접) 역방향
const CELLS = [
  { lat: [0, 30], dirSign: 1 },    // 해들리(북)
  { lat: [30, 60], dirSign: -1 },  // 페렐(북)
  { lat: [60, 85], dirSign: 1 },   // 극세포(북) — 85°에서 하강 (극점 수렴 없음)
  { lat: [0, -30], dirSign: 1 },   // 해들리(남)
  { lat: [-30, -60], dirSign: -1 },// 페렐(남)
  { lat: [-60, -85], dirSign: 1 }, // 극세포(남)
];

// 대류권계면 높이: 적도에서 두껍고(≈17km) 극으로 갈수록 얇아짐(≈8km)
function topAlt(latDeg) {
  return 0.52 - 0.28 * (Math.abs(latDeg) / 90); // 적도:극 ≈ 17km:8km 비율 유지
}

function pt(latDeg, alt) {
  const l = THREE.MathUtils.degToRad(latDeg);
  return new THREE.Vector3((1 + alt) * Math.cos(l), (1 + alt) * Math.sin(l), 0);
}

function cellCurve(latA, latB) {
  const pts = [];
  const seg = 16;
  for (let i = 0; i <= seg; i++) { // 고공 — 위도별 대류권계면 높이를 따라감
    const la = latA + (latB - latA) * (i / seg);
    pts.push(pt(la, topAlt(la) * 0.85));
  }
  for (let i = 0; i <= seg; i++) pts.push(pt(latB + (latA - latB) * (i / seg), 0.03)); // 지표
  return new THREE.CatmullRomCurve3(pts, true);
}

export function createCells() {
  const group = new THREE.Group();

  // 배경 반투명 단면판 — 바깥 경계가 대류권계면을 따라감 (적도 두껍고 극 얇음)
  const shape = new THREE.Shape();
  for (let la = -90; la <= 90; la += 3) {
    const r = 1 + topAlt(la) + 0.02;
    const l = THREE.MathUtils.degToRad(la);
    const x = r * Math.cos(l), y = r * Math.sin(l);
    if (la === -90) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  for (let la = 90; la >= -90; la -= 3) { // 안쪽 경계(지표)로 되돌아오기
    const l = THREE.MathUtils.degToRad(la);
    shape.lineTo(1.02 * Math.cos(l), 1.02 * Math.sin(l));
  }
  const disc = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }),
  );
  group.add(disc);

  // 대류권계면 경계선 — 적도에서 높고 극에서 낮은 곡선
  const tropoPts = [];
  for (let la = -90; la <= 90; la += 3) tropoPts.push(pt(la, topAlt(la)));
  const tropo = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(tropoPts),
    new THREE.LineBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5 }),
  );
  group.add(tropo);

  const movers = [];
  for (const c of CELLS) {
    const curve = cellCurve(c.lat[0], c.lat[1]);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.008, 6, true),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }),
    );
    group.add(tube);
    for (let k = 0; k < 3; k++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.027, 0.066, 8),
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
