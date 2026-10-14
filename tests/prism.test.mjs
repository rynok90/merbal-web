import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
	PRISM_AMBER,
	PRISM_HOVER_RADIUS,
	PRISM_IDLE_SPEED,
	PRISM_LINE,
	PRISM_LINE_LOOP_MS,
	PRISM_TEAL,
	heroPrismFrame,
	idleRotation,
	internalDashOffset,
	internalLinePhase,
	prismLineColors,
	projectPrism,
} from '../src/lib/prism.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

test('idle rotation advances X, Y, and Z without a pointer argument', () => {
	assert.equal(idleRotation.length, 1);
	assert.ok(PRISM_IDLE_SPEED.x > 0);
	assert.ok(PRISM_IDLE_SPEED.y > 0);
	assert.ok(PRISM_IDLE_SPEED.z > 0);

	const start = idleRotation(0);
	const later = idleRotation(1000);
	assert.ok(later.x > start.x);
	assert.ok(later.y > start.y);
	assert.ok(later.z > start.z);

	const frame = heroPrismFrame(1000, [], null);
	assert.deepEqual(frame.rotation, later);

	const flat = projectPrism(0, 480, 420);
	const turned = projectPrism(1400, 480, 420);
	assert.equal(flat.length, turned.length);
	assert.ok(
		flat.some((point, index) => {
			const next = turned[index];
			return Math.abs(point.x - next.x) > 0.5 || Math.abs(point.y - next.y) > 0.5;
		}),
	);
});

test('internal line phase repeats and drives a looping dash', () => {
	assert.equal(internalLinePhase(0), 0);
	assert.equal(internalLinePhase(PRISM_LINE_LOOP_MS), 0);
	assert.equal(internalLinePhase(PRISM_LINE_LOOP_MS * 3), 0);
	const quarter = internalLinePhase(PRISM_LINE_LOOP_MS * 0.25);
	const three = internalLinePhase(PRISM_LINE_LOOP_MS * 0.75);
	assert.ok(quarter > 0.24 && quarter < 0.26);
	assert.ok(three > quarter);
	assert.ok(three < 1);
	assert.equal(internalDashOffset(0), internalDashOffset(1));
	assert.notEqual(internalDashOffset(0), internalDashOffset(0.5));
	assert.equal(heroPrismFrame(PRISM_LINE_LOOP_MS, [], null).phase, 0);
});

test('only lines near the cursor become amber or teal', () => {
	const points = [
		{ x: 0, y: 0 },
		{ x: 20, y: 0 },
		{ x: 400, y: 360 },
	];
	const colors = prismLineColors(points, { x: 0, y: 0 }, PRISM_HOVER_RADIUS);
	assert.equal(colors[0], PRISM_AMBER);
	assert.equal(colors[0], '#F5A524');
	assert.equal(colors[1], PRISM_TEAL);
	assert.ok(colors[1].toLowerCase() !== '#f5a524');
	assert.equal(colors[2], PRISM_LINE);
	assert.equal(colors[2], '#2B8CFF');
	assert.notEqual(colors[2], PRISM_AMBER);
	assert.notEqual(colors[2], PRISM_TEAL);

	const idle = prismLineColors(points, null);
	assert.ok(idle.every((color) => color !== PRISM_AMBER && color !== PRISM_TEAL));

	const frame = heroPrismFrame(500, points, { x: 0, y: 0 });
	assert.deepEqual(frame.colors, colors);
	assert.deepEqual(frame.rotation, idleRotation(500));
});

test('hero client calls the shipped prism helpers and boots without module or require', async () => {
	const client = read('src/lib/hero-prism-client.ts');
	const hero = read('src/components/Hero.astro');
	assert.match(client, /from '\.\/prism\.ts'/);
	assert.match(client, /heroPrismFrame/);
	assert.match(client, /projectPrism/);
	assert.match(client, /internalDashOffset/);
	assert.match(client, /bootHeroPrism/);
	assert.doesNotMatch(client, /\brequire\s*\(/);
	assert.doesNotMatch(client, /module\.exports/);
	assert.match(hero, /bootHeroPrism/);
	assert.match(hero, /data-hero-prism/);
	assert.doesNotMatch(hero, /three\.js/i);

	const previousWindow = globalThis.window;
	const previousDocument = globalThis.document;
	globalThis.window = globalThis;
	globalThis.document = {
		readyState: 'complete',
		querySelector() {
			return null;
		},
		querySelectorAll() {
			return [];
		},
		addEventListener() {},
	};
	try {
		assert.equal(globalThis.module, undefined);
		assert.equal(globalThis.require, undefined);
		const loaded = await import('../src/lib/hero-prism-client.ts');
		assert.equal(typeof loaded.bootHeroPrism, 'function');
		loaded.bootHeroPrism();
	} finally {
		if (previousWindow === undefined) delete globalThis.window;
		else globalThis.window = previousWindow;
		if (previousDocument === undefined) delete globalThis.document;
		else globalThis.document = previousDocument;
	}
});
