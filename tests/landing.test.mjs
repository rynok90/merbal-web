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
	['src/pages/plataformas/index.astro', '/plataformas'],
	['src/pages/plataformas/operacion-de-sitios.astro', '/plataformas/operacion-de-sitios'],
	['src/pages/plataformas/negocios-de-servicio.astro', '/plataformas/negocios-de-servicio'],
	['src/pages/nosotros.astro', '/nosotros'],
	['src/pages/contacto.astro', '/contacto'],
];

test('Astro routes exist as distinct pages including plataformas verticals', () => {
	for (const [file] of ROUTES) {
		assert.equal(existsSync(join(root, file)), true, `missing ${file}`);
		assert.match(read(file), /layouts\/Layout\.astro/);
	}
	assert.equal(existsSync(join(root, 'src/pages/software.astro')), false);
});

test('Header uses real page paths, not only in-page anchors', () => {
	const header = read('src/components/Header.astro');
	const nav = read('src/lib/nav.ts');
	const footer = read('src/components/Footer.astro');

	assert.match(header, /HEADER_NAV/);
	assert.match(header, /CONTACT_PATH/);
	assert.doesNotMatch(header, /href="#inicio"/);
	assert.doesNotMatch(header, /href="#servicios"/);
	assert.doesNotMatch(header, /href="#nosotros"/);
	assert.doesNotMatch(header, /href="#contacto"/);

	for (const href of [
		"'/seguridad-electronica'",
		"'/infraestructura-de-red'",
		"'/plataformas'",
		"'/plataformas/operacion-de-sitios'",
		"'/plataformas/negocios-de-servicio'",
		"'/contacto'",
	]) {
		assert.ok(nav.includes(href), `nav missing ${href}`);
	}

	assert.match(footer, /FOOTER_LINKS/);
	assert.match(nav, /\/nosotros/);
});

test('home has three equal doors, intact lema, and no loose products', () => {
	const home = read('src/pages/index.astro');
	const hero = read('src/components/Hero.astro');
	const pillars = read('src/components/Pillars.astro');
	const surface = home + hero + pillars;

	assert.match(home, /<Hero/);
	assert.match(home, /<Pillars/);
	assert.doesNotMatch(home, /<Process/);
	assert.doesNotMatch(home, /<Platforms/);
	assert.doesNotMatch(home, /<Contact/);
	assert.doesNotMatch(home, /<Method/);
	assert.match(hero, /Expertise en campo/);
	assert.match(hero, /Productos/);
	assert.match(hero, /que operan/);
	assert.match(hero, /Tres divisiones/);
	assert.match(hero, /campo/);
	assert.match(hero, /plataformas/i);
	assert.doesNotMatch(surface, /hacemos de todo/i);
	assert.doesNotMatch(pillars, /perímetro/);
	assert.match(hero, /Ver divisiones/);
	assert.doesNotMatch(hero, /Ver pilares/);
	assert.match(
		pillars,
		/Videovigilancia, control de acceso, detección e integración\. Sistemas que se operan y se auditan/,
	);
	assert.doesNotMatch(surface, /Software \/ Plataformas/);
	assert.doesNotMatch(surface, /MERBAL productos/);
	assert.doesNotMatch(surface, /\bSoftware\b/);
	assert.match(pillars, /href="\/seguridad-electronica"/);
	assert.match(pillars, /href="\/infraestructura-de-red"/);
	assert.match(pillars, /href="\/plataformas"/);
	assert.match(pillars, />Seguridad electrónica</);
	assert.match(pillars, />Infraestructura de red</);
	assert.match(pillars, />Plataformas</);
	assert.doesNotMatch(pillars, /href="\/software"/);
	assert.doesNotMatch(surface, /Cómo trabajamos/);
	assert.doesNotMatch(surface, /SecureFlow/);
	assert.doesNotMatch(surface, /Access Paperless/);
	assert.doesNotMatch(surface, /ANUVÉ/);
	assert.doesNotMatch(surface, /ActivoObra/);
	assert.doesNotMatch(surface, /HayStock/);
	assert.doesNotMatch(surface, /RutaSegura/);
	assert.doesNotMatch(surface, /Arco Care/);
	assert.doesNotMatch(surface, /Fochi/);
	assert.doesNotMatch(surface, /secureflow-crm-production\.up\.railway\.app/);
	assert.doesNotMatch(surface, /secureflow-landing\.netlify\.app/);
	assert.doesNotMatch(surface, /name="nombre"/);
	assert.doesNotMatch(surface, /Venta de equipos/i);
});

test('Access Paperless and product names stay out of the header', () => {
	const nav = read('src/lib/nav.ts');
	const header = read('src/components/Header.astro');
	const headerNav = nav.slice(0, nav.indexOf('FOOTER_LINKS'));
	const chrome = headerNav + header;

	assert.doesNotMatch(chrome, /Access Paperless/);
	assert.doesNotMatch(chrome, /ANUVÉ/);
	assert.doesNotMatch(chrome, /ActivoObra/);
	assert.doesNotMatch(chrome, /HayStock/);
	assert.doesNotMatch(chrome, /RutaSegura/);
	assert.doesNotMatch(header, />Inicio</);
	assert.doesNotMatch(header, />Software</);
	assert.doesNotMatch(header, />Nosotros</);
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

test('contacto posts JSON to the Netlify function, not mailto', () => {
	const page = read('src/pages/contacto.astro');
	const contact = read('src/components/Contact.astro');
	const helper = read('src/lib/contact.ts') + read('src/lib/contact-config.ts');

	assert.match(page, /<Contact/);
	assert.match(contact, /CONTACT_FUNCTION_PATH/);
	assert.match(helper, /\/\.netlify\/functions\/contact/);
	assert.doesNotMatch(contact, /buildMailtoUrl/);
	assert.doesNotMatch(contact, /window\.location\.href/);
	assert.doesNotMatch(contact, /action=\{?`?mailto:/);
	assert.match(contact, /name="nombre"/);
	assert.match(contact, /name="email"/);
	assert.match(contact, /name="empresa"/);
	assert.match(contact, /name="mensaje"/);
	assert.match(contact, /name="division"/);
	assert.match(contact, /name="vertical"/);
	assert.match(contact, /name="website"/);
	assert.match(contact, /CONTACT_EMAIL/);
	assert.match(read('src/lib/mailto.ts'), /soporte@merbal\.lat/);
	assert.doesNotMatch(contact, /WhatsApp/i);
});

test('expert service pages describe the practice and point to contact', () => {
	const seguridad = read('src/pages/seguridad-electronica.astro');
	const red = read('src/pages/infraestructura-de-red.astro');

	assert.match(seguridad, /Seguridad electrónica/);
	assert.match(red, /Infraestructura de red/);
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
		'src/pages/plataformas/index.astro',
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
