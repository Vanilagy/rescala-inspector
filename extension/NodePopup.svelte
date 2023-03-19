<script lang="ts">
    import { fly } from "svelte/transition";
    import type { RenderedGraph } from "./rendered_graph";

    export let renderedGraph: RenderedGraph;
    $: selectedNode = renderedGraph.selectedNode; 
    $: graphScale = renderedGraph.scale;
    $: viewedHistoryEntry = renderedGraph.viewedHistoryEntry;
    $: formattedValue = $viewedHistoryEntry.values.get($selectedNode?.node)?.formatted;

    $: popupStyle = (() => {
        if (!$selectedNode) return;

        let width = 208;
        let height = 150;
        let left = $selectedNode.visualCenter().x * $graphScale + renderedGraph.originX - width/2;
        let top = $selectedNode.visualPosition().y * $graphScale + renderedGraph.originY - height;

        return {
            width,
            height,
            left,
            top
        };
    })();
</script>

{#if $selectedNode}
    <div
        transition:fly={{y: -10, duration: 150}}
        class="absolute text-xs opacity-20 hover:opacity-100 transition-opacity blur-sm hover:blur-none"
        style:width={popupStyle.width + 'px'}
        style:height={popupStyle.height + 'px'}
        style:left={popupStyle.left + 'px'}
        style:top={popupStyle.top + 'px'}
    >
        <div class="w-full h-full bg-elevation-1 border border-border-1 shadow rounded-md p-2 px-3 space-y-3">
            <p class="opacity-30 text-[10px] break-words">
                {@html '/' + $selectedNode.node.reScalaResource.path.slice(0, -1).join('/').replaceAll('/', '/<wbr>')}
            </p>
            <div class="flex w-full !mt-1">
                <p class="truncate flex-1">
                    <span class="opacity-50 font-bold uppercase text-[11px]">Label</span><br>
                    {$selectedNode.node.label}
                </p>
                <p class="truncate text-right">
                    <span class="opacity-50 font-bold uppercase text-[11px]">ID</span><br>
                    {$selectedNode.node.id}
                </p>
            </div>
            {#if formattedValue}
                <div>
                    <span class="opacity-50 font-bold uppercase text-[11px]">Value</span><br>
                    <div
                        class="absolute value-continer font-mono whitespace-pre bg-elevation-2 px-2 py-1 rounded-md
                            shadow overflow-hidden min-w-[calc(100%-24px)] max-w-[calc(100%-24px)] max-h-[46px] hover:overflow-auto hover:max-h-64
                            hover:max-w-[400px] select-text"
                    >
                        {@html formattedValue}
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}