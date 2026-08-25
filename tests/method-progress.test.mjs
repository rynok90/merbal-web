import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	applyMethodProgress,
	isMethodStepActive,
	methodLineScale,
	methodStrokeOffset,
} from '../src/lib/method-progress.ts';

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
