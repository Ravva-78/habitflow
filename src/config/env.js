// src/config/env.js
const ENV = {
  dev: {
    API_URL: 'http://192.168.1.100:3000', // change to your local IP for dev
  },
  production: {
    API_URL: 'https://habitflow-production-0efc.up.railway.app', // ✅ https:// added
  },
};

const IS_PRODUCTION = true;

export const API_URL = IS_PRODUCTION ? ENV.production.API_URL : ENV.dev.API_URL;
export const COACH_ENDPOINT = `${API_URL}/api/coach`;
