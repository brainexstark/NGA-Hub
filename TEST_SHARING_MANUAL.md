# NGA Hub: Temporary Sharing Protocol

This manual details the procedure for generating a temporary, high-performance link for external synchronization and testing. This process utilizes Firebase Hosting Preview Channels and does not modify the core application logic.

## 1. Prerequisites
*   Ensure you are in the terminal within Firebase Studio.
*   Ensure you have the Firebase CLI initialized and are logged in.

## 2. Generate Expiring Link (48 Hours)
Execute the following command to deploy a preview version of the app that will automatically expire after 48 hours:

```bash
firebase hosting:channel:deploy beta --expires 48h
```

## 3. Results
*   The terminal will output a unique URL (e.g., `https://nga-hub--beta-xxxxxx.web.app`).
*   Share this URL with your friends for testing.
*   The link will become inactive exactly 48 hours after the time of deployment.

## 4. PWA Handshake
The mandatory `manifest.json` and `sw.js` nodes have been localized. When your friends open the link in Chrome, the "Install" dropdown icon in the address bar should be authorized automatically.

## 5. Customizing the Desktop Icon
To replace the default NGA Hub icon with your own choice:
1.  **Node Deposit**: Place your image file (PNG, 512x512 recommended) into the `public/` folder of this project.
2.  **Manifest Synchronization**: Open `public/manifest.json`.
3.  **Update Reference**: Change the `src` paths in the `icons` array to match your filename (e.g., `"/your-icon.png"`).
4.  **Handshake Reset**: Perform a **Hard Refresh (Ctrl+F5)** in your browser to localize the new asset.

---
**Protocol Status: Sharing Authorized**
