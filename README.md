# DeskGrid

[![Deploy to GitHub Pages](https://github.com/Peaj/DeskGrid/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Peaj/DeskGrid/actions/workflows/deploy-pages.yml)

DeskGrid is a frontend-only classroom seating planner built with React + TypeScript + Vite.

## Deployment

- Production site (GitHub Pages): https://peaj.de/DeskGrid/
- Deployment method: GitHub Actions workflow (`.github/workflows/deploy-pages.yml`)
- Trigger:
  - push to `main` where `package.json` version changed
  - manual workflow dispatch (always deploys)

### Required Repository Setting

In GitHub repository settings:

1. Open `Settings -> Pages`.
2. Under `Build and deployment`, set `Source` to `GitHub Actions`.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```

## Versioning

DeskGrid uses semantic versioning (`MAJOR.MINOR.PATCH`).

```bash
npm run version:patch
npm run version:minor
npm run version:major
```

## Privacy

DeskGrid is local-first by design. Student names, seating plans, constraints, and assignments stay in the browser on the teacher's device and are not uploaded by the app.

- Project data is stored locally in this browser via `localStorage`.
- The current project auto-saves to local storage and auto-loads in the same browser.
- Users can save and load full project files, or export layout and roster data separately.
- The app does not use analytics, tracking, or cloud sync.
- Future features must not introduce remote data upload or third-party tracking without revisiting the privacy model.
