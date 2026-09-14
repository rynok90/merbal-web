import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

const ROUTES = [
	['src/pages/index.astro', '/'],
	['src/pages/seguridad-electronica.astro', '/seguridad-electronica'],
	['src/pages/infraestructura-de-red.astro', '/infraestructura-de-red'],
	['src/pages/software.astro', '/software'],
	['src/pages/nosotros.astro', '/nosotros'],
	['src/pages/contacto.astro', '/contacto'],
];

test('six Astro routes exist as distinct pages', () => {
	for (const [file] of ROUTES) {
		assert.equal(existsSync(join(root, file)), true, `missing ${file}`);
		assert.match(read(file), /layouts\/Layout\.astro/);
	}
});

test('Header uses real page paths, not only in-page anchors', () => {
	const header = read('src/components/Header.astro');
	const nav = read('src/lib/nav.ts');
	const footer = read('src/components/Footer.astro');

	assert.match(header, /NAV_LINKS/);
	assert.match(header, /CONTACT_PATH/);
	assert.doesNotMatch(header, /href="#inicio"/);
	assert.doesNotMatch(header, /href="#servicios"/);
	assert.doesNotMatch(header, /href="#nosotros"/);
	assert.doesNotMatch(header, /href="#contacto"/);

	for (const href of [
		"'/'",
		"'/seguridad-electronica'",
		"'/infraestructura-de-red'",
		"'/software'",
		"'/nosotros'",
		"'/contacto'",
	]) {
		assert.ok(nav.includes(href), `nav missing ${href}`);
	}

	assert.match(footer, /NAV_LINKS/);
});

test('home stays focused: hero tone without process, catalog, or contact dump', () => {
	const home = read('src/pages/index.astro');
	const hero = read('src/components/Hero.astro');
	const pillars = read('src/components/Pillars.astro');

	assert.match(home, /<Hero/);
	assert.match(home, /<Pillars/);
	assert.doesNotMatch(home, /<Process/);
	assert.doesNotMatch(home, /<Platforms/);
	assert.doesNotMatch(home, /<Contact/);
	assert.doesNotMatch(home, /<Method/);
	assert.match(hero, /Expertise en campo/);
	assert.match(hero, /Productos/);
	assert.match(hero, /que operan/);
	assert.match(
		hero,
		/Software y plataformas\s+propias — más desarrollo a la medida — para resolver problemas reales y automatizar procesos de\s+operación/,
	);
	assert.doesNotMatch(hero, /no dependa de un catálogo/);
	assert.match(pillars, /href="\/seguridad-electronica"/);
	assert.match(pillars, /href="\/infraestructura-de-red"/);
	assert.match(pillars, /href="\/software"/);
	assert.doesNotMatch(home + hero + pillars, /Cómo trabajamos/);
	assert.doesNotMatch(home + hero + pillars, /SecureFlow CRM/);
	assert.doesNotMatch(home + hero + pillars, /secureflow-crm-production\.up\.railway\.app/);
	assert.doesNotMatch(home + hero + pillars, /secureflow-landing\.netlify\.app/);
	assert.doesNotMatch(home + hero + pillars, /name="nombre"/);
	assert.doesNotMatch(home + hero + pillars, /Venta de equipos/i);
});

