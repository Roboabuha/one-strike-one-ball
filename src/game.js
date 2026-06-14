(function attachGameModule(root) {
  const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];
  const DEFAULT_DIFFICULTY_ID = 'beginner';

  const difficultyDefinitions = {
    beginner: {
      id: 'beginner',
      label: '초급',
      length: 3,
      minDigit: 0,
      maxDigit: 9,
      targetStrikes: 3,
      targetText: '3S',
      goalHint: '숫자 3개 모두 맞히기',
      recommended: true,
      rangeText: '0~9 중 서로 다른 숫자 3개',
      placeholder: '숫자 3개 입력',
      heroHtml:
        '컴퓨터가 고른 <strong>0~9 중 서로 다른 숫자 3개</strong>를 맞혀보자! 처음이면 초급부터 시작해도 좋아.',
      ruleHtml: '0~9 숫자 중 <strong>서로 다른 3개</strong>를 입력해. 같은 숫자는 한 번만 써.',
      startMessage: '초급: 0~9 숫자 3개를 맞혀봐!',
      note: '처음이면 추천',
    },
    intermediate: {
      id: 'intermediate',
      label: '중급',
      length: 4,
      minDigit: 0,
      maxDigit: 9,
      targetStrikes: 4,
      targetText: '4S',
      goalHint: '숫자 4개 모두 맞히기',
      recommended: false,
      rangeText: '0~9 중 서로 다른 숫자 4개',
      placeholder: '숫자 4개 입력',
      heroHtml:
        '컴퓨터가 고른 <strong>0~9 중 서로 다른 숫자 4개</strong>를 맞혀보자! 자리가 같으면 스트라이크, 숫자만 같으면 볼이야.',
      ruleHtml: '0~9 숫자 중 <strong>서로 다른 4개</strong>를 입력해. 같은 숫자는 한 번만 써.',
      startMessage: '중급: 0~9 숫자 4개를 맞혀봐!',
      note: '생각 더 하기',
    },
    advanced: {
      id: 'advanced',
      label: '상급',
      length: 5,
      minDigit: 0,
      maxDigit: 9,
      targetStrikes: 5,
      targetText: '5S',
      goalHint: '숫자 5개 모두 맞히기',
      recommended: false,
      rangeText: '0~9 중 서로 다른 숫자 5개',
      placeholder: '숫자 5개 입력',
      heroHtml:
        '컴퓨터가 고른 <strong>0~9 중 서로 다른 숫자 5개</strong>를 맞혀보자! 목표는 5 스트라이크야.',
      ruleHtml: '0~9 숫자 중 <strong>서로 다른 5개</strong>를 입력해. 같은 숫자는 한 번만 써.',
      startMessage: '상급: 0~9 숫자 5개를 맞혀봐!',
      note: '집중력 도전',
    },
    expert: {
      id: 'expert',
      label: '최상급',
      length: 6,
      minDigit: 0,
      maxDigit: 9,
      targetStrikes: 6,
      targetText: '6S',
      goalHint: '숫자 6개 모두 맞히기',
      recommended: false,
      rangeText: '0~9 중 서로 다른 숫자 6개',
      placeholder: '숫자 6개 입력',
      heroHtml:
        '컴퓨터가 고른 <strong>0~9 중 서로 다른 숫자 6개</strong>를 맞혀보자! 진짜 숫자야구 챔피언에게 어울리는 목표야.',
      ruleHtml: '0~9 숫자 중 <strong>서로 다른 6개</strong>를 입력해. 같은 숫자는 한 번만 써.',
      startMessage: '최상급: 0~9 숫자 6개를 맞혀봐!',
      note: '도전왕 모드',
    },
  };

  const DIFFICULTIES = Object.freeze(
    Object.fromEntries(
      DIFFICULTY_ORDER.map((id) => {
        const difficulty = difficultyDefinitions[id];
        return [
          id,
          Object.freeze({
            ...difficulty,
            digits: Object.freeze([...DIGITS]),
          }),
        ];
      }),
    ),
  );

  function getDifficulty(difficultyOrId = DEFAULT_DIFFICULTY_ID) {
    if (typeof difficultyOrId === 'function' || !difficultyOrId) {
      return DIFFICULTIES[DEFAULT_DIFFICULTY_ID];
    }

    if (typeof difficultyOrId === 'string') {
      return DIFFICULTIES[difficultyOrId] || DIFFICULTIES[DEFAULT_DIFFICULTY_ID];
    }

    if (difficultyOrId.id && DIFFICULTIES[difficultyOrId.id]) {
      return DIFFICULTIES[difficultyOrId.id];
    }

    return DIFFICULTIES[DEFAULT_DIFFICULTY_ID];
  }

  function normalizeAttempts(attempts) {
    const parsed = Number(attempts);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return 1;
    }
    return Math.floor(parsed);
  }

  function createSecret(difficultyOrRandom = DEFAULT_DIFFICULTY_ID, maybeRandom = Math.random) {
    const random = typeof difficultyOrRandom === 'function' ? difficultyOrRandom : maybeRandom;
    const difficulty = getDifficulty(difficultyOrRandom);
    const pool = [...difficulty.digits];
    const secret = [];

    while (secret.length < difficulty.length) {
      const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
      secret.push(pool.splice(index, 1)[0]);
    }

    return secret;
  }

  function validateGuess(value, difficultyOrId = DEFAULT_DIFFICULTY_ID) {
    const difficulty = getDifficulty(difficultyOrId);
    const normalized = String(value || '').trim();

    if (normalized.length !== difficulty.length) {
      return { ok: false, message: `숫자 ${difficulty.length}개를 넣어줘!` };
    }

    const digits = normalized.split('');
    if (!digits.every((digit) => difficulty.digits.includes(digit))) {
      return { ok: false, message: '0부터 9까지 숫자만 쓸 수 있어.' };
    }

    if (new Set(digits).size !== digits.length) {
      return { ok: false, message: '같은 숫자는 한 번만 쓸 수 있어.' };
    }

    return { ok: true, digits };
  }

  function evaluateGuess(secret, guess) {
    const strikes = guess.filter((digit, index) => secret[index] === digit).length;
    const balls = guess.filter((digit, index) => secret.includes(digit) && secret[index] !== digit).length;
    const solved = strikes === secret.length;

    return {
      strikes,
      balls,
      out: strikes === 0 && balls === 0,
      solved,
    };
  }

  function makeHintText(result) {
    if (result.solved) {
      return '정답! 홈런! 🎉';
    }

    if (result.out) {
      return '아웃! 숫자도 자리도 안 맞았어.';
    }

    const strikeText = `${result.strikes} 스트라이크`;
    const ballText = `${result.balls} 볼`;
    return `${strikeText} ${ballText}`;
  }

  function calculateScore(difficultyOrId, attempts) {
    const difficulty = getDifficulty(difficultyOrId);
    const safeAttempts = normalizeAttempts(attempts);
    const parAttempts = difficulty.length + 2;
    const speedBonus = Math.max(0, parAttempts - safeAttempts) * 25;
    return difficulty.length * 100 + speedBonus;
  }

  function getStarsForAttempts(difficultyOrId, attempts) {
    const difficulty = getDifficulty(difficultyOrId);
    const safeAttempts = normalizeAttempts(attempts);

    if (safeAttempts <= difficulty.length + 1) {
      return 3;
    }

    if (safeAttempts <= difficulty.length * 2) {
      return 2;
    }

    return 1;
  }

  function getProgressPercent(result, difficultyOrId) {
    const difficulty = getDifficulty(difficultyOrId);
    const strikes = Math.max(0, Math.min(difficulty.length, Number(result && result.strikes) || 0));
    return Math.round((strikes / difficulty.length) * 100);
  }

  function makeCelebrationText({ score, stars, streak }) {
    const rank = stars === 3 ? '홈런왕' : stars === 2 ? '에이스' : '도전왕';
    return `${rank}! ${'⭐'.repeat(stars)} ${score}점 · 연속 ${streak}홈런!`;
  }

  const api = {
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
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.OneStrikeOneBall = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
