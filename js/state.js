// © 2026 김용현
// 단일 상태 + pub/sub. UI는 setState/setToggle만 호출, 씬 모듈은 매 프레임 getState()를 읽음.
const state = {
  dayOfYear: 172,        // 하지에서 시작
  rotating: true,
  rotationSpeed: 1,
  revolving: false,
  revolutionSpeed: 1,
  rotationAngle: 0,      // 자전 누적각(rad) — 렌더 루프가 직접 갱신
  toggles: { trade: true, west: true, polarwind: true, belts: true, itcz: true, latlines: true, cells: false, polar: true },
  cameraPreset: 'default',
  presetSeq: 0,          // 같은 프리셋 재클릭도 적용되도록 증가 카운터
};
const listeners = new Set();

export const getState = () => state;
export function setState(patch) { Object.assign(state, patch); emit(); }
export function setToggle(key, on) { state.toggles[key] = on; emit(); }
export function subscribe(fn) { listeners.add(fn); }
function emit() { listeners.forEach((fn) => fn(state)); }
