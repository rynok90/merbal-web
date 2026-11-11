export type DistributedBrand = {
	name: string;
	src: string;
	href?: string;
};

/**
 * Logos oficiales de marcas distribuidas.
 * La lista vacía oculta la franja: no se publican huecos ni nombres inventados.
 */
export const DISTRIBUTED_BRANDS: DistributedBrand[] = [];
