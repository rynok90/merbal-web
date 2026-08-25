import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

const THEME_COLORS = [
	['navy-950', '#060d18'],
	['navy-900', '#0a1628'],
	['navy-800', '#102038'],
	['navy-700', '#162a48'],
	['accent', '#2b8cff'],
	['accent-2', '#5eb0ff'],
	['text', '#f4f7fb'],
	['text-soft', '#c5d0de'],
	['muted', '#8b9bb0'],
];

test('global.css imports Tailwind and defines the MERBAL @theme', () => {
	const css = read('src/styles/global.css');

	assert.match(css, /@import\s+"tailwindcss"/);
	assert.match(css, /@theme\s*\{/);
	assert.match(css, /Outfit/);
	assert.match(css, /Inter/);
	assert.match(css, /scroll-behavior:\s*smooth/);

	for (const [name, hex] of THEME_COLORS) {
		assert.match(css, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
		assert.match(css, new RegExp(hex, 'i'));
	}
});

test('Layout.astro is a reusable MERBAL shell with SEO, fonts, favicon, and slot', () => {
	const layout = read('src/layouts/Layout.astro');

	assert.match(layout, /\btitle\b/);
	assert.match(layout, /\bdescription\b/);
	assert.match(layout, /<meta\s+name="description"/);
	assert.match(layout, /property="og:title"/);
	assert.match(layout, /property="og:description"/);
	assert.match(layout, /fonts\.googleapis\.com/);
	assert.match(layout, /Outfit/);
	assert.match(layout, /Inter/);
	assert.match(layout, /\/images\/logo-mark\.png/);
	assert.match(layout, /global\.css/);
	assert.match(layout, /<slot\s*\/>/);
});

test('index.astro uses Layout and MERBAL branding without the stub homepage', () => {
	const page = read('src/pages/index.astro');

	assert.match(page, /layouts\/Layout\.astro/);
	assert.match(page, /<Layout/);
	assert.match(page, /MERBAL/);
	assert.doesNotMatch(page, /Base lista/);
});

test('astro.config registers @tailwindcss/vite', () => {
	const config = read('astro.config.mjs');

	assert.match(config, /@tailwindcss\/vite/);
	assert.match(config, /tailwindcss\s*\(/);
});
