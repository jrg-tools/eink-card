<script lang="ts">
	import { browser } from '$app/environment';
	import type { BusinessCard } from '$lib/card/types';
	import { renderToCanvas } from '$lib/card/renderer';

	let { card }: { card: BusinessCard } = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let renderToken = 0;

	$effect(() => {
		// Track the whole card object (deep reactivity via JSON snapshot).
		const snapshot = JSON.stringify(card);
		if (!browser || !canvas) return;
		void snapshot;
		const token = ++renderToken;
		renderToCanvas(card, canvas).catch((err) => {
			if (token === renderToken) console.error('Preview render failed:', err);
		});
	});
</script>

<div class="device" class:landscape={card.orientation === 'landscape'}>
	<div class="screen">
		<canvas bind:this={canvas} aria-label="Business card preview"></canvas>
	</div>
</div>

<style>
	.device {
		display: flex;
		justify-content: center;
		padding: 8px;
	}

	.screen {
		width: min(100%, 300px);
		border: 2px solid var(--ink);
		border-radius: 6px;
		padding: 10px;
		background: #e9e9e2;
		box-shadow: 3px 3px 0 var(--light-gray);
	}

	.device.landscape .screen {
		width: min(100%, 560px);
	}

	canvas {
		display: block;
		width: 100%;
		height: auto;
		filter: grayscale(1) contrast(0.96);
		background: #fff;
	}
</style>
