<script lang="ts">
	import { browser } from '$app/environment';
	import { DEVICE_MODELS, type BusinessCard, type DeviceModel } from '$lib/card/types';
	import { renderBusinessCard } from '$lib/card/renderer';
	import { validateCard } from '$lib/card/validation';
	import { CrossPointClient } from '$lib/crosspoint/client';
	import type { ConnectionState, DeviceConfig } from '$lib/crosspoint/types';
	import {
		loadCard,
		saveCard,
		clearCard,
		loadDeviceConfig,
		saveDeviceConfig
	} from '$lib/storage/local-card';
	import DeviceStatus from '$lib/ui/DeviceStatus.svelte';
	import CardPreview from '$lib/ui/CardPreview.svelte';
	import CardForm from '$lib/ui/CardForm.svelte';
	import OrientationSelector from '$lib/ui/OrientationSelector.svelte';
	import DeviceSelector from '$lib/ui/DeviceSelector.svelte';
	import SendButton, { type SendState } from '$lib/ui/SendButton.svelte';

	const FILENAME = 'business-card.bmp';
	const POLL_MS = 3000;

	let card: BusinessCard = $state(loadCard());
	let deviceConfig: DeviceConfig = $state(loadDeviceConfig());

	let connection: ConnectionState = $state('unknown');
	let detectedDevice = $state('');
	let sendState: SendState = $state('idle');
	let sendMessage = $state('');
	let showSettings = $state(false);

	const client = $derived(new CrossPointClient({ ...deviceConfig }));
	const validation = $derived(validateCard(card));

	// Persist card + device config on change.
	$effect(() => {
		saveCard($state.snapshot(card));
	});
	$effect(() => {
		saveDeviceConfig($state.snapshot(deviceConfig));
	});

	// Device detection polling.
	async function checkDevice() {
		if (!browser || document.visibilityState === 'hidden') return;
		if (connection === 'unknown') connection = 'checking';
		try {
			const status = await client.status();
			detectedDevice = status.device;
			if (status.device === card.device) {
				connection = 'connected';
			} else if (DEVICE_MODELS.includes(status.device as DeviceModel)) {
				// A supported device was found — switch to it automatically.
				card.device = status.device as DeviceModel;
				connection = 'connected';
			} else {
				connection = 'unsupported';
			}
		} catch {
			connection = 'disconnected';
		}
	}

	$effect(() => {
		if (!browser) return;
		checkDevice();
		const timer = setInterval(checkDevice, POLL_MS);
		return () => clearInterval(timer);
	});

	async function generateBmp(): Promise<Blob> {
		return renderBusinessCard($state.snapshot(card));
	}

	async function send() {
		if (!validation.valid) return;
		sendMessage = '';
		try {
			sendState = 'generating';
			const blob = await generateBmp();
			sendState = 'uploading';
			if (deviceConfig.setAsSleepScreen) {
				await client.setAsSleepScreen(blob, FILENAME);
				sendState = 'success';
				sendMessage =
					'Card uploaded and set as sleep screen. It will appear whenever the device sleeps.';
			} else {
				await client.upload(blob, FILENAME);
				sendState = 'success';
				sendMessage = 'Card uploaded. Open the image from the device file browser to display it.';
			}
		} catch (err) {
			sendState = 'error';
			sendMessage = err instanceof Error ? err.message : 'Unknown error.';
		} finally {
			setTimeout(() => (sendState = 'idle'), 4000);
		}
	}

	async function download() {
		if (!validation.valid) return;
		const blob = await generateBmp();
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = FILENAME;
		a.click();
		URL.revokeObjectURL(url);
	}

	function reset() {
		if (confirm('Clear all card information?')) {
			clearCard();
			card = loadCard();
		}
	}
</script>

<svelte:head>
	<title>E-ink Business Card</title>
	<meta
		name="description"
		content="Create and send a business card to your Xteink X3 or X4 e-reader."
	/>
</svelte:head>

