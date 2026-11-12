import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { FAQS } from '../src/lib/faq.ts';
import {
	DESCRIPTION_MAX,
	OG_IMAGE_PATH,
	PAGE_SEO,
	SUBTITLE,
	baseGraph,
	canonicalFor,
	catalogGraph,
	jsonLd,
	pageSeo,
} from '../src/lib/seo.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

test('each page has a unique Spanish title and description within the snippet length', () => {
	const titles = new Set();
	const descriptions = new Set();
	for (const [path, seo] of Object.entries(PAGE_SEO)) {
		assert.equal(pageSeo(path).title, seo.title);
		assert.equal(seo.title.includes('MERBAL'), true, path);
		assert.equal(titles.has(seo.title), false, `duplicate title ${seo.title}`);
		assert.equal(descriptions.has(seo.description), false, `duplicate description ${path}`);
		titles.add(seo.title);
		descriptions.add(seo.description);
		assert.ok(seo.description.length <= DESCRIPTION_MAX, `${path} description is ${seo.description.length}`);
		assert.doesNotMatch(seo.title + seo.description, /SecureFlow|WhatsApp|precio|\$\d/i);
	}
	assert.equal(PAGE_SEO['/'].description, SUBTITLE);
	assert.equal(canonicalFor('/contacto'), 'https://merbal.lat/contacto/');
	assert.equal(canonicalFor('/contacto/'), 'https://merbal.lat/contacto/');
	assert.equal(canonicalFor('/plataformas/negocios-de-servicio'), 'https://merbal.lat/plataformas/negocios-de-servicio/');
	assert.equal(canonicalFor('/privacidad/'), 'https://merbal.lat/privacidad/');
	assert.equal(canonicalFor('/seguridad-electronica'), 'https://merbal.lat/seguridad-electronica/');
	assert.equal(canonicalFor('/infraestructura-de-red/'), 'https://merbal.lat/infraestructura-de-red/');
	assert.equal(canonicalFor('/'), 'https://merbal.lat/');
});

test('structured data names MERBAL, its software and services, and the visible FAQ', () => {
	const graph = jsonLd(baseGraph(catalogGraph()));
	assert.match(graph, /"@type":"Organization"/);
	assert.match(graph, /"name":"MERBAL"/);
	assert.match(graph, /soporte@merbal\.lat/);
	assert.match(graph, /"@type":"WebSite"/);
	assert.match(graph, /"@type":"FAQPage"/);
	assert.match(graph, /"@type":"SoftwareApplication"/);
	assert.match(graph, /"@type":"Service"/);
	assert.match(graph, /Ecosistema Paperless/);
	for (const name of ['Access', 'Obras', 'Safe Access', 'Ruta', 'Integridad', 'Anuvé', 'Consola empresarial', 'Guardias']) {
		assert.match(graph, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
	}
	assert.equal(FAQS.length >= 5 && FAQS.length <= 8, true);
	for (const item of FAQS) {
		assert.match(graph, new RegExp(item.question.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
	}
	assert.doesNotMatch(graph, /SecureFlow|aggregateRating|reviewCount|"price"|WhatsApp/i);
});

test('robots.txt allows AI crawlers and points at the sitemap', () => {
	const robots = read('public/robots.txt');
	for (const bot of ['GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'Google-Extended', 'ClaudeBot']) {
		assert.match(robots, new RegExp(`User-agent: ${bot}\\s+Allow: /`));
	}
	assert.match(robots, /Sitemap: https:\/\/merbal\.lat\/sitemap-index\.xml/);
});

test('llms.txt describes MERBAL and each own brand with a URL already on the site', () => {
	const llms = read('public/llms.txt');
	assert.match(llms, /^# MERBAL/m);
	assert.match(llms, /> Desarrollamos el software\. Integramos la tecnología\./);
	assert.match(llms, /Software a la medida/);
	assert.match(llms, /Seguridad electrónica/);
	assert.match(llms, /Infraestructura de red/);
	assert.match(llms, /https:\/\/access\.merbal\.lat\/access-paperless\//);
	assert.match(llms, /https:\/\/access\.merbal\.lat\/obras-paperless\//);
	assert.match(llms, /https:\/\/access\.merbal\.lat\/safe-access\//);
	assert.match(llms, /https:\/\/access\.merbal\.lat\/#modulos/);
	assert.match(llms, /https:\/\/anuve\.merbal\.lat\//);
	assert.match(llms, /#sol-consola/);
	assert.match(llms, /#sol-guard/);
	assert.match(llms, /soporte@merbal\.lat/);
	assert.match(llms, new RegExp(OG_IMAGE_PATH.replace('/', '\\/') + '|merbal\\.lat'));
	assert.doesNotMatch(llms, /SecureFlow|WhatsApp|Arco Care|ActivoObra/);
});

test('astro config publishes the sitemap for merbal.lat', () => {
	const config = read('astro.config.mjs');
	assert.match(config, /@astrojs\/sitemap/);
	assert.match(config, /site:\s*'https:\/\/merbal\.lat'/);
	assert.match(config, /trailingSlash:\s*'always'/);
});
