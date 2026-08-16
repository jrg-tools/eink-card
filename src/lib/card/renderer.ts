import { X3_WIDTH, X3_HEIGHT, type BusinessCard } from './types';
import { encodeBmp } from './bmp';
import { generateQrCanvas } from './qr';
import { displayUrl } from './validation';

const INK = '#111111';
const PAPER = '#ffffff';
const MID_GRAY = '#444444';

const FONT_STACK = `'Inter', 'Helvetica Neue', 'Arial', sans-serif`;

interface TextFit {
	size: number;
	text: string;
}

/** Reduce font size until the text fits, then truncate with ellipsis if needed. */
function fitText(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
	maxSize: number,
	minSize: number,
	weight = 'normal',
	letterSpacing = 0
): TextFit {
	let size = maxSize;
	const measure = (t: string, s: number) => {
		ctx.font = `${weight} ${s}px ${FONT_STACK}`;
		return ctx.measureText(t).width + letterSpacing * Math.max(0, t.length - 1);
	};
	while (size > minSize && measure(text, size) > maxWidth) {
		size -= 1;
	}
	let out = text;
	if (measure(out, size) > maxWidth) {
		while (out.length > 1 && measure(out + '…', size) > maxWidth) {
			out = out.slice(0, -1);
		}
		out += '…';
	}
	return { size, text: out };
}

function drawText(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	opts: {
		maxWidth: number;
		maxSize: number;
		minSize: number;
		weight?: string;
		color?: string;
		letterSpacing?: number;
	}
): number {
	const { size, text: fitted } = fitText(
		ctx,
		text,
		opts.maxWidth,
		opts.maxSize,
		opts.minSize,
		opts.weight ?? 'normal',
		opts.letterSpacing ?? 0
	);
	ctx.font = `${opts.weight ?? 'normal'} ${size}px ${FONT_STACK}`;
	ctx.fillStyle = opts.color ?? INK;
	if (opts.letterSpacing) {
		const total =
			ctx.measureText(fitted).width + opts.letterSpacing * Math.max(0, fitted.length - 1);
		let cx = x;
		if (ctx.textAlign === 'center') cx = x - total / 2;
		else if (ctx.textAlign === 'right' || ctx.textAlign === 'end') cx = x - total;
		const prevAlign = ctx.textAlign;
		ctx.textAlign = 'left';
		for (const ch of fitted) {
			ctx.fillText(ch, cx, y);
			cx += ctx.measureText(ch).width + opts.letterSpacing;
		}
		ctx.textAlign = prevAlign;
	} else {
		ctx.fillText(fitted, x, y);
	}
	return size;
}

// ---------------------------------------------------------------------------
// Icons — minimalist line icons drawn with canvas paths.
// (x, y) is the top-left corner of a `size`×`size` box.
// ---------------------------------------------------------------------------

type IconType = 'email' | 'phone' | 'web' | 'github' | 'linkedin' | 'pin';