test('software page is a product division with live SecureFlow href', () => {
	const page = read('src/pages/software.astro');
	const platforms = read('src/components/Platforms.astro');
	const products = read('src/lib/products.ts');
	const tree = page + platforms + products;

	assert.match(page, /<Platforms/);
	assert.match(page, /División de producto/);
	assert.match(tree, /Software \/ Plataformas/);
	assert.match(tree, /SecureFlow CRM/);
	assert.match(tree, /Access Paperless/);
	assert.match(tree, /ANUVÉ/);
	assert.match(tree, /https:\/\/secureflow-landing\.netlify\.app/);
	assert.doesNotMatch(tree, /https:\/\/secureflow-crm-production\.up\.railway\.app/);
	assert.match(platforms, /product\.status === 'live'/);
	assert.match(platforms, /product\.status === 'soon'/);
	assert.doesNotMatch(platforms, /products\[0\]/);
	assert.doesNotMatch(platforms, /slice\(1\)/);
	assert.match(platforms, /productCtaLabel\(product\)/);
	assert.doesNotMatch(platforms, /SECUFLOW_CTA_LABEL/);
	assert.match(products, /productCtaLabel/);
	assert.match(products, /Conocer \$\{/);
	assert.doesNotMatch(platforms, /Abrir SecureFlow/);
	assert.match(platforms, /target="_blank"/);
	assert.match(platforms, /rel="noopener noreferrer"/);
	assert.match(tree, /HayStock/);
	assert.match(tree, /RutaSegura/);
	assert.match(platforms, /md:grid-cols-2/);
	assert.match(platforms, /Próximamente/);
	assert.match(tree, /Desarrollo de software a la medida/);
	assert.match(platforms, /liveProductHref/);
	assert.match(platforms, /customSoftware\.href/);

	const upcomingStart = platforms.indexOf('upcoming.map');
	assert.ok(upcomingStart >= 0, 'upcoming products must be mapped from the soon set');
	const upcomingEnd = platforms.indexOf('customSoftware', upcomingStart);
	const upcomingBlock = platforms.slice(
		upcomingStart,
		upcomingEnd === -1 ? undefined : upcomingEnd,
	);
	assert.doesNotMatch(upcomingBlock, /<a[\s>]/);
	assert.doesNotMatch(upcomingBlock, /btn-primary/);
	assert.doesNotMatch(upcomingBlock, /productCtaLabel/);
	assert.match(upcomingBlock, /Próximamente/);
});

test('Access Paperless and ANUVÉ stay out of the nav', () => {
	const nav = read('src/lib/nav.ts');
	const header = read('src/components/Header.astro');
	const chrome = nav + header;

	assert.doesNotMatch(chrome, /Access Paperless/);
	assert.doesNotMatch(chrome, /ANUVÉ/);
	assert.doesNotMatch(chrome, /ANUVE/);
	assert.doesNotMatch(chrome, /HayStock/);
	assert.doesNotMatch(chrome, /RutaSegura/);
});

test('nosotros owns Cómo trabajamos and the four steps', () => {
	const page = read('src/pages/nosotros.astro');
	const method = read('src/components/Method.astro');

	assert.match(page, /<Method/);
	assert.match(method, /Cómo trabajamos/);
	assert.match(method, /Diagnóstico/);
	assert.match(method, /Diseño/);
	assert.match(method, /Implementación/);
	assert.match(method, /Acompañamiento/);
	assert.match(method, /data-method-step/);
	assert.match(method, /id="metodo"/);
	assert.match(method, />\s*01\s*</);
	assert.match(method, />\s*02\s*</);
	assert.match(method, />\s*03\s*</);
	assert.match(method, />\s*04\s*</);
});

test('contacto has mailto form fields and the commercial email', () => {
	const page = read('src/pages/contacto.astro');
	const contact = read('src/components/Contact.astro');
	const helper = read('src/lib/mailto.ts');

	assert.match(page, /<Contact/);
	assert.match(contact, /mailto:/);
	assert.match(contact, /buildMailtoUrl/);
	assert.match(contact, /name="nombre"/);
	assert.match(contact, /name="email"/);
	assert.match(contact, /name="empresa"/);
	assert.match(contact, /name="mensaje"/);
	assert.match(helper, /merbal\.tech\.comercial@gmail\.com/);
});

test('expert service pages describe the practice and point to contact', () => {
	const seguridad = read('src/pages/seguridad-electronica.astro');
	const red = read('src/pages/infraestructura-de-red.astro');

	assert.match(seguridad, /Seguridad electrónica/);
	assert.match(seguridad, /retorno/i);
	assert.match(red, /Infraestructura de red/);
	assert.match(red, /disponibilidad/i);
});

test('GSAP + ScrollTrigger are registered in shipped client motion', () => {
	const motion = read('src/components/Motion.astro');
	const css = read('src/styles/global.css');

	assert.match(motion, /from ['"]gsap['"]/);
	assert.match(motion, /gsap\/ScrollTrigger/);
	assert.match(motion, /gsap\.registerPlugin\(ScrollTrigger\)/);
	assert.match(motion, /ScrollTrigger\.batch/);
	assert.match(motion, /data-method-step/);
	assert.match(motion, /isHeaderScrolled/);
	assert.match(css, /\.nav-link:hover/);
	assert.match(css, /\.card-hover:hover/);
	assert.match(css, /data-scrolled/);
});

test('venta de equipos is absent from shipped sources', () => {
	const files = [
		'src/pages/index.astro',
		'src/pages/software.astro',
		'src/pages/nosotros.astro',
		'src/pages/contacto.astro',
		'src/pages/seguridad-electronica.astro',
		'src/pages/infraestructura-de-red.astro',
		'src/components/Header.astro',
		'src/components/Footer.astro',
		'src/components/Hero.astro',
		'src/components/Pillars.astro',
		'src/components/Platforms.astro',
		'src/components/Method.astro',
		'src/components/Contact.astro',
		'src/pages/privacidad.astro',
	];
	for (const file of files) {
		assert.doesNotMatch(read(file), /Venta de equipos/i);
	}
});
