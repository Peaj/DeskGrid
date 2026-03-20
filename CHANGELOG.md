# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project uses Semantic Versioning.

## [Unreleased]

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
