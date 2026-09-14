import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
	composeResendEmail,
	CONTACT_FUNCTION_PATH,
	createRateLimiter,
	handleContactRequest,
	parseContactPayload,
} from '../src/lib/contact.ts';
import { CONTACT_EMAIL } from '../src/lib/mailto.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

function post(body, env = {}) {
	return handleContactRequest(
		new Request('https://merbal.lat/.netlify/functions/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.10' },
			body: typeof body === 'string' ? body : JSON.stringify(body),
		}),
		{ rateLimiter: createRateLimiter(20, 60_000), ...env },
	);
}

const sample = {
	nombre: 'Ana Pérez',
	email: 'ana@empresa.mx',
	empresa: 'Acme',
	mensaje: 'Necesito un diagnóstico',
	division: 'Plataformas',
	vertical: 'Negocios de servicio',
};

test('CONTACT_EMAIL is soporte@merbal.lat', () => {
	assert.equal(CONTACT_EMAIL, 'soporte@merbal.lat');
});

test('contact form posts JSON to the function and has division, vertical and honeypot', () => {
	const contact = read('src/components/Contact.astro');
	const config = read('src/lib/contact-config.ts');
	assert.equal(CONTACT_FUNCTION_PATH, '/.netlify/functions/contact');
	assert.match(contact, /CONTACT_FUNCTION_PATH/);
	assert.match(contact, /method="post"/);
	assert.doesNotMatch(contact, /action=\{?`?mailto:/);
	assert.doesNotMatch(contact, /buildMailtoUrl/);
	assert.doesNotMatch(contact, /window\.location\.href/);
	assert.match(contact, /name="division"/);
	assert.match(contact, /name="vertical"/);
	assert.match(contact, /name="website"/);
	assert.match(contact, /DIVISIONS\.map/);
	assert.match(contact, /VERTICALS\.map/);
	assert.match(config, /Seguridad electrónica/);
	assert.match(config, /Infraestructura de red/);
	assert.match(config, /Plataformas/);
	assert.match(config, /Operación de sitios/);
	assert.match(config, /Negocios de servicio/);
	assert.match(contact, /Pide una demo o una asesoría/);
	assert.match(contact, /Inténtalo de nuevo/);
	assert.doesNotMatch(contact, /WhatsApp/i);
});

test('handler returns 503 JSON without RESEND_API_KEY, never Internal error', async () => {
	const res = await post(sample, { getApiKey: () => undefined });
	assert.equal(res.status, 503);
	const body = await res.json();
	assert.equal(body.ok, false);
	assert.match(String(body.error), /Inténtalo de nuevo/);
	assert.doesNotMatch(JSON.stringify(body), /Internal error/);
	assert.notEqual(res.status, 500);
});

test('invalid body is 4xx not 500', async () => {
	const badJson = await post('{', { getApiKey: () => undefined });
	assert.equal(badJson.status, 400);
	assert.notEqual(badJson.status, 500);

	const missing = await post({ nombre: 'Ana' }, { getApiKey: () => undefined });
	assert.equal(missing.status, 400);
	const missingBody = await missing.json();
	assert.doesNotMatch(JSON.stringify(missingBody), /Internal error/);

	const parsed = parseContactPayload({
		nombre: 'Ana',
		email: 'not-an-email',
		mensaje: 'Hola',
		division: 'Seguridad electrónica',
	});
	assert.equal(parsed.ok, false);
	if (!parsed.ok) assert.equal(parsed.status, 400);
});

test('rate limiter blocks a second immediate call', async () => {
	const limiter = createRateLimiter(1, 60_000);
	assert.equal(limiter.allow('ip-1'), true);
	assert.equal(limiter.allow('ip-1'), false);

	const tight = createRateLimiter(1, 60_000);
	const first = await post(sample, { getApiKey: () => 'test-key', rateLimiter: tight, sendEmail: async () => ({ ok: true }) });
	assert.equal(first.status, 200);
	const second = await post(sample, { getApiKey: () => 'test-key', rateLimiter: tight, sendEmail: async () => ({ ok: true }) });
	assert.equal(second.status, 429);
	const body = await second.json();
	assert.doesNotMatch(JSON.stringify(body), /Internal error/);
});

test('composeResendEmail uses Avisos MERBAL from, soporte to, visitor reply-to and MERBAL subject', () => {
	const parsed = parseContactPayload(sample);
	assert.equal(parsed.ok, true);
	if (!parsed.ok) return;
	const email = composeResendEmail(parsed.value);
	assert.equal(email.from, 'Avisos MERBAL <avisos@avisos.merbal.lat>');
	assert.equal(email.to, 'soporte@merbal.lat');
	assert.equal(email.reply_to, 'ana@empresa.mx');
	assert.equal(email.subject, '[MERBAL] Plataformas — Ana Pérez · Acme');
});

test('function file exists and contact/footer sources have no WhatsApp or Resend secrets', () => {
	const fn = read('netlify/functions/contact.mts');
	assert.match(fn, /handleContactRequest/);
	const footer = read('src/components/Footer.astro');
	const contact = read('src/components/Contact.astro');
	const helper = read('src/lib/contact.ts');
	assert.doesNotMatch(fn + footer + contact + helper, /WhatsApp/i);
	assert.doesNotMatch(fn + helper, /re_[A-Za-z0-9]{10,}/);
	assert.doesNotMatch(helper, /RESEND_API_KEY\s*=\s*['"][^'"]+['"]/);

	function walk(dir, acc = []) {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
			const path = join(dir, entry.name);
			if (entry.isDirectory()) walk(path, acc);
			else if (/\.(ts|mts|mjs|js|astro|html|toml)$/.test(entry.name)) acc.push(path);
		}
		return acc;
	}

	for (const dir of ['src', 'netlify', 'public']) {
		for (const file of walk(join(root, dir))) {
			const text = readFileSync(file, 'utf8');
			assert.doesNotMatch(text, /re_[A-Za-z0-9]{20,}/, `possible Resend secret in ${file}`);
		}
	}
});
