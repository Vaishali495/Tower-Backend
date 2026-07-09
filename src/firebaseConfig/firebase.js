import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read service account safely

const serviceAccountPath = path.join(__dirname, "/etc/secrets/serviceFile.json");
// const serviceAccountPath = path.join(__dirname, "./serviceFile.json");

// Initialize Firebase Admin SDK safely
if (!admin.apps.length) {
admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
});
}

// Export bucket or db
export const messaging = admin.messaging();