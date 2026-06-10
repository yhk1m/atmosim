// © 2026 김용현
import * as THREE from 'three';

export function createSun() {
  const group = new THREE.Group();
  // decay=0, distance=0 → 거리 무관 동일 광량 (도식적 축척이므로)
  const light = new THREE.PointLight(0xffffff, 2.5, 0, 0);
  group.add(light);
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(2.5, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffdd66 }),
  );
  group.add(ball);
  return { group };
}
