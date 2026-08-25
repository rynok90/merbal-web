export const CONTACT_EMAIL = 'merbal.tech.comercial@gmail.com';

export type ContactPayload = {
	name: string;
	email: string;
	company: string;
	message: string;
};

export function payloadFromFormData(data: FormData): ContactPayload {
	return {
		name: String(data.get('nombre') ?? '').trim(),
		email: String(data.get('email') ?? '').trim(),
		company: String(data.get('empresa') ?? '').trim(),
		message: String(data.get('mensaje') ?? '').trim(),
	};
}

export function buildMailtoUrl(payload: ContactPayload, to: string = CONTACT_EMAIL): string {
	const who = payload.company ? `${payload.name} · ${payload.company}` : payload.name;
	const subject = `Solicitud de asesoría MERBAL — ${who}`;
	const body = [
		'Solicitud desde merbal.tech',
		'',
		`Nombre: ${payload.name}`,
		`Email: ${payload.email}`,
		`Empresa: ${payload.company || '—'}`,
		'',
		'Mensaje:',
		payload.message,
	].join('\n');

	const query = new URLSearchParams({ subject, body }).toString().replaceAll('+', '%20');
	return `mailto:${to}?${query}`;
}
