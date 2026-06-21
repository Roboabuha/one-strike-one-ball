const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function readProjectFile(...segments) {
  return readFileSync(path.join(root, ...segments), 'utf8');
}

test('index.html wires the game UI, stylesheet, and scripts', () => {
  const html = readProjectFile('index.html');

  assert.match(html, /원스트라이크원볼/);
  assert.match(html, /id="guessForm"/);
  assert.match(html, /<form[^>]*id="guessForm"[^>]*novalidate/);
  assert.match(html, /id="guessInput"/);
  assert.match(html, /id="historyList"/);
  assert.match(html, /src="src\/game\.js\?v=scoreboard-toy"/);
  assert.match(html, /src="src\/app\.js\?v=scoreboard-toy"/);
  assert.match(html, /href="styles\.css\?v=level-colors"/);
});

test('index.html uses a no-scroll two-panel desktop layout with play on the left and history on the right', () => {
  const html = readProjectFile('index.html');
  const layoutIndex = html.indexOf('class="play-layout"');
  const playPanelIndex = html.indexOf('class="play-panel"');
  const historyPanelIndex = html.indexOf('class="history-panel"');
  const guessFormIndex = html.indexOf('id="guessForm"');
  const historyListIndex = html.indexOf('id="historyList"');

  assert.ok(layoutIndex !== -1, 'two-panel layout wrapper is present');
  assert.ok(playPanelIndex > layoutIndex, 'left play panel appears inside layout');
  assert.ok(historyPanelIndex > playPanelIndex, 'right history panel appears after play panel');
  assert.ok(guessFormIndex > playPanelIndex && guessFormIndex < historyPanelIndex, 'number input lives in left panel');
  assert.ok(historyListIndex > historyPanelIndex, 'history list lives in right panel');
  assert.match(html, /aria-label="왼쪽 숫자 선택 영역"/);
  assert.match(html, /aria-label="오른쪽 기록 영역"/);
});

test('index.html makes rules available only on demand and moves difficulty explanations into the rules drawer', () => {
  const html = readProjectFile('index.html');
  const rulesIndex = html.indexOf('class="rules-drawer"');
  const historyListIndex = html.indexOf('id="historyList"');

  assert.match(html, /<details[^>]*class="rules-drawer"/);
  assert.match(html, /<summary>규칙 보기<\/summary>/);
  assert.ok(rulesIndex !== -1 && rulesIndex < historyListIndex, 'rules toggle appears before the record list');
  assert.doesNotMatch(html, /class="info-grid"/);
  assert.doesNotMatch(html, /class="rule-card"/);

  const rulesHtml = html.slice(rulesIndex, historyListIndex);
  assert.match(rulesHtml, /난이도 안내/);
  assert.match(rulesHtml, /초급[\s\S]*0~9[\s\S]*3개/);
  assert.match(rulesHtml, /중급[\s\S]*0~9[\s\S]*4개/);
  assert.match(rulesHtml, /상급[\s\S]*0~9[\s\S]*5개/);
  assert.match(rulesHtml, /최상급[\s\S]*0~9[\s\S]*6개/);
});

test('index.html keeps difficulty buttons compact with only level names visible', () => {
  const html = readProjectFile('index.html');
  const playPanelIndex = html.indexOf('class="play-panel"');
  const difficultyIndex = html.indexOf('id="difficultySelector"');
  const formIndex = html.indexOf('id="guessForm"');

  assert.ok(difficultyIndex > playPanelIndex, 'difficulty selector appears in play panel');
  assert.ok(formIndex > difficultyIndex, 'input appears after difficulty selector');

  for (const [id, label] of [
    ['beginner', '초급'],
    ['intermediate', '중급'],
    ['advanced', '상급'],
    ['expert', '최상급'],
  ]) {
    assert.match(html, new RegExp(`<button[\\s\\S]*data-difficulty="${id}"[\\s\\S]*>${label}<\\/button>`));
  }

  assert.match(html, /aria-pressed="true"[\s\S]*초급/);
  assert.doesNotMatch(html, /difficulty-meta/);
  assert.doesNotMatch(html, /difficulty-note/);
  assert.doesNotMatch(html, /selected-label/);
  assert.match(html, /data-digit="0"/);
  assert.match(html, /id="goalText"/);
  assert.match(html, /id="goalHint"/);
  assert.match(html, /id="padHelp"/);
  assert.match(html, /모두 지우기/);
  assert.match(html, /id="heroText"/);
});