function drawIcon(
	ctx: CanvasRenderingContext2D,
	type: IconType,
	x: number,
	y: number,
	size: number
): void {
	ctx.save();
	ctx.translate(x, y);
	ctx.strokeStyle = INK;
	ctx.fillStyle = INK;
	ctx.lineWidth = Math.max(2, size * 0.09);
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	const s = size;

	switch (type) {
		case 'email': {
			const h = s * 0.72;
			const top = (s - h) / 2;
			ctx.strokeRect(s * 0.05, top, s * 0.9, h);
			ctx.beginPath();
			ctx.moveTo(s * 0.05, top + h * 0.08);
			ctx.lineTo(s * 0.5, top + h * 0.62);
			ctx.lineTo(s * 0.95, top + h * 0.08);
			ctx.stroke();
			break;
		}
		case 'phone': {
			ctx.beginPath();
			ctx.moveTo(s * 0.22, s * 0.1);
			ctx.quadraticCurveTo(s * 0.1, s * 0.1, s * 0.12, s * 0.3);
			ctx.quadraticCurveTo(s * 0.2, s * 0.72, s * 0.62, s * 0.88);
			ctx.quadraticCurveTo(s * 0.88, s * 0.95, s * 0.9, s * 0.78);
			ctx.lineTo(s * 0.9, s * 0.66);
			ctx.lineTo(s * 0.66, s * 0.56);
			ctx.lineTo(s * 0.56, s * 0.66);
			ctx.quadraticCurveTo(s * 0.36, s * 0.56, s * 0.3, s * 0.38);
			ctx.lineTo(s * 0.4, s * 0.28);
			ctx.lineTo(s * 0.32, s * 0.1);
			ctx.closePath();
			ctx.stroke();
			break;
		}
		case 'web': {
			const r = s * 0.42;
			const c = s / 2;
			ctx.beginPath();
			ctx.arc(c, c, r, 0, Math.PI * 2);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(c - r, c);
			ctx.lineTo(c + r, c);
			ctx.stroke();
			ctx.beginPath();
			ctx.ellipse(c, c, r * 0.45, r, 0, 0, Math.PI * 2);
			ctx.stroke();
			break;
		}
		case 'github': {
			// git-branch icon
			const r = s * 0.11;
			ctx.beginPath();
			ctx.arc(s * 0.28, s * 0.18, r, 0, Math.PI * 2);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(s * 0.28, s * 0.82, r, 0, Math.PI * 2);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(s * 0.76, s * 0.24, r, 0, Math.PI * 2);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(s * 0.28, s * 0.29);
			ctx.lineTo(s * 0.28, s * 0.71);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(s * 0.76, s * 0.35);
			ctx.quadraticCurveTo(s * 0.76, s * 0.55, s * 0.28, s * 0.58);
			ctx.stroke();
			break;
		}
		case 'linkedin': {
			const r = s * 0.16;
			ctx.beginPath();
			ctx.roundRect(s * 0.08, s * 0.08, s * 0.84, s * 0.84, r);
			ctx.stroke();
			ctx.font = `700 ${s * 0.5}px ${FONT_STACK}`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('in', s * 0.5, s * 0.56);
			break;
		}
		case 'pin': {
			const c = s / 2;
			ctx.beginPath();
			ctx.arc(c, s * 0.38, s * 0.28, Math.PI * 0.85, Math.PI * 0.15);
			ctx.lineTo(c, s * 0.92);
			ctx.closePath();
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(c, s * 0.38, s * 0.1, 0, Math.PI * 2);
			ctx.fill();
			break;
		}
	}
	ctx.restore();
}

// ---------------------------------------------------------------------------
// Contact rows
// ---------------------------------------------------------------------------

interface ContactRow {
	icon: IconType;
	text: string;
}

function contactRows(card: BusinessCard): ContactRow[] {
	const rows: ContactRow[] = [];
	if (card.email?.trim()) rows.push({ icon: 'email', text: card.email.trim() });
	if (card.phone?.trim()) rows.push({ icon: 'phone', text: card.phone.trim() });
	if (card.website?.trim()) rows.push({ icon: 'web', text: displayUrl(card.website) });
	if (card.github?.trim()) rows.push({ icon: 'github', text: displayUrl(card.github) });
	if (card.linkedin?.trim()) rows.push({ icon: 'linkedin', text: displayUrl(card.linkedin) });
	if (card.location?.trim()) rows.push({ icon: 'pin', text: card.location.trim() });
	return rows;
}

function drawContactRow(
	ctx: CanvasRenderingContext2D,
	row: ContactRow,
	x: number,
	baselineY: number,
	textW: number,
	textSize: number
): void {
	const iconSize = textSize * 1.15;
	drawIcon(ctx, row.icon, x, baselineY - iconSize * 0.82, iconSize);
	ctx.textAlign = 'left';
	ctx.textBaseline = 'alphabetic';
	drawText(ctx, row.text, x + iconSize + textSize * 0.7, baselineY, {
		maxWidth: textW - iconSize - textSize * 0.7,
		maxSize: textSize,
		minSize: Math.max(14, textSize - 8)
	});
}

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------

