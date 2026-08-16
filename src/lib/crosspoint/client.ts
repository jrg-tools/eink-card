import type { DeviceConfig, DeviceStatus, UploadResult } from './types';
import { HttpUploadTransport } from './http';
import { DeviceTimeoutError, DeviceUnavailableError, SettingsUpdateError } from './errors';

const STATUS_TIMEOUT_MS = 1500;
const SETTINGS_TIMEOUT_MS = 5000;
const REQUEST_TIMEOUT_MS = 5000;

/** Directory scanned for custom sleep images in "Custom" sleep mode. */
export const SLEEP_IMAGE_DIR = '/.sleep';
/** Legacy root sleep image: takes priority over /.sleep/ directory images. */
const LEGACY_ROOT_SLEEP_IMAGE = '/sleep.bmp';
/** CrossPointSettings.h: SLEEP_SCREEN_MODE { DARK=0, LIGHT=1, CUSTOM=2, ... } */
export const SLEEP_SCREEN_CUSTOM = 2;

export class CrossPointClient {
	private transport: HttpUploadTransport;

	constructor(private config: DeviceConfig) {
		this.transport = new HttpUploadTransport(config.baseUrl);
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

	/**
	 * Upload a file, deleting any existing file with the same name first
	 * (some firmware versions reject overwrites).
	 */
	async upload(file: Blob, filename: string, path?: string): Promise<UploadResult> {
		const dest = (path ?? '/').replace(/\/+$/, '') || '/';
		const target = dest === '/' ? `/${filename}` : `${dest}/${filename}`;
		if (await this.fileExists(target)) {
			await this.deleteFile(target);
		}
		return this.transport.upload(file, filename, dest);
	}

	/**
	 * List a directory via GET /api/files.
	 * Returns null when the directory does not exist or cannot be listed.
	 */
	async listFiles(dir: string): Promise<Array<{ name: string; isDirectory: boolean }> | null> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
		try {
			const res = await fetch(`${this.config.baseUrl}/api/files?path=${encodeURIComponent(dir)}`, {
				signal: controller.signal
			});
			if (!res.ok) return null;
			return (await res.json()) as Array<{ name: string; isDirectory: boolean }>;
		} catch {
			return null;
		} finally {
			clearTimeout(timer);
		}
	}

	/** Create a directory via POST /mkdir. */
	async mkdir(dir: string): Promise<void> {
		const clean = dir.replace(/\/+$/, '');
		const idx = clean.lastIndexOf('/');
		const parent = idx <= 0 ? '/' : clean.slice(0, idx);
		const name = clean.slice(idx + 1);
		if (!name) return;
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
		try {
			await fetch(`${this.config.baseUrl}/mkdir`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ name, path: parent }),
				signal: controller.signal
			});
		} catch {
			// Non-fatal: the upload attempt will surface any real problem.
		} finally {
			clearTimeout(timer);
		}
	}

	/** Check whether a file exists via GET /api/files on its parent directory. */
	async fileExists(path: string): Promise<boolean> {
		const idx = path.lastIndexOf('/');
		const parent = idx <= 0 ? '/' : path.slice(0, idx);
		const name = path.slice(idx + 1);
		const items = await this.listFiles(parent);
		return items?.some((it) => !it.isDirectory && it.name === name) ?? false;
	}

	/**
	 * Delete a file via POST /delete. Failures are ignored (the file may
	 * simply not exist yet).
	 */
	async deleteFile(path: string): Promise<void> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
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
	 * 1. List /.sleep; create it only if the listing fails (does not exist).
	 * 2. Upload the image once as /.sleep/<filename> (upload() deletes an
	 *    existing file with the same name first).
	 * 3. Remove a legacy root /sleep.bmp only if it actually exists
	 *    (it takes priority over /.sleep/ images).
	 * 4. Set the sleepScreen setting to Custom (index 2 in CrossPointSettings.h).
	 *
	 * CrossPoint exposes no "display image now" endpoint, so this is the
	 * supported way to pin an image to the screen.
	 */
	async setAsSleepScreen(file: Blob, filename: string): Promise<void> {
		if ((await this.listFiles(SLEEP_IMAGE_DIR)) === null) {
			await this.mkdir(SLEEP_IMAGE_DIR);
		}
		await this.upload(file, filename, SLEEP_IMAGE_DIR);
		if (await this.fileExists(LEGACY_ROOT_SLEEP_IMAGE)) {
			await this.deleteFile(LEGACY_ROOT_SLEEP_IMAGE);
		}
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
