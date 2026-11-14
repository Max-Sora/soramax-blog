<script lang="ts">
import { onMount } from "svelte";
import {
	getFailureMode,
	getHardwareCase,
	getHardwareModule,
	getSymptom,
	type HardwareCase,
	hardwareCases,
} from "@/lib/ee-intelligence/hardware";

let query = "";
let selectedCaseId = "case-01";
let selectedCase: HardwareCase = hardwareCases[0]!;
let moduleFilter = "";
let symptomFilter = "";

$: visibleCases = hardwareCases.filter((item) => {
	const search = `${item.id} ${item.title} ${item.summary}`.toLowerCase();
	return (
		(!query || search.includes(query.toLowerCase())) &&
		(!moduleFilter || item.moduleIds.includes(moduleFilter as never)) &&
		(!symptomFilter || item.symptomIds.includes(symptomFilter as never))
	);
});
$: currentDiagnosisHref = `/tools/ee-intelligence/diagnosis/?module=${selectedCase.moduleIds[0]}&symptom=${selectedCase.symptomIds[0]}&fault=${selectedCase.failureModeIds[0]}`;

onMount(() => {
	const params = new URLSearchParams(window.location.search);
	const item = getHardwareCase(params.get("case"));
	if (item) {
		selectedCaseId = item.id;
		selectedCase = item;
	}
	moduleFilter = params.get("module") ?? "";
	symptomFilter = params.get("symptom") ?? "";
});

function inspect(item: HardwareCase) {
	selectedCaseId = item.id;
	selectedCase = item;
	window.history.replaceState(
		{},
		"",
		`/tools/ee-intelligence/case-explorer/?case=${encodeURIComponent(item.id)}${moduleFilter ? `&module=${encodeURIComponent(moduleFilter)}` : ""}${symptomFilter ? `&symptom=${encodeURIComponent(symptomFilter)}` : ""}`,
	);
}

function moduleName(id: string) {
	return getHardwareModule(id)?.name ?? id;
}
function symptomName(id: string) {
	return getSymptom(id)?.title ?? id;
}
function failureName(id: string) {
	return getFailureMode(id)?.title ?? id;
}
</script>

<svelte:head>
	<title>Case Explorer · Hardware Atlas</title>
	<meta name="description" content="Evidence-linked synthetic troubleshooting cases connected to Hardware Atlas." />
</svelte:head>

