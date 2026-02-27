# DeskGrid

[![Deploy to GitHub Pages](https://github.com/Peaj/DeskGrid/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/Peaj/DeskGrid/actions/workflows/deploy-pages.yml)

DeskGrid is a frontend-only classroom seating planner built with React + TypeScript + Vite.

## Deployment

- Production site (GitHub Pages): https://peaj.de/DeskGrid/
- Deployment method: GitHub Actions workflow (`.github/workflows/deploy-pages.yml`)
- Trigger: push to `main` or manual workflow dispatch

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
