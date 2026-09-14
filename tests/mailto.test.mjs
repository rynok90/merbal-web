import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { CONTACT_EMAIL } from '../src/lib/mailto.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('CONTACT_EMAIL is the MERBAL soporte inbox', () => {
	assert.equal(CONTACT_EMAIL, 'soporte@merbal.lat');
	const helper = readFileSync(join(root, 'src/lib/mailto.ts'), 'utf8');
	assert.doesNotMatch(helper, /buildMailtoUrl/);
	assert.doesNotMatch(helper, /merbal\.tech\.comercial@gmail\.com/);
});
