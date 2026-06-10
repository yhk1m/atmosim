// © 2026 김용현
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const LINES = [
  { lat: 0, name: '적도' },
  { lat: 23.44, name: '북회귀선' }, { lat: -23.44, name: '남회귀선' },
  { lat: 66.56, name: '북극권' }, { lat: -66.56, name: '남극권' },
];
const WIND_LABELS = [
  { lat: 16, name: '북동무역풍', cls: 'label-trade' },
  { lat: -16, name: '남동무역풍', cls: 'label-trade' },
  { lat: 45, name: '편서풍', cls: 'label-west' },
  { lat: -45, name: '편서풍', cls: 'label-west' },
  { lat: 73, name: '극동풍', cls: 'label-polarwind' },
  { lat: -73, name: '극동풍', cls: 'label-polarwind' },
];
const R = 1.015;

function latCircle(latDeg) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const r = R * Math.cos(lat), y = R * Math.sin(lat);
  const pts = [];
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }),
  );
}

function textLabel(text, cls, latDeg, dist) {
  const div = document.createElement('div');
  div.className = `label ${cls}`;
  div.textContent = text;
  const obj = new CSS2DObject(div);
  const lat = THREE.MathUtils.degToRad(latDeg);
  obj.position.set(dist * Math.cos(lat), dist * Math.sin(lat), 0);
  return obj;
}

export function createLines() {
  const group = new THREE.Group();
  for (const l of LINES) {
    group.add(latCircle(l.lat));
    group.add(textLabel(l.name, 'label-lat', l.lat, 1.18));
  }
  for (const w of WIND_LABELS) {
    group.add(textLabel(w.name, `label-wind ${w.cls}`, w.lat, 1.45));
  }
  function update(state) {
    group.visible = state.toggles.latlines;
  }
  return { group, update };
}
