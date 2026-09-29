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
	assert.match(ficha, /product\.status === 'live'/);
	assert.match(ficha, /product\.status === 'soon'/);
	assert.match(ficha, /product\.status === 'paused'/);
	assert.match(ficha, /En operación/);
	assert.match(ficha, /Próximamente/);
	assert.match(ficha, /En pausa/);
	assert.match(ficha, /href="\/mantenimiento"/);
	assert.match(ficha, /Avisarme/);
	assert.doesNotMatch(ficha, /Access Paperless/);

	const access = products.find((product) => product.name === 'Access Paperless');
	assert.ok(access);
	assert.equal(access.status, 'live');
	assert.equal(liveProductHref(access), 'https://access.merbal.lat/');
	assert.equal(productCtaLabel(access), 'Conocer Access');
	assert.doesNotMatch(liveProductHref(access) ?? '', /netlify/i);
	assert.doesNotMatch(liveProductHref(access) ?? '', /railway/i);

	const enterprise = products.find((product) => product.name === 'Access Enterprise');
	assert.ok(enterprise);
	assert.equal(enterprise.status, 'soon');
	assert.equal(enterprise.href, null);
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
	].join('\n');
	assert.doesNotMatch(enterpriseCopy, /sillas/);
	assert.doesNotMatch(enterpriseCopy, /22\+/);
	assert.doesNotMatch(enterpriseCopy, /multi-sitio/);
	assert.doesNotMatch(enterpriseCopy, /políticas de grupo/);

	const secureflow = products.find((product) => product.name === 'SecureFlow CRM');
	assert.ok(secureflow);
	assert.equal(secureflow.status, 'paused');
	assert.equal(liveProductHref(secureflow), null);
	assert.doesNotMatch(secureflow.href ?? '', /netlify/i);
	assert.doesNotMatch(secureflow.href ?? '', /railway/i);

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
