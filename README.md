# X3 Business Card

A lightweight, self-hosted web app for creating a minimalistic digital business card optimized for the **Xteink X3** e-ink reader (528×792 px) running [CrossPoint Reader](http://crosspoint.local/), and sending it directly to the device over your local network.

> **Design once. Preview exactly. Send directly.**

## What it does

1. Enter your name, role, company, and contact info.
2. Choose portrait or landscape orientation.
3. See a live preview rendered exactly as the e-ink device will display it.
4. Optionally add a QR code (URL or link of your choice).
5. Detect a CrossPoint-powered X3 on your local network.
6. Send the generated 24-bit uncompressed BMP straight to the device, or download it as a fallback.

Everything renders **client-side** in your browser: no accounts, no database, no personal data ever leaves your device (except the upload to your own X3). Your card is remembered in `localStorage`.

## Tech

- SvelteKit + Svelte 5 + TypeScript
- HTML Canvas renderer with a custom 24-bit BMP encoder
- `qrcode` for in-browser QR generation
- Plain CSS with an e-ink inspired design system (paper tones, no gradients)
- Docker deployment via `@sveltejs/adapter-node`

## Development

```sh
pnpm install
pnpm dev
```

Useful scripts:

```sh
pnpm check   # type checking
pnpm lint    # prettier + eslint
pnpm build   # production build
```

## Docker

```sh
docker compose up -d
```

Then open `http://<docker-host>:3000` from a phone or desktop on the same Wi-Fi network as the X3.

## Sending to the X3

1. On the X3, enable CrossPoint **File Transfer** mode.
2. Make sure your phone/computer is on the same network.
3. The app polls `http://crosspoint.local/api/status` every 3 s; when the header shows `● X3 CONNECTED`, press **SEND TO X3**.
4. The card is uploaded as `/business-card.bmp`. By default it is **also set as the sleep screen ("cover")**: the app uploads it as `/sleep.bmp` and switches the CrossPoint `sleepScreen` setting to `Custom` via `POST /api/settings`, so the card appears whenever the X3 sleeps. This can be disabled in the app's device settings panel.

> CrossPoint has no "display this image now" API endpoint; the sleep screen is the supported way to pin an image to the display. To show it immediately, just let the device sleep (or press the power button briefly if configured for sleep).

If mDNS (`crosspoint.local`) doesn't resolve on your network, open the device settings panel in the app and enter the X3's IP address (shown on the device) instead.

> Note: browsers block cross-origin requests to plain-HTTP local devices in some configurations. If direct browser→X3 requests fail, download the BMP and transfer it manually, or use the app's fallback options.

## Architecture

```
Browser (SvelteKit UI)
 ├── Card editor  → localStorage
 ├── Canvas renderer → BMP encoder (24-bit uncompressed)
 ├── Live e-ink preview (renders the actual canvas)
 └── CrossPoint client
       ├── GET  http://crosspoint.local/api/status
       ├── POST http://crosspoint.local/upload?path=/          (business-card.bmp + sleep.bmp)
       └── POST http://crosspoint.local/api/settings           ({"sleepScreen": 2} = Custom)
```

The SvelteKit server is only an application shell (plus `/api/health` for Docker health checks). Image generation and device communication happen entirely in the browser.

See [TDD.md](./TDD.md) for the full technical design document.
