export type NavLink = {
	href: string;
	label: string;
};

export const NAV_LINKS: NavLink[] = [
	{ href: '/', label: 'Inicio' },
	{ href: '/seguridad-electronica', label: 'Seguridad' },
	{ href: '/infraestructura-de-red', label: 'Red' },
	{ href: '/software', label: 'Software' },
	{ href: '/nosotros', label: 'Nosotros' },
	{ href: '/contacto', label: 'Contacto' },
];

export const CONTACT_PATH = '/contacto';

export const ROUTES = [
	'/',
	'/seguridad-electronica',
	'/infraestructura-de-red',
	'/software',
	'/nosotros',
	'/contacto',
] as const;

export function isActivePath(currentPath: string, href: string): boolean {
	if (href === '/') return currentPath === '/';
	return currentPath === href || currentPath.startsWith(`${href}/`);
}
