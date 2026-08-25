import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildMailtoUrl, CONTACT_EMAIL, payloadFromFormData } from '../src/lib/mailto.ts';

test('CONTACT_EMAIL is the MERBAL commercial inbox', () => {
	assert.equal(CONTACT_EMAIL, 'merbal.tech.comercial@gmail.com');
});

test('payloadFromFormData reads the shipped form field names', () => {
	const data = new FormData();
	data.set('nombre', '  Ana Pérez  ');
	data.set('email', 'ana@empresa.mx');
	data.set('empresa', 'Acme');
	data.set('mensaje', 'Necesito un diagnóstico');

	assert.deepEqual(payloadFromFormData(data), {
		name: 'Ana Pérez',
		email: 'ana@empresa.mx',
		company: 'Acme',
		message: 'Necesito un diagnóstico',
	});
});

test('buildMailtoUrl opens a mailto with encoded name, company, and message', () => {
	const url = buildMailtoUrl({
		name: 'Ana Pérez',
		email: 'ana@empresa.mx',
		company: 'Acme',
		message: 'Necesito un diagnóstico',
	});

	assert.equal(url.startsWith(`mailto:${CONTACT_EMAIL}?`), true);

	const query = url.slice(`mailto:${CONTACT_EMAIL}?`.length);
	const params = new URLSearchParams(query);
	const subject = params.get('subject') ?? '';
	const body = params.get('body') ?? '';

	assert.match(subject, /Ana Pérez/);
	assert.match(subject, /Acme/);
	assert.match(body, /ana@empresa.mx/);
	assert.match(body, /Necesito un diagnóstico/);
	assert.match(body, /Nombre: Ana Pérez/);
	assert.match(body, /Empresa: Acme/);
});
