// src/config/env.js
// Switch between dev and production API

const ENV = {
  dev: {
    // Your local machine IP when testing on phone via USB/WiFi
    // Run: ipconfig (Windows) or ifconfig (Mac) to find your IP
    API_URL: 'http://192.168.1.100:3000', // ← change to YOUR local IP
  },
  production: {
    // After deploying server to Railway/Render, paste URL here
    API_URL: 'https://habitflow-api.railway.app', // ← change after deploy
  },
};

// Toggle this to switch between environments
const IS_PRODUCTION = false; // set to true before Play Store build

export const API_URL = IS_PRODUCTION ? ENV.production.API_URL : ENV.dev.API_URL;
export const COACH_ENDPOINT = `${API_URL}/api/coach`;
