# E-ink Business Card

A lightweight, self-hosted web app for creating a minimalistic digital business card optimized for the **Xteink X3** (528×792 px) and **Xteink X4** (480×800 px) e-ink readers running [CrossPoint Reader](http://crosspoint.local/), and sending it directly to the device over your local network.

> **Design once. Preview exactly. Send directly.**

## What it does

1. Enter your name, role, company, and contact info.
2. Choose portrait or landscape orientation.
3. See a live preview rendered exactly as the e-ink device will display it.
4. Optionally add a QR code (URL or link of your choice).
5. Detect a CrossPoint-powered X3 or X4 on your local network (the app auto-selects the detected model).
6. Send the generated 24-bit uncompressed BMP straight to the device, or download it as a fallback.

Everything renders **client-side** in your browser: no accounts, no database, no personal data ever leaves your device (except the upload to your own device). Your card is remembered in `localStorage`.

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

Then open `http://<docker-host>:3000` from a phone or desktop on the same Wi-Fi network as the e-reader.

## Sending to the device

1. On the device, enable CrossPoint **File Transfer** mode.
2. Make sure your phone/computer is on the same network.
3. The app polls `http://crosspoint.local/api/status` every 3 s; when the header shows `● X3 CONNECTED` (or `● X4 CONNECTED`), press **SEND TO DEVICE**.
4. By default the card is uploaded once as `/.sleep/business-card.bmp` and **set as the sleep screen ("cover")**: the app switches the CrossPoint `sleepScreen` setting to `Custom` via `POST /api/settings`, so the card appears whenever the device sleeps. If the cover option is disabled in the app's device settings panel, the card is uploaded as `/business-card.bmp` instead.

> CrossPoint has no "display this image now" API endpoint; the sleep screen is the supported way to pin an image to the display. To show it immediately, just let the device sleep (or press the power button briefly if configured for sleep).

If mDNS (`crosspoint.local`) doesn't resolve on your network, open the device settings panel in the app and enter the device's IP address (shown on the device) instead.

> Note: browsers block cross-origin requests to plain-HTTP local devices in some configurations. If direct browser→device requests fail, download the BMP and transfer it manually, or use the app's fallback options.

## Architecture

```
Browser (SvelteKit UI)
 ├── Card editor  → localStorage
 ├── Canvas renderer → BMP encoder (24-bit uncompressed)
 ├── Live e-ink preview (renders the actual canvas)
 └── CrossPoint client
       ├── GET  http://crosspoint.local/api/status
       ├── POST http://crosspoint.local/upload?path=/.sleep    (business-card.bmp)
       └── POST http://crosspoint.local/api/settings           ({"sleepScreen": 2} = Custom)
```

The SvelteKit server is only an application shell (plus `/api/health` for Docker health checks). Image generation and device communication happen entirely in the browser.

See [TDD.md](./TDD.md) for the full technical design document.
