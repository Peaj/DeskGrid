## Change management (required)
- Only update the version in `package.json` when explicitly prompted to release.
  - Use semantic versioning:
    - **patch** for bug fixes and internal refactors with no user-facing change.
    - **minor** for backward-compatible features or enhancements.
    - **major** for breaking changes or behavior changes that require user action.
  - Version changes are the trigger for release automation.
- Keep the `package.json` version and the latest `CHANGELOG.md` release section in sync for every release.
- Only update `CHANGELOG.md` when explicitly prompted to release.
  - Use Keep a Changelog style headings (Added/Changed/Fixed/Removed).
