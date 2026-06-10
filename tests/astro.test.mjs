import assert from 'node:assert';
import { solarDeclination, orbitAngle, itczLat, dayToDate, seasonName, SEASONS } from '../js/astro.js';

assert(Math.abs(solarDeclination(SEASONS.하지) - 23.44) < 0.01, '하지 적위 +23.44');
assert(Math.abs(solarDeclination(SEASONS.동지) + 23.44) < 0.1, '동지 적위 -23.44');
assert(Math.abs(solarDeclination(SEASONS.춘분)) < 1.5, '춘분 적위 ≈ 0');
assert(Math.abs(solarDeclination(SEASONS.추분)) < 1.5, '추분 적위 ≈ 0');
assert(Math.abs(orbitAngle(SEASONS.하지) - Math.PI) < 1e-9, '하지 공전각 = π (지구가 -X쪽)');
assert(itczLat(SEASONS.하지) > 8 && itczLat(SEASONS.하지) < 11, 'ITCZ 7월경 북상 ~9°N');
assert(itczLat(SEASONS.동지) < -8, 'ITCZ 1월경 남하');
assert.deepStrictEqual(dayToDate(1), { month: 1, date: 1 });
assert.deepStrictEqual(dayToDate(172), { month: 6, date: 21 });
assert.deepStrictEqual(dayToDate(266), { month: 9, date: 23 });
assert.deepStrictEqual(dayToDate(365), { month: 12, date: 31 });
assert.equal(seasonName(172), '하지');
assert.equal(seasonName(100), '');
console.log('✓ astro.test 통과');
