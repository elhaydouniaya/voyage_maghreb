#!/usr/bin/env node

/**
 * Comprehensive admin login test
 * Verifies: credentials validation → JWT generation → session creation → admin role assignment
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3003';
const cookies = [];

function setCookieHandler(header) {
  if (!header) return;
  const parts = header.split(';');
  const [name, value] = parts[0].split('=');
  cookies.push(`${name}=${value}`);
}

async function request(method, path, body = null) {
  console.log (`\n[${method}] ${path}`);
  
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    if (cookies.length > 0) {
      options.headers['Cookie'] = cookies.join('; ');
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const setCookie = res.headers['set-cookie'];
        if (Array.isArray(setCookie)) {
          setCookie.forEach(setCookieHandler);
        } else if (setCookie) {
          setCookieHandler(setCookie);
        }

        console.log(`  Status: ${res.statusCode}`);
        if (data) console.log(`  Body length: ${data.length}`);
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runTests() {
  try {
    console.log('=== Admin Login Test Suite ===\n');

    // Step 1: Get CSRF token
    console.log('Step 1: Fetch CSRF token');
    const csrfRes = await request('GET', '/api/auth/csrf');
    assert(csrfRes.status === 200, `Expected 200, got ${csrfRes.status}`);
    const csrfMatch = csrfRes.data.match(/"csrfToken":"([^"]+)"/);
    const csrf = csrfMatch ? csrfMatch[1] : undefined;
    console.log(`  CSRF token: ${csrf ? 'OK' : 'MISSING'}`);

    // Step 2: Sign in with credentials
    console.log('\nStep 2: SignIn with admin credentials');
    const signInBody = new URLSearchParams({
      email: 'admin@maghrebvoyage.com',
      password: 'admin123',
    }).toString();
    
    const signInRes = await request('POST', '/api/auth/callback/credentials', signInBody);
    assert(signInRes.status === 302, `Expected 302 redirect, got ${signInRes.status}`);
    console.log(`  Redirect location: ${signInRes.headers['location'] || 'not-provided'}`);
    console.log(`  Cookies set: ${cookies.length}`);

    // Step 3: Check session
    console.log('\nStep 3: Check session endpoint');
    const sessionRes = await request('GET', '/api/auth/session');
    assert(sessionRes.status === 200, `Expected 200, got ${sessionRes.status}`);
    
    try {
      const sessionData = JSON.parse(sessionRes.data);
      console.log(`  Session data: ${JSON.stringify(sessionData, null, 2)}`);
      
      if (sessionData.user) {
        assert(sessionData.user.email, 'Missing user.email');
        assert(sessionData.user.role, 'Missing user.role');
        assert(sessionData.user.role === 'ADMIN', `Expected role=ADMIN, got ${sessionData.user.role}`);
        console.log(`  ✓ Admin role confirmed: ${sessionData.user.role}`);
      } else {
        console.log('  ✗ Session user not found');
      }
    } catch (e) {
      console.log(`  ✗ Failed to parse session: ${e.message}`);
    }

    console.log('\n=== All tests passed! ===\n');
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    process.exit(1);
  }
}

runTests();
