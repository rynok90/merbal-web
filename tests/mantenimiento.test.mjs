import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { NAV_LINKS } from '../src/lib/nav.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

function configString(html, key) {
	const match = html.match(new RegExp(`${key}:\\s*"([^"]*)"`));
	assert.ok(match, `missing CONFIG.${key}`);
	return match[1];
}

test('maintenance CONFIG and document.title formula are MERBAL-branded', () => {
	assert.equal(existsSync(join(root, 'public/mantenimiento.html')), true);
	const html = read('public/mantenimiento.html');

	assert.equal(configString(html, 'brand'), 'MERBAL');
	assert.equal(configString(html, 'statusCode'), '503');
	assert.equal(configString(html, 'statusLabel'), 'En mantenimiento');
	assert.equal(configString(html, 'title'), 'Volvemos en un momento');
	assert.equal(
		configString(html, 'message'),
		'Estamos haciendo una mejora breve. Tu informacion sigue a salvo y el sitio se reanudara en cuanto terminemos.',
	);
	assert.equal(configString(html, 'retryLabel'), 'Reintentar conexion');
	assert.equal(configString(html, 'supportLabel'), 'Escribir a MERBAL');
	assert.equal(configString(html, 'supportHref'), 'mailto:soporte@merbal.lat');

	assert.match(html, /label:\s*"Servicios",\s*value:\s*"Pausados"/);
	assert.match(html, /label:\s*"Datos",\s*value:\s*"Protegidos"/);
	assert.match(html, /label:\s*"Restauracion",\s*value:\s*"En curso"/);

	assert.match(html, /document\.title = `\$\{CONFIG\.brand\} · \$\{CONFIG\.statusLabel\}`/);
	assert.equal(
		`${configString(html, 'brand')} · ${configString(html, 'statusLabel')}`,
		'MERBAL · En mantenimiento',
	);
});

test('/mantenimiento is reachable and is not nav or home', () => {
	const redirects = read('public/_redirects');
	assert.match(redirects, /\/mantenimiento\s+\/mantenimiento\.html/);
	assert.match(redirects, /\/seguridad-electronica\s+\/mantenimiento\s+302!/);
	assert.match(redirects, /\/infraestructura-de-red\s+\/mantenimiento\s+302!/);

	const hrefs = NAV_LINKS.map((link) => link.href);
	assert.equal(hrefs.includes('/mantenimiento'), false);

	const header = read('src/components/Header.astro');
	const nav = read('src/lib/nav.ts');
	assert.doesNotMatch(header, /\/mantenimiento/);
	assert.doesNotMatch(nav, /\/mantenimiento/);

	const home = read('src/pages/index.astro');
	const hero = read('src/components/Hero.astro');
	assert.match(home, /<Hero/);
	assert.match(hero, /Productos/);
	assert.match(hero, /que operan/);
	assert.doesNotMatch(hero, /Expertise en campo/);
	assert.doesNotMatch(home, /mantenimiento/i);
	assert.doesNotMatch(home, /Volvemos en un momento/);
});
