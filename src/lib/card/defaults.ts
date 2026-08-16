import type { BusinessCard } from './types';

export const defaultCard: BusinessCard = {
	device: 'X3',
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
