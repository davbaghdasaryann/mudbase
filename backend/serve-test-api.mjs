#!/usr/bin/env node

/**
 * HTTP server to serve test-api.html with API proxy
 * This fixes CORS issues by:
 * 1. Serving the HTML from a proper HTTP origin (not file://)
 * 2. Proxying API requests through this server so they appear to come from localhost:3000
 *
 * Usage: node serve-test-api.mjs
 *
 * Note: If port 3000 is busy, the server will try 3001.
 *       Make sure your backend is running on port 7787.
 */

import http from 'http';
import {URL} from 'url';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PREFERRED_PORT = 3000;
const FALLBACK_PORT = 3001;
const TEST_API_FILE = path.join(__dirname, 'test-api.html');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:7787';

let testApiContent = null;
let server = null;

function loadHtml() {
    try {
        testApiContent = fs.readFileSync(TEST_API_FILE, 'utf8');
        return true;
    } catch (err) {
        console.error('❌ Error loading test-api.html:', err.message);
        return false;
    }
}

// Proxy API requests to backend with correct origin headers
function proxyRequest(req, res) {
    try {
        const targetUrl = new URL(req.url || '/', `http://${req.headers.host}`);
        const backendPath = targetUrl.pathname + targetUrl.search;
        const backendUrl = new URL(backendPath, BACKEND_URL);

        const options = {
            method: req.method,
            headers: {
                Cookie: req.headers.cookie || '',
                // Set origin to what backend expects (localhost:3000)
                Origin: 'http://localhost:3000',
                Referer: `http://localhost:${server.address()?.port || PREFERRED_PORT}/`,
                'User-Agent': req.headers['user-agent'] || 'test-api-server',
            },
        };

        // Forward important headers - Content-Type only for requests with body
        if (req.headers['content-type']) {
            options.headers['Content-Type'] = req.headers['content-type'];
        }

        // Always forward Accept header (important for images, JSON, etc.)
        if (req.headers['accept']) {
            options.headers['Accept'] = req.headers['accept'];
        } else if (backendPath.startsWith('/api/static/')) {
            // For static files, default to accepting images and all types
            options.headers['Accept'] = '*/*';
        }

        // Forward authorization if present
        if (req.headers['authorization']) {
            options.headers['Authorization'] = req.headers['authorization'];
        }

        // Forward other headers that might be needed
        if (req.headers['if-none-match']) {
            options.headers['If-None-Match'] = req.headers['if-none-match'];
        }
        if (req.headers['if-modified-since']) {
            options.headers['If-Modified-Since'] = req.headers['if-modified-since'];
        }

        // Handle requests with potential body (POST, PUT, PATCH)
        const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
        let bodyChunks = [];
        let bodyCollected = false;

        const makeProxyRequest = (requestBody) => {
            // Set Content-Length if there's a body
            if (requestBody && requestBody.length > 0) {
                options.headers['Content-Length'] = requestBody.length.toString();
            } else {
                // Remove Content-Length if no body
                delete options.headers['Content-Length'];
            }

            const proxyReq = http.request(backendUrl, options, (proxyRes) => {
                try {
                    // Log static file requests for debugging
                    if (backendPath.startsWith('/api/static/')) {
                        console.log(
                            `[Proxy] Static file request: ${backendPath} -> Status: ${proxyRes.statusCode}`
                        );
                    }

                    // Collect response headers
                    const responseHeaders = {...proxyRes.headers};

                    // Override CORS headers to allow our origin
                    const clientOrigin =
                        req.headers.origin ||
                        `http://localhost:${server.address()?.port || PREFERRED_PORT}`;
                    responseHeaders['Access-Control-Allow-Origin'] = clientOrigin;
                    responseHeaders['Access-Control-Allow-Credentials'] = 'true';

                    // Forward Set-Cookie headers
                    if (proxyRes.headers['set-cookie']) {
                        responseHeaders['Set-Cookie'] = proxyRes.headers['set-cookie'];
                    }

                    // Remove Content-Length from headers if present - let the pipe handle it
                    // This is important for binary data like images
                    delete responseHeaders['content-length'];

                    // Set proper status code
                    const statusCode = proxyRes.statusCode || 200;

                    // If backend returns error for static files, log it
                    if (backendPath.startsWith('/api/static/') && statusCode >= 400) {
                        console.error(
                            `[Proxy] Backend returned ${statusCode} for static file: ${backendPath}`
                        );
                        console.error(`[Proxy] Response headers:`, responseHeaders);
                    }

                    res.writeHead(statusCode, responseHeaders);

                    // Pipe the response - this handles binary data correctly
                    proxyRes.pipe(res);
                } catch (err) {
                    console.error('Error processing proxy response:', err.message || err);
                    if (!res.headersSent) {
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.end(
                            JSON.stringify({
                                error: 'Error processing response',
                                message: err.message || String(err),
                            })
                        );
                    }
                }
            });

            proxyReq.on('error', (err) => {
                const errorMsg = err.message || err.code || String(err);
                console.error(`Proxy error [${req.method} ${req.url}]:`, errorMsg);
                console.error('  Backend URL:', backendUrl.toString());
                console.error('  Error code:', err.code);
                if (!res.headersSent) {
                    res.writeHead(502, {'Content-Type': 'application/json'});
                    res.end(
                        JSON.stringify({
                            error: 'Backend connection failed',
                            message: errorMsg,
                            code: err.code,
                            backendUrl: backendUrl.toString(),
                        })
                    );
                }
            });

            // Handle request timeout
            proxyReq.setTimeout(30000, () => {
                console.error(`Proxy timeout [${req.method} ${req.url}]`);
                proxyReq.destroy();
                if (!res.headersSent) {
                    res.writeHead(504, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({error: 'Backend request timeout'}));
                }
            });

            // Send request body if present
            if (requestBody && requestBody.length > 0) {
                proxyReq.write(requestBody);
            }
            proxyReq.end();
        };

        // For requests with body, collect it first
        if (hasBody) {
            req.on('data', (chunk) => {
                bodyChunks.push(chunk);
            });

            req.on('end', () => {
                if (bodyCollected) return;
                bodyCollected = true;
                const requestBody = Buffer.concat(bodyChunks);
                makeProxyRequest(requestBody);
            });

            req.on('error', (err) => {
                console.error('Request error:', err.message || err);
                if (!res.headersSent) {
                    res.writeHead(400, {'Content-Type': 'application/json'});
                    res.end(
                        JSON.stringify({
                            error: 'Request error',
                            message: err.message || String(err),
                        })
                    );
                }
            });
        } else {
            // For GET/HEAD/DELETE/etc, make request immediately
            makeProxyRequest(null);
        }
    } catch (err) {
        console.error('Proxy setup error:', err.message || err);
        console.error('  Request URL:', req.url);
        if (!res.headersSent) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(
                JSON.stringify({error: 'Proxy setup failed', message: err.message || String(err)})
            );
        }
    }
}

