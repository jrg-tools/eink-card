import type { BusinessCard } from './types';

export const defaultCard: BusinessCard = {
	orientation: 'portrait',
	name: '',
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
	},
	template: 'minimal'
};
