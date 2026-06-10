import assert from 'node:assert';
import { getState, setState, setToggle, subscribe } from '../js/state.js';

let calls = 0;
subscribe(() => calls++);
setState({ dayOfYear: 80 });
assert.equal(getState().dayOfYear, 80, 'setState 반영');
assert.equal(calls, 1, '구독자 호출');
setToggle('wind', false);
assert.equal(getState().toggles.wind, false, '토글 반영');
assert.equal(calls, 2);
assert.equal(getState().toggles.belts, true, '다른 토글 유지');
console.log('✓ state.test 통과');