test('index.html removes the message panel so number selection can own the main space', () => {
  const html = readProjectFile('index.html');

  assert.doesNotMatch(html, /id="messagePanel"/);
  assert.doesNotMatch(html, /class="message-panel/);
});

test('index.html includes gamification status, progress, and celebration hooks', () => {
  const html = readProjectFile('index.html');

  assert.match(html, /id="scoreText"/);
  assert.match(html, /id="streakText"/);
  assert.match(html, /id="badgeText"/);
  assert.match(html, /id="progressText"/);
  assert.match(html, /id="progressFill"/);
  assert.match(html, /id="celebration"/);
  assert.match(html, /🏅 새싹 타자 배지 도전 중/);
  assert.match(html, /class="gamification-panel"/);
});

test('styles.css contains no-scroll split-screen layout with a larger number-pad section', () => {
  const css = readProjectFile('styles.css');

  assert.match(css, /body[\s\S]*overflow:\s*hidden/);
  assert.match(css, /\.app-shell[\s\S]*height:\s*100dvh/);
  assert.match(css, /\.play-layout[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(320px,\s*0\.72fr\)/);
  assert.match(css, /\.play-panel[\s\S]*grid-template-rows:[\s\S]*minmax\(220px,\s*1fr\)/);
  assert.match(css, /\.history-panel/);
  assert.match(css, /\.history-list[\s\S]*overflow-y:\s*hidden/);
  assert.match(css, /\.rules-drawer/);
  assert.match(css, /\.compact-hero/);
  assert.match(css, /\.difficulty-button[\s\S]*min-height:\s*42px/);
  assert.match(css, /\.number-pad[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.number-pad[\s\S]*grid-auto-rows:\s*1fr/);
  assert.match(css, /\.number-pad[\s\S]*min-height:\s*0/);
  assert.doesNotMatch(css, /\.message-panel/);
  assert.match(css, /\.gamification-panel/);
  assert.match(css, /\.progress-fill/);
  assert.match(css, /\.celebration/);
  assert.match(css, /\.confetti/);
  assert.match(css, /@keyframes/);
  assert.match(css, /button:disabled/);
  assert.match(css, /@media/);
});

test('styles.css makes the history board a fixed 20-slot two-column board filled left column first', () => {
  const css = readProjectFile('styles.css');

  assert.match(css, /\.history-list[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.history-list[\s\S]*grid-template-rows:\s*repeat\(10,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.history-list[\s\S]*grid-auto-flow:\s*column/);
  assert.match(css, /\.history-list[\s\S]*gap:\s*5px/);
  assert.match(css, /\.history-slot/);
  assert.match(css, /\.history-slot:nth-child\(n \+ 11\)/);
  assert.match(css, /\.slot-number[\s\S]*color:\s*var\(--danger\)/);
  assert.match(css, /\.record-card/);
  assert.match(css, /\.record-card\.is-empty/);
  assert.match(css, /\.history-slot[\s\S]*word-break:\s*keep-all/);
  assert.match(css, /\.history-slot[\s\S]*overflow-wrap:\s*break-word/);
  assert.match(css, /\.history-list \.result[\s\S]*min-width:\s*0/);
});

test('styles.css adds tactile scoreboard polish without changing the static layout contract', () => {
  const css = readProjectFile('styles.css');

  assert.match(css, /\.play-panel::before/);
  assert.match(css, /\.history-panel::before/);
  assert.match(css, /\.score-box::before/);
  assert.match(css, /\.number-pad button\[data-digit\][\s\S]*box-shadow/);
  assert.match(css, /\.number-pad button:active/);
  assert.match(css, /#guessInput:not\(:placeholder-shown\)/);
  assert.match(css, /\.record-card\.is-hit/);
  assert.match(css, /\.record-card\.is-out/);
  assert.match(css, /\.record-card\.is-solved/);
});

test('app.js appends new attempts to the bottom and no longer depends on a message panel', () => {
  const app = readProjectFile('src', 'app.js');

  assert.match(app, /OneStrikeOneBall/);
  assert.match(app, /currentDifficultyId/);
  assert.match(app, /difficultySelector/);
  assert.match(app, /applyDifficulty/);
  assert.match(app, /updateDifficultyUI/);
  assert.match(app, /createSecret\(currentDifficultyId\)/);
  assert.match(app, /validateGuess\(rawValue, currentDifficultyId\)/);
  assert.match(app, /setAttribute\('maxlength'/);
  assert.match(app, /setAttribute\('pattern'/);
  assert.match(app, /placeholder/);
  assert.match(app, /goalText/);
  assert.match(app, /goalHint/);
  assert.match(app, /padHelp/);
  assert.match(app, /heroText/);
  assert.match(app, /ruleText/);
  assert.match(app, /scoreText/);
  assert.match(app, /streakText/);
  assert.match(app, /badgeText/);
  assert.match(app, /progressFill/);
  assert.match(app, /calculateScore/);
  assert.match(app, /getStarsForAttempts/);
  assert.match(app, /makeCelebrationText/);
  assert.match(app, /launchCelebration/);
  assert.match(app, /aria-pressed/);
  assert.match(app, /button\.disabled/);
  assert.match(app, /이미 고른 숫자야!/);
  assert.match(app, /새 게임으로 다시 시작했어/);
  assert.match(app, /historyRecords\.push\(\{ guess, hint, outcome \}\)/);
  assert.match(app, /renderHistorySlots\(\)/);
  assert.match(app, /historyList\.scrollTop\s*=\s*historyList\.scrollHeight/);
  assert.doesNotMatch(app, /messagePanel/);
  assert.doesNotMatch(app, /classList\.add\('pop'\)/);
});

test('app.js marks history records with result outcome classes for scan-friendly feedback', () => {
  const app = readProjectFile('src', 'app.js');

  assert.match(app, /function getRecordOutcome/);
  assert.match(app, /result\.solved[\s\S]*'solved'/);
  assert.match(app, /result\.out[\s\S]*'out'/);
  assert.match(app, /'hit'/);
  assert.match(app, /record\.outcome/);
  assert.match(app, /card\.classList\.add\(`is-\$\{record\.outcome\}`\)/);
  assert.match(app, /historyRecords\.push\(\{ guess, hint, outcome \}\)/);
});

test('app.js renders fixed numbered history slots and fills 1-10 before 11-20', () => {
  const app = readProjectFile('src', 'app.js');

  assert.match(app, /const HISTORY_SLOT_COUNT\s*=\s*20/);
  assert.match(app, /let historyRecords\s*=\s*\[\]/);
  assert.match(app, /function renderHistorySlots/);
  assert.match(app, /Array\.from\(\{ length: HISTORY_SLOT_COUNT \}/);
  assert.match(app, /slot\.className\s*=\s*'history-slot'/);
  assert.match(app, /number\.className\s*=\s*'slot-number'/);
  assert.match(app, /number\.textContent\s*=\s*`\$\{index \+ 1\}\.`/);
  assert.match(app, /card\.className\s*=\s*'record-card'/);
  assert.match(app, /card\.classList\.add\('is-empty'\)/);
  assert.match(app, /historyRecords\.push\(\{ guess, hint, outcome \}\)/);
  assert.match(app, /historyRecords\.length > HISTORY_SLOT_COUNT[\s\S]*historyRecords\.shift\(\)/);
  assert.match(app, /renderHistorySlots\(\)/);
});

test('app.js plays a small throw sound on valid submits without external audio files', () => {
  const app = readProjectFile('src', 'app.js');

  assert.match(app, /function playThrowSound/);
  assert.match(app, /AudioContext|webkitAudioContext/);
  assert.match(app, /createOscillator/);
  assert.match(app, /createGain/);
  assert.match(app, /oscillator\.type\s*=\s*'triangle'/);
  assert.match(app, /gain\.gain/);
  assert.match(app, /playThrowSound\(\);[\s\S]*const result = game\.evaluateGuess/);
  assert.doesNotMatch(app, /\.mp3|\.wav|\.ogg/);
});

test('README documents 0 usage, new difficulty lengths, gamification, and split-screen UX', () => {
  const readme = readProjectFile('README.md');

  assert.match(readme, /0~9/);
  assert.match(readme, /초급.*0~9.*3자리.*3S/);
  assert.match(readme, /중급.*0~9.*4자리.*4S/);
  assert.match(readme, /상급.*0~9.*5자리.*5S/);
  assert.match(readme, /최상급.*0~9.*6자리.*6S/);
  assert.match(readme, /점수/);
  assert.match(readme, /연속 홈런/);
  assert.match(readme, /배지/);
  assert.match(readme, /좌측.*숫자/);
  assert.match(readme, /우측.*기록/);
  assert.match(readme, /규칙.*접기/);
  assert.match(readme, /최근 시도.*아래/);
  assert.match(readme, /2열/);
  assert.match(readme, /20개/);
  assert.match(readme, /20칸/);
  assert.match(readme, /1~10/);
  assert.match(readme, /11~20/);
  assert.match(readme, /왼쪽.*먼저/);
  assert.match(readme, /효과음/);
});
