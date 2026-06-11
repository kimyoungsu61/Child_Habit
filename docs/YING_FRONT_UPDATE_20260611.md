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

## Mission Cancel and Video Recording Follow-up

- Allow active missions with only previous-day submission history to be canceled
- Block cancellation only when the mission has an approved submission today
- Hide the cancel action when the mission completion stamp is displayed
- Remove the duplicate video recording stop button
- Keep the main recording button as the single start/stop control

### Follow-up Verification

- Oracle rollback test:
  - Previous-day submission mission: cancellation allowed
  - Approved-today mission: cancellation blocked
- Deployed JSP contains no separate `stopMockVideoBtn`
- Maven tests: 8 passed
