# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-12
**Commit:** none (not a git repository)
**Branch:** none

## OVERVIEW

Local Korean number-baseball game for elementary-school players. This is a static browser app: no bundler, no framework, no build step.

## STRUCTURE

```text
one-strike-one-ball/
├── index.html          # runtime entry; direct script/style wiring
├── styles.css          # full game layout and responsive visual rules
├── src/
│   ├── game.js         # shared game logic; browser global + CommonJS export
│   └── app.js          # browser bootstrap and DOM state management
├── tests/
│   ├── game.test.js    # logic contract for digits, difficulty, scoring, hints
│   └── static.test.js  # file-content contract for HTML/CSS/app/README structure
├── package.json        # only start/test scripts
└── README.md           # gameplay, UX, and MVP scope
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Change game rules, difficulty, scoring, hint copy | `src/game.js` | Also update `tests/game.test.js`; user-facing Korean strings are tested. |
| Change DOM behavior, input flow, history, celebration, sound | `src/app.js` | Loads `window.OneStrikeOneBall`; no imports or bundler assumptions. |
| Change visible structure or required element ids/classes | `index.html` | `tests/static.test.js` asserts IDs, script tags, layout order, and rules drawer. |
| Change layout, colors, history grid, responsive behavior | `styles.css` | Static tests assert many CSS selectors and key declarations. |
| Change documented UX or MVP scope | `README.md` | README text is part of `tests/static.test.js`. |
| Verify everything | `npm test` | Uses Node built-in test runner. |
| Run locally | `npm start` | Serves current files at `http://127.0.0.1:5180/`. |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `OneStrikeOneBall` | browser global | `src/game.js` | API consumed by `src/app.js`. |
| `module.exports` API | CommonJS export | `src/game.js` | API consumed directly by `tests/game.test.js`. |
| `DIFFICULTIES` | constant map | `src/game.js` | Defines beginner/intermediate/advanced/expert. |
| `createSecret` | function | `src/game.js` | Generates unique digit answers from `0` through `9`. |
| `validateGuess` | function | `src/game.js` | Enforces length, numeric digits, and no duplicates. |
| `evaluateGuess` | function | `src/game.js` | Computes strikes, balls, out, solved. |
| `calculateScore` / `getStarsForAttempts` | functions | `src/game.js` | Gamification formulas tested as contract. |
| `startApp` IIFE | browser entry | `src/app.js` | Starts immediately after scripts load in `index.html`. |
| `renderHistorySlots` | function | `src/app.js` | Maintains fixed 20-slot history board. |
| `applyDifficulty` | function | `src/app.js` | Switching difficulty starts a new game without confirmation. |

## CONVENTIONS

- Keep the app static. Do not introduce a bundler or framework unless the project direction changes deliberately.
- Runtime order matters: `index.html` loads `src/game.js` before `src/app.js`.
- `src/game.js` must keep both surfaces: CommonJS exports for tests and `window.OneStrikeOneBall` for the browser.
- Difficulty IDs are `beginner`, `intermediate`, `advanced`, `expert`; visible labels are Korean.
- All difficulties use digits `0` through `9`; duplicate digits are invalid.
- Tests deliberately inspect files as text. Renaming IDs/classes or rewording tested Korean copy often requires test updates.
- The desktop UX target is a no-scroll two-panel screen: play controls left, history board right.
- History is fixed at 20 visible slots, filled left column `1-10` before right column `11-20`.
- Rules belong in the collapsible `details.rules-drawer`; the old permanent info grid is intentionally absent.

## ANTI-PATTERNS

- Do not make audio failure block gameplay. `src/app.js` treats sound as a bonus effect and swallows unavailable-audio errors.
- Do not reintroduce `messagePanel`, `info-grid`, `rule-card`, `difficulty-meta`, or `difficulty-note`; static tests forbid these older UI shapes.
- Do not assume an npm dev server. Local preview is Python's static server on `127.0.0.1:5180`.
- Do not convert `src/app.js` to module imports without changing `index.html` and the test strategy.

## COMMANDS

```bash
npm test
npm start
```

The `start` script runs:

```bash
python -m http.server 5180 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:5180/
```

## NOTES

- This directory is not currently a git repository.
- There is no CI, deployment config, or build output.
- `tests/static.test.js` is intentionally broad: it protects the current UX layout, CSS contract, README promises, and absence of removed panels.
- If Korean text appears corrupted in a terminal, verify with UTF-8-capable tools or a browser before changing source text.
