/**
 * Minimal 24-bit uncompressed BMP encoder.
 * Takes RGBA pixel data (as produced by canvas getImageData) and returns a Blob.
 */
export function encodeBmp(pixels: Uint8ClampedArray, width: number, height: number): Blob {
	const rowSize = Math.ceil((24 * width) / 32) * 4; // rows padded to 4 bytes
	const pixelDataSize = rowSize * height;
	const headerSize = 14 + 40; // BITMAPFILEHEADER + BITMAPINFOHEADER
	const fileSize = headerSize + pixelDataSize;

	const buffer = new ArrayBuffer(fileSize);
	const view = new DataView(buffer);
	const bytes = new Uint8Array(buffer);

	// BITMAPFILEHEADER
	view.setUint8(0, 0x42); // 'B'
	view.setUint8(1, 0x4d); // 'M'
	view.setUint32(2, fileSize, true);
	view.setUint32(6, 0, true); // reserved
	view.setUint32(10, headerSize, true); // pixel data offset

	// BITMAPINFOHEADER
	view.setUint32(14, 40, true); // header size
	view.setInt32(18, width, true);
	view.setInt32(22, height, true); // positive = bottom-up
	view.setUint16(26, 1, true); // planes
	view.setUint16(28, 24, true); // bits per pixel
	view.setUint32(30, 0, true); // BI_RGB, no compression
	view.setUint32(34, pixelDataSize, true);
	view.setInt32(38, 2835, true); // ~72 DPI horizontal
	view.setInt32(42, 2835, true); // ~72 DPI vertical
	view.setUint32(46, 0, true); // palette colors
	view.setUint32(50, 0, true); // important colors

	// Pixel data: bottom-up, BGR
	for (let y = 0; y < height; y++) {
		const srcRow = (height - 1 - y) * width * 4;
		const dstRow = headerSize + y * rowSize;
		for (let x = 0; x < width; x++) {
			const src = srcRow + x * 4;
			const dst = dstRow + x * 3;
			bytes[dst] = pixels[src + 2]; // B
			bytes[dst + 1] = pixels[src + 1]; // G
			bytes[dst + 2] = pixels[src]; // R
		}
	}

	return new Blob([buffer], { type: 'image/bmp' });
}
