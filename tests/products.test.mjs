import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	customSoftware,
	liveProductHref,
	productCtaLabel,
	products,
	SECUFLOW_CRM_URL,
	SECUFLOW_CTA_LABEL,
} from '../src/lib/products.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('product catalog ships five products with SecureFlow live and four coming soon', () => {
	assert.equal(SECUFLOW_CRM_URL, 'https://secureflow-landing.netlify.app');
	assert.doesNotMatch(SECUFLOW_CRM_URL, /secureflow-crm-production\.up\.railway\.app/);

	const names = products.map((product) => product.name);
	assert.deepEqual(names, [
		'SecureFlow CRM',
		'Access Paperless',
		'ANUVÉ',
		'HayStock',
		'RutaSegura',
	]);
	assert.equal(products.length, 5);

	const secureflow = products[0];
	assert.equal(secureflow.name, 'SecureFlow CRM');
	assert.match(secureflow.description, /seguridad e integración/i);
	assert.equal(secureflow.status, 'live');
	assert.equal(secureflow.href, SECUFLOW_CRM_URL);
	assert.equal(liveProductHref(secureflow), SECUFLOW_CRM_URL);
	assert.equal(productCtaLabel(secureflow), 'Conocer SecureFlow');
	assert.equal(SECUFLOW_CTA_LABEL, productCtaLabel(secureflow));

	const access = products[1];
	assert.equal(access.name, 'Access Paperless');
	assert.equal(
		access.description,
		'Control de visitantes y contratistas con pase QR. De la bitácora de papel al acceso digital.',
	);
	assert.match(access.description, /bitácora/);
	assert.equal(access.status, 'soon');
	assert.equal(access.href, null);
	assert.equal(liveProductHref(access), null);
	assert.equal(productCtaLabel(access), 'Conocer Access');

	const anuve = products[2];
	assert.equal(anuve.name, 'ANUVÉ');
	assert.equal(
		anuve.description,
		'Agenda, catálogo y overlay para nail bars. La clienta ve el diseño en su mano.',
	);
	assert.match(anuve.description, /diseño/);
	assert.equal(anuve.status, 'soon');
	assert.equal(anuve.href, null);
	assert.equal(liveProductHref(anuve), null);
	assert.equal(productCtaLabel(anuve), 'Conocer ANUVÉ');

	const haystock = products[3];
	assert.equal(haystock.name, 'HayStock');
	assert.match(haystock.description, /WhatsApp/);
	assert.match(haystock.description, /refaccionarias/);
	assert.equal(haystock.status, 'soon');
	assert.equal(haystock.href, null);
	assert.equal(liveProductHref(haystock), null);

	const rutasegura = products[4];
	assert.equal(rutasegura.name, 'RutaSegura');
	assert.match(rutasegura.description, /desarrollo/i);
	assert.equal(rutasegura.status, 'soon');
	assert.equal(rutasegura.href, null);
	assert.equal(liveProductHref(rutasegura), null);

	const live = products.filter((product) => product.status === 'live');
	const soon = products.filter((product) => product.status === 'soon');
	assert.deepEqual(
		live.map((product) => product.name),
		['SecureFlow CRM'],
	);
	assert.deepEqual(
		soon.map((product) => product.name),
		['Access Paperless', 'ANUVÉ', 'HayStock', 'RutaSegura'],
	);

	const catalog = readFileSync(join(root, 'src/lib/products.ts'), 'utf8');
	assert.doesNotMatch(catalog, /secureflow-crm-production\.up\.railway\.app/);
	assert.match(catalog, /ANUVÉ/);
	assert.match(catalog, /bitácora/);
	assert.match(catalog, /diseño/);
	assert.doesNotMatch(catalog, /Ã‰|Ã¡|Ã©/);
});

test('custom software is a first-class option in the shipped catalog', () => {
	assert.equal(customSoftware.name, 'Desarrollo de software a la medida');
	assert.match(customSoftware.description, /plataforma/i);
	assert.equal(customSoftware.href, '/contacto');
});
