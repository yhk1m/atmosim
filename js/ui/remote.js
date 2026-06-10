// © 2026 김용현
import { getState, setState, setToggle, subscribe } from '../state.js';
import { solarDeclination, itczLat, dayToDate, seasonName } from '../astro.js';

export function initRemote() {
  const $ = (id) => document.getElementById(id);
  const rotPlay = $('rotPlay'), revPlay = $('revPlay'), daySlider = $('daySlider'), hud = $('hud');

  rotPlay.onclick = () => setState({ rotating: !getState().rotating });
  revPlay.onclick = () => setState({ revolving: !getState().revolving });
  $('rotSpeed').oninput = (e) => setState({ rotationSpeed: +e.target.value });
  $('revSpeed').oninput = (e) => setState({ revolutionSpeed: +e.target.value });
  daySlider.oninput = (e) => setState({ dayOfYear: +e.target.value, revolving: false });

  document.querySelectorAll('.season').forEach((b) => {
    b.onclick = () => setState({ dayOfYear: +b.dataset.day, revolving: false });
  });
  document.querySelectorAll('#toggles input').forEach((c) => {
    c.onchange = () => setToggle(c.dataset.key, c.checked);
  });
  document.querySelectorAll('#views button').forEach((b) => {
    b.onclick = () => setState({ cameraPreset: b.dataset.view, presetSeq: getState().presetSeq + 1 });
  });

  // 키보드: Space=자전, ←→=날짜 ±1, 1~4=절기
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    if (e.code === 'Space') { e.preventDefault(); rotPlay.click(); }
    if (e.key === 'ArrowRight') setState({ dayOfYear: (Math.round(getState().dayOfYear) % 365) + 1 });
    if (e.key === 'ArrowLeft') setState({ dayOfYear: ((Math.round(getState().dayOfYear) + 363) % 365) + 1 });
    const idx = ['1', '2', '3', '4'].indexOf(e.key);
    if (idx >= 0) setState({ dayOfYear: [80, 172, 266, 355][idx], revolving: false });
  });

  // 상태 → UI 동기화 (공전 중 슬라이더/HUD 자동 갱신 포함)
  function sync(s) {
    rotPlay.textContent = s.rotating ? '⏸' : '▶';
    revPlay.textContent = s.revolving ? '⏸' : '▶';
    daySlider.value = Math.round(s.dayOfYear);
    const { month, date } = dayToDate(s.dayOfYear);
    const sn = seasonName(s.dayOfYear);
    hud.textContent =
      `${month}월 ${date}일${sn ? ' · ' + sn : ''} · 태양적위 ${solarDeclination(s.dayOfYear).toFixed(1)}° · ITCZ ${itczLat(s.dayOfYear).toFixed(1)}°`;
  }
  subscribe(sync);
  sync(getState());
}
