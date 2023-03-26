<script lang="ts">
    import Icon from '@iconify/svelte';
    import { tick } from 'svelte';
    import type { RenderedGraph } from './rendered_graph';
    import type { ReScalaEvent } from './re_scala';
    import { groupBy } from './utils';

    const GROUPING_MODES = {
        'Batch': (history: ReScalaEvent[]) => groupBy(history, x => x.batch),
        'Transaction': (history: ReScalaEvent[]) => groupBy(history, x => x.transaction),
        'Atomic': (history: ReScalaEvent[]) => history.map(x => [x])
    } as const;

    export let renderedGraph: RenderedGraph;
    $: history = renderedGraph.graph.history;
    $: currentHistoryIndex = renderedGraph.graph.currentHistoryIndex;
    $: selectedGroupingMode = 'Batch' as keyof typeof GROUPING_MODES;
    $: groups = [[], ...GROUPING_MODES[selectedGroupingMode]($history)];
    $: currentGroupIndex = Math.max(groups.findIndex(x => x.includes($history[$currentHistoryIndex])), 0);

    let historyShown = false;

    const setGroupingMode = async (mode: string) => {
        selectedGroupingMode = mode as keyof typeof GROUPING_MODES;

        await tick();
        let group = groups[currentGroupIndex];
        renderedGraph.graph.setHistoryIndex($history.indexOf(group.at(-1)));
    };

    const formattedDiff = (group: ReScalaEvent[]) => {
        let output = '';

        let edgesRemoved = group.filter(x => x.type === 'Drop').length;
        let edgesAdded = group.filter(x => x.type === 'Discover').length;
        let nodesAdded = group.filter(x => x.type === 'Create').length;
        let valueChanges = group.filter(x => x.type === 'Value').length;

        if (nodesAdded > 0) output += `Nodes: +${nodesAdded}\n`;
        if (edgesAdded > 0 || edgesRemoved > 0)
            output += `Edges: ${[edgesAdded, -edgesRemoved].filter(Boolean).map(x => (x > 0 ? '+' : '') + x).join(', ')}\n`;
        if (valueChanges > 0) output += `Changes: ${valueChanges}`;

        return output;
    };

    const goBack = () => {
        if (currentGroupIndex === 0) return;

        let nextHistoryIndex = $history.indexOf(groups[currentGroupIndex - 1].at(-1));
        renderedGraph.graph.setHistoryIndex(nextHistoryIndex);
    };
    const goForward = () => {
        if (currentGroupIndex === groups.length - 1) return;

        let nextHistoryIndex = $history.indexOf(groups[currentGroupIndex + 1].at(-1));
        renderedGraph.graph.setHistoryIndex(nextHistoryIndex);
    };

    const scrollIntoView = (node: HTMLElement, group: ReScalaEvent[]) => {
        let unsubscribe = currentHistoryIndex.subscribe(x => {
            let event = $history[x];
            if (group.includes(event) /*|| (x === -1 && group.length === 0)*/) {
                console.log(1, node, group, groups.includes(group));
                node.scrollIntoView({ inline: 'nearest' });
            }
        });

        return {
            update: (newGroup: ReScalaEvent[]) => group = newGroup,
            destroy: unsubscribe
        };
    };
</script>

<svelte:window
    on:keydown={(e) => e.code === 'ArrowLeft' && goBack()}
    on:keydown={(e) => e.code === 'ArrowRight' && goForward()}
/>

<div class="absolute left-2 right-2 bottom-2 drop-shadow pointer-events-none">
    <div
        class="inline-flex bg-elevation-1 rounded-t-md border border-border-1 overflow-hidden pointer-events-auto"
        class:rounded-b-md={!historyShown}
        class:!border-b-0={historyShown}
    >
        <button
            class="group w-56 text-left text-xs font-medium flex items-center py-1 px-3 cursor-pointer hover:bg-hover-1 box-content border-r border-border-1"
            on:click={() => historyShown = !historyShown}
        >
            <p class="flex-1 opacity-60 group-hover:opacity-100">History</p>
            <Icon icon="heroicons:chevron-down-20-solid" class="w-4 h-4 {!historyShown && 'rotate-180'}" />
        </button>

        {#each Object.entries(GROUPING_MODES) as [groupingMode]}
            <button
                class="group w-20 text-[11px] font-medium cursor-pointer hover:bg-hover-1"
                on:click={() => setGroupingMode(groupingMode)}
            >
                <p
                    class="opacity-30 group-hover:opacity-100"
                    class:font-black={groupingMode === selectedGroupingMode}
                    class:opacity-100={groupingMode === selectedGroupingMode}
                >
                    {groupingMode}
                </p>
            </button>
        {/each}
    </div>

    {#if historyShown}
        <div
            class="pointer-events-auto w-full bg-elevation-1 rounded-b-md h-28 overflow-x-auto rounded-tr-md p-3 border border-border-1"
            on:keydown={e => e.code.startsWith('Arrow') && e.preventDefault()}
        >
            <div class="flex items-center h-6 box-content">
                {#each groups as group, i}
                    <button
                        class="shrink-0 bg-elevation-2 w-4 h-4 rounded-full shadow z-10 hover:h-6 transition-all scroll-mx-4 {currentGroupIndex === i && 'bg-highlight-1 h-6'}"
                        on:click={() => renderedGraph.graph.setHistoryIndex($history.indexOf(group.at(-1)))}
                        use:scrollIntoView={group}
                    />

                    {#if i < groups.length - 1}
                        <div class="shrink-0 bg-elevation-2 w-24 h-1 rounded-full -mx-1 relative">
                            <p class="absolute left-0 top-2 text-[10px] opacity-50 w-full text-center whitespace-pre">
                                {formattedDiff(groups[i+1])}
                            </p>
                        </div>
                    {/if}
                {/each}
                <div class="w-3 h-1 shrink-0" />
            </div>
        </div>
    {/if}
</div>