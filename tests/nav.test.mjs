import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
	CONTACT_PATH,
	FOOTER_LINKS,
	HEADER_CTA_LABEL,
	HEADER_NAV,
	isActivePath,
	ROUTES,
} from '../src/lib/nav.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

test('header nav is four items with Plataformas expanding to two verticals', () => {
	assert.deepEqual(
		HEADER_NAV.map((link) => link.label),
		['Seguridad electrónica', 'Infraestructura de red', 'Plataformas', 'Contacto'],
	);
	assert.deepEqual(
		HEADER_NAV.map((link) => link.href),
		['/seguridad-electronica', '/infraestructura-de-red', '/plataformas', '/contacto'],
	);
	const plataformas = HEADER_NAV.find((link) => link.label === 'Plataformas');
	assert.ok(plataformas?.children);
	assert.deepEqual(
		plataformas.children.map((child) => [child.label, child.href]),
		[
			['Operación de sitios', '/plataformas/operacion-de-sitios'],
			['Negocios de servicio', '/plataformas/negocios-de-servicio'],
		],
	);

	const labels = HEADER_NAV.map((link) => link.label);
	assert.equal(labels.includes('Inicio'), false);
	assert.equal(labels.includes('Software'), false);
	assert.equal(labels.includes('Nosotros'), false);
	assert.equal(CONTACT_PATH, '/contacto');
	assert.equal(HEADER_CTA_LABEL, 'Solicitar asesoría');

	const header = read('src/components/Header.astro');
	assert.match(header, /HEADER_NAV/);
	assert.match(header, /aria-label="Principal"/);
	assert.match(header, /aria-label="Móvil"/);
	assert.match(header, /nav-dropdown/);
	assert.match(header, /link\.children/);
	assert.match(header, /href=\{CONTACT_PATH\}/);
	assert.doesNotMatch(header, />Inicio</);
	assert.doesNotMatch(header, />Software</);
	assert.doesNotMatch(header, />Nosotros</);
});

test('footer keeps Nosotros and header CTA points to contacto', () => {
	const footerHrefs = FOOTER_LINKS.map((link) => link.href);
	assert.equal(footerHrefs.includes('/nosotros'), true);
	assert.equal(
		FOOTER_LINKS.some((link) => link.label === 'Nosotros'),
		true,
	);
	const footer = read('src/components/Footer.astro');
	const nav = read('src/lib/nav.ts');
	assert.match(footer, /FOOTER_LINKS/);
	assert.match(nav, /href: '\/nosotros'/);
});

test('ROUTES include plataformas verticals and not /software', () => {
	assert.equal(ROUTES.includes('/plataformas'), true);
	assert.equal(ROUTES.includes('/plataformas/operacion-de-sitios'), true);
	assert.equal(ROUTES.includes('/plataformas/negocios-de-servicio'), true);
	assert.equal(ROUTES.includes('/software'), false);
	assert.equal(ROUTES.includes('/nosotros'), true);
});

test('isActivePath matches current route without treating home as a prefix', () => {
	assert.equal(isActivePath('/', '/'), true);
	assert.equal(isActivePath('/plataformas', '/'), false);
	assert.equal(isActivePath('/plataformas', '/plataformas'), true);
	assert.equal(isActivePath('/plataformas/operacion-de-sitios', '/plataformas'), true);
	assert.equal(isActivePath('/nosotros', '/plataformas'), false);
	assert.equal(isActivePath('/seguridad-electronica', '/seguridad-electronica'), true);
});
