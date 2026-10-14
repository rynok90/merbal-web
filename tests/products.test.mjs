import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	customSoftware,
	liveProductHref,
	productCtaLabel,
	productStatusLabel,
	products,
	productsByVertical,
	SECUFLOW_CRM_URL,
	SECUFLOW_CTA_LABEL,
	serviceBusinessProducts,
	showcaseCta,
	showcaseProducts,
	siteOpsProducts,
} from '../src/lib/products.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('catalog partitions site-ops with Access and SecureFlow live', () => {
	assert.match(SECUFLOW_CRM_URL ?? '', /secureflow-landing\.netlify\.app/);
	assert.doesNotMatch(SECUFLOW_CRM_URL ?? '', /railway/i);

	assert.deepEqual(
		products.map((product) => product.name),
		[
			'Access Paperless',
			'Access Enterprise',
			'Safe Access',
			'ActivoObra',
			'SecureFlow CRM',
			'ANUVÉ',
			'Arco Care',
		],
	);

	assert.deepEqual(
		siteOpsProducts.map((product) => product.name),
		['Access Paperless', 'Access Enterprise', 'Safe Access', 'ActivoObra', 'SecureFlow CRM'],
	);
	assert.deepEqual(
		productsByVertical('operacion-de-sitios').map((product) => product.name),
		['Access Paperless', 'Access Enterprise', 'Safe Access', 'ActivoObra', 'SecureFlow CRM'],
	);

	const liveSiteOps = siteOpsProducts.filter((product) => product.status === 'live');
	assert.deepEqual(
		liveSiteOps.map((product) => product.name),
		['Access Paperless', 'SecureFlow CRM'],
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
	assert.equal(enterprise.name, 'Access Enterprise');
	assert.equal(enterprise.status, 'soon');
	assert.equal(enterprise.href, null);
	assert.equal(enterprise.vertical, 'operacion-de-sitios');
	assert.equal(liveProductHref(enterprise), null);
	assert.equal(enterprise.description, 'Control de plantilla propia en predio, ruta y obra.');
	assert.equal(
		enterprise.problem,
		'La lista de papel no dice quién subió al camión, quién faltó ni quién no iba. El reloj de pared no cubre la ruta ni el predio sin señal.',
	);
	assert.equal(
		enterprise.audience,
		'Campo, empaque, obra, patio y cuadrilla de sitio. También el grupo que ya controla visitantes con Access Paperless y necesita el módulo de plantilla.',
	);
	assert.equal(
		enterprise.howItWorks,
		'Lectura en el punto: QR o buscar por nombre y confirmar con foto. Tablero de cubiertos y faltantes por ruta y sitio. A la noche, RH tiene el Excel. Este módulo no acredita contratistas ni visitas.',
	);
	const enterpriseCopy = [
		enterprise.description,
		enterprise.problem,
		enterprise.audience,
		enterprise.howItWorks,
		enterprise.href ?? '',
	].join('\n');
	assert.doesNotMatch(enterpriseCopy, /sillas/);
	assert.doesNotMatch(enterpriseCopy, /22\+/);
	assert.doesNotMatch(enterpriseCopy, /multi-sitio/);
	assert.doesNotMatch(enterpriseCopy, /políticas de grupo/);
	assert.doesNotMatch(enterpriseCopy, /precio/i);
	assert.doesNotMatch(enterpriseCopy, /https?:\/\//);

	const activo = siteOpsProducts.find((product) => product.name === 'ActivoObra');
	assert.ok(activo);
	assert.equal(activo.status, 'soon');
	assert.equal(activo.href, null);
	assert.match(activo.description, /activos físicos en sitio/);

	const safe = siteOpsProducts.find((product) => product.name === 'Safe Access');
	assert.ok(safe);
	assert.equal(safe.status, 'soon');
	assert.equal(safe.href, null);
	assert.equal(liveProductHref(safe), null);
	assert.equal(showcaseCta(safe).label, 'Avisarme');
	assert.ok(safe.problem.length > 20);
	assert.ok(safe.audience.length > 10);
	assert.ok(safe.howItWorks.length > 10);

	const secureflow = siteOpsProducts.find((product) => product.name === 'SecureFlow CRM');
	assert.ok(secureflow);
	assert.equal(secureflow.status, 'live');
	assert.equal(secureflow.href, 'https://secureflow-landing.netlify.app');
	assert.equal(liveProductHref(secureflow), 'https://secureflow-landing.netlify.app');
	assert.doesNotMatch(secureflow.href ?? '', /railway/i);
	assert.match(SECUFLOW_CRM_URL ?? '', /secureflow-landing\.netlify\.app/);
	assert.equal(productCtaLabel(secureflow), 'Conocer SecureFlow');
	assert.equal(SECUFLOW_CTA_LABEL, 'Conocer SecureFlow');
	assert.match(productStatusLabel(secureflow), /En operación/);

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
	assert.match(catalog, /secureflow-landing\.netlify\.app/);
	assert.doesNotMatch(catalog, /railway/i);
	assert.match(catalog, /Safe Access/);
});

test('showcase order, live hrefs, and Avisarme come from the shipped catalog', () => {
	const showcase = showcaseProducts();
	assert.deepEqual(
		showcase.map((product) => product.name),
		['Access Paperless', 'Access Enterprise', 'Safe Access', 'ActivoObra', 'SecureFlow CRM'],
	);

	const paperless = showcase[0];
	assert.equal(paperless.status, 'live');
	assert.equal(productStatusLabel(paperless), 'En operación');
	assert.equal(showcaseCta(paperless).href, 'https://access.merbal.lat/');
	assert.equal(showcaseCta(paperless).external, true);

	for (const name of ['Access Enterprise', 'Safe Access', 'ActivoObra']) {
		const product = showcase.find((item) => item.name === name);
		assert.ok(product);
		assert.equal(product.status, 'soon');
		assert.match(productStatusLabel(product), /Próximamente/);
		assert.equal(showcaseCta(product).label, 'Avisarme');
		assert.equal(showcaseCta(product).external, false);
	}

	const secureflow = showcase[4];
	assert.equal(secureflow.status, 'live');
	assert.equal(showcaseCta(secureflow).href, 'https://secureflow-landing.netlify.app');
	assert.equal(showcaseCta(secureflow).label, 'Conocer SecureFlow');
});

test('custom software is a first-class option in the shipped catalog', () => {
	assert.equal(customSoftware.name, 'Desarrollo de software a la medida');
	assert.match(customSoftware.description, /plataforma/i);
	assert.equal(customSoftware.href, '/contacto');
});
