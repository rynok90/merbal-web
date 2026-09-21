import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
	liveProductHref,
	productCtaLabel,
	products,
} from '../src/lib/products.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

const BRANDS = /Hikvision|Dahua|Axis|Bosch|Hanwha|Uniview|Honeywell|catálogo de marcas/i;

test('product fichas ship problema, para quién, cómo opera and a live CTA helper', () => {
	const ficha = read('src/components/ProductFicha.astro');
	assert.match(ficha, /Problema/);
	assert.match(ficha, /Para quién/);
	assert.match(ficha, /Cómo opera/);
	assert.match(ficha, /product\.problem/);
	assert.match(ficha, /product\.audience/);
	assert.match(ficha, /product\.howItWorks/);
	assert.match(ficha, /liveProductHref/);
	assert.match(ficha, /productCtaLabel/);
	assert.match(ficha, /product\.status === 'soon'/);
	assert.match(ficha, /Próximamente/);
	assert.match(ficha, /En operación/);
	assert.doesNotMatch(ficha, /Access Paperless/);

	const access = products.find((product) => product.name === 'Access Paperless');
	assert.ok(access);
	assert.equal(access.status, 'live');
	assert.equal(liveProductHref(access), 'https://access.merbal.lat/');
	assert.equal(productCtaLabel(access), 'Conocer Access');
	assert.doesNotMatch(liveProductHref(access) ?? '', /netlify/i);

	for (const product of products) {
		assert.ok(product.problem.length > 20, `${product.name} missing problem`);
		assert.ok(product.audience.length > 10, `${product.name} missing audience`);
		assert.ok(product.howItWorks.length > 10, `${product.name} missing howItWorks`);
	}
});

test('campo landings are gone; product fichas are not a CCTV catalog', () => {
	assert.equal(existsSync(join(root, 'src/pages/seguridad-electronica.astro')), false);
	assert.equal(existsSync(join(root, 'src/pages/infraestructura-de-red.astro')), false);
	const ficha = read('src/components/ProductFicha.astro');
	assert.doesNotMatch(ficha, BRANDS);
	assert.doesNotMatch(ficha, /Hikvision|Dahua|Axis/);
});
