# KhepiLabs Agent Instructions

## Anti-Slop is required
Before any coding, UI, copy, responsive/mobile, accessibility, or code-comment task:
1. Read `antislop.md` in the repository root.
2. Follow its activation-mode procedure before beginning work.
3. Load the matching Anti-Slop skill when its `SKILL.md` is available:
   - `skills/antislop/SKILL.md` for every task
   - `skills/antislop-ui/SKILL.md` for UI and visual work
   - `skills/antislop-copywriting/SKILL.md` for copy and text
   - `skills/antislop-human/SKILL.md` for usability and accessibility
   - `skills/antislop-layoutmobile/SKILL.md` for responsive/mobile work
   - `skills/antislop-code/SKILL.md` for code comments
4. If a referenced skill file is missing, do not pretend it was loaded. State the limitation and use only the rules actually available.
5. Preserve KhepiLabs' existing product identity and architecture. Do not redesign unrelated sections or change unrelated behavior.
6. Before delivery, run the relevant checks/build and report concrete evidence. Never claim a check passed if it was not run.

## Project-specific guardrails
- Inspect existing components, styles, data models, and patterns before editing.
- Prefer focused changes over broad rewrites.
- Keep existing routes, authentication, Supabase behavior, and app publishing flows intact unless the task explicitly requires changes.
- Ensure interactive controls work, and cover loading, empty, and error states where relevant.
- Check responsive behavior and keyboard accessibility for UI changes.
