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

function astroFiles(dir, acc = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) astroFiles(path, acc);
		else if (entry.name.endsWith('.astro')) acc.push(path);
	}
	return acc;
}

test('every src .astro file is valid Spanish Unicode without mojibake', () => {
	const files = astroFiles(src);
	assert.ok(files.length > 0, 'expected src/**/*.astro files');

	for (const file of files) {
		const text = readFileSync(file, 'utf8');
		for (const token of MOJIBAKE) {
			assert.equal(text.includes(token), false, `${file} contains mojibake token ${JSON.stringify(token)}`);
		}
		assert.equal(text.includes('\uFFFD'), false, `${file} contains replacement character`);
	}
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
