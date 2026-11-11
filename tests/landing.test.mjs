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
	['src/pages/plataformas/index.astro', '/plataformas'],
	['src/pages/plataformas/operacion-de-sitios.astro', '/plataformas/operacion-de-sitios'],
	['src/pages/plataformas/negocios-de-servicio.astro', '/plataformas/negocios-de-servicio'],
	['src/pages/nosotros.astro', '/nosotros'],
	['src/pages/contacto.astro', '/contacto'],
	['src/pages/seguridad-electronica.astro', '/seguridad-electronica'],
	['src/pages/infraestructura-de-red.astro', '/infraestructura-de-red'],
];

test('Astro routes exist as distinct pages including plataformas verticals', () => {
	for (const [file] of ROUTES) {
		assert.equal(existsSync(join(root, file)), true, `missing ${file}`);
		const source = read(file);
		if (file === 'src/pages/index.astro') assert.match(source, /layouts\/HomeLayout\.astro/);
		else assert.match(source, /layouts\/Layout\.astro/);
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
		"'/plataformas'",
		"'/plataformas/operacion-de-sitios'",
		"'/plataformas/negocios-de-servicio'",
		"'/contacto'",
	]) {
		assert.ok(nav.includes(href), `nav missing ${href}`);
	}

	assert.match(nav, /Integración/);
	assert.match(nav, /Seguridad electrónica/);
	assert.match(nav, /Infraestructura de red/);
	assert.match(nav, /\/seguridad-electronica/);
	assert.match(nav, /\/infraestructura-de-red/);
	assert.doesNotMatch(nav, /label: 'Campo'/);
	assert.match(footer, /FOOTER_LINKS/);
	assert.match(nav, /\/nosotros/);
});

test('home follows the approved three-block mock', () => {
	const home = read('src/pages/index.astro');
	const page = read('src/components/home/HomePage.astro');
	const data = read('src/lib/home-solutions.ts');
	const carousel = read('src/components/home/ScreenCarousel.astro');
	const layout = read('src/layouts/HomeLayout.astro');
	const motion = read('src/scripts/home-motion.js');
	const brands = read('src/lib/distributed-brands.ts');
	const brandsView = read('src/components/home/DistributedBrands.astro');
	const surface = home + page + data + carousel + layout + motion + brands + brandsView;

	assert.match(home, /<HomeLayout/);
	assert.match(home, /<HomePage/);
	assert.doesNotMatch(home, /<Hero/);
	assert.doesNotMatch(home, /<Pillars/);
	assert.match(page, /Desarrollamos el software\.<br>Integramos la tecnología\./);
	assert.match(page, /Pedir demo/);
	assert.match(page, /Hablar con MERBAL/);
	assert.match(page, /href="\/#contacto"/);
	assert.match(page, /sol\.cta\.href/);
	assert.match(data, /https:\/\/access\.merbal\.lat\/access-paperless\//);
	assert.match(data, /https:\/\/access\.merbal\.lat\/obras-paperless\//);
	assert.match(data, /https:\/\/access\.merbal\.lat\/safe-access\//);
	assert.match(data, /https:\/\/access\.merbal\.lat\/#modulos/);
	assert.match(data, /https:\/\/anuve\.merbal\.lat\//);
	assert.match(data, /solucion=consola-empresarial/);
	assert.match(data, /solucion=guardias/);
	assert.match(data, /Pedir informes/);
	assert.match(page, /Plataformas propias/);
	assert.match(page, /Software a la medida/);
	assert.match(page, /Seguridad y red/);
	assert.match(page, /sol-\$\{sol\.id\}/);
	for (const id of ['access', 'obras', 'safe', 'ruta', 'inte', 'anuve', 'consola', 'guard']) {
		assert.match(data, new RegExp(`id: '${id}'`));
	}
	assert.match(data, /Guardias \(módulo, también extra de la Consola\)/);
	assert.match(page, /anuve-lockup-vino\.png/);
	assert.match(data, /anuve-agenda-local\.webp/);
	assert.match(data, /anuve-tienda-clienta-390\.webp/);
	assert.match(data, /Por confidencialidad \(NDA\) no mostramos los proyectos de clientes\./);
	assert.match(data, /Pedidos de restaurante/);
	assert.match(data, /Expediente de consultorio/);
	assert.match(data, /App interna de RH/);
	assert.doesNotMatch(data, /Asistencia en obra/);
	assert.doesNotMatch(data, /App de citas/);
	assert.doesNotMatch(data, /Tableros de operación/);
	assert.match(data, /Un sello cierra la cadena y llega por correo/);
	assert.match(carousel, /auto = 3800/);
	assert.match(page, /auto=\{3800\}/);
	assert.match(read('src/styles/home/feedback.css'), /site-header\.is-dark \.nav-dd a/);
	assert.match(page, /NDA_NOTE/);
	assert.match(page, /\/images\/logo-mark\.png/);
	assert.match(carousel, /data-reel/);
	assert.match(motion, /\[data-reel\]/);
	assert.match(read('src/styles/home/styles.css'), /prefers-reduced-motion/);
	assert.match(read('src/styles/home/feedback.css'), /prefers-reduced-motion/);
	assert.match(layout, /instrument-sans\.woff2/);
	assert.doesNotMatch(layout, /fonts\.googleapis\.com/);
	assert.match(motion, /prefers-reduced-motion/);
	assert.match(motion, /pointer: fine/);
	assert.match(motion, /CONTACT_FUNCTION_PATH|data-endpoint|netlify\/functions\/contact/);
	assert.match(page, /data-endpoint=\{CONTACT_FUNCTION_PATH\}/);
	assert.match(page, /name="nombre"/);
	assert.match(brands, /DISTRIBUTED_BRANDS: DistributedBrand\[\] = \[\]/);
	assert.match(brandsView, /brands\.length > 0/);
	assert.doesNotMatch(surface, /logo marca distribuida/);
	assert.doesNotMatch(surface, /class="ph"/);
	assert.doesNotMatch(surface, /SecureFlow/);
	assert.doesNotMatch(surface, /Próximamente/);
	assert.doesNotMatch(surface, /HayStock/);
	assert.doesNotMatch(surface, /RutaSegura/);
	assert.doesNotMatch(surface, /Expertise en campo/);
	assert.doesNotMatch(surface, /Venta de equipos/i);
	assert.doesNotMatch(surface, /fonts\.googleapis\.com/);
	assert.doesNotMatch(surface, /railway/i);
	assert.doesNotMatch(surface, /Mock de validación/);
	assert.doesNotMatch(surface, /existe desde 2023/);
	assert.doesNotMatch(surface, /finales de 2024/);
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
	assert.match(chrome, /Integración/);
	assert.match(chrome, /Seguridad electrónica/);
	assert.match(chrome, /Infraestructura de red/);
	assert.doesNotMatch(chrome, /label: 'Campo'/);
	assert.doesNotMatch(header, />Campo</);
});

test('nosotros owns Cómo trabajamos and the four steps', () => {
	const page = read('src/pages/nosotros.astro');
	const method = read('src/components/Method.astro');
	const about = read('src/components/About.astro');
	const tree = page + method + about;

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
	assert.match(tree, /casa de plataformas/);
	assert.doesNotMatch(tree, /tres divisiones/i);
	assert.doesNotMatch(tree, /mismo peso/);
	assert.doesNotMatch(tree, /cerramos la división/);
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
