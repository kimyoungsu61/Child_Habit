# Frontend integration

- Source: https://github.com/changsoo2609/Changsoo
- Integrated revision: `0eeb3340a6022b51f1d3b4351da5117d2f0bae94`
- Git remote: `frontend` (`frontend/han`)
- Static files: `src/main/webapp/index.html`, `css`, `js`, `assets`
- Backend integration layer: `js/07-backend-integration.js`
- JSON API entry point: `/api/*`

The original prototype scripts and visual assets are preserved. The final
integration script intercepts the mock login, mission, submission, review, and
reward actions and replaces them with same-origin Servlet API requests.
