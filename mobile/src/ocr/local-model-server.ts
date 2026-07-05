/**
 * Local Model Server
 *
 * Wraps @dr.pogodin/react-native-static-server to serve downloaded model
 * weight files from documentDirectory over a local HTTP server, with CORS.
 */
import StaticServer from '@dr.pogodin/react-native-static-server';

let server: StaticServer | null = null;
let serverUrl: string | null = null;

/**
 * Start a local HTTP server serving files from `modelPath`.
 * Uses port 0 to let the OS assign a free port.
 * Returns the local server base URL, e.g. "http://localhost:34521/"
 */
export async function startModelServer(modelPath: string): Promise<string> {
  // If already running, stop first
  if (server) {
    await stopModelServer();
  }

  // Strip the file:// prefix if present (expo-file-system uses it)
  let cleanPath = modelPath;
  if (cleanPath.startsWith('file://')) {
    cleanPath = cleanPath.replace('file://', '');
  }
  // Remove trailing slash for the server root
  if (cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }

  server = new StaticServer({
    fileDir: cleanPath,
    port: 0,   // OS assigns a free port
    // Enable CORS so the WebView can fetch files via extraConfig (lighttpd mod_setenv)
    extraConfig: `
      server.modules += ("mod_setenv")
      setenv.add-response-header = (
        "Access-Control-Allow-Origin" => "*",
        "Access-Control-Allow-Methods" => "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers" => "*"
      )
    `
  });

  const origin = await server.start();
  serverUrl = origin.endsWith('/') ? origin : origin + '/';

  console.log(`[LocalModelServer] Started at ${serverUrl}`);
  return serverUrl;
}

/**
 * Stop the running local server and clean up.
 */
export async function stopModelServer(): Promise<void> {
  if (server) {
    try {
      await server.stop();
    } catch (err) {
      console.warn('[LocalModelServer] Stop error:', err);
    }
    server = null;
    serverUrl = null;
  }
}

/**
 * Get the currently active server URL, or null.
 */
export function getServerUrl(): string | null {
  return serverUrl;
}
