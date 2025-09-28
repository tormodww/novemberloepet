import Parse from 'parse';

// Prefer Vite env variables (VITE_), fall back to REACT_APP_ for compatibility
const appId = (import.meta as any).env?.VITE_PARSE_APP_ID || process.env.REACT_APP_PARSE_APP_ID || (import.meta as any).env?.REACT_APP_PARSE_APP_ID;
const jsKey = (import.meta as any).env?.VITE_PARSE_JS_KEY || process.env.REACT_APP_PARSE_JS_KEY || (import.meta as any).env?.REACT_APP_PARSE_JS_KEY;
const serverURL = (import.meta as any).env?.VITE_PARSE_SERVER_URL || process.env.REACT_APP_PARSE_SERVER_URL || (import.meta as any).env?.REACT_APP_PARSE_SERVER_URL;

if (appId && jsKey && serverURL) {
  Parse.initialize(appId, jsKey);
  Parse.serverURL = serverURL;
} else {
  // If not configured, we still export Parse but operations will likely fail — contexts should fallback
  // eslint-disable-next-line no-console
  console.warn('Parse env vars not set. Back4App persistence disabled.');
}

export default Parse;