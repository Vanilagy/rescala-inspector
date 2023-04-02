<script lang="ts">
	import { saturate } from '../ts/utils';
	import Icon from '@iconify/svelte';
	import { animationSpeedSetting } from '../ts/rendered_graph';

	let dragging = false;

	$: completion = $animationSpeedSetting / 4;

	let dragCompletion: number;
	const drag = (e: PointerEvent) => {
		if (!dragging) return;

		dragCompletion += e.movementX / 80;

		$animationSpeedSetting = Math.round(saturate(dragCompletion) * 4);
	};
</script>

<svelte:window
	on:pointermove={drag}
	on:pointerup={() => dragging = false}
/>

<div class="absolute bottom-3 right-3 flex items-center space-x-2">
	<Icon icon="fluent:slow-mode-24-regular" class="w-4 h-4 opacity-30" />
	<div class="h-2 bg-elevation-1 rounded-md overflow-hidden w-20 relative border box-content border-border-1">
		<div
			class="h-2 w-4 rounded-md bg-elevation-3 absolute top-0 shadow hover:bg-hover-strong cursor-grab transition-all"
			class:bg-hover-strong={dragging}
			style="left: {100 * completion}%; transform: translateX({-100 * completion}%);"
			on:pointerdown={() => (dragging = true, dragCompletion = completion)}
		/>
	</div>
	<Icon icon="fluent:fast-mode-24-regular" class="w-4 h-4 opacity-30" />
</div>