import type { CrossPointTransport, DeviceConfig, DeviceStatus, UploadResult } from './types';
import { HttpUploadTransport } from './http';
import { WebSocketUploadTransport } from './websocket';
import { DeviceTimeoutError, DeviceUnavailableError, SettingsUpdateError } from './errors';

const STATUS_TIMEOUT_MS = 1500;
const SETTINGS_TIMEOUT_MS = 5000;
const DELETE_TIMEOUT_MS = 5000;

/** Root sleep image: takes priority over /.sleep/ directory images. */
export const SLEEP_IMAGE_FILENAME = 'sleep.bmp';
/** CrossPointSettings.h: SLEEP_SCREEN_MODE { DARK=0, LIGHT=1, CUSTOM=2, ... } */
export const SLEEP_SCREEN_CUSTOM = 2;

function joinPath(dir: string, filename: string): string {
	return `${dir.replace(/\/+$/, '')}/${filename}`;
}

export class CrossPointClient {
	private transport: CrossPointTransport;

	constructor(private config: DeviceConfig) {
		this.transport =
			config.transport === 'websocket'
				? new WebSocketUploadTransport(config.baseUrl)
				: new HttpUploadTransport(config.baseUrl);
	}

	async status(): Promise<DeviceStatus> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS);
		try {
			const res = await fetch(`${this.config.baseUrl}/api/status`, {
				signal: controller.signal
			});
			if (!res.ok) throw new DeviceUnavailableError();
			return (await res.json()) as DeviceStatus;
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') {
				throw new DeviceTimeoutError();
			}
			throw new DeviceUnavailableError();
		} finally {
			clearTimeout(timer);
		}
	}

	async upload(file: Blob, filename: string, path?: string): Promise<UploadResult> {
		const dest = path ?? this.config.uploadPath;
		// The device rejects uploads when the file already exists
		// ("File already exists"), so delete any previous version first.
		await this.deleteFile(joinPath(dest, filename));
		return this.transport.upload(file, filename, dest);
	}

	/**
	 * Delete a file via POST /delete. Failures are ignored (the file may
	 * simply not exist yet).
	 */
	async deleteFile(path: string): Promise<void> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), DELETE_TIMEOUT_MS);
		try {
			await fetch(`${this.config.baseUrl}/delete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ path }),
				signal: controller.signal
			});
		} catch {
			// Non-fatal: proceed with the upload attempt regardless.
		} finally {
			clearTimeout(timer);
		}
	}

	/**
	 * Make the card show whenever the device sleeps ("cover"):
	 * 1. Upload the image as /sleep.bmp (takes priority in "Custom" sleep mode).
	 * 2. Set the sleepScreen setting to Custom (index 2 in CrossPointSettings.h).
	 *
	 * CrossPoint exposes no "display image now" endpoint, so this is the
	 * supported way to pin an image to the screen.
	 */
	async setAsSleepScreen(file: Blob): Promise<void> {
		await this.upload(file, SLEEP_IMAGE_FILENAME, '/');
		await this.applySettings({ sleepScreen: SLEEP_SCREEN_CUSTOM });
	}

	/** Apply a partial settings update via POST /api/settings. */
	async applySettings(settings: Record<string, number | string>): Promise<void> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), SETTINGS_TIMEOUT_MS);
		try {
			const res = await fetch(`${this.config.baseUrl}/api/settings`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(settings),
				signal: controller.signal
			});
			if (!res.ok) {
				throw new SettingsUpdateError(`HTTP ${res.status}`);
			}
		} catch (err) {
			if (err instanceof SettingsUpdateError) throw err;
			if (err instanceof DOMException && err.name === 'AbortError') {
				throw new DeviceTimeoutError();
			}
			throw new SettingsUpdateError(err instanceof Error ? err.message : String(err));
		} finally {
			clearTimeout(timer);
		}
	}
}
