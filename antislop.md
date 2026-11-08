# Anti-Slop for KhepiLabs

This file is the project-level pointer for Anti-Slop. It is a filter, not a style guide: it prevents generic AI-generated UI, copy, and code without prescribing an aesthetic.

For UI, copy, people, mobile layout, or code-comment work, load the matching Anti-Slop skill before starting.

- Core filter, always on: `skills/antislop/SKILL.md`
- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People / usability: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`

Before starting, follow the core skill's "Two Usage Modes" section: explicit session instruction first, then global preference, then ask. For a resolved mode, announce `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once, using the actual mode and source. Ask only when no mode is resolved.

**Important installation note:** This pointer does not contain the six skill files. If they are absent from the repository, do not claim the full Anti-Slop skill set is installed or loaded. The project instructions require the agent to report that limitation.

Official upstream: https://github.com/miqdadbadjuber/anti-slop
