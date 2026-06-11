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
  document.querySelectorAll('#toggles input[data-key]').forEach((c) => {
    c.onchange = () => setToggle(c.dataset.key, c.checked);
  });

  // 일괄 선택/해제 (바람 전체 / 전체)
  const WIND_KEYS = ['trade', 'west', 'polarwind'];
  const LAT_KEYS = ['latEq', 'latTropic', 'lat3060', 'latPolar'];
  const ALL_KEYS = [...WIND_KEYS, 'belts', 'itcz', ...LAT_KEYS, 'cells', 'polar', 'moon', 'labels'];
  const windAll = $('windAll'), latAll = $('latAll'), allToggles = $('allToggles');
  function setKeys(keys, on) {
    const t = { ...getState().toggles };
    keys.forEach((k) => { t[k] = on; });
    setState({ toggles: t });
  }
  windAll.onchange = () => setKeys(WIND_KEYS, windAll.checked);
  latAll.onchange = () => setKeys(LAT_KEYS, latAll.checked);
  allToggles.onchange = () => setKeys(ALL_KEYS, allToggles.checked);
  document.querySelectorAll('#views button').forEach((b) => {
    b.onclick = () => setState({ cameraPreset: b.dataset.view, presetSeq: getState().presetSeq + 1 });
  });

  // 리모콘 위치 (하단/좌/우) + 숨기기 — localStorage에 기억. 모바일은 항상 하단 고정
  const remote = $('remote'), showBtn = $('remoteShow');
  const mobileMq = window.matchMedia('(max-width: 768px)');
  function applyPos() {
    const pos = mobileMq.matches ? 'bottom' : savedPos;
    remote.classList.remove('pos-left', 'pos-right');
    if (pos === 'left' || pos === 'right') remote.classList.add(`pos-${pos}`);
  }
  function setPos(pos) {
    savedPos = pos;
    try { localStorage.setItem('atmosim.remotePos', pos); } catch {}
    applyPos();
  }
  mobileMq.addEventListener('change', applyPos);
  $('posLeft').onclick = () => setPos('left');
  $('posBottom').onclick = () => setPos('bottom');
  $('posRight').onclick = () => setPos('right');
  $('remoteHide').onclick = () => { remote.classList.add('hidden'); showBtn.classList.remove('hidden'); };
  $('fullscreenBtn').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  };

  // 축척 안내 패널
  const helpPanel = $('helpPanel');
  $('helpBtn').onclick = () => helpPanel.classList.toggle('hidden');
  $('helpClose').onclick = () => helpPanel.classList.add('hidden');
  showBtn.onclick = () => { showBtn.classList.add('hidden'); remote.classList.remove('hidden'); };
  let savedPos = 'bottom';
  try { savedPos = localStorage.getItem('atmosim.remotePos') || 'bottom'; } catch {}
  setPos(savedPos);

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
    // 토글 체크박스 ↔ 상태 동기화 (일괄 변경 반영)
    document.querySelectorAll('#toggles input[data-key]').forEach((c) => {
      c.checked = s.toggles[c.dataset.key];
    });
    const wOn = WIND_KEYS.filter((k) => s.toggles[k]).length;
    windAll.checked = wOn === WIND_KEYS.length;
    windAll.indeterminate = wOn > 0 && wOn < WIND_KEYS.length; // 일부만 켜짐 표시
    const lOn = LAT_KEYS.filter((k) => s.toggles[k]).length;
    latAll.checked = lOn === LAT_KEYS.length;
    latAll.indeterminate = lOn > 0 && lOn < LAT_KEYS.length;
    const aOn = ALL_KEYS.filter((k) => s.toggles[k]).length;
    allToggles.checked = aOn === ALL_KEYS.length;
    allToggles.indeterminate = aOn > 0 && aOn < ALL_KEYS.length;
    const { month, date } = dayToDate(s.dayOfYear);
    const sn = seasonName(s.dayOfYear);
    hud.textContent =
      `${month}월 ${date}일${sn ? ' · ' + sn : ''} · 태양적위 ${solarDeclination(s.dayOfYear).toFixed(1)}° · ITCZ ${itczLat(s.dayOfYear).toFixed(1)}°`;
  }
  subscribe(sync);
  sync(getState());
}
