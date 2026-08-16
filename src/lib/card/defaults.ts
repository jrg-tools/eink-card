import type { BusinessCard } from './types';

export const defaultCard: BusinessCard = {
	orientation: 'portrait',
	name: '',
	nickname: '',
	role: '',
	company: '',
	email: '',
	phone: '',
	website: '',
	linkedin: '',
	github: '',
	location: '',
	tagline: '',
	qr: {
		enabled: false,
		value: ''
	}
};
