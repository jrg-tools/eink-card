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
	transport: 'http' | 'websocket';
	uploadPath: string;
	/** Also upload the card as /sleep.bmp and switch the sleep screen to Custom. */
	setAsSleepScreen: boolean;
}

export const defaultDeviceConfig: DeviceConfig = {
	baseUrl: 'http://crosspoint.local',
	transport: 'http',
	uploadPath: '/',
	setAsSleepScreen: true
};

export type ConnectionState = 'unknown' | 'checking' | 'connected' | 'disconnected' | 'unsupported';

export interface CrossPointTransport {
	upload(file: Blob, filename: string, path?: string): Promise<UploadResult>;
}
