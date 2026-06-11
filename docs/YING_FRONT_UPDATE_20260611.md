# Ying Front Update - 2026-06-11

## Integrated Front

- Source branch: `origin/Front`
- Source commit: `f2bbe84`
- Main additions:
  - Parent mission editing flow
  - Reward box quantity selection and batch opening
  - Reward box reopening navigation and result messaging

## Ying Fixes Included

- Persist uploaded mission media outside the deployed WAR directory
- Keep legacy temporary media readable during migration
- Render the child's real photo or video in the parent submission detail
- Include the application context path when loading submission media
- Start the photo camera preview when the child enters photo certification
- Restore the camera preview when retaking a photo
- Keep recorded video preview controls and playback
- Show the parent/child login selection as the initial screen

## Verification

- JavaScript syntax checks:
  - `04-servlet-workflows.js`
  - `05-router-auth.js`
  - `07-backend-integration.js`
- Maven test and WAR package: `mvn clean package`
- Tomcat deployment target: `http://localhost:8090/back/app`
