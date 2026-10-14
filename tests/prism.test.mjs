import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PLATFORM_VERTICALS } from '../src/lib/products.ts';
import {
	PRISM_AMBER,
	PRISM_BLUE,
	PRISM_BLUE_SOFT,
	PRISM_DESKTOP_NODE_COUNT,
	PRISM_FLOAT_SPEED,
	PRISM_HOVER_RADIUS,
	PRISM_IDLE_SPEED,
	PRISM_LINE,
	PRISM_LINE_LOOP_MS,
	PRISM_MOBILE_NODE_COUNT,
	PRISM_NODE_TEAL,
	PRISM_PULSE_CYCLE_MS,
	PRISM_PULSE_WINDOW,
	PRISM_TEAL,
	heroPrismFrame,
	idleRotation,
	internalDashOffset,
	internalLinePhase,
	prismFloat,
	prismHoverColor,
	prismLinkColor,
	prismLinks,
	prismLineColors,
	prismMotionAllowed,
	prismNodeCount,
	prismNodes,
	prismPulseLinkIndex,
	prismPulsePhase,
	projectPrism,
} from '../src/lib/prism.ts';
import { GLASS_ROUGHNESS, GLASS_TRANSMISSION, createGlassMaterial } from '../src/lib/hero-prism-client.ts';

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

test('desktop nodes stay in 25–40, mobile uses fewer, and colors are blue or teal', () => {
	assert.ok(PRISM_DESKTOP_NODE_COUNT >= 25 && PRISM_DESKTOP_NODE_COUNT <= 40);
	assert.ok(PRISM_MOBILE_NODE_COUNT < PRISM_DESKTOP_NODE_COUNT);
	assert.ok(PRISM_MOBILE_NODE_COUNT < 25);

	const desktop = prismNodes(1280);
	const mobile = prismNodes(390);
	assert.equal(desktop.length, prismNodeCount(1280));
	assert.equal(mobile.length, prismNodeCount(390));
	assert.equal(desktop.length, PRISM_DESKTOP_NODE_COUNT);
	assert.equal(mobile.length, PRISM_MOBILE_NODE_COUNT);
	assert.ok(mobile.length < desktop.length);

	const allowed = new Set([PRISM_BLUE, PRISM_BLUE_SOFT, PRISM_NODE_TEAL]);
	assert.equal(PRISM_BLUE, '#2B8CFF');
	assert.equal(PRISM_BLUE_SOFT, '#3B82F6');
	assert.equal(PRISM_NODE_TEAL, '#14B8A6');
	for (const node of desktop) {
		assert.ok(allowed.has(node.color));
		assert.ok(Math.abs(node.x) < 0.8 && Math.abs(node.y) < 0.8 && Math.abs(node.z) < 0.8);
	}
	assert.ok(desktop.some((node) => node.color === '#2B8CFF'));
	assert.ok(desktop.some((node) => node.color === '#3B82F6'));
	assert.ok(desktop.some((node) => node.color === '#14B8A6'));

	const links = prismLinks(desktop);
	assert.ok(links.length > 0);
	assert.ok(links.length < desktop.length * 3);
	assert.ok(links.every((link) => link.a !== link.b && link.a >= 0 && link.b < desktop.length));
	assert.equal(prismLinkColor(0), '#2B8CFF');
	assert.equal(prismLinkColor(1), '#14B8A6');
});

test('vertical float, pulse phase, and motion gates stay pure functions of time and visibility', () => {
	assert.equal(prismFloat(0), 0);
	assert.equal(prismFloat(Number.NaN), 0);
	const early = prismFloat(420);
	const later = prismFloat(1600);
	assert.notEqual(early, later);
	assert.ok(Math.abs(early) < 0.2);
	assert.ok(Math.abs(later) < 0.2);
	assert.ok(Math.abs(prismFloat((Math.PI * 2 * 1000) / PRISM_FLOAT_SPEED)) < 1e-9);

	assert.equal(prismPulsePhase(0), 0);
	assert.equal(prismPulsePhase(PRISM_PULSE_CYCLE_MS), 0);
	const quietAt = PRISM_PULSE_CYCLE_MS * ((PRISM_PULSE_WINDOW + 1) / 2);
	assert.equal(prismPulsePhase(quietAt), -1);
	const traveling = prismPulsePhase(PRISM_PULSE_CYCLE_MS * (PRISM_PULSE_WINDOW / 2));
	assert.ok(traveling > 0.4 && traveling < 0.6);
	assert.equal(prismPulseLinkIndex(0, 5), 0);
	assert.notEqual(prismPulseLinkIndex(PRISM_PULSE_CYCLE_MS, 5), prismPulseLinkIndex(0, 5));

	assert.equal(prismMotionAllowed(true, true), false);
	assert.equal(prismMotionAllowed(false, false), false);
	assert.equal(prismMotionAllowed(false, true), true);
});

