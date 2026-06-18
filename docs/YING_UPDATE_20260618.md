# Ying update - 2026-06-18

## Merged remote updates

- Merged the latest `origin/Front` updates through commit `3ffba38`.
- Added and integrated admin demo account support.
- Restored the admin profile setup flow and skip button behavior.
- Fixed child session handling after invite-code login.
- Updated the admin badge/profile modal behavior.
- Added backend DAO/Mapper support for demo parent, child, mission, and game profile data lookup.
- Preserved existing `origin/ying` updates, including mobile camera UX, reward layout, browser back navigation, and Roa animation asset updates.

## Local merge notes

- The merge completed as a fast-forward with no conflicts.
- Current preview target: `http://localhost:8090/back/app`.
- The local deletion of `src/main/webapp/assets/images/profile.webp` was not included in this update because the app still references it as the default profile image.
