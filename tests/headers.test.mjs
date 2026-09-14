import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

test('public/_headers ships the MERBAL security header set for /*', () => {
	const path = join(root, 'public/_headers');
	assert.equal(existsSync(path), true, 'missing public/_headers');
	const headers = read('public/_headers');

	assert.match(headers, /^\/\*/m);
	assert.match(headers, /X-Frame-Options:\s*DENY/);
	assert.match(headers, /X-Content-Type-Options:\s*nosniff/);
	assert.match(headers, /Referrer-Policy:\s*strict-origin-when-cross-origin/);
	assert.match(
		headers,
		/Permissions-Policy:\s*camera=\(\),\s*microphone=\(\),\s*geolocation=\(\),\s*payment=\(\)/,
	);
	assert.match(headers, /Strict-Transport-Security:\s*max-age=31536000;\s*includeSubDomains/);
	assert.match(headers, /Content-Security-Policy:/);
	assert.match(headers, /default-src 'self'/);
	assert.match(headers, /script-src 'self' 'unsafe-inline'/);
	assert.match(headers, /style-src 'self' 'unsafe-inline' https:\/\/fonts\.googleapis\.com/);
	assert.match(headers, /font-src 'self' https:\/\/fonts\.gstatic\.com/);
	assert.match(headers, /img-src 'self' data:/);
	assert.match(headers, /connect-src 'self'/);
	assert.match(headers, /frame-ancestors 'none'/);
	assert.match(headers, /base-uri 'self'/);
	assert.match(headers, /form-action 'self'/);
});

test('headers live only in public/_headers; redirects keep /mantenimiento', () => {
	const toml = read('netlify.toml');
	assert.doesNotMatch(toml, /\[\[headers\]\]/);
	const redirects = read('public/_redirects');
	assert.match(redirects, /\/mantenimiento\s+\/mantenimiento\.html/);
	assert.match(redirects, /\/software\s+\/plataformas\s+301/);
});

test('CSP script-src allows only the Astro inline-module exception', () => {
	const headers = read('public/_headers');
	const csp = headers.split('\n').find((line) => line.includes('Content-Security-Policy:'));
	assert.ok(csp, 'missing CSP line');
	assert.match(csp, /script-src 'self' 'unsafe-inline'/);
	assert.doesNotMatch(csp, /unsafe-eval/);
	assert.doesNotMatch(csp, /cdn\.jsdelivr|unpkg|googleapis\.com\/ajax/);
});
