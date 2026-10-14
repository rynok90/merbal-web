import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
	customSoftware,
	productCtaLabel,
	productStatusLabel,
	SECUFLOW_CRM_URL,
	SERVICE_VERTICAL,
	SITE_OPS_VERTICAL,
	serviceBusinessProducts,
	showcaseCta,
	showcaseProducts,
	siteOpsProducts,
} from '../src/lib/products.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

test('plataformas surface renders showcase cards with a detail panel', () => {
	const hub = read('src/pages/plataformas/index.astro');
	const platforms = read('src/components/Platforms.astro');
	const css = read('src/styles/global.css');
	const tree = hub + platforms;

	assert.match(hub, /<Platforms/);
	assert.match(platforms, /showcaseProducts/);
	assert.match(platforms, /showcaseCta/);
	assert.match(platforms, /platform-card/);
	assert.match(platforms, /platform-icon/);
	assert.match(platforms, /platform-card-layer/);
	assert.match(platforms, /data-platform-open/);
	assert.match(platforms, /id="platform-panel"/);
	assert.match(platforms, /Problema/);
	assert.match(platforms, /Para quién/);
	assert.match(platforms, /Cómo opera/);
	assert.match(platforms, /customSoftware/);
	assert.match(css, /\.platform-card:hover/);
	assert.match(css, /rotateX\(4deg\) rotateY\(-6deg\)/);
	assert.match(css, /#F5A524/);
	assert.match(css, /#2B8CFF/);
	assert.doesNotMatch(tree, /tres divisiones/i);
	assert.doesNotMatch(tree, /mismo peso/);
	assert.doesNotMatch(tree, /cerramos la división/);
	assert.doesNotMatch(tree, /SecureFlow CRM ya opera/);
	assert.doesNotMatch(tree, /HayStock/);
	assert.doesNotMatch(tree, /RutaSegura/);
	assert.doesNotMatch(tree, /Fochi/);
	assert.equal(customSoftware.href, '/contacto');

	const showcase = showcaseProducts();
	assert.deepEqual(
		showcase.map((product) => product.name),
		['Access Paperless', 'Access Enterprise', 'Safe Access', 'ActivoObra', 'SecureFlow CRM'],
	);
	assert.equal(productStatusLabel(showcase[0]), 'En operación');
	assert.equal(showcaseCta(showcase[0]).href.replace(/\/$/, ''), 'https://access.merbal.lat');
	assert.equal(showcaseCta(showcase[4]).href, 'https://secureflow-landing.netlify.app');
	assert.equal(productStatusLabel(showcase[4]), 'En operación');
	for (const product of showcase) {
		assert.ok(product.problem.trim().length > 0, `${product.name} problem`);
		assert.ok(product.audience.trim().length > 0, `${product.name} audience`);
		assert.ok(product.howItWorks.trim().length > 0, `${product.name} how`);
		if (product.status === 'soon') assert.equal(showcaseCta(product).label, 'Avisarme');
	}
	assert.equal(SITE_OPS_VERTICAL.name, 'Operación de sitios');
	assert.equal(SERVICE_VERTICAL.name, 'Negocios de servicio');
});

test('operacion-de-sitios lists Access first, Safe Access soon, and SecureFlow live', () => {
	const page = read('src/pages/plataformas/operacion-de-sitios.astro');
	const ficha = read('src/components/ProductFicha.astro');
	const tree = page + ficha;

	assert.match(page, /siteOpsProducts/);
	assert.doesNotMatch(page, /serviceBusinessProducts/);
	assert.match(tree, /Problema/);
	assert.match(tree, /Para quién/);
	assert.match(tree, /Cómo opera/);
	assert.match(ficha, /productCtaLabel/);
	assert.match(ficha, /liveProductHref/);
	assert.match(ficha, /En pausa/);
	assert.match(ficha, /Próximamente/);
	assert.match(ficha, /En operación/);

	const names = siteOpsProducts.map((product) => product.name);
	assert.deepEqual(names, [
		'Access Paperless',
		'Access Enterprise',
		'Safe Access',
		'ActivoObra',
		'SecureFlow CRM',
	]);
	assert.equal(siteOpsProducts[0].status, 'live');
	assert.equal(productCtaLabel(siteOpsProducts[0]), 'Conocer Access');
	assert.equal(siteOpsProducts[1].name, 'Access Enterprise');
	assert.equal(siteOpsProducts[1].status, 'soon');
	assert.equal(siteOpsProducts[2].name, 'Safe Access');
	assert.equal(siteOpsProducts[2].status, 'soon');
	assert.equal(showcaseCta(siteOpsProducts[2]).label, 'Avisarme');
	assert.equal(siteOpsProducts[4].name, 'SecureFlow CRM');
	assert.equal(siteOpsProducts[4].status, 'live');
	assert.match(SECUFLOW_CRM_URL ?? '', /secureflow-landing\.netlify\.app/);
	assert.doesNotMatch(SECUFLOW_CRM_URL ?? '', /railway/i);
	assert.doesNotMatch(page, /ANUVÉ/);
	assert.doesNotMatch(page, /HayStock/);
	assert.doesNotMatch(page, /RutaSegura/);
	assert.doesNotMatch(page, /cerradura/i);
});

test('negocios-de-servicio lists ANUVÉ and Arco Care, never site-ops products', () => {
	const page = read('src/pages/plataformas/negocios-de-servicio.astro');

	assert.match(page, /serviceBusinessProducts/);
	assert.doesNotMatch(page, /siteOpsProducts/);
	assert.deepEqual(
		serviceBusinessProducts.map((product) => product.name),
		['ANUVÉ', 'Arco Care'],
	);
	assert.match(page, /ANUVÉ|serviceBusinessProducts/);
	assert.doesNotMatch(page, /SecureFlow/);
	assert.doesNotMatch(page, /Access Paperless/);
	assert.doesNotMatch(page, /ActivoObra/);
	assert.doesNotMatch(page, /HayStock/);
	assert.doesNotMatch(page, /RutaSegura/);
	assert.doesNotMatch(page, /Fochi/);
});

test('/software 301 redirects to /plataformas', () => {
	const redirects = read('public/_redirects');
	assert.match(redirects, /\/software\s+\/plataformas\s+301/);
});
