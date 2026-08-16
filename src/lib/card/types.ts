export type Orientation = 'portrait' | 'landscape';

export type DeviceModel = 'X3' | 'X4';

export interface DeviceSpec {
	/** Native panel width in portrait orientation. */
	width: number;
	/** Native panel height in portrait orientation. */
	height: number;
	label: string;
}

export const DEVICES: Record<DeviceModel, DeviceSpec> = {
	X3: { width: 528, height: 792, label: 'Xteink X3' },
	X4: { width: 480, height: 800, label: 'Xteink X4' }
};

export const DEVICE_MODELS = Object.keys(DEVICES) as DeviceModel[];

export interface BusinessCard {
	device: DeviceModel;
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
