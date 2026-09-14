import {
	CONTACT_FUNCTION_PATH,
	DIVISIONS,
	VERTICALS,
	type Division,
	type Vertical,
} from './contact-config.ts';
import { CONTACT_EMAIL } from './mailto.ts';

export { CONTACT_FUNCTION_PATH, DIVISIONS, VERTICALS };
export type { Division, Vertical };

export type ContactPayload = {
	nombre: string;
	email: string;
	empresa: string;
	mensaje: string;
	division: Division;
	vertical: Vertical | '';
	website?: string;
};

export type ComposedEmail = {
	from: string;
	to: string;
	reply_to: string;
	subject: string;
	text: string;
};

export type ContactEnv = {
	getApiKey?: () => string | undefined;
	getClientKey?: (req: Request) => string;
	now?: () => number;
	sendEmail?: (apiKey: string, email: ComposedEmail) => Promise<{ ok: boolean }>;
	rateLimiter?: { allow: (key: string, now?: number) => boolean };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createRateLimiter(max: number, windowMs: number) {
	const hits = new Map<string, number[]>();
	return {
		allow(key: string, now = Date.now()): boolean {
			const windowStart = now - windowMs;
			const prev = (hits.get(key) ?? []).filter((stamp) => stamp > windowStart);
			if (prev.length >= max) {
				hits.set(key, prev);
				return false;
			}
			prev.push(now);
			hits.set(key, prev);
			return true;
		},
		reset() {
			hits.clear();
		},
	};
}

export const contactRateLimiter = createRateLimiter(5, 60_000);

export function isDivision(value: string): value is Division {
	return (DIVISIONS as readonly string[]).includes(value);
}

export function isVertical(value: string): value is Vertical {
	return (VERTICALS as readonly string[]).includes(value);
}

export function parseContactPayload(
	input: unknown,
): { ok: true; value: ContactPayload } | { ok: false; error: string; status: number } {
	if (!input || typeof input !== 'object') {
		return { ok: false, error: 'Solicitud inválida.', status: 400 };
	}

	const body = input as Record<string, unknown>;
	const nombre = String(body.nombre ?? '').trim();
	const email = String(body.email ?? '').trim();
	const empresa = String(body.empresa ?? '').trim();
	const mensaje = String(body.mensaje ?? '').trim();
	const division = String(body.division ?? '').trim();
	const vertical = String(body.vertical ?? '').trim();
	const website = String(body.website ?? '').trim();

	if (website) {
		return {
			ok: true,
			value: {
				nombre: nombre || 'honeypot',
				email: email || 'honeypot@invalid.local',
				empresa,
				mensaje: mensaje || 'honeypot',
				division: isDivision(division) ? division : 'Plataformas',
				vertical: '',
				website,
			},
		};
	}

	if (!nombre || !email || !mensaje || !division) {
		return { ok: false, error: 'Faltan campos obligatorios.', status: 400 };
	}
	if (!EMAIL_RE.test(email)) {
		return { ok: false, error: 'El email no es válido.', status: 400 };
	}
	if (!isDivision(division)) {
		return { ok: false, error: 'La división no es válida.', status: 400 };
	}
	if (division === 'Plataformas') {
		if (!isVertical(vertical)) {
			return { ok: false, error: 'Elige una vertical de plataformas.', status: 400 };
		}
	} else if (vertical && !isVertical(vertical)) {
		return { ok: false, error: 'La vertical no es válida.', status: 400 };
	}

	return {
		ok: true,
		value: {
			nombre,
			email,
			empresa,
			mensaje,
			division,
			vertical: vertical && isVertical(vertical) ? vertical : '',
			website,
		},
	};
}

export function composeResendEmail(payload: ContactPayload): ComposedEmail {
	const empresa = payload.empresa || '—';
	const subject = `[MERBAL] ${payload.division} — ${payload.nombre} · ${empresa}`;
	const lines = [
		'Solicitud de demo o asesoría — merbal.lat',
		'',
		`Nombre: ${payload.nombre}`,
		`Email: ${payload.email}`,
		`Empresa: ${empresa}`,
		`División: ${payload.division}`,
		payload.vertical ? `Vertical: ${payload.vertical}` : '',
		'',
		'Mensaje:',
		payload.mensaje,
	].filter((line, index, all) => line !== '' || all[index - 1] !== '');

	return {
		from: 'Avisos MERBAL <avisos@avisos.merbal.lat>',
		to: CONTACT_EMAIL,
		reply_to: payload.email,
		subject,
		text: lines.join('\n'),
	};
}

export async function sendResendEmail(
	apiKey: string,
	email: ComposedEmail,
): Promise<{ ok: boolean }> {
	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			from: email.from,
			to: [email.to],
			reply_to: email.reply_to,
			subject: email.subject,
			text: email.text,
		}),
	});
	return { ok: response.ok };
}

function json(body: unknown, status: number): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
}

export async function handleContactRequest(
	req: Request,
	env: ContactEnv = {},
): Promise<Response> {
	try {
		if (req.method !== 'POST') {
			return json({ ok: false, error: 'Método no permitido.' }, 405);
		}

		const getApiKey = env.getApiKey ?? (() => process.env.RESEND_API_KEY);
		const getClientKey =
			env.getClientKey ??
			((request: Request) =>
				request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown');
		const now = env.now ?? Date.now;
		const sendEmail = env.sendEmail ?? sendResendEmail;
		const limiter = env.rateLimiter ?? contactRateLimiter;

		if (!limiter.allow(getClientKey(req), now())) {
			return json({ ok: false, error: 'Demasiadas solicitudes. Inténtalo de nuevo.' }, 429);
		}

		let raw: unknown;
		try {
			raw = await req.json();
		} catch {
			return json({ ok: false, error: 'Solicitud inválida.' }, 400);
		}

		const parsed = parseContactPayload(raw);
		if (!parsed.ok) {
			return json({ ok: false, error: parsed.error }, parsed.status);
		}

		if (parsed.value.website) {
			return json({ ok: true }, 200);
		}

		const apiKey = getApiKey();
		if (!apiKey) {
			return json(
				{ ok: false, error: 'El servicio de correo no está disponible. Inténtalo de nuevo.' },
				503,
			);
		}

		const email = composeResendEmail(parsed.value);
		const sent = await sendEmail(apiKey, email);
		if (!sent.ok) {
			return json({ ok: false, error: 'No se pudo enviar. Inténtalo de nuevo.' }, 503);
		}

		return json({ ok: true }, 200);
	} catch {
		return json({ ok: false, error: 'No se pudo enviar. Inténtalo de nuevo.' }, 503);
	}
}
