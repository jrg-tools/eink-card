export interface DeviceStatus {
	version: string;
	ip: string;
	mode: 'STA' | 'AP' | string;
	rssi: number;
	freeHeap: number;
	uptime: number;
	device: 'X3' | 'X4' | string;
}

export interface UploadResult {
	success: boolean;
	filename: string;
	response?: string;
}

export interface DeviceConfig {
	baseUrl: string;
	/** Upload the card into /.sleep/ and switch the sleep screen to Custom. */
	setAsSleepScreen: boolean;
}

export const defaultDeviceConfig: DeviceConfig = {
	baseUrl: 'http://crosspoint.local',
	setAsSleepScreen: true
};

export type ConnectionState = 'unknown' | 'checking' | 'connected' | 'disconnected' | 'unsupported';
