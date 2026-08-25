import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HEADER_SCROLL_THRESHOLD, isHeaderScrolled } from '../src/lib/header-scroll.ts';

test('isHeaderScrolled is false at the top and true past the threshold', () => {
	assert.equal(isHeaderScrolled(0), false);
	assert.equal(isHeaderScrolled(HEADER_SCROLL_THRESHOLD), false);
	assert.equal(isHeaderScrolled(HEADER_SCROLL_THRESHOLD + 1), true);
	assert.equal(isHeaderScrolled(480), true);
});
