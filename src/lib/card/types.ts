export type Orientation = 'portrait' | 'landscape';
export type TemplateId = 'minimal' | 'classic' | 'modern';

export interface BusinessCard {
	orientation: Orientation;
	name: string;
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
	template: TemplateId;
}

export interface RenderOptions {
	width: number;
	height: number;
	orientation: Orientation;
	template: string;
}

export const X3_WIDTH = 528;
export const X3_HEIGHT = 792;
