import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
	applyMethodProgress,
	isMethodStepActive,
	methodLineScale,
	methodStrokeOffset,
} from '../src/lib/method-progress.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('methodLineScale clamps scroll progress to 0–1', () => {
	assert.equal(methodLineScale(-1), 0);
	assert.equal(methodLineScale(0), 0);
	assert.equal(methodLineScale(0.4), 0.4);
	assert.equal(methodLineScale(1), 1);
	assert.equal(methodLineScale(2), 1);
});

test('isMethodStepActive activates the four steps in sequence along the line', () => {
	assert.equal(isMethodStepActive(0, 0), true);
	assert.equal(isMethodStepActive(0, 1), false);
	assert.equal(isMethodStepActive(0, 3), false);
	assert.equal(isMethodStepActive(1 / 3, 1), true);
	assert.equal(isMethodStepActive(1 / 3, 2), false);
	assert.equal(isMethodStepActive(1, 3), true);
});

test('applyMethodProgress toggles is-active on the real step contract', () => {
	const steps = [0, 1, 2, 3].map(() => {
		const flags = new Set();
		return {
			classList: {
				toggle(token, force) {
					if (token !== 'is-active') return;
					if (force) flags.add(token);
					else flags.delete(token);
				},
				has(token) {
					return flags.has(token);
				},
			},
		};
	});

	applyMethodProgress(steps, 0);
	assert.equal(steps[0].classList.has('is-active'), true);
	assert.equal(steps[3].classList.has('is-active'), false);

	applyMethodProgress(steps, 1);
	assert.equal(steps.every((step) => step.classList.has('is-active')), true);
});

test('methodStrokeOffset draws the line from full hidden to fully drawn', () => {
	assert.equal(methodStrokeOffset(0, 200), 200);
	assert.equal(methodStrokeOffset(0.5, 200), 100);
	assert.equal(methodStrokeOffset(1, 200), 0);
	assert.equal(methodStrokeOffset(-1, 200), 200);
});

test('Método section still exposes 01–04 with GSAP ScrollTrigger wiring', () => {
	const method = readFileSync(join(root, 'src/components/Method.astro'), 'utf8');
	const motion = readFileSync(join(root, 'src/components/Motion.astro'), 'utf8');

	assert.match(method, /id="metodo"/);
	assert.match(method, />\s*01\s*</);
	assert.match(method, />\s*02\s*</);
	assert.match(method, />\s*03\s*</);
	assert.match(method, />\s*04\s*</);
	assert.match(method, /Diagnóstico/);
	assert.match(method, /Diseño/);
	assert.match(method, /Implementación/);
	assert.match(method, /Acompañamiento/);
	assert.match(method, /lg:grid-cols-4/);

	assert.match(motion, /from ['"]gsap['"]/);
	assert.match(motion, /gsap\/ScrollTrigger/);
	assert.match(motion, /gsap\.registerPlugin\(ScrollTrigger\)/);
	assert.match(motion, /methodStrokeOffset/);
	assert.match(motion, /applyMethodProgress/);
	assert.match(motion, /stroke-dashoffset/);
});
