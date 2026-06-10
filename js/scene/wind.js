// © 2026 김용현
import * as THREE from 'three';
import { itczLat } from '../astro.js';

// key: 토글 키, ew: 동서 진행(+1 동향), ns: 남북 진행(+1 북향)
// lonSpan/latSpan: 화살표 한 줄기의 길이(도) — 사선 경로
const BANDS = [
  { key: 'trade',     lat: [8, 26],    ew: -1, ns: -1, lonSpan: 30, latSpan: 10, color: 0xff5533 }, // 북동무역풍 → 남서로
  { key: 'trade',     lat: [-26, -8],  ew: -1, ns: 1,  lonSpan: 30, latSpan: 10, color: 0xff5533 }, // 남동무역풍 → 북서로
  { key: 'west',      lat: [35, 55],   ew: 1,  ns: 1,  lonSpan: 30, latSpan: 8,  color: 0x3388ff }, // 편서풍(북) → 북동으로
  { key: 'west',      lat: [-55, -35], ew: 1,  ns: -1, lonSpan: 30, latSpan: 8,  color: 0x3388ff }, // 편서풍(남) → 남동으로
  { key: 'polarwind', lat: [65, 78],   ew: -1, ns: -1, lonSpan: 45, latSpan: 6,  color: 0xbb66ff }, // 극동풍(북)
  { key: 'polarwind', lat: [-78, -65], ew: -1, ns: 1,  lonSpan: 45, latSpan: 6,  color: 0xbb66ff }, // 극동풍(남)
];
const STREAMS = 8;  // 밴드당 줄기 수
const DASHES = 6;   // 줄기당 점선 토막 수 (+ 화살촉 1)
const R = 1.04;
const CYCLE = 1.8;  // 순차 점등 주기(초)

function posOf(latDeg, lonDeg) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  return new THREE.Vector3(
    R * Math.cos(lat) * Math.cos(lon),
    R * Math.sin(lat),
    -R * Math.cos(lat) * Math.sin(lon),
  );
}

// p1→p2 사이를 잇는 점선 토막 (길이의 72%만 채워 점선 느낌)
function dashMesh(p1, p2, mat) {
  const len = p1.distanceTo(p2);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, len * 0.72, 6), mat);
  m.position.copy(p1).lerp(p2, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p2.clone().sub(p1).normalize());
  return m;
}

export function createWind() {
  const group = new THREE.Group();
  const bandGroups = [];
  const streams = [];
  let built = NaN; // 마지막으로 빌드한 ITCZ 위도 (0.3° 이상 변할 때만 재배치)
  let tAcc = 0;

  for (const band of BANDS) {
    const bg = new THREE.Group();
    group.add(bg);
    bandGroups.push({ group: bg, band });
  }

  function rebuild(shiftBase) {
    streams.length = 0;
    for (const { group: bg, band } of bandGroups) {
      if (bg.children.length) bg.children[0].material.dispose();
      bg.children.forEach((m) => m.geometry.dispose());
      bg.clear();
      const mat = new THREE.MeshBasicMaterial({ color: band.color });
      const [lo, hi] = band.lat;
      const mid = (lo + hi) / 2;
      const shift = shiftBase * (1 - Math.abs(mid) / 90); // 계절 이동(극 쪽일수록 약하게)
      for (let i = 0; i < STREAMS; i++) {
        const row = i % 2; // 2개 위도 행 교차 배치
        const base = band.ns > 0 ? lo : lo + band.latSpan; // 경로가 밴드 안에 들어오도록 시작 위도 선정
        const lat0 = base + ((row + 0.5) * (hi - lo - band.latSpan)) / 2 + shift;
        const lon0 = i * (360 / STREAMS) + row * 18;
        // 경로 점들: 사선(동서 lonSpan + 남북 latSpan)
        const segs = DASHES + 1;
        const pts = [];
        for (let j = 0; j <= segs; j++) {
          const s = j / segs;
          pts.push(posOf(lat0 + band.ns * band.latSpan * s, lon0 + band.ew * band.lonSpan * s));
        }
        const dashes = [];
        for (let j = 0; j < DASHES; j++) {
          const d = dashMesh(pts[j], pts[j + 1], mat);
          bg.add(d);
          dashes.push(d);
        }
        // 화살촉 (경로 끝, 진행 방향)
        const head = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.06, 8), mat);
        head.position.copy(pts[segs]);
        head.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          pts[segs].clone().sub(pts[segs - 1]).normalize(),
        );
        bg.add(head);
        streams.push({ bandGroup: bg, dashes, head, stagger: (i * 0.37 + row * 0.5) % 1 });
      }
    }
  }

  function update(state, dt) {
    const t = state.toggles;
    group.visible = t.trade || t.west || t.polarwind;
    if (!group.visible) return;
    const lat = itczLat(state.dayOfYear);
    if (!(Math.abs(lat - built) < 0.3)) { rebuild(lat); built = lat; }
    for (const { group: bg, band } of bandGroups) bg.visible = t[band.key];
    // 순차 점등 (아우디 방향지시등): 꼬리→머리 순서로 켜지고, 잠시 유지 후 한꺼번에 꺼짐
    tAcc += dt;
    for (const st of streams) {
      if (!st.bandGroup.visible) continue;
      const phase = (tAcc / CYCLE + st.stagger) % 1;
      const prog = phase * (DASHES + 4); // +4 = 머리 점등 후 유지 구간
      for (let j = 0; j < DASHES; j++) st.dashes[j].visible = prog >= j + 1;
      st.head.visible = prog >= DASHES + 1;
    }
  }
  return { group, update };
}
