// After Render deploys, replace PROD_URL with the actual service URL.
// Find it in: Render dashboard → habitflow-backend service → top of page.
// Format is: https://habitflow-backend.onrender.com  (no trailing slash)

const IS_PRODUCTION = true;

const DEV_URL  = 'http://10.0.2.2:3000';
const PROD_URL = 'https://REPLACE_WITH_RENDER_URL_AFTER_DEPLOY.onrender.com';

export const API_BASE_URL = IS_PRODUCTION ? PROD_URL : DEV_URL;
