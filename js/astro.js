// © 2026 김용현
// 천문 계산 — 전부 순수 함수. day = 1(1/1) ~ 365(12/31)
export const TILT_DEG = 23.44;
export const YEAR_DAYS = 365;
export const SEASONS = { 춘분: 80, 하지: 172, 추분: 266, 동지: 355 };

// 하지를 기준으로 한 코사인 근사 (기하학적 공전각과 자동 일치)
export function solarDeclination(day) {
  return TILT_DEG * Math.cos((2 * Math.PI * (day - SEASONS.하지)) / YEAR_DAYS);
}

// 하지에 지구가 (-R, 0, 0) → 태양이 +X 방향 → 북반구 여름
export function orbitAngle(day) {
  return Math.PI + (2 * Math.PI * (day - SEASONS.하지)) / YEAR_DAYS;
}

// 적도수렴대 위도 (도식적 근사: 적위의 40%)
export function itczLat(day) {
  return 0.4 * solarDeclination(day);
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export function dayToDate(day) {
  let n = (((Math.round(day) - 1) % YEAR_DAYS) + YEAR_DAYS) % YEAR_DAYS;
  for (let m = 0; m < 12; m++) {
    if (n < MONTH_DAYS[m]) return { month: m + 1, date: n + 1 };
    n -= MONTH_DAYS[m];
  }
  return { month: 12, date: 31 }; // 방어적 폴백 (루프가 끝나면 연말)
}

export function seasonName(day) {
  for (const [name, d] of Object.entries(SEASONS)) {
    if (Math.abs(day - d) < 2) return name;
  }
  return '';
}
