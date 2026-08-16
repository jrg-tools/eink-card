<script lang="ts">
	import { DEVICE_MODELS, DEVICES, type DeviceModel } from '$lib/card/types';

	let { device = $bindable() }: { device: DeviceModel } = $props();
</script>

<div class="selector" role="radiogroup" aria-label="Device model">
	{#each DEVICE_MODELS as model (model)}
		<button
			type="button"
			class="option"
			class:active={device === model}
			role="radio"
			aria-checked={device === model}
			title="{DEVICES[model].label} ({DEVICES[model].width}×{DEVICES[model].height})"
			onclick={() => (device = model)}
		>
			{model}
		</button>
	{/each}
</div>

<style>
	.selector {
		display: inline-flex;
		border: 2px solid var(--ink);
	}

	.option {
		min-height: 32px;
		padding: 2px 14px;
		background: var(--paper);
		border: none;
		font-family: var(--font);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--ink);
		cursor: pointer;
	}

	.option + .option {
		border-left: 2px solid var(--ink);
	}

	.option.active {
		background: var(--ink);
		color: var(--paper);
	}
</style>
