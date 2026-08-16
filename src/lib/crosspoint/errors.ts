export class CrossPointError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'CrossPointError';
	}
}

export class DeviceUnavailableError extends CrossPointError {
	constructor() {
		super(
			'Device not detected. Make sure it is awake, CrossPoint File Transfer is active, and you are on the same Wi-Fi network.'
		);
		this.name = 'DeviceUnavailableError';
	}
}

export class UploadFailedError extends CrossPointError {
	constructor(detail?: string) {
		super(`Unable to send card. The device rejected the upload.${detail ? ` (${detail})` : ''}`);
		this.name = 'UploadFailedError';
	}
}

export class DeviceTimeoutError extends CrossPointError {
	constructor() {
		super('The device did not respond. Check that CrossPoint is still in File Transfer mode.');
		this.name = 'DeviceTimeoutError';
	}
}

export class SettingsUpdateError extends CrossPointError {
	constructor(detail?: string) {
		super(
			`Card uploaded, but could not update the sleep screen setting.${detail ? ` (${detail})` : ''}`
		);
		this.name = 'SettingsUpdateError';
	}
}
