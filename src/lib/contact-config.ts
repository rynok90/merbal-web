export const CONTACT_FUNCTION_PATH = '/.netlify/functions/contact';

export const DIVISIONS = [
	'Seguridad electrónica',
	'Infraestructura de red',
	'Plataformas',
] as const;

export const VERTICALS = ['Operación de sitios', 'Negocios de servicio'] as const;

export type Division = (typeof DIVISIONS)[number];
export type Vertical = (typeof VERTICALS)[number];
