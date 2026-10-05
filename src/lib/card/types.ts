export type Orientation = 'portrait' | 'landscape';

export type DeviceModel = 'X3' | 'X4' | 'X4_PRO' | 'X4_CLASSIC';

export interface DeviceSpec {
	/** Native panel width in portrait orientation. */
	width: number;
	/** Native panel height in portrait orientation. */
	height: number;
	label: string;
	/** Compact name for the device selector and status badge. */
	short: string;
	/**
	 * Lower-cased identifiers CrossPoint may report in `/api/status` `device`:
	 * legacy C3 builds send "X3"/"X4", newer builds send the FreeInk board name.
	 */
	aliases: string[];
}

export const DEVICES: Record<DeviceModel, DeviceSpec> = {
	X3: {
		width: 528,
		height: 792,
		label: 'Xteink X3',
		short: 'X3',
		aliases: ['x3', 'xteink_x3', 'xteink_x3_uc8279']
	},
	X4: { width: 480, height: 800, label: 'Xteink X4', short: 'X4', aliases: ['x4', 'xteink_x4'] },
	X4_PRO: {
		width: 480,
		height: 800,
		label: 'Xteink X4 Pro',
		short: 'X4 PRO',
		aliases: ['xteink_x4_pro', 'x4_pro', 'x4pro']
	},
	X4_CLASSIC: {
		width: 480,
		height: 800,
		label: 'Xteink X4 Classic',
		short: 'X4 CLASSIC',
		aliases: ['xteink_x4_classic', 'x4_classic', 'x4classic', 'x4c']
	}
};

export const DEVICE_MODELS = Object.keys(DEVICES) as DeviceModel[];

export function isDeviceModel(value: unknown): value is DeviceModel {
	return typeof value === 'string' && Object.hasOwn(DEVICES, value);
}

/** Map a device identifier reported by CrossPoint to a supported model, if any. */
export function resolveDeviceModel(reported: string | undefined | null): DeviceModel | undefined {
	if (!reported) return undefined;
	const id = reported.trim().toLowerCase();
	return DEVICE_MODELS.find((model) => DEVICES[model].aliases.includes(id));
}

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
