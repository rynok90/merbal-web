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

test('header nav keeps Plataformas and Contacto and adds Integración', () => {
	assert.deepEqual(
		HEADER_NAV.map((link) => link.label),
		['Plataformas', 'Integración', 'Contacto'],
	);
	const labels = HEADER_NAV.flatMap((link) => [link.label, ...(link.children ?? []).map((child) => child.label)]);
	assert.equal(labels.some((label) => /campo/i.test(label)), false);
	assert.equal(labels.includes('Inicio'), false);
	assert.equal(labels.includes('Software'), false);
	assert.equal(labels.includes('Nosotros'), false);

	const plataformas = HEADER_NAV.find((link) => link.label === 'Plataformas');
	assert.ok(plataformas?.children);
	assert.equal(plataformas.href, '/plataformas');
	assert.deepEqual(
		plataformas.children.map((child) => [child.label, child.href]),
		[
			['Operación de sitios', '/plataformas/operacion-de-sitios'],
			['Negocios de servicio', '/plataformas/negocios-de-servicio'],
		],
	);

	const integracion = HEADER_NAV.find((link) => link.label === 'Integración');
	assert.ok(integracion?.children);
	assert.deepEqual(
		integracion.children.map((child) => [child.label, child.href]),
		[
			['Seguridad electrónica', '/seguridad-electronica'],
			['Infraestructura de red', '/infraestructura-de-red'],
		],
	);
	assert.equal(labels.includes('Seguridad electrónica'), true);
	assert.equal(labels.includes('Infraestructura de red'), true);
	assert.equal(HEADER_NAV.some((link) => link.label === 'Contacto'), true);
	assert.equal(HEADER_NAV.find((link) => link.label === 'Contacto')?.href, '/contacto');
	assert.equal(CONTACT_PATH, '/contacto');
	assert.equal(HEADER_CTA_LABEL, 'Solicitar asesoría');

	const header = read('src/components/Header.astro');
	assert.match(header, /HEADER_NAV/);
	assert.match(header, /aria-label="Principal"/);
	assert.match(header, /aria-label="Móvil"/);
	assert.match(header, /nav-dropdown/);
	assert.match(header, /link\.children/);
	assert.match(header, /href=\{CONTACT_PATH\}/);
	assert.match(header, /nav-link-integration/);
	assert.doesNotMatch(header, />Inicio</);
	assert.doesNotMatch(header, />Software</);
	assert.doesNotMatch(header, />Nosotros</);
	assert.doesNotMatch(header, />Campo</);
});

test('footer keeps Nosotros and drops campo links', () => {
	assert.deepEqual(
		FOOTER_LINKS.map((link) => [link.label, link.href]),
		[
			['Plataformas', '/plataformas'],
			['Nosotros', '/nosotros'],
			['Contacto', '/contacto'],
		],
	);
	const footerHrefs = FOOTER_LINKS.map((link) => link.href);
	assert.equal(footerHrefs.includes('/seguridad-electronica'), false);
	assert.equal(footerHrefs.includes('/infraestructura-de-red'), false);
	const footer = read('src/components/Footer.astro');
	const nav = read('src/lib/nav.ts');
	const footerBlock = nav.slice(nav.indexOf('FOOTER_LINKS'));
	assert.match(footer, /FOOTER_LINKS/);
	assert.match(footerBlock, /href: '\/nosotros'/);
	assert.doesNotMatch(footerBlock, /\/seguridad-electronica/);
	assert.doesNotMatch(footerBlock, /\/infraestructura-de-red/);
	assert.doesNotMatch(footerBlock, /Campo/);
});

test('ROUTES include plataformas verticals and not campo or /software', () => {
	assert.equal(ROUTES.includes('/plataformas'), true);
	assert.equal(ROUTES.includes('/plataformas/operacion-de-sitios'), true);
	assert.equal(ROUTES.includes('/plataformas/negocios-de-servicio'), true);
	assert.equal(ROUTES.includes('/software'), false);
	assert.equal(ROUTES.includes('/nosotros'), true);
	assert.equal(ROUTES.includes('/seguridad-electronica'), false);
	assert.equal(ROUTES.includes('/infraestructura-de-red'), false);
});

test('isActivePath matches current route without treating home as a prefix', () => {
	assert.equal(isActivePath('/', '/'), true);
	assert.equal(isActivePath('/plataformas', '/'), false);
	assert.equal(isActivePath('/plataformas', '/plataformas'), true);
	assert.equal(isActivePath('/plataformas/operacion-de-sitios', '/plataformas'), true);
	assert.equal(isActivePath('/nosotros', '/plataformas'), false);
	assert.equal(isActivePath('/contacto', '/contacto'), true);
});
