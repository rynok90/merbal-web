import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	applyMethodProgress,
	isMethodStepActive,
	isMethodStepCurrent,
	methodHeadPoint,
	methodLineScale,
	methodStrokeOffset,
} from '../src/lib/method-progress.ts';

function fakeSteps(count = 4) {
	return Array.from({ length: count }, () => {
		const flags = new Set();
		return {
			classList: {
				toggle(token, force) {
					if (force) flags.add(token);
					else flags.delete(token);
				},
				has(token) {
					return flags.has(token);
				},
			},
		};
	});
}

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
	assert.equal(isMethodStepActive(1 / 3, 0), true);
	assert.equal(isMethodStepActive(1 / 3, 1), true);
	assert.equal(isMethodStepActive(1 / 3, 2), false);
	assert.equal(isMethodStepActive(1, 0), true);
	assert.equal(isMethodStepActive(1, 3), true);
});

test('isMethodStepCurrent marks only the leading active step', () => {
	assert.equal(isMethodStepCurrent(0, 0), true);
	assert.equal(isMethodStepCurrent(0, 1), false);
	assert.equal(isMethodStepCurrent(1 / 3, 0), false);
	assert.equal(isMethodStepCurrent(1 / 3, 1), true);
	assert.equal(isMethodStepCurrent(1 / 3, 2), false);
	assert.equal(isMethodStepCurrent(1, 2), false);
	assert.equal(isMethodStepCurrent(1, 3), true);
});

test('applyMethodProgress toggles is-active on the real step contract', () => {
	const steps = fakeSteps();

	applyMethodProgress(steps, 0);
	assert.equal(steps[0].classList.has('is-active'), true);
	assert.equal(steps[0].classList.has('is-current'), true);
	assert.equal(steps[1].classList.has('is-active'), false);
	assert.equal(steps[2].classList.has('is-active'), false);
	assert.equal(steps[3].classList.has('is-active'), false);

	applyMethodProgress(steps, 1 / 3);
	assert.equal(steps[0].classList.has('is-active'), true);
	assert.equal(steps[1].classList.has('is-active'), true);
	assert.equal(steps[1].classList.has('is-current'), true);
	assert.equal(steps[2].classList.has('is-active'), false);
	assert.equal(steps[3].classList.has('is-active'), false);

	applyMethodProgress(steps, 1);
	assert.equal(steps.every((step) => step.classList.has('is-active')), true);
	assert.equal(steps[3].classList.has('is-current'), true);
	assert.equal(steps[0].classList.has('is-current'), false);
});

test('methodStrokeOffset draws the line from full hidden to fully drawn', () => {
	assert.equal(methodStrokeOffset(0, 200), 200);
	assert.equal(methodStrokeOffset(0.5, 200), 100);
	assert.equal(methodStrokeOffset(1, 200), 0);
	assert.equal(methodStrokeOffset(-1, 200), 200);
});

test('methodHeadPoint interpolates along the shipped line from progress', () => {
	assert.deepEqual(methodHeadPoint(0, 10, 20, 110, 20), { x: 10, y: 20 });
	assert.deepEqual(methodHeadPoint(1, 10, 20, 110, 20), { x: 110, y: 20 });
	assert.deepEqual(methodHeadPoint(0.5, 0, 0, 40, 40), { x: 20, y: 20 });
});

