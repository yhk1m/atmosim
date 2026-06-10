// © 2026 김용현
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { SEASONS, orbitAngle } from '../astro.js';
import { ORBIT_R } from '../constants.js';

export function createOrbit() {
  const group = new THREE.Group();

  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    pts.push(new THREE.Vector3(ORBIT_R * Math.cos(a), 0, ORBIT_R * Math.sin(a)));
  }
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineDashedMaterial({ color: 0x8899aa, dashSize: 0.6, gapSize: 0.4, transparent: true, opacity: 0.7 }),
  );
  line.computeLineDistances();
  group.add(line);

  for (const [name, day] of Object.entries(SEASONS)) {
    const a = orbitAngle(day);
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x66ccff }),
    );
    marker.position.set(ORBIT_R * Math.cos(a), 0, ORBIT_R * Math.sin(a));
    const div = document.createElement('div');
    div.className = 'label label-season';
    div.textContent = name;
    const label = new CSS2DObject(div);
    label.position.set(0, 1.2, 0);
    marker.add(label);
    group.add(marker);
  }
  return { group };
}