async function renderPortrait(ctx: CanvasRenderingContext2D, card: BusinessCard): Promise<void> {
	const W = X3_WIDTH;
	const H = X3_HEIGHT;
	const M = 40;
	const contentW = W - M * 2;

	ctx.textAlign = 'center';
	ctx.textBaseline = 'alphabetic';
	const cx = W / 2;
	let y = 120;

	// Nickname (if any) is the biggest element; the name goes smaller below it.
	const nickname = card.nickname?.trim();
	if (nickname) {
		drawText(ctx, nickname.toUpperCase(), cx, y, {
			maxWidth: contentW,
			maxSize: 80,
			minSize: 44,
			weight: '700',
			letterSpacing: 2
		});
		y += 54;
		drawText(ctx, card.name, cx, y, {
			maxWidth: contentW,
			maxSize: 32,
			minSize: 20,
			color: MID_GRAY
		});
	} else {
		drawText(ctx, card.name.toUpperCase(), cx, y, {
			maxWidth: contentW,
			maxSize: 68,
			minSize: 38,
			weight: '700',
			letterSpacing: 2
		});
	}

	// Role
	if (card.role?.trim()) {
		y += 54;
		drawText(ctx, card.role, cx, y, {
			maxWidth: contentW,
			maxSize: 34,
			minSize: 22,
			color: MID_GRAY
		});
	}

	// Company
	if (card.company?.trim()) {
		y += 48;
		drawText(ctx, card.company.toUpperCase(), cx, y, {
			maxWidth: contentW,
			maxSize: 27,
			minSize: 18,
			weight: '600',
			color: INK
		});
	}

	// Divider — short, centered
	y += 44;
	ctx.fillStyle = INK;
	ctx.fillRect(cx - 45, y, 90, 4);
	y += 22;

	// Tagline
	if (card.tagline?.trim()) {
		y += 36;
		drawText(ctx, `“${card.tagline.trim()}”`, cx, y, {
			maxWidth: contentW,
			maxSize: 25,
			minSize: 17,
			color: MID_GRAY
		});
	}

	// Contact block — left aligned, icons.
	ctx.textAlign = 'left';
	y += 66;
	const rows = contactRows(card);
	const textSize = 28;
	const rowH = 54;
	for (const row of rows) {
		drawContactRow(ctx, row, M, y, contentW, textSize);
		y += rowH;
	}

	// QR code — centered at the bottom.
	const hasQr = Boolean(card.qr?.enabled && card.qr.value.trim());
	if (hasQr) {
		const qrSize = 190;
		const qy = H - M - qrSize - (card.qr!.label?.trim() ? 38 : 0);
		const qr = await generateQrCanvas(card.qr!.value.trim(), qrSize);
		const qx = cx - qrSize / 2;
		ctx.drawImage(qr, qx, qy, qrSize, qrSize);
		if (card.qr!.label?.trim()) {
			ctx.textAlign = 'center';
			drawText(ctx, card.qr!.label!, cx, qy + qrSize + 30, {
				maxWidth: qrSize + 80,
				maxSize: 22,
				minSize: 15,
				color: MID_GRAY
			});
			ctx.textAlign = 'left';
		}
	}
}

