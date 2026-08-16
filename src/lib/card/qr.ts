import QRCode from 'qrcode';

/**
 * Generate a pure black/white QR code onto an offscreen canvas.
 * Never dithered; includes quiet-zone padding.
 */
export async function generateQrCanvas(value: string, size: number): Promise<HTMLCanvasElement> {
	const canvas = document.createElement('canvas');
	await QRCode.toCanvas(canvas, value, {
		width: size,
		margin: 2,
		errorCorrectionLevel: 'M',
		color: {
			dark: '#000000',
			light: '#ffffff'
		}
	});
	return canvas;
}
