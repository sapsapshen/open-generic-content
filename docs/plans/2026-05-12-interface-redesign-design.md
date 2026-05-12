# 2026-05-12 Interface Redesign Design

## Direction

Chosen direction: literati atelier.

The redesign aims for a quieter, more deliberate interface that supports repeated creative use without reading like a generic AI console. The product keeps all existing capabilities, but the information architecture is reorganized into a single-screen workshop: orientation in the masthead, mode choice and working guidance in the sidebar, structured input sequencing in the central composition panel, and presentation plus history in the output panel.

## Architecture

- Preserve all existing JavaScript anchors: IDs, `data-mode-tab`, `data-mode-panel`, and `data-output-panel` stay intact.
- Replace the previous two-column controls vs output split with a three-zone layout: sticky rail, workbench, output stage.
- Convert each major input slice into a numbered section card so the workflow becomes self-explanatory.
- Keep image and poem modes parallel so the interface remains learnable after switching modes.

## Design System

- Use paper, ink, lacquer, jade, and muted gold as the core semantic palette.
- Use Noto Serif SC for cultural weight and Outfit for operational clarity.
- Use generous rounded surfaces, soft shadows, and restrained contrast.
- Keep strong focus styles, clear empty states, and mobile-safe stacking behavior.

## Acceptance Criteria

- All current generation, lookup, template, and history actions keep working without JavaScript changes to selectors.
- The page feels calmer, more premium, and easier to scan than before.
- Both desktop and mobile layouts preserve action clarity and content hierarchy.
- A `DESIGN.md` file exists as the semantic source of truth for future visual work.