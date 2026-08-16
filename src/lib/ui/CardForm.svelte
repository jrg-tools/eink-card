<script lang="ts">
	import type { BusinessCard } from '$lib/card/types';

	let { card = $bindable() }: { card: BusinessCard } = $props();
</script>

<div class="form">
	<h2 class="section-title">Information</h2>

	<div class="field">
		<label for="name">Name *</label>
		<input id="name" type="text" bind:value={card.name} placeholder="Jorge Chato" />
	</div>

	<div class="field">
		<label for="role">Role</label>
		<input id="role" type="text" bind:value={card.role} placeholder="Senior Backend Engineer" />
	</div>

	<div class="field">
		<label for="company">Company</label>
		<input id="company" type="text" bind:value={card.company} placeholder="Mercari" />
	</div>

	<div class="field">
		<label for="tagline">Tagline</label>
		<input id="tagline" type="text" bind:value={card.tagline} placeholder="Optional short motto" />
	</div>

	<h2 class="section-title">Contact</h2>

	<div class="field">
		<label for="email">Email</label>
		<input id="email" type="email" bind:value={card.email} placeholder="jorge@example.com" />
	</div>

	<div class="field">
		<label for="phone">Phone</label>
		<input id="phone" type="tel" bind:value={card.phone} placeholder="+81 90 ..." />
	</div>

	<div class="field">
		<label for="website">Website</label>
		<input id="website" type="url" bind:value={card.website} placeholder="https://example.com" />
	</div>

	<div class="field">
		<label for="github">GitHub</label>
		<input id="github" type="url" bind:value={card.github} placeholder="https://github.com/jorge" />
	</div>

	<div class="field">
		<label for="linkedin">LinkedIn</label>
		<input
			id="linkedin"
			type="url"
			bind:value={card.linkedin}
			placeholder="https://linkedin.com/in/jorge"
		/>
	</div>

	<div class="field">
		<label for="location">Location</label>
		<input id="location" type="text" bind:value={card.location} placeholder="Tokyo, Japan" />
	</div>

	<h2 class="section-title">QR Code</h2>

	{#if card.qr}
		<div class="field checkbox">
			<input id="qr-enabled" type="checkbox" bind:checked={card.qr.enabled} />
			<label for="qr-enabled">Include QR code</label>
		</div>

		{#if card.qr.enabled}
			<div class="field">
				<label for="qr-value">QR content (URL)</label>
				<input
					id="qr-value"
					type="url"
					bind:value={card.qr.value}
					placeholder="https://example.com"
				/>
			</div>
			<div class="field">
				<label for="qr-label">QR label</label>
				<input id="qr-label" type="text" bind:value={card.qr.label} placeholder="Optional label" />
			</div>
		{/if}
	{/if}
</div>

<style>
	.field {
		margin-bottom: 14px;
	}

	.checkbox {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 44px;
	}

	.checkbox label {
		margin: 0;
	}

	.checkbox input[type='checkbox'] {
		width: 22px;
		height: 22px;
		accent-color: var(--ink);
	}
</style>
