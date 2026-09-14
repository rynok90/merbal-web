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
	productsByVertical,
	SECUFLOW_CRM_URL,
	SECUFLOW_CTA_LABEL,
	serviceBusinessProducts,
	siteOpsProducts,
} from '../src/lib/products.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('catalog partitions site-ops and service verticals without HayStock or RutaSegura', () => {
	assert.equal(SECUFLOW_CRM_URL, 'https://secureflow-landing.netlify.app');
	assert.doesNotMatch(SECUFLOW_CRM_URL, /secureflow-crm-production\.up\.railway\.app/);

	assert.deepEqual(
		products.map((product) => product.name),
		['SecureFlow CRM', 'Access Paperless', 'ActivoObra', 'ANUVÉ', 'Arco Care'],
	);

	assert.deepEqual(
		siteOpsProducts.map((product) => product.name),
		['SecureFlow CRM', 'Access Paperless', 'ActivoObra'],
	);
	assert.deepEqual(
		productsByVertical('operacion-de-sitios').map((product) => product.name),
		['SecureFlow CRM', 'Access Paperless', 'ActivoObra'],
	);

	const secureflow = siteOpsProducts.find((product) => product.name === 'SecureFlow CRM');
	assert.ok(secureflow);
	assert.equal(secureflow.status, 'live');
	assert.equal(secureflow.href, SECUFLOW_CRM_URL);
	assert.equal(secureflow.vertical, 'operacion-de-sitios');
	assert.equal(liveProductHref(secureflow), SECUFLOW_CRM_URL);
	assert.equal(productCtaLabel(secureflow), 'Conocer SecureFlow');
	assert.equal(SECUFLOW_CTA_LABEL, 'Conocer SecureFlow');

	const access = siteOpsProducts.find((product) => product.name === 'Access Paperless');
	assert.ok(access);
	assert.equal(access.status, 'soon');
	assert.equal(access.href, null);
	assert.doesNotMatch(access.problem + access.howItWorks + access.description, /cerradura/i);
	assert.match(access.description, /bitácora/);

	const activo = siteOpsProducts.find((product) => product.name === 'ActivoObra');
	assert.ok(activo);
	assert.equal(activo.status, 'soon');
	assert.equal(activo.href, null);
	assert.match(activo.description, /activos físicos en sitio/);

	assert.deepEqual(
		serviceBusinessProducts.map((product) => product.name),
		['ANUVÉ', 'Arco Care'],
	);
	const anuve = serviceBusinessProducts.find((product) => product.name === 'ANUVÉ');
	assert.ok(anuve);
	assert.equal(anuve.status, 'soon');
	assert.equal(anuve.href, null);
	assert.equal(anuve.vertical, 'negocios-de-servicio');
	assert.match(anuve.description, /diseño/);

	const arco = serviceBusinessProducts.find((product) => product.name === 'Arco Care');
	assert.ok(arco);
	assert.equal(arco.status, 'soon');
	assert.equal(arco.href, null);
	assert.equal(arco.vertical, 'negocios-de-servicio');
	assert.equal(
		arco.description,
		'Plataforma para clínicas veterinarias: agenda, expediente y recordatorios.',
	);
	assert.equal(
		arco.problem,
		'La clínica opera entre WhatsApp, hojas y un software que no habla con el dueño del paciente.',
	);
	assert.equal(arco.audience, 'Clínicas veterinarias y PyME de servicio al público.');
	assert.equal(
		arco.howItWorks,
		'Agenda, expediente y recordatorios. El equipo opera; el dueño recibe el seguimiento.',
	);
	assert.equal(liveProductHref(arco), null);

	assert.equal(
		siteOpsProducts.some((product) => product.name === 'ANUVÉ'),
		false,
	);
	assert.equal(
		serviceBusinessProducts.some((product) => product.name === 'SecureFlow CRM'),
		false,
	);

	const catalog = readFileSync(join(root, 'src/lib/products.ts'), 'utf8');
	assert.match(catalog, /ANUVÉ/);
	assert.match(catalog, /bitácora/);
	assert.match(catalog, /diseño/);
	assert.doesNotMatch(catalog, /Ã‰|Ã¡|Ã©/);
	assert.doesNotMatch(catalog, /HayStock/);
	assert.doesNotMatch(catalog, /RutaSegura/);
	assert.doesNotMatch(catalog, /Fochi/);
});

test('custom software is a first-class option in the shipped catalog', () => {
	assert.equal(customSoftware.name, 'Desarrollo de software a la medida');
	assert.match(customSoftware.description, /plataforma/i);
	assert.equal(customSoftware.href, '/contacto');
});