<div class="app">
	<header class="header">
		<div class="brand">
			<h1>E-ink Card</h1>
			<DeviceSelector bind:device={card.device} />
		</div>
		<DeviceStatus state={connection} device={detectedDevice} />
	</header>

	<main class="layout">
		<section class="preview-col" aria-label="Preview">
			<div class="orientation">
				<OrientationSelector bind:orientation={card.orientation} />
			</div>
			<CardPreview {card} />
		</section>

		<section class="editor-col" aria-label="Editor">
			<div class="panel">
				<CardForm bind:card />
			</div>

			<div class="panel settings">
				<button
					type="button"
					class="settings-toggle"
					aria-expanded={showSettings}
					onclick={() => (showSettings = !showSettings)}
				>
					Device settings {showSettings ? '▴' : '▾'}
				</button>
				{#if showSettings}
					<div class="field">
						<label for="device-url">Device address</label>
						<input id="device-url" type="url" bind:value={deviceConfig.baseUrl} />
					</div>
					<div class="field cover-toggle">
						<input
							id="set-sleep-screen"
							type="checkbox"
							bind:checked={deviceConfig.setAsSleepScreen}
						/>
						<label for="set-sleep-screen">Set as sleep screen (cover) after upload</label>
					</div>
					<p class="hint-small">
						Uploads the card as /.sleep/business-card.bmp and switches the device sleep screen mode
						to “Custom”, so the card shows whenever the device sleeps.
					</p>
					<button type="button" class="btn" onclick={checkDevice}>Check again</button>
					{#if deviceConfig.baseUrl.startsWith('http://') && !/crosspoint\.local|192\.168\.|10\.|172\./.test(deviceConfig.baseUrl)}
						<p class="warning">Warning: this does not look like a local network address.</p>
					{/if}
				{/if}
			</div>

			<button type="button" class="reset" onclick={reset}>Reset card</button>
		</section>
	</main>

	<div class="actions">
		<SendButton
			state={sendState}
			disabled={!validation.valid || connection !== 'connected'}
			onsend={send}
		/>
		<button type="button" class="btn" disabled={!validation.valid} onclick={download}>
			Download BMP
		</button>
		{#if sendMessage}
			<p class="message" role="status" aria-live="polite">{sendMessage}</p>
		{/if}
		{#if !validation.valid && card.name === ''}
			<p class="hint">Enter your name to enable generation.</p>
		{/if}
	</div>
</div>

<style>
	.app {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 16px 140px;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 0;
		border-bottom: 2px solid var(--ink);
		margin-bottom: 20px;
	}

	.header h1 {
		font-size: 18px;
		margin: 0;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
	}

	@media (min-width: 900px) {
		.layout {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}

		.preview-col {
			position: sticky;
			top: 16px;
		}
	}

	.orientation {
		margin-bottom: 16px;
	}

	.editor-col {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.settings-toggle {
		width: 100%;
		min-height: 44px;
		background: none;
		border: none;
		font-family: var(--font);
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--dark-gray);
		cursor: pointer;
		text-align: left;
		padding: 0;
	}

	.settings .field {
		margin: 12px 0;
	}

	.cover-toggle {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 44px;
	}

	.cover-toggle label {
		margin: 0;
	}

	.cover-toggle input[type='checkbox'] {
		width: 22px;
		height: 22px;
		accent-color: var(--ink);
	}

	.hint-small {
		font-size: 12px;
		color: var(--mid-gray);
		margin: 4px 0 12px;
	}

	.warning {
		font-size: 13px;
		color: var(--dark-gray);
		border-left: 3px solid var(--ink);
		padding-left: 8px;
	}

	.reset {
		background: none;
		border: none;
		min-height: 44px;
		font-family: var(--font);
		font-size: 12px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--mid-gray);
		text-decoration: underline;
		cursor: pointer;
	}

	.actions {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--paper);
		border-top: 2px solid var(--ink);
		padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
		display: grid;
		gap: 10px;
		max-width: 1100px;
		margin: 0 auto;
	}

	.message,
	.hint {
		margin: 0;
		font-size: 13px;
		color: var(--dark-gray);
		text-align: center;
	}
</style>
