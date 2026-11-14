<script lang="ts">
import { onMount } from "svelte";
import {
	type FailureModeId,
	failureModes,
	getFailureMode,
	getHardwareCase,
	getHardwareModule,
	getSymptom,
	type HardwareModuleId,
	hardwareCases,
	hardwareModules,
	type SymptomId,
	symptoms,
} from "@/lib/ee-intelligence/hardware";

let moduleId: HardwareModuleId = "gpu";
let symptomId: SymptomId = "black-screen";
let failureId: FailureModeId | "" = "";
let description = "";
let diagnosisStatus = "idle";
let invalidContext = false;

$: activeModule = getHardwareModule(moduleId) ?? hardwareModules[0]!;
$: symptom = getSymptom(symptomId) ?? symptoms[0]!;
$: failure = getFailureMode(failureId);
$: relatedCases = hardwareCases.filter(
	(item) =>
		item.moduleIds.includes(activeModule.id) &&
		item.symptomIds.includes(symptom.id),
);
$: candidateFailures = symptom.relatedFailureModeIds
	.map((id) => getFailureMode(id))
	.filter(Boolean);

onMount(() => {
	const params = new URLSearchParams(window.location.search);
	const incomingModule = getHardwareModule(params.get("module"));
	const incomingSymptom = getSymptom(params.get("symptom"));
	const incomingFailure = getFailureMode(params.get("fault"));
	invalidContext =
		Boolean(params.get("module") && !incomingModule) ||
		Boolean(params.get("symptom") && !incomingSymptom) ||
		Boolean(params.get("fault") && !incomingFailure);
	if (incomingModule) moduleId = incomingModule.id;
	if (incomingSymptom) symptomId = incomingSymptom.id;
	if (incomingFailure) failureId = incomingFailure.id;
});

function updateContext() {
	const params = new URLSearchParams({ module: moduleId, symptom: symptomId });
	if (failureId) params.set("fault", failureId);
	window.history.replaceState(
		{},
		"",
		`/tools/ee-intelligence/diagnosis/?${params.toString()}`,
	);
}

function runLocalTriage() {
	diagnosisStatus = "running";
	window.setTimeout(() => {
		diagnosisStatus = "ready";
	}, 260);
}

function moduleName(id: string) {
	return getHardwareModule(id)?.name ?? id;
}
function failureName(id: string) {
	return getFailureMode(id)?.title ?? id;
}
</script>

<svelte:head>
	<title>AI Diagnosis · EE Intelligence</title>
	<meta name="description" content="Prefilled local-first diagnosis context from Hardware Atlas." />
</svelte:head>