<div class="case-shell">
	<header class="case-header"><div><span class="eyebrow">EE INTELLIGENCE / CASE EXPLORER</span><h1>Evidence, in context.</h1><p>Cases share the Hardware Atlas module, symptom and failure IDs. Inspect the reasoning chain before opening a diagnosis run.</p></div><div class="header-links"><a href="/tools/ee-intelligence/hardware-atlas/">← Hardware Atlas</a><span class="synthetic-label">SYNTHETIC DEMO DATA</span></div></header>
	<div class="case-notice"><strong>Educational case library</strong><span>These are structured demo cases. “Synthetic Demo” is intentionally visible and is not a verified repair record.</span></div>
	<section class="case-layout">
		<div class="case-queue"><div class="queue-tools"><input bind:value={query} aria-label="Search cases" placeholder="Search case, symptom or evidence…" /><select bind:value={moduleFilter} aria-label="Filter by module"><option value="">All modules</option>{#each ["gpu", "psu", "ram", "motherboard", "storage", "cpu", "cooling", "fans", "display"] as id}<option value={id}>{moduleName(id)}</option>{/each}</select><select bind:value={symptomFilter} aria-label="Filter by symptom"><option value="">All symptoms</option>{#each ["black-screen", "no-display-signal", "low-fps", "stuttering", "random-reboot", "bsod", "overheating", "boot-failure", "disk-slowness", "application-crash", "display-artifacts", "excessive-fan-noise"] as id}<option value={id}>{symptomName(id)}</option>{/each}</select></div><div class="queue-count">{visibleCases.length} cases · context filters preserve many-to-many relationships</div>{#each visibleCases as item}<button class:selected={selectedCaseId === item.id} class="queue-item" on:click={() => inspect(item)}><div><span>{item.id.toUpperCase()}</span><strong>{item.title}</strong><small>{item.summary}</small></div><b>→</b></button>{:else}<div class="empty">No matching cases. Clear a filter to restore the full queue.</div>{/each}</div>
		<article class="case-detail"><div class="detail-top"><div><span class="eyebrow">{selectedCase.id.toUpperCase()} · {selectedCase.sourceType}</span><h2>{selectedCase.title}</h2></div><span class="confidence">{Math.round(selectedCase.confidence * 100)}% confidence</span></div><p class="detail-summary">{selectedCase.summary}</p><div class="relation-block"><span class="eyebrow">MODULES</span><div class="tags">{#each selectedCase.moduleIds as id}<a href={`/tools/ee-intelligence/hardware-atlas/?module=${id}`}>{moduleName(id)}</a>{/each}</div></div><div class="relation-block"><span class="eyebrow">SYMPTOMS</span><div class="tags">{#each selectedCase.symptomIds as id}<a href={`/tools/ee-intelligence/hardware-atlas/?module=${selectedCase.moduleIds[0]}&symptom=${id}`}>{symptomName(id)}</a>{/each}</div></div><div class="relation-block"><span class="eyebrow">FAILURE HYPOTHESES</span><div class="hypothesis-list">{#each selectedCase.failureModeIds as id}<div><span class="hypothesis-dot"></span><span>{failureName(id)}</span></div>{/each}</div></div><div class="evidence-block"><div class="detail-heading"><h3>Evidence ledger</h3><span>{selectedCase.evidence.length} items</span></div>{#each selectedCase.evidence as evidence}<div class="evidence-item"><span class="evidence-index">{evidence.label}</span><div><strong>{evidence.value}</strong><small>{evidence.source}</small></div></div>{/each}</div><div class="detail-actions"><a class="primary" href={currentDiagnosisHref}>Run Diagnosis with this context <span>→</span></a><a class="secondary" href={`/tools/ee-intelligence/hardware-atlas/?module=${selectedCase.moduleIds[0]}&symptom=${selectedCase.symptomIds[0]}&fault=${selectedCase.failureModeIds[0]}`}>Return to Atlas <span>↗</span></a></div></article>
	</section>
	<footer class="case-footer">CASE EXPLORER · SOURCE STATUS IS EXPLICIT · <a href="/tools/ee-intelligence/">EE Intelligence dashboard</a></footer>
</div>

<style>
	.case-shell { --case-bg: #071017; --case-panel: #0b1720; --case-line: rgba(151,203,216,.16); --case-line-strong: rgba(117,210,224,.42); --case-ink: #d9edf0; --case-muted: #8aa4aa; --case-cyan: #75d2e0; --case-amber: #e2ae62; width: min(1240px, calc(100% - 2rem)); margin: 0 auto; padding: 1.3rem 0 3.5rem; color: var(--case-ink); }.case-shell :is(button,a,input,select):focus-visible { outline: 2px solid var(--case-cyan); outline-offset: 3px; }.case-header { display: flex; justify-content: space-between; gap: 1rem; align-items: end; padding-bottom: 1.3rem; border-bottom: 1px solid var(--case-line); }.eyebrow { color: var(--case-cyan); font: 700 .63rem ui-monospace, monospace; letter-spacing: .13em; }.case-header h1 { margin: .45rem 0 .35rem; font-size: clamp(2.2rem, 5vw, 3.8rem); letter-spacing: -.06em; }.case-header p { max-width: 44rem; margin: 0; color: var(--case-muted); font-size: .78rem; line-height: 1.5; }.header-links { display: grid; justify-items: end; gap: .6rem; }.header-links a, .case-footer a { color: var(--case-cyan); font: 700 .66rem ui-monospace, monospace; text-decoration: none; }.synthetic-label { border: 1px solid rgba(226,174,98,.55); padding: .35rem .45rem; color: var(--case-amber); font: 700 .59rem ui-monospace, monospace; }.case-notice { display: flex; gap: .7rem; margin: 1rem 0; padding: .7rem .8rem; border-left: 2px solid var(--case-amber); background: rgba(226,174,98,.07); font-size: .7rem; }.case-notice span { color: var(--case-muted); }.case-layout { display: grid; grid-template-columns: minmax(20rem, .8fr) minmax(0, 1.2fr); gap: 1rem; align-items: start; }.case-queue, .case-detail { border: 1px solid var(--case-line); background: linear-gradient(135deg, rgba(14,31,42,.96), rgba(7,16,23,.98)); }.case-queue { padding: .8rem; }.queue-tools { display: grid; gap: .45rem; }.queue-tools input, .queue-tools select { min-width: 0; border: 1px solid var(--case-line); padding: .55rem; background: var(--case-bg); color: var(--case-ink); font-size: .7rem; }.queue-count { margin: .7rem 0 .35rem; color: var(--case-muted); font: .59rem ui-monospace, monospace; }.queue-item { display: flex; justify-content: space-between; gap: .6rem; width: 100%; padding: .65rem .55rem; border: 1px solid transparent; border-bottom-color: var(--case-line); background: transparent; color: var(--case-ink); text-align: left; cursor: pointer; }.queue-item:hover, .queue-item.selected { border-color: var(--case-line-strong); background: rgba(117,210,224,.06); }.queue-item > div { min-width: 0; }.queue-item span, .queue-item strong, .queue-item small { display: block; }.queue-item span { color: var(--case-cyan); font: 700 .57rem ui-monospace, monospace; }.queue-item strong { margin-top: .3rem; font-size: .71rem; }.queue-item small { margin-top: .25rem; color: var(--case-muted); font-size: .64rem; line-height: 1.4; }.queue-item b { color: var(--case-cyan); }.case-detail { padding: 1rem; }.detail-top { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }.case-detail h2 { margin: .45rem 0 0; font-size: 1.45rem; line-height: 1.15; }.confidence { color: var(--case-amber); font: 700 .64rem ui-monospace, monospace; white-space: nowrap; }.detail-summary { margin: .8rem 0 1.1rem; color: var(--case-muted); font-size: .78rem; line-height: 1.55; }.relation-block, .evidence-block { margin-top: 1rem; padding-top: .8rem; border-top: 1px solid var(--case-line); }.tags { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .5rem; }.tags a { border: 1px solid var(--case-line); padding: .33rem .45rem; color: var(--case-cyan); font-size: .64rem; text-decoration: none; }.tags a:hover { background: rgba(117,210,224,.07); }.hypothesis-list { display: grid; gap: .4rem; margin-top: .5rem; color: var(--case-muted); font-size: .7rem; }.hypothesis-list div { display: flex; gap: .4rem; align-items: center; }.hypothesis-dot { width: .45rem; height: .45rem; border-radius: 50%; background: var(--case-amber); }.detail-heading { display: flex; justify-content: space-between; gap: .5rem; align-items: baseline; }.detail-heading h3 { margin: 0; font-size: .9rem; }.detail-heading span { color: var(--case-muted); font: .6rem ui-monospace, monospace; }.evidence-item { display: grid; grid-template-columns: 5rem 1fr; gap: .7rem; padding: .65rem 0; border-bottom: 1px solid var(--case-line); }.evidence-index { color: var(--case-cyan); font: 700 .59rem ui-monospace, monospace; }.evidence-item strong, .evidence-item small { display: block; }.evidence-item strong { font-size: .7rem; line-height: 1.4; }.evidence-item small { margin-top: .22rem; color: var(--case-muted); font-size: .62rem; }.detail-actions { display: grid; gap: .45rem; margin-top: 1.1rem; }.detail-actions a { display: flex; justify-content: space-between; gap: .5rem; padding: .6rem .7rem; font: 700 .65rem ui-monospace, monospace; text-decoration: none; }.detail-actions .primary { background: var(--case-cyan); color: #061017; }.detail-actions .secondary { border: 1px solid var(--case-line-strong); color: var(--case-cyan); }.empty { padding: 1rem; border: 1px dashed var(--case-line-strong); color: var(--case-muted); font-size: .7rem; }.case-footer { margin-top: 1.4rem; padding-top: .75rem; border-top: 1px solid var(--case-line); color: var(--case-muted); font: .6rem ui-monospace, monospace; }
	.case-shell { padding: 1.3rem 1.3rem 3.5rem; box-sizing: border-box; border: 1px solid rgba(117,210,224,.15); background: radial-gradient(circle at 12% 0%, rgba(35,93,112,.18), transparent 36%), var(--case-bg); }
	@media (max-width: 800px) { .case-header { align-items: start; flex-direction: column; }.header-links { justify-items: start; }.case-layout { grid-template-columns: 1fr; } }
	@media (max-width: 560px) { .case-shell { width: min(100% - 1rem, 760px); }.detail-top { display: grid; }.confidence { justify-self: start; }.case-footer { line-height: 1.5; } }
</style>
