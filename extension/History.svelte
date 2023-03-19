<script lang="ts">
    import Icon from '@iconify/svelte';
    import { get } from 'svelte/store';
    import type { HistoryEntry } from './graph';
    import type { RenderedGraph } from './rendered_graph';

    export let renderedGraph: RenderedGraph;
    $: history = renderedGraph.graph.history;
    $: viewedEntry = renderedGraph.viewedHistoryEntry;

    let historyShown = false;

    const historyEntryDifference = (e1: HistoryEntry, e2: HistoryEntry) => {
        let output = '';

        let edgesRemoved = e2.events.filter(x => x.type === 'Drop').length;
        let edgesAdded = e2.edges.length - e1.edges.length + edgesRemoved;
        let nodesAdded = e2.nodes.length - e1.nodes.length;
        let valueChanges = e2.events.filter(x => x.type === 'Value').length;

        if (nodesAdded > 0) output += `Nodes: +${nodesAdded}\n`;
        if (edgesAdded > 0 || edgesRemoved > 0)
            output += `Edges: ${[edgesAdded, -edgesRemoved].filter(Boolean).map(x => (x > 0 ? '+' : '') + x).join(', ')}\n`;
        if (valueChanges > 0) output += `Changes: ${valueChanges}`;

        return output;
    };

    const goBack = () => {
        let arr = get(renderedGraph.graph.history);
        let index = arr.indexOf($viewedEntry);
        renderedGraph.viewHistoryEntry(arr[Math.max(index - 1, 0)]);
    };
    const goForward = () => {
        let arr = get(renderedGraph.graph.history);
        let index = arr.indexOf($viewedEntry);
        renderedGraph.viewHistoryEntry(arr[Math.min(index + 1, arr.length - 1)]);
    };

    const scrollIntoView = (node: HTMLElement, entry: HistoryEntry) => {
        let unsubscribe = viewedEntry.subscribe(x => {
            if (x === entry) node.scrollIntoView({ inline: 'nearest' });
        });

        return {
            destroy: unsubscribe
        };
    };
</script>

<svelte:window
    on:keydown={(e) => e.code === 'ArrowLeft' && goBack()}
    on:keydown={(e) => e.code === 'ArrowRight' && goForward()}
/>

<div class="absolute left-2 right-2 bottom-2 drop-shadow">
    <button
        class="w-56 bg-[#292a2d] rounded-t-md text-left text-xs font-medium flex items-center py-1 px-3 cursor-pointer hover:bg-zinc-800"
        class:rounded-b-md={!historyShown}
        on:click={() => historyShown = !historyShown}
    >
        <p class="flex-1 opacity-60 hover:opacity-100">History</p>
        <Icon icon="heroicons:chevron-down-20-solid" class="w-4 h-4 {!historyShown && 'rotate-180'}" />
    </button>

    {#if historyShown}
        <div class="w-full bg-[#292a2d] rounded-b-md h-28 overflow-x-auto rounded-tr-md p-3">
            <div class="flex items-center h-6 box-content">
                {#each $history as entry, i}
                    <button
                        class="shrink-0 bg-zinc-700 w-4 h-4 rounded-full shadow z-10 hover:h-6 transition-all {$viewedEntry === entry && 'bg-blue-500 h-6'}"
                        on:click={() => renderedGraph.viewHistoryEntry(entry)}
                        use:scrollIntoView={entry}
                    />

                    {#if i < $history.length - 1}
                        <div class="shrink-0 bg-zinc-700 w-24 h-1 rounded-full -mx-1 relative">
                            <p class="absolute left-0 top-2 text-[10px] opacity-50 w-full text-center whitespace-pre">
                                {historyEntryDifference(entry, $history[i+1])}
                            </p>
                        </div>
                    {/if}
                {/each}
                <div class="w-3 h-1 shrink-0" />
            </div>
        </div>
    {/if}
</div>