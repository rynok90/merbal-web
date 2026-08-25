import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CONTACT_PATH, isActivePath, NAV_LINKS, ROUTES } from '../src/lib/nav.ts';

test('NAV_LINKS covers the six real routes', () => {
	const hrefs = NAV_LINKS.map((link) => link.href);
	for (const route of ROUTES) {
		assert.ok(hrefs.includes(route), `missing nav href ${route}`);
	}
	assert.equal(CONTACT_PATH, '/contacto');
});

test('isActivePath matches current route without treating home as a prefix', () => {
	assert.equal(isActivePath('/', '/'), true);
	assert.equal(isActivePath('/software', '/'), false);
	assert.equal(isActivePath('/software', '/software'), true);
	assert.equal(isActivePath('/nosotros', '/software'), false);
	assert.equal(isActivePath('/seguridad-electronica', '/seguridad-electronica'), true);
});
