// © 2026 김용현
import * as THREE from 'three';
import { TILT, EARTH_R, ORBIT_R } from '../constants.js';
import { orbitAngle } from '../astro.js';

export function createEarth() {
  const system = new THREE.Group(); // 공전 위치
  const tilted = new THREE.Group(); // 자전축 기울기 — 오버레이 부착처
  tilted.rotation.z = -TILT;        // 북극이 +X쪽으로 기울어짐
  system.add(tilted);
  const spin = new THREE.Group();   // 자전 — 지구 메시만
  tilted.add(spin);

  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff }); // 낮 면이 밝게 보이도록 감쇠 없음
  new THREE.TextureLoader().load(
    'assets/earth.jpg',
    (tex) => { tex.colorSpace = THREE.SRGBColorSpace; mat.map = tex; mat.needsUpdate = true; },
    undefined,
    () => { mat.color.set(0x3366aa); console.warn('텍스처 로드 실패 — 단색으로 표시'); },
  );
  spin.add(new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 64, 64), mat));

  // 자전축 막대
  const axis = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, EARTH_R * 2.7),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }),
  );
  tilted.add(axis);

  function update(state) {
    spin.rotation.y = state.rotationAngle;
    const a = orbitAngle(state.dayOfYear);
    system.position.set(ORBIT_R * Math.cos(a), 0, ORBIT_R * Math.sin(a));
  }
  return { system, tilted, spin, update };
}
