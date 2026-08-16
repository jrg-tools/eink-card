export type Orientation = 'portrait' | 'landscape';

export interface BusinessCard {
	orientation: Orientation;
	name: string;
	nickname?: string;
	role?: string;
	company?: string;
	email?: string;
	phone?: string;
	website?: string;
	linkedin?: string;
	github?: string;
	location?: string;
	tagline?: string;
	qr?: {
		enabled: boolean;
		value: string;
		label?: string;
	};
}

export const X3_WIDTH = 528;
export const X3_HEIGHT = 792;
