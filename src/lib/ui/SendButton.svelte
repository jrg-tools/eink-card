<script lang="ts">
	export type SendState = 'idle' | 'generating' | 'uploading' | 'success' | 'error';

	let {
		state,
		disabled = false,
		onsend
	}: {
		state: SendState;
		disabled?: boolean;
		onsend: () => void;
	} = $props();

	const label = $derived.by(() => {
		switch (state) {
			case 'generating':
				return 'Preparing card…';
			case 'uploading':
				return 'Sending to X3…';
			case 'success':
				return '✓ Card sent to X3';
			case 'error':
				return '× Could not send — retry';
			default:
				return 'Send to X3';
		}
	});

	const busy = $derived(state === 'generating' || state === 'uploading');
</script>

<button
	type="button"
	class="btn btn--primary"
	disabled={disabled || busy}
	aria-live="polite"
	onclick={onsend}
>
	{label}
</button>
