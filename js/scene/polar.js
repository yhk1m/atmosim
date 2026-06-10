// © 2026 김용현
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { solarDeclination } from '../astro.js';

// 백야 한계위도 = 90 - |적위|. 그보다 고위도 캡을 여름 반구=백야(밝게)/겨울 반구=극야(어둡게) 표시.
const R = 1.03;

function makeCap(color, opacity) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(R, 48, 12, 0, Math.PI * 2, 0, 0.1),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
  );
}

function makeLabel(text) {
  const div = document.createElement('div');
  div.className = 'label label-polar';
  div.textContent = text;
  return new CSS2DObject(div);
}

export function createPolar() {
  const group = new THREE.Group();
  const dayCap = makeCap(0xffee88, 0.45);   // 백야
  const nightCap = makeCap(0x223366, 0.75); // 극야
  const dayLabel = makeLabel('백야 ☀');
  const nightLabel = makeLabel('극야 ●');
  group.add(dayCap, nightCap, dayLabel, nightLabel);

  let built = NaN;
  function update(state) {
    group.visible = state.toggles.polar;
    if (!group.visible) return;
    const d = solarDeclination(state.dayOfYear);
    if (Math.abs(d - built) < 0.3) return; // 0.3° 이상 변할 때만 재생성
    built = d;
    const abs = Math.abs(d);
    const show = abs >= 1; // 춘·추분 부근에선 숨김
    dayCap.visible = nightCap.visible = dayLabel.visible = nightLabel.visible = show;
    if (!show) return;
    const len = THREE.MathUtils.degToRad(abs); // 캡 각폭 = |적위|
    dayCap.geometry.dispose();
    dayCap.geometry = new THREE.SphereGeometry(R, 48, 12, 0, Math.PI * 2, 0, len);
    nightCap.geometry.dispose();
    nightCap.geometry = new THREE.SphereGeometry(R, 48, 12, 0, Math.PI * 2, 0, len);
    // 적위 > 0(북반구 여름): 북극 백야, 남극 극야. 반대면 뒤집기 (rotation.x=π → 남극 캡)
    dayCap.rotation.x = d > 0 ? 0 : Math.PI;
    nightCap.rotation.x = d > 0 ? Math.PI : 0;
    dayLabel.position.set(0, d > 0 ? 1.3 : -1.3, 0);
    nightLabel.position.set(0, d > 0 ? -1.3 : 1.3, 0);
  }
  return { group, update };
}