async function renderLandscape(ctx: CanvasRenderingContext2D, card: BusinessCard): Promise<void> {
	const W = X3_HEIGHT; // rotated: 792
	const H = X3_WIDTH; // rotated: 528
	const M = 44;
	const hasQr = Boolean(card.qr?.enabled && card.qr.value.trim());
	const qrSize = 190;
	const sideW = hasQr ? qrSize + M : 0;
	const textW = W - M * 2 - sideW;

	ctx.textAlign = 'left';
	ctx.textBaseline = 'alphabetic';
	let y = 104;

	const nickname = card.nickname?.trim();
	if (nickname) {
		drawText(ctx, nickname.toUpperCase(), M, y, {
			maxWidth: textW,
			maxSize: 72,
			minSize: 38,
			weight: '700',
			letterSpacing: 2
		});
		y += 50;
		drawText(ctx, card.name, M, y, {
			maxWidth: textW,
			maxSize: 30,
			minSize: 19,
			color: MID_GRAY
		});
	} else {
		drawText(ctx, card.name.toUpperCase(), M, y, {
			maxWidth: textW,
			maxSize: 62,
			minSize: 34,
			weight: '700',
			letterSpacing: 2
		});
	}

	if (card.role?.trim()) {
		y += 50;
		drawText(ctx, card.role, M, y, {
			maxWidth: textW,
			maxSize: 32,
			minSize: 20,
			color: MID_GRAY
		});
	}

	if (card.company?.trim()) {
		y += 44;
		drawText(ctx, card.company.toUpperCase(), M, y, {
			maxWidth: textW,
			maxSize: 26,
			minSize: 17,
			weight: '600'
		});
	}

	y += 40;
	ctx.fillStyle = INK;
	ctx.fillRect(M, y, 90, 4);
	y += 18;

	if (card.tagline?.trim()) {
		y += 34;
		drawText(ctx, `“${card.tagline.trim()}”`, M, y, {
			maxWidth: textW,
			maxSize: 24,
			minSize: 16,
			color: MID_GRAY
		});
	}

	y += 56;
	const textSize = 26;
	const rowH = 50;
	for (const row of contactRows(card)) {
		if (y > H - 36) break;
		drawContactRow(ctx, row, M, y, textW, textSize);
		y += rowH;
	}

	// Right column: QR centered vertically.
	if (hasQr) {
		const rx = W - M - qrSize;
		const qy = (H - qrSize) / 2 - 22;
		const qr = await generateQrCanvas(card.qr!.value.trim(), qrSize);
		ctx.drawImage(qr, rx, qy, qrSize, qrSize);
		if (card.qr!.label?.trim()) {
			ctx.textAlign = 'center';
			drawText(ctx, card.qr!.label!, rx + qrSize / 2, qy + qrSize + 32, {
				maxWidth: qrSize + 24,
				maxSize: 21,
				minSize: 15,
				color: MID_GRAY
			});
			ctx.textAlign = 'left';
		}
	}
}

/**
 * Render the card onto a canvas.
 * Portrait: 528×792. Landscape: 792×528 (canvas dimensions swapped).
 */
export async function renderToCanvas(card: BusinessCard, canvas: HTMLCanvasElement): Promise<void> {
	const landscape = card.orientation === 'landscape';
	canvas.width = landscape ? X3_HEIGHT : X3_WIDTH;
	canvas.height = landscape ? X3_WIDTH : X3_HEIGHT;

	// Ensure web fonts are loaded so the preview and the exported BMP
	// render with identical glyphs and metrics.
	if (typeof document !== 'undefined' && document.fonts?.ready) {
		try {
			await document.fonts.ready;
		} catch {
			/* fall back to whatever is available */
		}
	}

	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) throw new Error('Canvas 2D context unavailable');

	ctx.fillStyle = PAPER;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.textAlign = 'left';

	if (landscape) {
		await renderLandscape(ctx, card);
	} else {
		await renderPortrait(ctx, card);
	}
}

/** Render the business card and encode it as an uncompressed 24-bit BMP blob. */
export async function renderBusinessCard(card: BusinessCard): Promise<Blob> {
	const canvas = document.createElement('canvas');
	await renderToCanvas(card, canvas);
	const ctx = canvas.getContext('2d')!;
	const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
	return encodeBmp(data.data, canvas.width, canvas.height);
}
