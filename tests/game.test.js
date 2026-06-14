const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DIGITS,
  DIFFICULTIES,
  DIFFICULTY_ORDER,
  DEFAULT_DIFFICULTY_ID,
  getDifficulty,
  createSecret,
  validateGuess,
  evaluateGuess,
  makeHintText,
  calculateScore,
  getStarsForAttempts,
  getProgressPercent,
  makeCelebrationText,
} = require('../src/game.js');

const expectedDifficulties = [
  ['beginner', '초급', 3, '3S', true],
  ['intermediate', '중급', 4, '4S', false],
  ['advanced', '상급', 5, '5S', false],
  ['expert', '최상급', 6, '6S', false],
];

test('difficulty settings use 0 through 9 and scale from 3 to 6 digits', () => {
  assert.deepEqual(DIGITS, ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  assert.deepEqual(DIFFICULTY_ORDER, expectedDifficulties.map(([id]) => id));
  assert.equal(DEFAULT_DIFFICULTY_ID, 'beginner');

  for (const [id, label, length, target, recommended] of expectedDifficulties) {
    const difficulty = getDifficulty(id);

    assert.equal(difficulty.id, id);
    assert.equal(difficulty.label, label);
    assert.equal(difficulty.length, length);
    assert.equal(difficulty.minDigit, 0);
    assert.equal(difficulty.maxDigit, 9);
    assert.equal(difficulty.targetText, target);
    assert.equal(difficulty.goalHint, `숫자 ${length}개 모두 맞히기`);
    assert.equal(difficulty.placeholder, `숫자 ${length}개 입력`);
    assert.equal(Boolean(difficulty.recommended), recommended);
    assert.deepEqual(difficulty.digits, DIGITS);
    assert.ok(difficulty.digits.includes('0'));
  }

  assert.equal(Object.keys(DIFFICULTIES).length, 4);
});

test('createSecret makes unique answers that include 0 and follow each difficulty length', () => {
  for (const [id, , length] of expectedDifficulties) {
    const secret = createSecret(id, () => 0.01);

    assert.equal(secret.length, length);
    assert.deepEqual(secret, DIGITS.slice(0, length));
    assert.equal(new Set(secret).size, length);
    assert.ok(secret.every((digit) => getDifficulty(id).digits.includes(digit)));
  }
});

test('default secret and validation use beginner three-digit 0~9 rules', () => {
  assert.deepEqual(createSecret(() => 0.01), ['0', '1', '2']);
  assert.deepEqual(validateGuess('012'), { ok: true, digits: ['0', '1', '2'] });
});

test('validateGuess accepts valid guesses with 0 for every difficulty', () => {
  assert.deepEqual(validateGuess('012', 'beginner'), { ok: true, digits: ['0', '1', '2'] });
  assert.deepEqual(validateGuess('0123', 'intermediate'), { ok: true, digits: ['0', '1', '2', '3'] });
  assert.deepEqual(validateGuess('01234', 'advanced'), { ok: true, digits: ['0', '1', '2', '3', '4'] });
  assert.deepEqual(validateGuess('012345', 'expert'), { ok: true, digits: ['0', '1', '2', '3', '4', '5'] });
});

test('validateGuess rejects wrong length, letters, and duplicates with level-aware messages', () => {
  assert.equal(validateGuess('01', 'beginner').message, '숫자 3개를 넣어줘!');
  assert.equal(validateGuess('0123', 'beginner').message, '숫자 3개를 넣어줘!');
  assert.equal(validateGuess('01a', 'beginner').message, '0부터 9까지 숫자만 쓸 수 있어.');
  assert.equal(validateGuess('001', 'beginner').message, '같은 숫자는 한 번만 쓸 수 있어.');
  assert.equal(validateGuess('012', 'intermediate').message, '숫자 4개를 넣어줘!');
  assert.equal(validateGuess('01234', 'intermediate').message, '숫자 4개를 넣어줘!');
  assert.equal(validateGuess('0123450', 'expert').message, '숫자 6개를 넣어줘!');
});

test('evaluateGuess counts strikes and balls correctly for zero and six digits', () => {
  assert.deepEqual(evaluateGuess(['0', '1', '2'], ['0', '2', '3']), {
    strikes: 1,
    balls: 1,
    out: false,
    solved: false,
  });

  assert.deepEqual(evaluateGuess(['0', '1', '2'], ['3', '4', '5']), {
    strikes: 0,
    balls: 0,
    out: true,
    solved: false,
  });

  assert.deepEqual(evaluateGuess(['0', '1', '2', '3', '4', '5'], ['0', '1', '2', '3', '4', '5']), {
    strikes: 6,
    balls: 0,
    out: false,
    solved: true,
  });
});

test('makeHintText returns kid-friendly Korean feedback', () => {
  assert.equal(makeHintText({ strikes: 1, balls: 1, out: false, solved: false }), '1 스트라이크 1 볼');
  assert.equal(makeHintText({ strikes: 0, balls: 0, out: true, solved: false }), '아웃! 숫자도 자리도 안 맞았어.');
  assert.equal(makeHintText({ strikes: 6, balls: 0, out: false, solved: true }), '정답! 홈런! 🎉');
});

test('gamification helpers calculate score, stars, progress, and celebration text', () => {
  assert.equal(calculateScore('beginner', 1), 400);
  assert.equal(calculateScore('beginner', 9), 300);
  assert.equal(calculateScore('expert', 1), 775);
  assert.equal(getStarsForAttempts('beginner', 4), 3);
  assert.equal(getStarsForAttempts('beginner', 6), 2);
  assert.equal(getStarsForAttempts('beginner', 7), 1);
  assert.equal(getProgressPercent({ strikes: 2 }, 'advanced'), 40);
  assert.equal(makeCelebrationText({ score: 400, stars: 3, streak: 2 }), '홈런왕! ⭐⭐⭐ 400점 · 연속 2홈런!');
});
