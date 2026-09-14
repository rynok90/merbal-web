import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');

const MOJIBAKE = [
	'â€”',
	'â€“',
	'â€˜',
	'â€™',
	'â€œ',
	'â€',
	'Ã³',
	'Ã¡',
	'Ã©',
	'Ã­',
	'Ã±',
	'Ãº',
	'Ã‰',
	'Â¿',
	'Â¡',
	'Â',
	'Ã',
];

function sourceFiles(dir, acc = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) sourceFiles(path, acc);
		else if (/\.(astro|ts|mjs)$/.test(entry.name)) acc.push(path);
	}
	return acc;
}

test('every src source file is valid Spanish Unicode without mojibake', () => {
	const files = sourceFiles(src);
	assert.ok(files.length > 0, 'expected src source files');

	for (const file of files) {
		const text = readFileSync(file, 'utf8');
		for (const token of MOJIBAKE) {
			assert.equal(text.includes(token), false, `${file} contains mojibake token ${JSON.stringify(token)}`);
		}
		assert.equal(text.includes('\uFFFD'), false, `${file} contains replacement character`);
	}

	const catalog = readFileSync(join(src, 'lib/products.ts'), 'utf8');
	assert.match(catalog, /ANUVÉ/);
	assert.match(catalog, /bitácora/);
	assert.match(catalog, /diseño/);
	assert.doesNotMatch(catalog, /ANUVE[^É]|Ã‰|Ã¡|Ã©/);
});

test('method headings use correct Spanish spellings', () => {
	const method = readFileSync(join(src, 'components/Method.astro'), 'utf8');
	const nosotros = readFileSync(join(src, 'pages/nosotros.astro'), 'utf8');
	const tree = method + nosotros;

	assert.match(tree, /Cómo/);
	assert.match(tree, /Método/);
	assert.match(method, /Diagnóstico/);
	assert.match(method, /Implementación/);
	assert.doesNotMatch(tree, /CÃ³mo|MÃ©todo|DiagnÃ³stico|ImplementaciÃ³n/);
});