// Handle CORS preflight requests
function handleOptions(req, res) {
    const clientOrigin =
        req.headers.origin || `http://localhost:${server.address()?.port || PREFERRED_PORT}`;
    res.writeHead(200, {
        'Access-Control-Allow-Origin': clientOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers':
            req.headers['access-control-request-headers'] ||
            'Content-Type, Accept, Authorization, Cookie',
        'Access-Control-Max-Age': '86400',
    });
    res.end();
}

function createServer() {
    server = http.createServer((req, res) => {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            handleOptions(req, res);
            return;
        }

        const url = req.url || '/';

        // Root: simple info page (main app is Next.js in frontend/)
        if (url === '/' || url === '/index.html') {
            const infoHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>MudBase</title></head>
<body>
  <h1>MudBase</h1>
  <p>API proxy server. Use the <strong>Next.js app</strong> in <code>frontend/</code> for the main UI.</p>
  <p><a href="/test-api.html">Test API</a> – manual API testing</p>
</body></html>`;
            res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            res.end(infoHtml);
            return;
        }

        // Serve test-api.html for testing
        else if (url === '/test-api.html' || url === '/test') {
            if (!testApiContent) {
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end('Test API HTML file not loaded');
                return;
            }

            // Modify HTML to route API calls through this proxy
            const currentPort = server.address()?.port || PREFERRED_PORT;
            const proxyUrl = `http://localhost:${currentPort}`;

            // Update the default backend URL input value and placeholder
            let modifiedHtml = testApiContent
                .replace(/value="http:\/\/localhost:7787"/g, `value="${proxyUrl}"`)
                .replace(/placeholder="http:\/\/localhost:7787"/g, `placeholder="${proxyUrl}"`);

            // Inject script to auto-configure backend URL on page load
            const autoConfigScript = `<script>
// Auto-configure backend URL to use proxy server
(function() {
  function setBackendUrl() {
    try {
      const backendUrlInput = document.getElementById('backendUrl');
      if (backendUrlInput && backendUrlInput.value !== '${proxyUrl}') {
        backendUrlInput.value = '${proxyUrl}';
      }
    } catch (e) {
      console.error('Error setting backend URL:', e);
    }
  }
  
  setBackendUrl();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setBackendUrl);
  }
  setTimeout(setBackendUrl, 100);
})();
<\/script>`;

            // Insert the script before the closing </body> tag
            if (modifiedHtml.includes('</body>')) {
                modifiedHtml = modifiedHtml.replace('</body>', autoConfigScript + '\n  </body>');
            } else if (modifiedHtml.includes('    <script>')) {
                modifiedHtml = modifiedHtml.replace(
                    '    <script>',
                    '    ' + autoConfigScript + '\n    <script>'
                );
            } else if (modifiedHtml.includes('<script>')) {
                modifiedHtml = modifiedHtml.replace('<script>', autoConfigScript + '\n<script>');
            }

            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
            });
            res.end(modifiedHtml);
        }
        // Proxy API requests
        else if (url.startsWith('/api/')) {
            proxyRequest(req, res);
        } else {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Not Found');
        }
    });

    return server;
}