<div class="diagnosis-shell">
	<header class="diagnosis-header"><div><span class="eyebrow">EE INTELLIGENCE / AI DIAGNOSIS</span><h1>Diagnosis starts with context.</h1><p>Hardware Atlas carries the selected module, symptom and failure hypothesis here. This page runs a transparent local triage flow; it does not claim a live AI or sensor result.</p></div><div class="header-links"><a href="/tools/ee-intelligence/hardware-atlas/">← Hardware Atlas</a><span class="offline-label">LOCAL-FIRST · NO API KEY</span></div></header>
	{#if invalidContext}<div class="invalid-notice"><strong>Some incoming IDs were not recognized.</strong><span>Safe defaults are shown. The URL remains readable and can be corrected from Atlas.</span></div>{/if}
	<div class="diagnosis-banner"><span>◎</span><div><strong>Educational triage workflow</strong><p>Use this as a structured checklist. It is not a diagnosis of the visitor's machine, and no private telemetry is read.</p></div></div>
	<section class="diagnosis-grid">
		<div class="context-panel panel"><div class="panel-heading"><div><span class="eyebrow">01 · PREFILLED CONTEXT</span><h2>What brought you here</h2></div><span class="context-state">{diagnosisStatus === "ready" ? "TRIAGE READY" : "CONTEXT ACTIVE"}</span></div><div class="context-form"><label>Module<select bind:value={moduleId} on:change={() => { failureId = ""; updateContext(); }}><option value="">Choose module</option>{#each hardwareModules as item}<option value={item.id}>{item.name} · {item.nameZh}</option>{/each}</select></label><label>Observed symptom<select bind:value={symptomId} on:change={() => { failureId = ""; updateContext(); }}>{#each symptoms as item}<option value={item.id}>{item.title}</option>{/each}</select></label><label>Working hypothesis<select bind:value={failureId} on:change={updateContext}><option value="">Keep multiple hypotheses open</option>{#each candidateFailures as item}<option value={item?.id}>{item?.title}</option>{/each}</select></label><label class="description-field">What changed or when did it start?<textarea bind:value={description} placeholder="Optional: e.g. after a GPU swap, under load, after a driver update…"></textarea></label></div><div class="context-chips"><span>{activeModule.name}</span><span>{symptom.title}</span>{#if failure}<span>{failure.title}</span>{/if}</div><button class="run-button" on:click={runLocalTriage} disabled={diagnosisStatus === "running"}>{diagnosisStatus === "running" ? "Building evidence path…" : diagnosisStatus === "ready" ? "Re-run local triage" : "Run local triage"}<span>→</span></button></div>
		<aside class="result-panel panel"><div class="panel-heading"><div><span class="eyebrow">02 · REVIEWABLE RESULT</span><h2>{failure ? failure.title : "Multiple causes remain possible"}</h2></div><span class="result-state">{failure ? failure.severity.toUpperCase() : "OPEN SET"}</span></div><p class="result-lede">{failure ? failure.description : symptom.description}</p><div class="result-block"><div class="block-heading"><h3>Related modules</h3><span>{symptom.relatedModuleIds.length} possible</span></div><div class="result-tags">{#each symptom.relatedModuleIds as id}<a href={`/tools/ee-intelligence/hardware-atlas/?module=${id}&symptom=${symptom.id}`}>{moduleName(id)}</a>{/each}</div></div><div class="result-block"><div class="block-heading"><h3>Validation signals</h3><span>observe before replacing</span></div><ul>{#each (failure?.diagnosticIndicators ?? ["Repeat the symptom under a controlled condition", "Compare a known-good cable, slot or profile where safe", "Check logs and documented vendor diagnostics"]) as indicator}<li>{indicator}</li>{/each}</ul></div><div class="result-block"><div class="block-heading"><h3>Safety boundary</h3><span>stop conditions</span></div><p class="safety-copy">Power down before touching internal hardware. Do not open a PSU, probe live rails, or work around moving fans. If there is smoke, a burnt smell or visible damage, disconnect power and seek qualified service.</p></div>{#if diagnosisStatus === "ready"}<div class="ready-callout"><strong>Context path assembled</strong><span>{relatedCases.length} related case{relatedCases.length === 1 ? "" : "s"} available for review.</span></div>{/if}</aside>
	</section>
	<section class="next-section"><div class="section-heading"><div><span class="eyebrow">03 · NEXT EVIDENCE</span><h2>Open related cases</h2><p>Cases remain linked to the same IDs, so the context can move back and forth without a generic jump.</p></div><a href={`/tools/ee-intelligence/case-explorer/?module=${activeModule.id}&symptom=${symptom.id}`} class="secondary">Open Case Explorer <span>↗</span></a></div><div class="mini-case-grid">{#each relatedCases.slice(0, 4) as item}<a class="mini-case" href={`/tools/ee-intelligence/case-explorer/?case=${item.id}&module=${activeModule.id}&symptom=${symptom.id}`}><span>{item.id.toUpperCase()} · {item.sourceType}</span><strong>{item.title}</strong><small>{item.evidence.length} evidence items →</small></a>{:else}<div class="empty">No direct case intersection for this combination. Keep multiple hypotheses open and change the symptom or module.</div>{/each}</div></section>
	<footer class="diagnosis-footer">AI DIAGNOSIS · TRANSPARENT LOCAL TRIAGE · <a href="/tools/ee-intelligence/">EE Intelligence dashboard</a></footer>
</div>

<style>
	.diagnosis-shell { --diag-bg: #071017; --diag-panel: #0b1720; --diag-line: rgba(151,203,216,.16); --diag-line-strong: rgba(117,210,224,.42); --diag-ink: #d9edf0; --diag-muted: #8aa4aa; --diag-cyan: #75d2e0; --diag-amber: #e2ae62; --diag-red: #ef716d; width: min(1240px, calc(100% - 2rem)); margin: 0 auto; padding: 1.3rem 0 3.5rem; color: var(--diag-ink); }.diagnosis-shell :is(button,a,input,select,textarea):focus-visible { outline: 2px solid var(--diag-cyan); outline-offset: 3px; }.diagnosis-header { display: flex; justify-content: space-between; gap: 1rem; align-items: end; padding-bottom: 1.3rem; border-bottom: 1px solid var(--diag-line); }.eyebrow { color: var(--diag-cyan); font: 700 .63rem ui-monospace, monospace; letter-spacing: .13em; }.diagnosis-header h1 { margin: .45rem 0 .35rem; font-size: clamp(2.2rem, 5vw, 3.8rem); letter-spacing: -.06em; }.diagnosis-header p { max-width: 44rem; margin: 0; color: var(--diag-muted); font-size: .78rem; line-height: 1.5; }.header-links { display: grid; justify-items: end; gap: .6rem; }.header-links a, .diagnosis-footer a { color: var(--diag-cyan); font: 700 .66rem ui-monospace, monospace; text-decoration: none; }.offline-label { border: 1px solid var(--diag-line-strong); padding: .35rem .45rem; color: var(--diag-cyan); font: 700 .59rem ui-monospace, monospace; }.invalid-notice, .diagnosis-banner { display: flex; gap: .7rem; margin: 1rem 0; padding: .7rem .8rem; }.invalid-notice { border-left: 2px solid var(--diag-red); background: rgba(239,113,109,.08); font-size: .7rem; }.invalid-notice span { color: var(--diag-muted); }.diagnosis-banner { border-left: 2px solid var(--diag-amber); background: rgba(226,174,98,.07); }.diagnosis-banner > span { color: var(--diag-amber); font-size: 1.1rem; }.diagnosis-banner strong { font-size: .72rem; }.diagnosis-banner p { margin: .2rem 0 0; color: var(--diag-muted); font-size: .67rem; }.diagnosis-grid { display: grid; grid-template-columns: minmax(0, .92fr) minmax(20rem, 1.08fr); gap: 1rem; align-items: start; }.panel { border: 1px solid var(--diag-line); background: linear-gradient(135deg, rgba(14,31,42,.96), rgba(7,16,23,.98)); padding: 1rem; }.panel-heading, .section-heading { display: flex; justify-content: space-between; gap: .8rem; align-items: start; }.panel-heading h2, .section-heading h2 { margin: .4rem 0 0; font-size: 1.2rem; }.context-state, .result-state { color: var(--diag-cyan); font: 700 .59rem ui-monospace, monospace; letter-spacing: .08em; }.result-state { color: var(--diag-amber); }.context-form { display: grid; gap: .7rem; margin-top: 1rem; }.context-form label { display: grid; gap: .35rem; color: var(--diag-muted); font-size: .67rem; }.context-form select, .context-form textarea { border: 1px solid var(--diag-line); padding: .55rem; background: var(--diag-bg); color: var(--diag-ink); font-size: .72rem; }.context-form textarea { min-height: 5.5rem; resize: vertical; line-height: 1.45; }.context-chips { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .9rem; }.context-chips span { border: 1px solid var(--diag-line-strong); padding: .32rem .4rem; color: var(--diag-cyan); font: 700 .59rem ui-monospace, monospace; }.run-button { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 1rem; border: 1px solid var(--diag-cyan); padding: .62rem .7rem; background: var(--diag-cyan); color: #061017; font: 700 .67rem ui-monospace, monospace; cursor: pointer; }.run-button:disabled { opacity: .6; cursor: wait; }.result-lede { margin: .9rem 0; color: var(--diag-muted); font-size: .76rem; line-height: 1.5; }.result-block { margin-top: 1rem; padding-top: .8rem; border-top: 1px solid var(--diag-line); }.block-heading { display: flex; justify-content: space-between; gap: .5rem; align-items: baseline; }.block-heading h3 { margin: 0; font-size: .8rem; }.block-heading span { color: var(--diag-muted); font: .58rem ui-monospace, monospace; }.result-tags { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .5rem; }.result-tags a { border: 1px solid var(--diag-line); padding: .35rem .45rem; color: var(--diag-cyan); font-size: .63rem; text-decoration: none; }.result-block ul { display: grid; gap: .45rem; margin: .55rem 0 0; padding-left: 1rem; color: var(--diag-muted); font-size: .68rem; line-height: 1.45; }.result-block li::marker { color: var(--diag-cyan); }.safety-copy { margin: .55rem 0 0; color: var(--diag-muted); font-size: .67rem; line-height: 1.5; }.ready-callout { display: grid; gap: .2rem; margin-top: 1rem; padding: .65rem; border-left: 2px solid var(--diag-cyan); background: rgba(117,210,224,.07); }.ready-callout strong { font-size: .72rem; }.ready-callout span { color: var(--diag-muted); font-size: .65rem; }.next-section { margin-top: 1.8rem; }.section-heading p { margin: .35rem 0 0; color: var(--diag-muted); font-size: .74rem; }.secondary { display: flex; justify-content: space-between; gap: .5rem; align-items: center; border: 1px solid var(--diag-line-strong); padding: .55rem .65rem; color: var(--diag-cyan); font: 700 .64rem ui-monospace, monospace; text-decoration: none; white-space: nowrap; }.mini-case-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; margin-top: .8rem; }.mini-case { display: grid; gap: .35rem; min-height: 6rem; padding: .65rem; border: 1px solid var(--diag-line); background: var(--diag-panel); color: var(--diag-ink); text-decoration: none; }.mini-case:hover { border-color: var(--diag-cyan); background: rgba(117,210,224,.06); }.mini-case span, .mini-case small { color: var(--diag-muted); font: .58rem ui-monospace, monospace; }.mini-case strong { font-size: .7rem; line-height: 1.3; }.empty { grid-column: 1/-1; padding: 1rem; border: 1px dashed var(--diag-line-strong); color: var(--diag-muted); font-size: .7rem; }.diagnosis-footer { margin-top: 1.4rem; padding-top: .75rem; border-top: 1px solid var(--diag-line); color: var(--diag-muted); font: .6rem ui-monospace, monospace; }
	.diagnosis-shell { padding: 1.3rem 1.3rem 3.5rem; box-sizing: border-box; border: 1px solid rgba(117,210,224,.15); background: radial-gradient(circle at 12% 0%, rgba(35,93,112,.18), transparent 36%), var(--diag-bg); }
	@media (max-width: 800px) { .diagnosis-header { align-items: start; flex-direction: column; }.header-links { justify-items: start; }.diagnosis-grid { grid-template-columns: 1fr; }.mini-case-grid { grid-template-columns: repeat(2, 1fr); } }
	@media (max-width: 560px) { .diagnosis-shell { width: min(100% - 1rem, 760px); }.panel-heading, .section-heading { display: grid; }.secondary { justify-self: start; }.mini-case-grid { grid-template-columns: 1fr; } }
</style>
