import type { CrossPointTransport, UploadResult } from './types';
import { DeviceTimeoutError, UploadFailedError } from './errors';

export class HttpUploadTransport implements CrossPointTransport {
    constructor(
        private baseUrl: string,
        private timeoutMs = 30_000
    ) { }

    async upload(file: Blob, filename: string, path = '/'): Promise<UploadResult> {
        const form = new FormData();
        form.append('file', file, filename);

        const url = `${this.baseUrl}/upload?path=${encodeURIComponent(path)}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const res = await fetch(url, {
                method: 'POST',
                body: form,
                signal: controller.signal
            });
            const text = await res.text().catch(() => '');
            if (!res.ok) {
                throw new UploadFailedError(`HTTP ${res.status}`);
            }
            return { success: true, filename, response: text };
        } catch (err) {
            if (err instanceof UploadFailedError) throw err;
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw new DeviceTimeoutError();
            }
            throw new UploadFailedError(err instanceof Error ? err.message : String(err));
        } finally {
            clearTimeout(timer);
        }
    }
}
