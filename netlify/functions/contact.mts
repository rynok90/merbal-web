import { handleContactRequest } from '../../src/lib/contact.ts';

export default async (req: Request, context: { ip?: string }) => {
	return handleContactRequest(req, {
		getApiKey: () => process.env.RESEND_API_KEY,
		getClientKey: (request) =>
			context?.ip ||
			request.headers.get('x-nf-client-connection-ip') ||
			request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			'unknown',
	});
};
