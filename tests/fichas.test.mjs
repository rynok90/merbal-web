import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { products } from '../src/lib/products.ts';

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

	for (const product of products) {
		assert.ok(product.problem.length > 20, `${product.name} missing problem`);
		assert.ok(product.audience.length > 10, `${product.name} missing audience`);
		assert.ok(product.howItWorks.length > 10, `${product.name} missing howItWorks`);
	}
});

test('field pages follow capacidad → para quién → CTA and are not a CCTV catalog', () => {
	const service = read('src/components/ServicePage.astro');
	const seguridad = read('src/pages/seguridad-electronica.astro');
	const red = read('src/pages/infraestructura-de-red.astro');

	assert.match(service, />Capacidad</);
	assert.match(service, />Para quién</);
	assert.match(service, /<CtaBand/);
	assert.match(seguridad, /capacity=/);
	assert.match(seguridad, /audience=/);
	assert.match(red, /capacity=/);
	assert.match(red, /audience=/);
	assert.doesNotMatch(seguridad + red + service, BRANDS);
	assert.doesNotMatch(seguridad + red, /Hikvision|Dahua|Axis/);
	assert.doesNotMatch(seguridad, /perímetro/);
	assert.match(seguridad, /Industrial, retail, hospital, educación, corporativo, hospitality/);
	assert.match(seguridad, /cualquier sitio que necesite seguridad electrónica/);
	assert.match(red, /Industrial, retail, hospital, educación, corporativo, hospitality/);
	assert.match(red, /cualquier operación que no se puede quedar sin red/);
	assert.match(red, /con o sin seguridad encima/);
	assert.match(red, /Sirve a datos, voz, seguridad o plataformas/);
	assert.doesNotMatch(seguridad + red, /Ã©|Ã¡/);
});
