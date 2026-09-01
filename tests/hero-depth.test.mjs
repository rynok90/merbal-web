import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
	HERO_FOLLOW_LAG,
	HERO_LERP,
	HERO_MOBILE_QUERY,
	delayedFollow,
	heroScrollOffset,
	heroTiltFromPointer,
	lerp,
	shouldSkipHeroDepth,
} from '../src/lib/hero-depth.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
	return readFileSync(join(root, rel), 'utf8');
}

test('lerp steps toward the target without reaching it in one tick', () => {
	const next = lerp(0, 10, HERO_LERP);
	assert.ok(next > 0, 'lerp should move off the start');
	assert.ok(next < 10, 'lerp should not snap to the target in one tick');
	assert.equal(lerp(4, 4, HERO_LERP), 4);
});

test('hero tilt and scroll offset stay small and follow pointer/scroll', () => {
	const rest = heroTiltFromPointer(0, 0);
	assert.equal(rest.rx, 0);
	assert.equal(rest.ry, 0);

	const tilt = heroTiltFromPointer(1, -0.5);
	assert.ok(tilt.ry > 0);
	assert.ok(tilt.rx < 0);
	assert.ok(Math.abs(tilt.rx) < 8);
	assert.ok(Math.abs(tilt.ry) < 10);

	assert.equal(heroScrollOffset(0), 0);
	const shift = heroScrollOffset(200);
	assert.ok(shift > 0, 'scroll displacement should be non-zero');
	assert.ok(shift < 40, 'scroll displacement should stay slight');
	assert.ok(heroScrollOffset(10_000) <= 28);
});

test('delayed particle follow lags the cursor', () => {
	const step = delayedFollow(0, 0, 100, 50, HERO_FOLLOW_LAG);
	assert.ok(step.x > 0 && step.x < 100);
	assert.ok(step.y > 0 && step.y < 50);
	const later = delayedFollow(step.x, step.y, 100, 50, HERO_FOLLOW_LAG);
	assert.ok(later.x > step.x);
	assert.ok(later.x < 100);
});

test('reduced-motion and mobile skip the hero depth set-piece', () => {
	assert.equal(shouldSkipHeroDepth({ reducedMotion: true, isMobile: false }), true);
	assert.equal(shouldSkipHeroDepth({ reducedMotion: false, isMobile: true }), true);
	assert.equal(shouldSkipHeroDepth({ reducedMotion: true, isMobile: true }), true);
	assert.equal(shouldSkipHeroDepth({ reducedMotion: false, isMobile: false }), false);
	assert.equal(HERO_MOBILE_QUERY, '(max-width: 767px)');
});

test('Hero copy and CSS grid stay the motion surface; no hero-layers JPGs', () => {
	const hero = read('src/components/Hero.astro');
	const motion = read('src/components/Motion.astro');
	const css = read('src/styles/global.css');

	assert.match(hero, /Expertise en campo/);
	assert.match(hero, /Hablar con un especialista/);
	assert.match(hero, /Ver pilares/);
	assert.match(hero, /hero-tech-grid/);
	assert.match(hero, /hero-tech-node/);
	assert.doesNotMatch(hero, /hero-layers/);
	assert.doesNotMatch(hero + motion + css, /hero-layers/);

	assert.match(motion, /from ['"]\.\.\/lib\/hero-depth['"]/);
	assert.match(motion, /shouldSkipHeroDepth/);
	assert.match(motion, /heroTiltFromPointer/);
	assert.match(motion, /heroScrollOffset/);
	assert.match(motion, /delayedFollow/);
	assert.match(motion, /hero-tech-grid/);
	assert.match(motion, /hero-tech-node/);
	assert.match(css, /--hero-tilt-x/);
	assert.match(css, /--hero-follow-x/);
	assert.match(css, /prefers-reduced-motion/);
});
