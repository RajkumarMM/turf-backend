import admin from "firebase-admin";
import { readFileSync } from "fs";

// Read the Firebase service account key file
const serviceAccount = JSON.parse(
  readFileSync(new URL("./config/turf-86bf0-firebase-adminsdk-fbsvc-12e02ed181.json", import.meta.url))
);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
