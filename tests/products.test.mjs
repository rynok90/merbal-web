import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	customSoftware,
	liveProductHref,
	products,
	SECUFLOW_CRM_URL,
	SECUFLOW_CTA_LABEL,
} from '../src/lib/products.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('product catalog ships SecureFlow live and HayStock/RutaSegura as coming soon', () => {
	assert.equal(SECUFLOW_CRM_URL, 'https://secureflow-landing.netlify.app');
	assert.equal(SECUFLOW_CTA_LABEL, 'Conocer SecureFlow');
	assert.doesNotMatch(SECUFLOW_CRM_URL, /secureflow-crm-production\.up\.railway\.app/);

	const names = products.map((product) => product.name);
	assert.deepEqual(names, ['SecureFlow CRM', 'HayStock', 'RutaSegura']);

	const secureflow = products.find((product) => product.name === 'SecureFlow CRM');
	assert.ok(secureflow);
	assert.match(secureflow.description, /seguridad e integración/i);
	assert.equal(secureflow.status, 'live');
	assert.equal(secureflow.href, SECUFLOW_CRM_URL);
	assert.equal(liveProductHref(secureflow), SECUFLOW_CRM_URL);

	const haystock = products.find((product) => product.name === 'HayStock');
	assert.ok(haystock);
	assert.match(haystock.description, /WhatsApp/);
	assert.match(haystock.description, /refaccionarias/);
	assert.equal(haystock.status, 'soon');
	assert.equal(haystock.href, null);
	assert.equal(liveProductHref(haystock), null);

	const rutasegura = products.find((product) => product.name === 'RutaSegura');
	assert.ok(rutasegura);
	assert.match(rutasegura.description, /desarrollo/i);
	assert.equal(rutasegura.status, 'soon');
	assert.equal(rutasegura.href, null);
	assert.equal(liveProductHref(rutasegura), null);

	const catalog = readFileSync(join(root, 'src/lib/products.ts'), 'utf8');
	assert.doesNotMatch(catalog, /secureflow-crm-production\.up\.railway\.app/);
});

test('custom software is a first-class option in the shipped catalog', () => {
	assert.equal(customSoftware.name, 'Desarrollo de software a la medida');
	assert.match(customSoftware.description, /plataforma/i);
	assert.equal(customSoftware.href, '/contacto');
});
