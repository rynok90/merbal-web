import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

const BANNED =
	'SecureFlow CRM ya opera. HayStock y RutaSegura vienen. El desarrollo a la medida cubre lo que el producto no alcanza.';

test('software evergreen copy replaced the banned product-status sentence', () => {
	const platforms = read('src/components/Platforms.astro');
	const page = read('src/pages/software.astro');
	const products = read('src/lib/products.ts');
	const tree = page + platforms + products;

	assert.doesNotMatch(tree, /SecureFlow CRM ya opera/);
	assert.ok(!tree.includes(BANNED));
	assert.match(
		platforms,
		/Productos propios y desarrollo a la medida para resolver problemas reales y automatizar procesos de operación/,
	);
	assert.doesNotMatch(platforms, /catálogo/);
	assert.match(tree, /SecureFlow CRM/);
	assert.match(tree, /HayStock/);
	assert.match(tree, /RutaSegura/);
	assert.match(platforms, /Próximamente/);
	assert.match(tree, /Desarrollo de software a la medida/);
});

test('método markup aligns four steps and exposes a progress hook', () => {
	const method = read('src/components/Method.astro');

	assert.match(method, /Cómo trabajamos/);
	assert.match(method, /Diagnóstico/);
	assert.match(method, /Diseño/);
	assert.match(method, /Implementación/);
	assert.match(method, /Acompañamiento/);
	assert.match(method, /lg:items-center/);
	assert.match(method, /lg:grid-cols-4/);
	assert.match(method, /data-method-line/);
	assert.match(method, /data-method-step/);
	assert.match(method, /lg:items-center/);
});

test('shipped GSAP motion draws the method line and activates steps', () => {
	const motion = read('src/components/Motion.astro');

	assert.match(motion, /from ['"]gsap['"]/);
	assert.match(motion, /gsap\/ScrollTrigger/);
	assert.match(motion, /gsap\.registerPlugin\(ScrollTrigger\)/);
	assert.match(motion, /applyMethodProgress/);
	assert.match(motion, /methodStrokeOffset/);
	assert.match(motion, /stroke-dashoffset/);
	assert.match(motion, /data-method-line/);
});

test('privacy notice page exists and Footer links Aviso de privacidad', () => {
	assert.equal(existsSync(join(root, 'src/pages/privacidad.astro')), true);
	const page = read('src/pages/privacidad.astro');
	const footer = read('src/components/Footer.astro');

	assert.match(page, /Aviso de privacidad/);
	assert.match(page, /formulario/i);
	assert.match(page, /México/);
	assert.match(page, /CONTACT_EMAIL/);
	assert.match(footer, /Aviso de privacidad/);
	assert.match(footer, /href="\/privacidad"/);
});

test('ambient background is CSS-only and reduced-motion safe', () => {
	const layout = read('src/layouts/Layout.astro');
	const css = read('src/styles/global.css');

	assert.match(layout, /site-ambient/);
	assert.match(css, /site-ambient-glow/);
	assert.match(css, /prefers-reduced-motion/);
	assert.doesNotMatch(layout + css, /three\.js/i);
});

test('home Hero has a scoped technological backdrop', () => {
	const hero = read('src/components/Hero.astro');
	const css = read('src/styles/global.css');

	assert.match(hero, /hero-tech/);
	assert.match(hero, /Empresa mexicana · Seguridad y tecnología/);
	assert.match(css, /hero-tech-grid/);
	assert.match(css, /perspective/);
	assert.doesNotMatch(hero, /three\.js/i);
});
