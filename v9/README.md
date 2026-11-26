# System Design Studio V9

React/TypeScript redesign, isolated from the current static GitHub Pages site. All six lessons use existing JSON directly; Zod validates the data. Zustand persists language, drafts and progress locally. React Flow renders architecture; Motion animates step progress. Legacy mock interviews and the complete advanced simulator remain linked.

## Local development

From this repository root: `cd v9 && npm install && npm run dev`. For the legacy links during local development, run `python3 -m http.server 8000` from the repository root in a separate terminal.

## Quality gate

`npm test` verifies original content counts; `npm run build` typechecks and builds; `npx playwright install chromium webkit && npm run test:e2e` checks browser interactions against the production preview. The PR workflow produces a static dist artifact. Do not merge or deploy before verification. After build, place dist contents under a separate `studio/` directory in the Pages publish root so relative legacy links resolve, without replacing the original home page. No backend or AI scoring is provided.

Known scope: V9 embeds all core content and advanced text; the advanced algorithm simulator and both mock whiteboards still run in the original pages. The sequence view is a step-by-step interaction list, not yet a UML lifeline diagram. Dependency lockfile should be committed after successful npm resolution.