test('nearest nodes and lines turn amber and far marks keep blue or teal', () => {
	assert.equal(prismHoverColor({ x: 4, y: 2 }, '#2B8CFF', { x: 0, y: 0 }, PRISM_HOVER_RADIUS), PRISM_AMBER);
	assert.equal(prismHoverColor({ x: 4, y: 2 }, '#14B8A6', { x: 0, y: 0 }), '#F5A524');
	assert.equal(prismHoverColor({ x: 400, y: 20 }, '#3B82F6', { x: 0, y: 0 }), '#3B82F6');
	assert.equal(prismHoverColor({ x: 400, y: 20 }, '#14B8A6', { x: 0, y: 0 }), PRISM_NODE_TEAL);
	assert.equal(prismHoverColor({ x: 0, y: 0 }, '#2B8CFF', null), PRISM_BLUE);
	assert.notEqual(prismHoverColor({ x: 400, y: 0 }, '#14B8A6', { x: 0, y: 0 }), PRISM_AMBER);
});

test('glass material is physical, highly transmissive, and lightly rough', () => {
	const material = createGlassMaterial();
	assert.equal(material.isMeshPhysicalMaterial, true);
	assert.equal(material.transmission, GLASS_TRANSMISSION);
	assert.ok(Math.abs(material.transmission - 0.9) < 0.05);
	assert.equal(material.roughness, GLASS_ROUGHNESS);
	assert.ok(material.roughness < 0.15);
	material.dispose();
});

test('hero client calls the shipped prism helpers and boots without module or require', async () => {
	const client = read('src/lib/hero-prism-client.ts');
	const hero = read('src/components/Hero.astro');
	const layout = read('src/layouts/Layout.astro');
	const css = read('src/styles/global.css');
	assert.match(client, /from '\.\/prism\.ts'/);
	assert.match(client, /idleRotation/);
	assert.match(client, /prismFloat/);
	assert.match(client, /prismNodes/);
	assert.match(client, /prismLinks/);
	assert.match(client, /prismPulsePhase/);
	assert.match(client, /prismHoverColor/);
	assert.match(client, /prismMotionAllowed/);
	assert.match(client, /MeshPhysicalMaterial/);
	assert.match(client, /transmission:\s*GLASS_TRANSMISSION/);
	assert.match(client, /alpha:\s*true/);
	assert.match(client, /scene\.background\s*=\s*null/);
	assert.match(client, /bootHeroPrism/);
	assert.doesNotMatch(client, /#060d18/);
	assert.doesNotMatch(client, /fillRect/);
	assert.doesNotMatch(client, /getContext\(\s*['"]2d['"]\s*\)/);
	assert.doesNotMatch(client, /\brequire\s*\(/);
	assert.doesNotMatch(client, /module\.exports/);
	assert.doesNotMatch(client, /three\.js/i);
	assert.match(hero, /bootHeroPrism/);
	assert.match(hero, /data-hero-prism/);
	assert.doesNotMatch(hero, /three\.js/i);
	assert.doesNotMatch(layout + css, /three\.js/i);
	assert.match(css, /\.hero-prism-stage::before/);
	assert.match(css, /20 184 166/);
	assert.match(css, /\.hero-prism[\s\S]*background:\s*transparent/);

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
		loaded.bootHeroPrism();
	} finally {
		if (previousWindow === undefined) delete globalThis.window;
		else globalThis.window = previousWindow;
		if (previousDocument === undefined) delete globalThis.document;
		else globalThis.document = previousDocument;
	}
});

test('home plataformas teaser is two layered cards, not the five-product catalog', () => {
	const pillars = read('src/components/Pillars.astro');
	const home = read('src/pages/index.astro');
	const css = read('src/styles/global.css');
	const names = PLATFORM_VERTICALS.map((vertical) => vertical.name);
	assert.deepEqual(names, ['Operación de sitios', 'Negocios de servicio']);
	assert.equal(PLATFORM_VERTICALS.length, 2);
	assert.match(pillars, /PLATFORM_VERTICALS\.map/);
	assert.match(pillars, /href=\{vertical\.href\}/);
	assert.match(pillars, /platform-icon/);
	assert.match(pillars, /<svg/);
	assert.match(pillars, /platform-card-layer/);
	assert.match(pillars, /platform-card-layer-2/);
	assert.match(pillars, /platform-card/);
	assert.match(pillars, /home-platform-card/);
	assert.match(css, /\.platform-card:hover/);
	assert.match(css, /rotateX\(4deg\) rotateY\(-6deg\)/);
	assert.match(css, /drop-shadow\(0 0 22px/);
	assert.match(css, /\.home-platform-card:hover/);
	assert.doesNotMatch(home, /<Platforms/);
	assert.doesNotMatch(pillars, /showcaseProducts/);
	assert.doesNotMatch(pillars, /Access Paperless/);
	assert.doesNotMatch(pillars, /SecureFlow/);
	assert.doesNotMatch(pillars, /ActivoObra/);
	assert.doesNotMatch(pillars, /Safe Access/);
});
