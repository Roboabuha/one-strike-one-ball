(function startApp() {
  const game = window.OneStrikeOneBall;
  const HISTORY_SLOT_COUNT = 20;

  const form = document.getElementById('guessForm');
  const input = document.getElementById('guessInput');
  const attemptCount = document.getElementById('attemptCount');
  const historyList = document.getElementById('historyList');
  const newGameButton = document.getElementById('newGameButton');
  const numberPad = document.querySelector('.number-pad');
  const submitButton = form.querySelector('button[type="submit"]');
  const goalText = document.getElementById('goalText');
  const goalHint = document.getElementById('goalHint');
  const padHelp = document.getElementById('padHelp');
  const heroText = document.getElementById('heroText');
  const ruleText = document.getElementById('ruleText');
  const scoreText = document.getElementById('scoreText');
  const streakText = document.getElementById('streakText');
  const badgeText = document.getElementById('badgeText');
  const progressText = document.getElementById('progressText');
  const progressFill = document.getElementById('progressFill');
  const celebration = document.getElementById('celebration');
  const difficultySelector = document.getElementById('difficultySelector');
  const difficultyButtons = Array.from(difficultySelector.querySelectorAll('button[data-difficulty]'));
  const numberPadButtons = Array.from(numberPad.querySelectorAll('button'));
  const digitButtons = Array.from(numberPad.querySelectorAll('button[data-digit]'));

  let currentDifficultyId = game.DEFAULT_DIFFICULTY_ID;
  let secret = [];
  let attempts = 0;
  let isSolved = false;
  let totalScore = 0;
  let streak = 0;
  let historyRecords = [];
  let audioContext = null;

  function getCurrentDifficulty() {
    return game.getDifficulty(currentDifficultyId);
  }

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    return audioContext;
  }

  function playThrowSound() {
    try {
      const context = getAudioContext();

      if (!context) {
        return;
      }

      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(420, now);
      oscillator.frequency.exponentialRampToValueAtTime(720, now + 0.08);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.15);
    } catch (error) {
      // Sound is a small bonus effect. Never block the game if audio is unavailable.
    }
  }

  function setMessage(text, isSuccess = false) {
    badgeText.textContent = text;
    badgeText.classList.toggle('success', isSuccess);
  }

  function setAttempts(nextAttempts) {
    attempts = nextAttempts;
    attemptCount.textContent = String(attempts);
  }

  function setScore(nextScore) {
    totalScore = nextScore;
    scoreText.textContent = String(totalScore);
  }

  function setStreak(nextStreak) {
    streak = nextStreak;
    streakText.textContent = String(streak);
  }

  function getRecordOutcome(result) {
    if (result.solved) {
      return 'solved';
    }

    if (result.out) {
      return 'out';
    }

    return 'hit';
  }

  function createRecordCard(record) {
    const card = document.createElement('span');
    card.className = 'record-card';

    if (!record) {
      card.classList.add('is-empty');
      card.setAttribute('aria-hidden', 'true');
      return card;
    }

    const guessText = document.createElement('span');
    const resultText = document.createElement('span');

    card.classList.add(`is-${record.outcome}`);
    guessText.className = 'guess';
    guessText.textContent = `${record.guess.join('')} `;
    resultText.className = 'result';
    resultText.textContent = `→ ${record.hint}`;

    card.append(guessText, resultText);
    return card;
  }

  function renderHistorySlots() {
    historyList.innerHTML = '';

    Array.from({ length: HISTORY_SLOT_COUNT }).forEach((_, index) => {
      const slot = document.createElement('li');
      const number = document.createElement('span');
      const card = createRecordCard(historyRecords[index]);

      slot.className = 'history-slot';
      number.className = 'slot-number';
      number.textContent = `${index + 1}.`;

      slot.append(number, card);
      historyList.append(slot);
    });

    historyList.scrollTop = historyList.scrollHeight;
  }

  function appendHistory(guess, hint, outcome) {
    historyRecords.push({ guess, hint, outcome });

    if (historyRecords.length > HISTORY_SLOT_COUNT) {
      historyRecords.shift();
    }

    renderHistorySlots();
  }

  function resetInput() {
    input.value = '';
    if (!input.disabled) {
      input.focus();
    }
  }

  function updateProgress(result = { strikes: 0 }) {
    const difficulty = getCurrentDifficulty();
    const strikes = Math.max(0, Math.min(difficulty.length, Number(result.strikes) || 0));
    const percent = game.getProgressPercent({ strikes }, currentDifficultyId);

    progressText.textContent = `진행도 ${strikes}/${difficulty.length}`;
    progressFill.style.width = `${percent}%`;

    if (!result.solved) {
      badgeText.textContent = strikes > 0 ? `좋아! ${strikes}개 자리가 맞았어` : '🏅 새싹 타자 배지 도전 중';
      badgeText.classList.remove('success');
    }
  }

  function updateDifficultyUI() {
    const difficulty = getCurrentDifficulty();

    goalText.textContent = difficulty.targetText;
    goalHint.textContent = difficulty.goalHint;
    padHelp.textContent = `${difficulty.label}은 0부터 9까지 숫자를 써!`;
    heroText.innerHTML = difficulty.heroHtml;
    ruleText.innerHTML = difficulty.ruleHtml;
    input.setAttribute('maxlength', String(difficulty.length));
    input.setAttribute('pattern', `[0-9]{${difficulty.length}}`);
    input.placeholder = difficulty.placeholder;

    difficultyButtons.forEach((button) => {
      const isSelected = button.dataset.difficulty === currentDifficultyId;

      button.classList.toggle('active', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });

    digitButtons.forEach((button) => {
      const digit = button.dataset.digit;
      const isAllowed = difficulty.digits.includes(digit);

      button.disabled = isSolved || !isAllowed;
      button.classList.toggle('is-disabled-by-difficulty', !isAllowed);
      button.setAttribute('aria-disabled', String(button.disabled));
      button.title = isAllowed ? '' : `${difficulty.label}에서는 ${digit}를 쓸 수 없어.`;
    });

    numberPadButtons.forEach((button) => {
      if (button.dataset.action) {
        button.disabled = isSolved;
        button.setAttribute('aria-disabled', String(isSolved));
      }
    });
  }

  function setPlayControlsEnabled(isEnabled) {
    input.disabled = !isEnabled;
    submitButton.disabled = !isEnabled;
    updateDifficultyUI();
  }

  function clearCelebration() {
    celebration.innerHTML = '';
  }

  function startNewGame(message) {
    const difficulty = getCurrentDifficulty();

    secret = game.createSecret(currentDifficultyId);
    isSolved = false;
    historyRecords = [];
    renderHistorySlots();
    setAttempts(0);
    setPlayControlsEnabled(true);
    updateProgress({ strikes: 0 });
    clearCelebration();
    setMessage(message || `새 숫자를 골랐어. ${difficulty.startMessage}`);
    resetInput();
  }

  function applyDifficulty(nextDifficultyId, isInitial = false) {
    if (!game.DIFFICULTIES[nextDifficultyId]) {
      return;
    }

    const nextDifficulty = game.getDifficulty(nextDifficultyId);

    if (!isInitial && currentDifficultyId === nextDifficulty.id) {
      setMessage(`${nextDifficulty.label}이 이미 선택되어 있어. 그대로 도전해보자!`);
      resetInput();
      return;
    }

    currentDifficultyId = nextDifficulty.id;
    startNewGame(
      isInitial
        ? `${nextDifficulty.label}으로 시작해. ${nextDifficulty.startMessage}`
        : `${nextDifficulty.label}으로 바꿨어. 새 게임으로 다시 시작했어! ${nextDifficulty.startMessage}`,
    );
  }

  function sanitizeKeyboardInput() {
    if (input.disabled) {
      return;
    }

    const difficulty = getCurrentDifficulty();
    let sanitizedValue = '';
    let rejectedOutOfRange = false;
    let rejectedDuplicate = false;
    let rejectedTooLong = false;

    for (const digit of input.value.split('')) {
      if (!game.DIGITS.includes(digit) || !difficulty.digits.includes(digit)) {
        rejectedOutOfRange = true;
        continue;
      }

      if (sanitizedValue.includes(digit)) {
        rejectedDuplicate = true;
        continue;
      }

      if (sanitizedValue.length >= difficulty.length) {
        rejectedTooLong = true;
        continue;
      }

      sanitizedValue += digit;
    }

    if (input.value === sanitizedValue) {
      return;
    }

    input.value = sanitizedValue;

    if (rejectedOutOfRange) {
      setMessage('0부터 9까지 숫자만 쓸 수 있어!');
      return;
    }

    if (rejectedDuplicate) {
      setMessage('이미 고른 숫자야!');
      return;
    }

    if (rejectedTooLong) {
      setMessage(`숫자 ${difficulty.length}개까지만 고를 수 있어!`);
    }
  }

  function launchCelebration(stars) {
    clearCelebration();
    const emojis = ['🎉', '⭐', '⚾', '🏆', '✨'];
    const count = stars * 8;

    for (let index = 0; index < count; index += 1) {
      const piece = document.createElement('span');
      piece.className = 'confetti';
      piece.textContent = emojis[index % emojis.length];
      piece.style.setProperty('--x', `${Math.random() * 100}vw`);
      piece.style.setProperty('--delay', `${Math.random() * 0.35}s`);
      piece.style.setProperty('--spin', `${Math.random() * 360}deg`);
      celebration.append(piece);
    }
  }

  function submitGuess(rawValue) {
    if (isSolved) {
      setMessage('새 게임을 누르면 다시 할 수 있어!');
      return;
    }

    const validation = game.validateGuess(rawValue, currentDifficultyId);
    if (!validation.ok) {
      setMessage(validation.message);
      resetInput();
      return;
    }

    playThrowSound();
    const result = game.evaluateGuess(secret, validation.digits);
    const hint = game.makeHintText(result);
    const outcome = getRecordOutcome(result);
    const nextAttempts = attempts + 1;

    setAttempts(nextAttempts);
    appendHistory(validation.digits, hint, outcome);
    updateProgress(result);

    if (result.solved) {
      const roundScore = game.calculateScore(currentDifficultyId, nextAttempts);
      const stars = game.getStarsForAttempts(currentDifficultyId, nextAttempts);
      const nextStreak = streak + 1;
      const celebrationText = game.makeCelebrationText({ score: roundScore, stars, streak: nextStreak });

      isSolved = true;
      setScore(totalScore + roundScore);
      setStreak(nextStreak);
      setMessage(`${hint} ${celebrationText}`, true);
      launchCelebration(stars);
      input.value = '';
      setPlayControlsEnabled(false);
      return;
    }

    setMessage(hint, false);
    resetInput();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitGuess(input.value);
  });

  newGameButton.addEventListener('click', () => {
    startNewGame();
  });

  difficultySelector.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-difficulty]');
    if (!button) {
      return;
    }

    applyDifficulty(button.dataset.difficulty);
  });

  input.addEventListener('input', sanitizeKeyboardInput);

  numberPad.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || input.disabled) {
      return;
    }

    const digit = button.dataset.digit;
    const action = button.dataset.action;
    const difficulty = getCurrentDifficulty();

    if (digit) {
      if (!difficulty.digits.includes(digit)) {
        setMessage('0부터 9까지 숫자만 쓸 수 있어!');
        input.focus();
        return;
      }

      if (input.value.includes(digit)) {
        setMessage('이미 고른 숫자야!');
        input.focus();
        return;
      }

      if (input.value.length >= difficulty.length) {
        setMessage(`숫자 ${difficulty.length}개를 다 골랐어. 던지기를 눌러봐!`);
        input.focus();
        return;
      }

      input.value += digit;
      input.focus();
      return;
    }

    if (action === 'delete') {
      input.value = input.value.slice(0, -1);
      input.focus();
      return;
    }

    if (action === 'clear') {
      resetInput();
    }
  });

  setScore(0);
  setStreak(0);
  applyDifficulty(currentDifficultyId, true);
})();
