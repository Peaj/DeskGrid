# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project uses Semantic Versioning.

## [Unreleased]

## [0.6.0] - 2026-03-21

### Added

- A dedicated Desk Layer sidebar with layout stats and a `Next Step` panel so both workspace tabs keep a consistent two-column structure.
- Active layer persistence via URL hash and local storage, including direct links to `#layout` and `#student`.
- A folder icon on the `Project` menu trigger for clearer top-bar navigation.

### Changed

- Reworked the workspace layout so the grid and sidebar stay aligned more consistently across narrow, medium, and very wide window sizes.
- Refined the layer tab and workspace shell styling so the active tab reads as part of the panel with a stronger shared outline and cleaner overlap.
- Restyled the grid board to feel inset into the workspace instead of floating above it, using softer neutral tones and inner depth.

### Fixed

- Grid scaling now preserves seat and student-chip proportions more reliably by using cell-size-relative spacing and insets instead of fixed pixel offsets.
- Wide-screen workspace sizing no longer shrinks the grid after reaching the desktop layout limit.
- The active workspace layer now restores correctly after reloads and responds to browser hash navigation.

## [0.5.0] - 2026-03-21

### Added

- A persistent privacy message in the header stating that all data stays on the user's device.
- A dedicated `Privacy` popover explaining local browser storage, the lack of accounts/cloud sync/tracking, and quick actions for local save/load/export/clear.
- GitHub repository links from the version badge and the privacy popover to make the app's open source status visible.
- Privacy-focused tests covering the top bar messaging, local-project clearing, and static guardrails against remote font/tracking integrations.

### Changed

- The top header now uses a cleaner borderless layout and the version badge opens the project repository.
- `Plus Jakarta Sans` is now self-hosted inside the app instead of loading from Google Fonts.
- Content Security Policy handling now happens during production builds so the deployed app keeps stricter browser restrictions without interfering with local Vite development.
- README privacy documentation now explicitly describes the local-first storage model and future privacy constraints.

### Fixed

- Vite local development no longer loses its HMR/server connection because of CSP blocking dev-time `blob:` workers.
- The app no longer makes third-party Google Fonts requests at runtime, keeping classroom-data sessions consistent with the local-first privacy story.

## [0.4.0] - 2026-03-20

### Added

- Inline connection rule creation at the point between students, with shared rule icons across the dialog, rules list, and line overlays.
- Mid-line rule badges and linked hover states between canvas connections and their matching rule entries.
- Solver quality-of-life actions and feedback, including `Bench All`, stat tooltips, and clearer stat cards.
- Student portrait background icons across seated chips, bench chips, and the drag ghost.
- Seat painting hover previews for adding and removing seats in the layout layer.

### Changed

- Pair rules now use a single icon per rule, and front/back rules keep only the directional arrow after the student name.
- Connection rendering now uses curved paths for longer links and straight paths for directly adjacent seats.
- Layout and student layers are visually separated more clearly by hiding students on the layout layer and softening background seat treatment on the student layer.
- Panel headers, solver controls, and bench student chips were unified for more consistent spacing, iconography, and text wrapping.

### Fixed

- Connection lines now render in the correct stack order and remain readable with improved contrast, slimmer underlays, and icons above overlapping students.
- Project menu interactions now use the correct cursor and close reliably on selection, outside click, or `Escape`.
- Seat painting no longer shows the delete state for newly created seats until the paint stroke ends.

## [0.3.0] - 2026-03-14

### Added

- Initial changelog tracking for releases.

### Changed

- GitHub Pages deployment is treated as the release artifact for this web app.
