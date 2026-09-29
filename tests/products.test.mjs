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

test('catalog partitions site-ops with Access first live and SecureFlow paused', () => {
	assert.doesNotMatch(SECUFLOW_CRM_URL ?? '', /netlify/i);
	assert.doesNotMatch(SECUFLOW_CRM_URL ?? '', /railway/i);

	assert.deepEqual(
		products.map((product) => product.name),
		[
			'Access Paperless',
			'Access Enterprise',
			'ActivoObra',
			'SecureFlow CRM',
			'ANUVÉ',
			'Arco Care',
		],
	);

	assert.deepEqual(
		siteOpsProducts.map((product) => product.name),
		['Access Paperless', 'Access Enterprise', 'ActivoObra', 'SecureFlow CRM'],
	);
	assert.deepEqual(
		productsByVertical('operacion-de-sitios').map((product) => product.name),
		['Access Paperless', 'Access Enterprise', 'ActivoObra', 'SecureFlow CRM'],
	);

	const liveSiteOps = siteOpsProducts.filter((product) => product.status === 'live');
	assert.deepEqual(
		liveSiteOps.map((product) => product.name),
		['Access Paperless'],
	);

	const access = siteOpsProducts[0];
	assert.equal(access.name, 'Access Paperless');
	assert.equal(access.status, 'live');
	assert.equal(access.href, 'https://access.merbal.lat/');
	assert.equal(liveProductHref(access), 'https://access.merbal.lat/');
	assert.equal(productCtaLabel(access), 'Conocer Access');
	assert.doesNotMatch(access.href, /netlify/i);
	assert.doesNotMatch(access.problem + access.howItWorks + access.description, /cerradura/i);
	assert.match(access.description, /bitácora/);

	const enterprise = siteOpsProducts.find((product) => product.name === 'Access Enterprise');
	assert.ok(enterprise);
	assert.equal(enterprise.status, 'soon');
	assert.equal(enterprise.href, null);
	assert.equal(liveProductHref(enterprise), null);
	assert.match(enterprise.description, /multi-sitio/);
	assert.match(enterprise.description, /22\+ sillas/);
	assert.match(enterprise.description, /políticas de grupo/);
	assert.doesNotMatch(enterprise.description + (enterprise.href ?? ''), /https?:\/\//);
	assert.doesNotMatch(enterprise.description, /\$|precio/i);

	const activo = siteOpsProducts.find((product) => product.name === 'ActivoObra');
	assert.ok(activo);
	assert.equal(activo.status, 'soon');
	assert.equal(activo.href, null);
	assert.match(activo.description, /activos físicos en sitio/);

	const secureflow = siteOpsProducts.find((product) => product.name === 'SecureFlow CRM');
	assert.ok(secureflow);
	assert.equal(secureflow.status, 'paused');
	assert.equal(liveProductHref(secureflow), null);
	assert.doesNotMatch(secureflow.href ?? '', /netlify/i);
	assert.doesNotMatch(secureflow.href ?? '', /railway/i);
	assert.doesNotMatch(SECUFLOW_CRM_URL ?? '', /secureflow-landing\.netlify\.app/);
	assert.equal(productCtaLabel(secureflow), 'Conocer SecureFlow');
	assert.equal(SECUFLOW_CTA_LABEL, 'Conocer SecureFlow');

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
	assert.doesNotMatch(catalog, /secureflow-landing\.netlify\.app/);
	assert.doesNotMatch(catalog, /railway/i);
});

test('custom software is a first-class option in the shipped catalog', () => {
	assert.equal(customSoftware.name, 'Desarrollo de software a la medida');
	assert.match(customSoftware.description, /plataforma/i);
	assert.equal(customSoftware.href, '/contacto');
});
