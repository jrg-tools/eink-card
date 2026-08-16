<script lang="ts">
	import type { Orientation } from '$lib/card/types';

	let { orientation = $bindable() }: { orientation: Orientation } = $props();
</script>

<div class="selector" role="radiogroup" aria-label="Orientation">
	<button
		type="button"
		class="btn"
		class:active={orientation === 'portrait'}
		role="radio"
		aria-checked={orientation === 'portrait'}
		onclick={() => (orientation = 'portrait')}
	>
		Portrait
	</button>
	<button
		type="button"
		class="btn"
		class:active={orientation === 'landscape'}
		role="radio"
		aria-checked={orientation === 'landscape'}
		onclick={() => (orientation = 'landscape')}
	>
		Landscape
	</button>
</div>

<style>
	.selector {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.btn.active {
		background: var(--ink);
		color: var(--paper);
	}
</style>
