import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { correctAnswer, formatSeconds, mirrorLevel, rotateLevel, scoreMatch, validateLevel } from '../dist/core.js';
const pack = JSON.parse(readFileSync(new URL('../data/reference-pack.json', import.meta.url), 'utf8'));

test('the ten reconstructed levels have valid box geometry and the observed counts', () => {
  assert.deepEqual(pack.levels.map(validateLevel), Array.from({ length: 10 }, () => []));
  assert.deepEqual(pack.levels.map(correctAnswer), [3, 6, 5, 5, 4, 7, 8, 3, 4, 24]);
});

test('one broad box counts once even though it fills four cells', () => {
  const level = pack.levels[4];
  assert.equal(correctAnswer(level), 4);
  assert.equal(level.boxes.reduce((n, b) => n + b.w * b.d * b.h, 0), 7);
});

test('four turns preserve valid geometry and object identity', () => {
  for (const level of pack.levels) {
    const turned = rotateLevel(level, 4);
    assert.deepEqual(turned.boxes, level.boxes);
    assert.deepEqual(validateLevel(rotateLevel(level, 1)), []);
  }
});

test('pause mirror keeps tower depth, support and object count unchanged', () => {
  for (const level of pack.levels) {
    const mirrored = mirrorLevel(level);
    assert.deepEqual(validateLevel(mirrored), []);
    assert.equal(correctAnswer(mirrored), correctAnswer(level));
    assert.deepEqual(mirrorLevel(mirrored).boxes, level.boxes);
    level.boxes.forEach((box, i) => assert.equal(box.x + box.y, mirrored.boxes[i].x + mirrored.boxes[i].y));
  }
});

test('observed final scoring uses answer time and five second mistakes', () => {
  const p1Times = [10240, 4000, 4000, 6000];
  const p2Times = [13340, 5000, 6000, 9000];
  const rounds = p1Times.map((elapsedMs, index) => ({
    answer: 3, players: [{ guess: index === 0 ? 2 : 3, elapsedMs },
      { guess: 2, elapsedMs: p2Times[index] }],
  }));
  const result = scoreMatch(rounds);
  assert.equal(result.players[0].adjustedMs, 29240);
  assert.equal(result.players[1].adjustedMs, 53340);
  assert.equal(result.winner, 0);
  assert.equal(formatSeconds(result.players[0].adjustedMs), '29.24');
});

test('two displayed centisecond totals that match produce a draw', () => {
  const result = scoreMatch([{ answer: 1, players: [
    { guess: 1, elapsedMs: 1000 }, { guess: 1, elapsedMs: 1004 },
  ] }]);
  assert.equal(result.winner, null);
});
