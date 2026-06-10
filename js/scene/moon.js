// © 2026 김용현
// 달 — 도식적 축척: 거리는 실제(60R⊕) 대신 4.0, 반지름 비 0.27은 실제와 같음.
// earth.system(황도면 기준, 기울지 않음)에 부착. 조명이 태양 광원이라 위상(보름/그믐)도 자연 표현됨.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const MOON_R = 0.27;
const MOON_DIST = 4.0;
const MOON_PERIOD = 27.32; // 항성월(일)

export function createMoon() {
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  group.add(pivot);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(MOON_R, 32, 32),
    new THREE.MeshLambertMaterial({ color: 0xb0aca4 }),
  );
  moon.position.set(MOON_DIST, 0, 0);
  pivot.add(moon);

  // 달 궤도 점선
  const pts = [];
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    pts.push(new THREE.Vector3(MOON_DIST * Math.cos(a), 0, MOON_DIST * Math.sin(a)));
  }
  const ring = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineDashedMaterial({ color: 0x778899, dashSize: 0.12, gapSize: 0.1, transparent: true, opacity: 0.5 }),
  );
  ring.computeLineDistances();
  group.add(ring);

  const div = document.createElement('div');
  div.className = 'label label-moon';
  div.textContent = '달';
  const label = new CSS2DObject(div);
  label.position.set(0, MOON_R + 0.15, 0);
  moon.add(label);

  function update(state) {
    const on = state.toggles.moon;
    group.visible = on;
    label.visible = on; // r160 CSS2DRenderer는 부모 그룹 visible을 무시 → 라벨 자체 플래그로 제어
    if (!on) return;
    // 지구 공전·자전과 같은 반시계(북쪽에서 볼 때) 방향, 약 27.3일 주기
    pivot.rotation.y = (2 * Math.PI * state.dayOfYear) / MOON_PERIOD;
  }
  return { group, update };
}
