# Kingdom 500 Firebase setup

The site now uses Firebase Realtime Database for shared CMS data and chat. The client configuration is in `src/firebase-config.js`; Firebase web API keys identify a project and are not service-account credentials.

## Complete deployment setup

1. In the Firebase console, open project `vikingrise500` and verify Realtime Database is enabled in the `europe-west1` region. The configured database URL is `https://vikingrise500-default-rtdb.europe-west1.firebasedatabase.app`.
2. In Project settings → General → Your apps, confirm that the web app configuration matches `src/firebase-config.js` (or update that file for another project).
3. Set up Realtime Database Security Rules. All browser writes are unauthenticated at present; the existing admin passcode is client-side and is **not** database authentication. For a short-lived local test only, Firebase's test-mode rules can validate the integration. Do not use publicly readable/writable rules for a production deployment: anyone can read, alter, or delete the data. Before production, add Firebase Authentication and enforce role-based rules (including public-only create access for chat/applications) in the database.
4. Host the Vite site over HTTPS. The browser imports Firebase's modular SDK from `gstatic`; no additional npm package is required.
5. Test using two separate browsers/devices: edit a stat or roster entry in the Admin Panel, submit a migration application, and send chat messages. Confirm the changes appear on the other device and remain after reload.

## Data layout

- `siteData/k500_custom_stats`, `siteData/k500_officers`, `siteData/k500_players`, `siteData/k500_activity_feed`, `siteData/k500_duty_log`, and other `k500_*` CMS keys are mirrored to the database and applied to every connected client.
- `chat/messages` stores shared chat messages; each client listens to the latest 100.
- `migrationApplications` stores visitor applications under generated keys.

The public Warrior Roster form requires the currently configured submission password `newarea500`. This check, like the existing admin passcode, is client-side and is not a substitute for Firebase Security Rules or real authentication.
