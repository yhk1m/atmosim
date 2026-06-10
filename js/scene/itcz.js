// © 2026 김용현
// 열적도(ITCZ) — 일자 링이 아니라 대륙 위에서 계절 진폭이 크고 해양에서 작은 물결선.
// 대륙에 고정돼야 하므로 earth.spin(자전 그룹)에 부착한다.
import * as THREE from 'three';
import { solarDeclination, TILT_DEG } from '../astro.js';

const R = 1.025;
// 대륙 가열 모델: center(°E), width(가우시안 폭), amp(추가 진폭°), hemi(+1 북반구/-1 남반구/0 양반구)
// 대륙은 자기 반구의 여름에만 열적도를 끌어당긴다.
const CONTINENTS = [
  { center: 22,  width: 32, amp: 11, hemi: 0 },  // 아프리카 (양반구)
  { center: 90,  width: 34, amp: 16, hemi: 1 },  // 남아시아 — 북반구 여름 몬순
  { center: 130, width: 24, amp: 11, hemi: -1 }, // 오스트레일리아 — 남반구 여름
  { center: -60, width: 28, amp: 10, hemi: -1 }, // 남아메리카 (아마존)
];
const OCEAN_AMP = 4.5; // 해양 기본 진폭(°)
const OCEAN_BIAS = 2.5; // 해양 북편향(°) — 동태평양·대서양 ITCZ는 연중 적도 북쪽 (열적도 ≠ 적도)

function gauss(x, c, w) {
  const d = ((x - c + 540) % 360) - 180; // 경도 순환 거리
  return Math.exp(-(d * d) / (2 * w * w));
}

// 경도별 열적도 위도(°). season = 적위/23.44 (-1 동지 ~ +1 하지)
export function itczLatAt(lonDeg, day) {
  const season = solarDeclination(day) / TILT_DEG;
  let lat = OCEAN_BIAS + OCEAN_AMP * season;
  for (const c of CONTINENTS) {
    // 대륙 끌림: 양반구 대륙은 항상, 단반구 대륙은 자기 여름에만
    const pull = c.hemi === 0 ? season : (c.hemi > 0 ? Math.max(0, season) : Math.min(0, season));
    lat += c.amp * gauss(lonDeg, c.center, c.width) * pull;
  }
  return THREE.MathUtils.clamp(lat, -26, 26);
}

export function createItcz() {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffdd33 });
  let mesh = null;
  let built = NaN;

  function rebuild(day) {
    if (mesh) { mesh.geometry.dispose(); group.remove(mesh); }
    const pts = [];
    for (let L = -180; L < 180; L += 4) {
      const lat = THREE.MathUtils.degToRad(itczLatAt(L, day));
      const lon = THREE.MathUtils.degToRad(L); // 텍스처 경도(°E)와 spin 프레임이 일치
      pts.push(new THREE.Vector3(
        R * Math.cos(lat) * Math.cos(lon),
        R * Math.sin(lat),
        -R * Math.cos(lat) * Math.sin(lon),
      ));
    }
    mesh = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 256, 0.01, 6, true),
      mat,
    );
    group.add(mesh);
  }

  function update(state) {
    group.visible = state.toggles.itcz;
    if (!group.visible) return;
    const d = solarDeclination(state.dayOfYear);
    if (Math.abs(d - built) < 0.3) return; // 적위 0.3° 이상 변할 때만 재생성
    built = d;
    rebuild(state.dayOfYear);
  }
  return { group, update };
}
