import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { CONTACT_PATH, HEADER_CTA_LABEL, HEADER_NAV } from '../src/lib/nav.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

const BRANDS = /Hikvision|Dahua|Axis|Bosch|Hanwha|Uniview|Honeywell|Cisco|Ubiquiti|Fortinet|NVR|DVR/i;

const pages = {
	'/seguridad-electronica': {
		file: 'src/pages/seguridad-electronica.astro',
		title: 'Seguridad electrónica',
		sub: 'Video inteligente, control de acceso y detección como sistema, no como catálogo de equipos.',
		intro:
			'Diseñamos la capa de seguridad del sitio como sistema: video inteligente, control de acceso, detección, audio IP y detección de incendio. No partimos de marcas.',
		layers: [
			'Video inteligente / analíticos',
			'Control de acceso',
			'Detección',
			'Audio IP',
			'Detección de incendio',
		],
		audience:
			'planta, retail, hospital, educación, corporativo, hospitality y cualquier sitio que necesite control real.',
		method:
			'diagnóstico con cifra → arquitectura por capas → implementación con criterio de continuidad → acompañamiento',
	},
	'/infraestructura-de-red': {
		file: 'src/pages/infraestructura-de-red.astro',
		title: 'Infraestructura de red',
		sub: 'La red que sostiene la operación: WiFi, fibra, cableado estructurado, equipo activo y continuidad.',
		intro:
			'Si cae el enlace, cae la operación. Diseñamos la red para disponibilidad, no para el catálogo del proveedor.',
		layers: [
			'WiFi empresarial',
			'Fibra / backbone',
			'Cableado estructurado (UTP)',
			'Equipo activo',
			'UPS / continuidad',
		],
		audience:
			'industrial, retail, hospital, educación, corporativo y cualquier operación que no se puede quedar sin red.',
		method: 'diagnóstico → diseño → implementación → acompañamiento',
	},
};

test('integración routes are pages, not redirects to mantenimiento', () => {
	const redirects = read('public/_redirects');
	assert.match(redirects, /\/mantenimiento\s+\/mantenimiento\.html/);
	assert.match(redirects, /\/software\s+\/plataformas\s+301/);
	assert.doesNotMatch(redirects, /\/seguridad-electronica\s+\/mantenimiento/);
	assert.doesNotMatch(redirects, /\/infraestructura-de-red\s+\/mantenimiento/);
	assert.doesNotMatch(read('netlify.toml'), /seguridad-electronica|infraestructura-de-red/);

	const integracion = HEADER_NAV.find((link) => link.label === 'Integración');
	assert.ok(integracion?.children);
	assert.deepEqual(
		integracion.children.map((child) => [child.label, child.href]),
		[
			['Seguridad electrónica', '/seguridad-electronica'],
			['Infraestructura de red', '/infraestructura-de-red'],
		],
	);
});

test('both integración pages ship the specified copy and the contact CTA', () => {
	const shell = read('src/components/IntegracionPage.astro');
	const cta = read('src/components/CtaBand.astro');
	assert.match(shell, /<CtaBand/);
	assert.match(shell, /layers\.map/);
	assert.match(shell, /badge-integration/);
	assert.match(shell, /max-w-6xl/);
	assert.doesNotMatch(shell, /<table/);
	assert.match(cta, /Solicitar asesoría/);
	assert.match(cta, /href=\{CONTACT_PATH\}/);
	assert.equal(HEADER_CTA_LABEL, 'Solicitar asesoría');
	assert.equal(CONTACT_PATH, '/contacto');

	for (const [href, page] of Object.entries(pages)) {
		const source = read(page.file);
		assert.match(source, /IntegracionPage/);
		assert.match(source, /layouts\/Layout\.astro/);
		assert.ok(source.includes(page.title), `${href} title`);
		assert.ok(source.includes(page.sub), `${href} sub`);
		assert.ok(source.includes(page.intro), `${href} intro`);
		assert.ok(source.includes(page.audience), `${href} audience`);
		assert.ok(source.includes(page.method), `${href} method`);
		for (const layer of page.layers) assert.ok(source.includes(layer), `${href} missing ${layer}`);
		assert.equal(page.layers.length, 5);
		assert.doesNotMatch(source, /CCTV/i);
		assert.doesNotMatch(source, BRANDS);
		assert.doesNotMatch(shell, /CCTV/i);
	}
});
