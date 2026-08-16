import type { CrossPointTransport, UploadResult } from './types';
import { UploadFailedError, DeviceTimeoutError } from './errors';

const CHUNK_SIZE = 16 * 1024;

/**
 * WebSocket upload transport for CrossPoint (port 81).
 *
 * Protocol:
 *   → START:<filename>:<size>:<path>
 *   ← READY
 *   → binary chunks
 *   ← PROGRESS:<received>:<total> ... DONE | ERROR:<message>
 */
export class WebSocketUploadTransport implements CrossPointTransport {
	constructor(
		private baseUrl: string,
		private timeoutMs = 60_000
	) {}

	private wsUrl(): string {
		const url = new URL(this.baseUrl);
		return `ws://${url.hostname}:81/`;
	}

	async upload(file: Blob, filename: string, path = '/'): Promise<UploadResult> {
		const buffer = await file.arrayBuffer();

		return new Promise<UploadResult>((resolve, reject) => {
			const ws = new WebSocket(this.wsUrl());
			ws.binaryType = 'arraybuffer';

			const timer = setTimeout(() => {
				ws.close();
				reject(new DeviceTimeoutError());
			}, this.timeoutMs);

			const fail = (message: string) => {
				clearTimeout(timer);
				ws.close();
				reject(new UploadFailedError(message));
			};

			ws.onerror = () => fail('WebSocket error');

			ws.onopen = () => {
				ws.send(`START:${filename}:${buffer.byteLength}:${path}`);
			};

			ws.onmessage = (event) => {
				const msg = typeof event.data === 'string' ? event.data : '';
				if (msg === 'READY') {
					for (let offset = 0; offset < buffer.byteLength; offset += CHUNK_SIZE) {
						ws.send(buffer.slice(offset, offset + CHUNK_SIZE));
					}
				} else if (msg === 'DONE') {
					clearTimeout(timer);
					ws.close();
					resolve({ success: true, filename });
				} else if (msg.startsWith('ERROR:')) {
					fail(msg.slice('ERROR:'.length));
				}
				// PROGRESS messages are ignored for now.
			};
		});
	}
}
