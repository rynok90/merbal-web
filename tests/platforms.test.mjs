import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
	customSoftware,
	productCtaLabel,
	SECUFLOW_CRM_URL,
	SERVICE_VERTICAL,
	SITE_OPS_VERTICAL,
	serviceBusinessProducts,
	siteOpsProducts,
} from '../src/lib/products.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

test('plataformas hub is two verticals, customSoftware only at the foot, no mixed grid', () => {
	const hub = read('src/pages/plataformas/index.astro');
	const platforms = read('src/components/Platforms.astro');
	const tree = hub + platforms;

	assert.match(hub, /<Platforms/);
	assert.match(platforms, /Operación de sitios/);
	assert.match(platforms, /Negocios de servicio/);
	assert.match(platforms, /href=\{vertical\.href\}/);
	assert.equal(SITE_OPS_VERTICAL.href, '/plataformas/operacion-de-sitios');
	assert.equal(SERVICE_VERTICAL.href, '/plataformas/negocios-de-servicio');
	assert.match(platforms, /customSoftware/);
	assert.match(platforms, /href=\{customSoftware\.href\}/);
	assert.equal(customSoftware.href, '/contacto');
	assert.doesNotMatch(tree, /HayStock/);
	assert.doesNotMatch(tree, /RutaSegura/);
	assert.doesNotMatch(tree, /SecureFlow CRM/);
	assert.doesNotMatch(tree, /Access Paperless/);
	assert.doesNotMatch(tree, /ActivoObra/);
	assert.doesNotMatch(tree, /ANUVÉ/);
});

test('operacion-de-sitios lists SecureFlow, Access Paperless and ActivoObra, never ANUVÉ', () => {
	const page = read('src/pages/plataformas/operacion-de-sitios.astro');
	const ficha = read('src/components/ProductFicha.astro');
	const tree = page + ficha;

	assert.match(page, /siteOpsProducts/);
	assert.doesNotMatch(page, /serviceBusinessProducts/);
	assert.match(tree, /Problema/);
	assert.match(tree, /Para quién/);
	assert.match(tree, /Cómo opera/);
	assert.match(ficha, /productCtaLabel/);
	assert.match(ficha, /target="_blank"/);

	const names = siteOpsProducts.map((product) => product.name);
	assert.deepEqual(names, ['SecureFlow CRM', 'Access Paperless', 'ActivoObra']);
	assert.equal(productCtaLabel(siteOpsProducts[0]), 'Conocer SecureFlow');
	assert.equal(siteOpsProducts[0].href, SECUFLOW_CRM_URL);
	assert.doesNotMatch(page, /ANUVÉ/);
	assert.doesNotMatch(page, /HayStock/);
	assert.doesNotMatch(page, /RutaSegura/);
	assert.doesNotMatch(page, /cerradura/i);
});

test('negocios-de-servicio lists ANUVÉ and never site-ops products', () => {
	const page = read('src/pages/plataformas/negocios-de-servicio.astro');

	assert.match(page, /serviceBusinessProducts/);
	assert.doesNotMatch(page, /siteOpsProducts/);
	assert.equal(serviceBusinessProducts[0].name, 'ANUVÉ');
	assert.match(page, /ANUVÉ|serviceBusinessProducts/);
	assert.doesNotMatch(page, /SecureFlow/);
	assert.doesNotMatch(page, /Access Paperless/);
	assert.doesNotMatch(page, /ActivoObra/);
	assert.doesNotMatch(page, /HayStock/);
	assert.doesNotMatch(page, /RutaSegura/);
});

test('/software 301 redirects to /plataformas', () => {
	const redirects = read('public/_redirects');
	assert.match(redirects, /\/software\s+\/plataformas\s+301/);
});
