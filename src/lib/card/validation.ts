import type { BusinessCard } from './types';

export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

export function validateCard(card: BusinessCard): ValidationResult {
	const errors: string[] = [];

	if (!card.name || card.name.trim().length === 0) {
		errors.push('Name is required.');
	}
	if (card.orientation !== 'portrait' && card.orientation !== 'landscape') {
		errors.push('Invalid orientation.');
	}
	if (card.qr?.enabled && (!card.qr.value || card.qr.value.trim().length === 0)) {
		errors.push('QR code is enabled but has no content.');
	}

	return { valid: errors.length === 0, errors };
}

/** Shorten a URL to a readable label, e.g. "https://github.com/jorge/" -> "github.com/jorge" */
export function displayUrl(url: string): string {
	return url
		.trim()
		.replace(/^https?:\/\//i, '')
		.replace(/^www\./i, '')
		.replace(/\/+$/, '');
}
