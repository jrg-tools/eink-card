import { browser } from '$app/environment';
import { isDeviceModel, type BusinessCard } from '$lib/card/types';
import { defaultCard } from '$lib/card/defaults';
import type { DeviceConfig } from '$lib/crosspoint/types';
import { defaultDeviceConfig } from '$lib/crosspoint/types';

const CARD_KEY = 'x3-business-card';
const DEVICE_KEY = 'x3-device-config';

export function loadCard(): BusinessCard {
	if (!browser) return structuredClone(defaultCard);
	try {
		const raw = localStorage.getItem(CARD_KEY);
		if (!raw) return structuredClone(defaultCard);
		const card = { ...structuredClone(defaultCard), ...(JSON.parse(raw) as Partial<BusinessCard>) };
		if (!isDeviceModel(card.device)) card.device = defaultCard.device;
		return card;
	} catch {
		return structuredClone(defaultCard);
	}
}

export function saveCard(card: BusinessCard): void {
	if (!browser) return;
	try {
		localStorage.setItem(CARD_KEY, JSON.stringify(card));
	} catch {
		// storage full / unavailable — non-fatal
	}
}

export function clearCard(): void {
	if (!browser) return;
	localStorage.removeItem(CARD_KEY);
}

export function loadDeviceConfig(): DeviceConfig {
	if (!browser) return { ...defaultDeviceConfig };
	try {
		const raw = localStorage.getItem(DEVICE_KEY);
		if (!raw) return { ...defaultDeviceConfig };
		return { ...defaultDeviceConfig, ...(JSON.parse(raw) as Partial<DeviceConfig>) };
	} catch {
		return { ...defaultDeviceConfig };
	}
}

export function saveDeviceConfig(config: DeviceConfig): void {
	if (!browser) return;
	try {
		localStorage.setItem(DEVICE_KEY, JSON.stringify(config));
	} catch {
		// non-fatal
	}
}