function startServer(port) {
    const srv = createServer();

    srv.listen(port, () => {
        const actualPort = srv.address()?.port || port;
        console.log('\n✅ MudBase API proxy server running');
        console.log(`   Root: http://localhost:${actualPort}/`);
        console.log(`   Test API: http://localhost:${actualPort}/test-api.html`);
        console.log(`   Backend: ${BACKEND_URL}`);
        console.log(`\n   Open http://localhost:${actualPort} in your browser`);
        console.log('\n   Press Ctrl+C to stop\n');

        if (actualPort !== PREFERRED_PORT) {
            console.log(`⚠️  Note: Using port ${actualPort} instead of ${PREFERRED_PORT}`);
            console.log(
                `   If you encounter CORS errors, stop the app on port ${PREFERRED_PORT} and restart.\n`
            );
        }
    });

    srv.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            if (port === PREFERRED_PORT) {
                console.log(`Port ${PREFERRED_PORT} is busy, trying ${FALLBACK_PORT}...`);
                startServer(FALLBACK_PORT);
            } else {
                console.error(`\n❌ Port ${port} is also in use`);
                console.error(`   Please free up port ${port} and try again\n`);
                process.exit(1);
            }
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
}

// Check if backend is reachable
async function checkBackend() {
    return new Promise((resolve) => {
        const testUrl = new URL('/api/auth/csrf', BACKEND_URL);
        const testReq = http.request(testUrl, {method: 'GET'}, (res) => {
            resolve(true);
            res.on('data', () => {});
            res.on('end', () => {});
        });

        testReq.setTimeout(2000, () => {
            testReq.destroy();
            resolve(false);
        });

        testReq.on('error', (err) => {
            resolve(false);
        });

        testReq.end();
    });
}

// Main
if (!loadHtml()) {
    process.exit(1);
}

// Check backend availability before starting
checkBackend().then((isAvailable) => {
    if (!isAvailable) {
        console.warn('\n⚠️  Warning: Backend server may not be reachable');
        console.warn(`   Expected at: ${BACKEND_URL}`);
        console.warn('   The server will start anyway, but API calls may fail.\n');
    } else {
        console.log(`✅ Backend is reachable at ${BACKEND_URL}\n`);
    }
    startServer(PREFERRED_PORT);
});
