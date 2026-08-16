import { X3_WIDTH, X3_HEIGHT, type BusinessCard } from './types';
import { encodeBmp } from './bmp';
import { generateQrCanvas } from './qr';
import { displayUrl } from './validation';

const INK = '#111111';
const PAPER = '#ffffff';
const MID_GRAY = '#555555';

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
        let cx = x;
        for (const ch of fitted) {
            ctx.fillText(ch, cx, y);
            cx += ctx.measureText(ch).width + opts.letterSpacing;
        }
    } else {
        ctx.fillText(fitted, x, y);
    }
    return size;
}

function contactLines(card: BusinessCard): string[] {
    const lines: string[] = [];
    if (card.email?.trim()) lines.push(card.email.trim());
    if (card.phone?.trim()) lines.push(card.phone.trim());
    if (card.website?.trim()) lines.push(displayUrl(card.website));
    if (card.github?.trim()) lines.push(displayUrl(card.github));
    if (card.linkedin?.trim()) lines.push(displayUrl(card.linkedin));
    if (card.location?.trim()) lines.push(card.location.trim());
    return lines;
}

async function renderPortrait(ctx: CanvasRenderingContext2D, card: BusinessCard): Promise<void> {
    const W = X3_WIDTH;
    const H = X3_HEIGHT;
    const M = 56; // margin
    const contentW = W - M * 2;

    ctx.textBaseline = 'alphabetic';
    let y = H * 0.18;

    // Name
    const nameSize = drawText(ctx, card.name.toUpperCase(), M, y, {
        maxWidth: contentW,
        maxSize: 42,
        minSize: 24,
        weight: '700',
        letterSpacing: 1
    });
    y += nameSize * 0.6;

    // Role
    if (card.role?.trim()) {
        y += 30;
        drawText(ctx, card.role, M, y, {
            maxWidth: contentW,
            maxSize: 22,
            minSize: 14,
            color: MID_GRAY
        });
    }

    // Company
    if (card.company?.trim()) {
        y += 44;
        drawText(ctx, card.company, M, y, {
            maxWidth: contentW,
            maxSize: 18,
            minSize: 12,
            weight: '600'
        });
    }

    // Tagline
    if (card.tagline?.trim()) {
        y += 38;
        drawText(ctx, card.tagline, M, y, {
            maxWidth: contentW,
            maxSize: 15,
            minSize: 11,
            color: MID_GRAY
        });
    }

    // Divider
    y += 48;
    ctx.fillStyle = INK;
    ctx.fillRect(M, y, contentW * 0.7, 2);
    y += 44;

    // Contact block
    const lines = contactLines(card);
    for (const line of lines) {
        drawText(ctx, line, M, y, { maxWidth: contentW, maxSize: 16, minSize: 11 });
        y += 32;
    }

    // QR code, bottom-right
    if (card.qr?.enabled && card.qr.value.trim()) {
        const qrSize = 170;
        const qr = await generateQrCanvas(card.qr.value.trim(), qrSize);
        const qx = W - M - qrSize;
        const qy = H - M - qrSize - (card.qr.label ? 24 : 0);
        ctx.drawImage(qr, qx, qy, qrSize, qrSize);
        if (card.qr.label?.trim()) {
            ctx.textAlign = 'center';
            drawText(ctx, card.qr.label, qx + qrSize / 2, qy + qrSize + 22, {
                maxWidth: qrSize + 30,
                maxSize: 13,
                minSize: 10,
                color: MID_GRAY
            });
            ctx.textAlign = 'left';
        }
    }
}

async function renderLandscape(ctx: CanvasRenderingContext2D, card: BusinessCard): Promise<void> {
    const W = X3_HEIGHT; // 792
    const H = X3_WIDTH; // 528
    const M = 56;
    const hasQr = Boolean(card.qr?.enabled && card.qr.value.trim());
    const qrSize = 160;
    const textW = hasQr ? W - M * 3 - qrSize : W - M * 2;

    ctx.textBaseline = 'alphabetic';
    let y = H * 0.22;

    const nameSize = drawText(ctx, card.name.toUpperCase(), M, y, {
        maxWidth: textW,
        maxSize: 40,
        minSize: 22,
        weight: '700',
        letterSpacing: 1
    });
    y += nameSize * 0.5;

    if (card.role?.trim()) {
        y += 28;
        drawText(ctx, card.role, M, y, { maxWidth: textW, maxSize: 20, minSize: 13, color: MID_GRAY });
    }

    if (card.company?.trim()) {
        y += 40;
        drawText(ctx, card.company, M, y, { maxWidth: textW, maxSize: 17, minSize: 12, weight: '600' });
    }

    if (card.tagline?.trim()) {
        y += 34;
        drawText(ctx, card.tagline, M, y, {
            maxWidth: textW,
            maxSize: 14,
            minSize: 11,
            color: MID_GRAY
        });
    }

    y += 40;
    ctx.fillStyle = INK;
    ctx.fillRect(M, y, Math.min(textW, 320), 2);
    y += 38;

    for (const line of contactLines(card)) {
        if (y > H - 40) break;
        drawText(ctx, line, M, y, { maxWidth: textW, maxSize: 15, minSize: 11 });
        y += 28;
    }

    if (hasQr) {
        const qr = await generateQrCanvas(card.qr!.value.trim(), qrSize);
        const qx = W - M - qrSize;
        const qy = H * 0.22 - 30;
        ctx.drawImage(qr, qx, qy, qrSize, qrSize);
        if (card.qr!.label?.trim()) {
            ctx.textAlign = 'center';
            drawText(ctx, card.qr!.label!, qx + qrSize / 2, qy + qrSize + 22, {
                maxWidth: qrSize + 30,
                maxSize: 13,
                minSize: 10,
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
