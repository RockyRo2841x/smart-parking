# Verification record

Completed on 21 October 2026. Preparation began on 20 October 2026.

## Automated checks

Seven checks in `tests/test_api.py` passed against the real FastAPI routes using its in-process test client:

1. Startup in manual-demo mode without importing a camera or model dependency.
2. The complete ordered inventory B1–B58.
3. Entry/exit updates persist across subsequent API polls.
4. Unknown slots and invalid states are rejected without changing occupancy.
5. Manual updates are rejected when camera mode is selected.
6. A synthetic box spanning two regions marks both spaces occupied.
7. An empty detection snapshot clears occupancy without modifying published state during snapshot construction.

These are API and mapping checks. They do not exercise the YOLO model, camera acquisition or detector-thread lifecycle under camera failures.

Frontend ESLint completed with no errors or warnings for `App.js`, `config.js` and `screens/`. Expo exported a web bundle successfully after the final screen text-encoding correction. No Android or iOS package was built.

## Browser check

Served the exported web app locally and connected it to a running Uvicorn API in manual-demo mode. Observed:

- Home loaded the parking summary and opened the lot view.
- The lot view displayed 58 spaces.
- Car Entered changed the count from 0 occupied / 58 free to 1 occupied / 57 free; the first available slot advanced from B1 to B2.
- A page reload retained the backend's current occupancy and refreshed the Home summary.
- Car Exited restored 0 occupied / 58 free and B1 as the first available slot.
- Another entry produced the screenshot in `images/manual-demo.png`, with B1 occupied and B2 highlighted.

The displayed counts were manually controlled demo state. No camera was opened for this verification.

## Environment

| Component | Version used |
| --- | --- |
| Node.js | 24.19.0 |
| Expo | 54.0.33 |
| React Native | 0.81.5 |
| FastAPI | 0.151.0 |
| Uvicorn | 0.54.0 |
| Starlette | 1.9.0 |
| Pydantic | 2.14.1 |
| HTTPX | 0.28.1 |

Python dependencies were installed into an isolated workspace target for verification. Frontend dependencies were installed from the original lockfile. FastAPI's test-client stack emitted a deprecation notice about HTTPX; all seven checks completed successfully.

## Preparation changes

The initial commit retains the original prototype source. Subsequent changes are explicit portability and demo improvements:

- One environment-configurable API address replaces duplicated hard-coded LAN addresses.
- Home exposes the implemented Lot B API instead of nonexistent small-lot/dummy endpoints and fabricated travel estimates.
- Unused SmallLot placeholder and static 52-slot sample data were removed from the current tree; they remain in the initial commit.
- Camera setup is opt-in and runs during API lifespan rather than at module import.
- Camera-independent manual mode makes API/UI behavior reproducible without hardware.
- Complete detection snapshots, locked reads/writes and detector status replace partial frame updates.
- Camera mode rejects manual writes, avoiding silent overwrite of UI changes by the next frame.
- The first available space is labeled accurately rather than presented as a distance-based nearest-space calculation.
- Network/update failures are surfaced in the UI.
- Setup instructions, dependency lists, checks and screenshot evidence replace the Expo starter README.

The original `C:\Users\mvish\smart-parking` folder was read only. No functionality beyond these preparation changes has been attributed to the original implementation.

## Remaining verification

Camera-mode startup and shutdown, real detection accuracy, slot calibration, field-of-view coverage, native phone behavior, concurrent user interactions and persistence remain unverified. Use of synthetic boxes in the mapping check does not establish real-world detector quality.
