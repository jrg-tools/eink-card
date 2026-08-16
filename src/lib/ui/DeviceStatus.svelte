<script lang="ts">
	import type { ConnectionState } from '$lib/crosspoint/types';

	let {
		state,
		device = ''
	}: {
		state: ConnectionState;
		device?: string;
	} = $props();

	const label = $derived.by(() => {
		switch (state) {
			case 'connected':
				return `● ${device || 'DEVICE'} CONNECTED`;
			case 'checking':
				return '◌ SEARCHING FOR DEVICE';
			case 'disconnected':
				return '○ DEVICE OFFLINE';
			case 'unsupported':
				return `△ ${device || 'DEVICE'} DETECTED`;
			default:
				return '○ DEVICE';
		}
	});
</script>

<span class="status status--{state}" role="status" aria-live="polite">{label}</span>

<style>
	.status {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.1em;
		white-space: nowrap;
		color: var(--mid-gray);
	}

	.status--connected {
		color: var(--ink);
	}

	.status--unsupported {
		color: var(--dark-gray);
	}
</style>
