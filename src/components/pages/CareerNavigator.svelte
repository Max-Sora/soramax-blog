<script lang="ts">
import { onMount } from "svelte";
import {
	phase2JobSnapshot,
	uciCampusOpportunities,
	uciCampusSources,
} from "@/data/career-navigator";
import {
	analyzePosting,
	compareCareers,
	EMPTY_PROFILE,
	generateRoadmap,
	isExpiredOpportunity,
	mergeExperience,
	normalizeCoursePlanText,
	normalizeResumeText,
	normalizeSkillIds,
	sourceLabel,
	updateCourseStatus,
} from "@/lib/career-navigator/engine";
import {
	careerNavigatorData,
	careers,
	sampleJobPostings,
	skills,
} from "@/lib/career-navigator/fixtures";
import { filterRelevantJobs } from "@/lib/career-navigator/phase2";
import { PRIVACY_DEFAULTS } from "@/lib/career-navigator/privacy";
import {
	type CareerNavigatorDraft,
	roadmapToMarkdown,
	validateCareerNavigatorDraft,
} from "@/lib/career-navigator/serialization";
import type {
	AcademicYear,
	ApplicationRecord,
	ApplicationStatus,
	CareerMatch,
	JobPosting,
	NavigatorMode,
	ProjectExperience,
	RoadmapAction,
	RoadmapStatus,
	StudentProfile,
} from "@/lib/career-navigator/types";

let mode: NavigatorMode = "explore";
let selectedCareerId = "embedded-systems";
let profile: StudentProfile = {
	...EMPTY_PROFILE,
	interests: [],
	courses: [],
	experiences: [],
};
let workload: "light" | "balanced" | "stretch" = "balanced";
let resumeText = "";
let coursePlanText = "";
let fileMessage = "";
let roadmapActions: RoadmapAction[] = [];
let jobText = "";
let jobLocation = "Anywhere / remote-friendly";
let activePosting: JobPosting = sampleJobPostings[0]!;
let matchAnalysis = analyzePosting(profile, activePosting, skills);
let applications: ApplicationRecord[] = [];
let applicationRole = "";
let applicationCompany = "";
let applicationStatus: ApplicationStatus = "planning";
let applicationLocation = "";
let applicationSourceUrl = "";
let applicationPostedAt = "";
let localSaveEnabled = PRIVACY_DEFAULTS.persistLocally;
let savedNotice = "";
let savedCareerIds: string[] = ["embedded-systems"];
let lastCalculated = "";
let selectedCareer = careers[0]!;
let careerMatches: CareerMatch[] = [];
let matchedSkills: string[] = [];
let missingSkills: string[] = [];
let restoredRoadmapActions: RoadmapAction[] | null = null;
let liveQuery = "";
let liveLocationFilter = "";
let liveEmployerFilter = "";
let liveInternshipOnly = true;
let liveJobs: JobPosting[] = [];
let campusItems = [
	...uciCampusOpportunities,
	...careerNavigatorData.campusOpportunities,
];

$: selectedCareer =
	careers.find((career) => career.id === selectedCareerId) ?? careers[0]!;
$: careerMatches = compareCareers(profile, careers, skills);
$: matchedSkills =
	careerMatches.find((match) => match.career.id === selectedCareer.id)
		?.matchedSkillIds ?? [];
$: missingSkills =
	careerMatches.find((match) => match.career.id === selectedCareer.id)
		?.missingSkillIds ?? [];
$: liveJobs = filterRelevantJobs(
	phase2JobSnapshot.jobs,
	selectedCareer.id,
).filter((job) => {
	const query = liveQuery.trim().toLowerCase();
	const location = liveLocationFilter.trim().toLowerCase();
	const employer = liveEmployerFilter.trim().toLowerCase();
	const textMatches =
		!query ||
		`${job.title} ${job.company} ${job.description ?? ""}`
			.toLowerCase()
			.includes(query);
	const locationMatches =
		!location || job.location.toLowerCase().includes(location);
	const employerMatches =
		!employer || job.company.toLowerCase().includes(employer);
	const internshipMatches =
		!liveInternshipOnly || job.internshipEligibility === "explicit-yes";
	return textMatches && locationMatches && employerMatches && internshipMatches;
});

onMount(() => {
	restoreDraft();
	lastCalculated = new Date().toLocaleString();
	recalculate();
	if (restoredRoadmapActions) roadmapActions = restoredRoadmapActions;
});

function restoreDraft() {
	if (typeof localStorage === "undefined") return;
	const raw = localStorage.getItem("soramax-career-navigator-draft");
	if (!raw) return;
	try {
		const result = validateCareerNavigatorDraft(JSON.parse(raw));
		if (!result.ok || !result.value) throw new Error(result.errors.join(" "));
		applyDraft(result.value);
		localSaveEnabled = true;
		savedNotice = "Restored the opt-in draft from this browser only.";
	} catch {
		localStorage.removeItem("soramax-career-navigator-draft");
		savedNotice = "The saved draft was invalid and was removed locally.";
	}
}

function applyDraft(draft: CareerNavigatorDraft) {
	profile = draft.profile;
	selectedCareerId = draft.selectedCareerId;
	jobText = draft.jobText;
	jobLocation = draft.jobLocation;
	workload = draft.workload;
	activePosting = draft.activePosting;
	if (draft.roadmapActions.length > 0)
		restoredRoadmapActions = draft.roadmapActions;
	applications = draft.applications;
}

function recalculate() {
	roadmapActions = generateRoadmap(profile, selectedCareer, skills, {
		workload,
	});
	matchAnalysis = analyzePosting(profile, activePosting, skills);
	lastCalculated = new Date().toLocaleString();
}

function chooseCareer(id: string) {
	const nextCareer = careers.find((career) => career.id === id);
	if (!nextCareer) return;
	selectedCareerId = id;
	selectedCareer = nextCareer;
	recalculate();
}

function updateProfile(patch: Partial<StudentProfile>) {
	profile = { ...profile, ...patch };
	recalculate();
}

function updateExperience(id: string, patch: Partial<ProjectExperience>) {
	profile = {
		...profile,
		experiences: profile.experiences.map((experience) =>
			experience.id === id ? { ...experience, ...patch } : experience,
		),
	};
	recalculate();
}

function removeExperience(id: string) {
	profile = {
		...profile,
		experiences: profile.experiences.filter(
			(experience) => experience.id !== id,
		),
	};
	recalculate();
}

function handleResumeInput() {
	profile = mergeExperience(profile, resumeText, skills);
	recalculate();
}

function importCoursePlan() {
	profile = {
		...profile,
		rawCoursePlanText: coursePlanText,
		courses: normalizeCoursePlanText(coursePlanText),
	};
	recalculate();
}

function loadSampleResume() {
	resumeText =
		"Embedded sensor logger project — C++, ESP32, Git, oscilloscope debugging\nCourse project — digital logic, Python data analysis, technical documentation";
	handleResumeInput();
	fileMessage =
		"Loaded visibly labeled SAMPLE resume text. Review and replace it with your own evidence.";
}

function loadSamplePlan() {
	coursePlanText =
		"Completed: Programming and Data Structures\nIn progress: Digital Logic\nPlanned: Signals and Systems\nPlanned: Embedded Systems Project (title only; not an official requirement)";
	importCoursePlan();
	fileMessage =
		"Loaded visibly labeled SAMPLE course-plan text. It is not counselor-approved and does not establish prerequisites.";
}

async function handleFile(event: Event, kind: "resume" | "plan") {
	const input = event.currentTarget as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	const extension = file.name.toLowerCase().split(".").pop();
	if (extension !== "txt" && extension !== "md" && extension !== "csv") {
		fileMessage = `${file.name} was not parsed in-browser. For privacy and accuracy, paste the text instead of assuming PDF/DOCX extraction succeeded.`;
		return;
	}
	const text = await file.text();
	if (kind === "resume") {
		resumeText = text;
		handleResumeInput();
	} else {
		coursePlanText = text;
		importCoursePlan();
	}
	fileMessage = `Imported ${file.name} locally. Extracted items are unverified until you review them.`;
}

function setActionStatus(id: string, status: RoadmapStatus) {
	roadmapActions = roadmapActions.map((action) =>
		action.id === id ? { ...action, status } : action,
	);
}

function moveAction(id: string, direction: -1 | 1) {
	const index = roadmapActions.findIndex((action) => action.id === id);
	const next = index + direction;
	if (index < 0 || next < 0 || next >= roadmapActions.length) return;
	const copy = [...roadmapActions];
	[copy[index], copy[next]] = [copy[next], copy[index]];
	roadmapActions = copy.map((action, position) => ({
		...action,
		priority: position + 1,
	}));
}

function postingFromText(text: string): JobPosting {
	const lines = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
	const requirements = skills.flatMap((skill) => {
		const present = normalizeSkillIds(text, [skill]).includes(skill.id);
		if (!present) return [];
		const sourceLine =
			lines.find((line) =>
				normalizeSkillIds(line, [skill]).includes(skill.id),
			) ?? skill.name;
		return [
			{
				id: `user-${skill.id}`,
				label: sourceLine,
				skillId: skill.id,
				category: "technical" as const,
				importance: /required|must|minimum|need to/i.test(sourceLine)
					? ("mandatory" as const)
					: ("unknown" as const),
				evidenceId: "user-job-description",
			},
		];
	});
	return {
		id: "user-pasted-posting",
		title: lines[0]?.slice(0, 80) || "User-pasted job description",
		company: "User-provided",
		location: jobLocation,
		retrievedAt: new Date().toISOString(),
		requirements:
			requirements.length > 0
				? requirements
				: [
						{
							id: "user-unmapped",
							label: "Unmapped requirement text — review manually",
							category: "other",
							importance: "unknown",
							evidenceId: "user-job-description",
						},
					],
		sourceEvidenceId: "user-job-description",
	};
}

function analyzeUserJob() {
	activePosting = jobText.trim()
		? postingFromText(jobText)
		: sampleJobPostings[0]!;
	matchAnalysis = analyzePosting(profile, activePosting, skills);
}

function selectPosting(posting: JobPosting) {
	activePosting = posting;
	jobText = [
		posting.title,
		...posting.requirements.map(
			(requirement) => `${requirement.importance}: ${requirement.label}`,
		),
	].join("\n");
	matchAnalysis = analyzePosting(profile, activePosting, skills);
}

function loadSampleJob() {
	selectPosting(sampleJobPostings[0]!);
}

function loadSampleSoftwareJob() {
	selectedCareerId = "software-engineer";
	selectPosting(
		sampleJobPostings.find(
			(posting) => posting.id === "sample-software-posting",
		) ?? sampleJobPostings[0]!,
	);
}

function toggleSelectedCareerSaved() {
	savedCareerIds = savedCareerIds.includes(selectedCareer.id)
		? savedCareerIds.filter((id) => id !== selectedCareer.id)
		: [...savedCareerIds, selectedCareer.id];
}

function selectLiveJob(posting: JobPosting) {
	activePosting = posting;
	jobText = posting.description ?? posting.title;
	matchAnalysis = analyzePosting(profile, posting, skills);
}

function saveLiveJob(posting: JobPosting) {
	if (
		applications.some(
			(application) =>
				application.url === (posting.applicationUrl ?? posting.url),
		)
	)
		return;
	applications = [
		{
			id: `application-${posting.id}`,
			company: posting.company,
			role: posting.title,
			location: posting.location,
			status: "saved",
			url: posting.applicationUrl ?? posting.url,
			sourceUrl: posting.originalSourceUrl ?? posting.url,
			postedAt: posting.postedAt ?? posting.publishedAt,
			lastUpdated: new Date().toISOString(),
		},
		...applications,
	];
	savedNotice =
		"Saved a verified public listing to the local application tracker.";
}

function freshnessLabel(posting: JobPosting) {
	return posting.freshnessStatus === "fresh"
		? "Fresh at last sync"
		: posting.freshnessStatus === "stale"
			? "Stale — verify before applying"
			: "Freshness unknown";
}

function postingSourceLabel(posting: JobPosting) {
	if (posting.isSample)
		return sourceLabel(careerNavigatorData.sources, posting.sourceEvidenceId);
	if (posting.provider) return `${posting.provider} public snapshot`;
	return "your pasted text";
}

function addApplication() {
	if (!applicationCompany.trim() || !applicationRole.trim()) return;
	applications = [
		{
			id: `application-${Date.now()}`,
			company: applicationCompany.trim(),
			role: applicationRole.trim(),
			status: applicationStatus,
			location: applicationLocation.trim() || undefined,
			sourceUrl: applicationSourceUrl.trim() || undefined,
			postedAt: applicationPostedAt || undefined,
			lastUpdated: new Date().toISOString(),
		},
		...applications,
	];
	applicationCompany = "";
	applicationRole = "";
	applicationLocation = "";
	applicationSourceUrl = "";
	applicationPostedAt = "";
}

function updateApplication(id: string, status: ApplicationStatus) {
	applications = applications.map((application) =>
		application.id === id
			? { ...application, status, lastUpdated: new Date().toISOString() }
			: application,
	);
}

function toggleLocalSave() {
	localSaveEnabled = !localSaveEnabled;
	if (!localSaveEnabled && typeof localStorage !== "undefined") {
		localStorage.removeItem("soramax-career-navigator-draft");
		savedNotice = "Local draft removed.";
	}
}

function saveDraft() {
	if (!localSaveEnabled || typeof localStorage === "undefined") return;
	localStorage.setItem(
		"soramax-career-navigator-draft",
		JSON.stringify(currentDraft()),
	);
	savedNotice =
		"Saved only in this browser. No account or server upload was used.";
}

function exportDraft() {
	downloadFile(
		JSON.stringify(currentDraft(), null, 2),
		"career-navigator-plan.json",
		"application/json",
	);
}

function exportMarkdown() {
	downloadFile(
		roadmapToMarkdown(currentDraft()),
		"career-navigator-plan.md",
		"text/markdown",
	);
}

function currentDraft(): CareerNavigatorDraft {
	return {
		profile,
		selectedCareerId,
		roadmapActions,
		applications,
		jobText,
		jobLocation,
		workload,
		activePosting,
	};
}

function downloadFile(content: string, filename: string, type: string) {
	const blob = new Blob([content], { type });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	link.click();
	URL.revokeObjectURL(link.href);
}

async function handleDraftImport(event: Event) {
	const input = event.currentTarget as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	try {
		const result = validateCareerNavigatorDraft(JSON.parse(await file.text()));
		if (!result.ok || !result.value) throw new Error(result.errors.join(" "));
		applyDraft(result.value);
		recalculate();
		savedNotice = `Imported and validated ${file.name} locally.`;
	} catch (error) {
		savedNotice = `Import rejected: ${error instanceof Error ? error.message : "invalid draft"}`;
	}
	input.value = "";
}

function setActionField(id: string, field: "title" | "why", value: string) {
	roadmapActions = roadmapActions.map((action) =>
		action.id === id
			? field === "title"
				? { ...action, title: value }
				: { ...action, why: value }
			: action,
	);
}

function removeAction(id: string) {
	roadmapActions = roadmapActions
		.filter((action) => action.id !== id)
		.map((action, index) => ({
			...action,
			priority: index + 1,
			prerequisiteActionIds: action.prerequisiteActionIds?.filter(
				(prerequisite) => prerequisite !== id,
			),
		}));
}

function roadmapHours() {
	return roadmapActions.reduce(
		(total, action) => total + (action.estimatedHours ?? 0),
		0,
	);
}

function skillName(id: string) {
	return skills.find((skill) => skill.id === id)?.name ?? id;
}

function sourceDate(id: string) {
	return (
		[...careerNavigatorData.sources, ...uciCampusSources]
			.find((source) => source.id === id)
			?.retrievedAt?.slice(0, 10) ?? "date unknown"
	);
}

function statusClass(status: string) {
	return status === "matched" || status === "done"
		? "status-good"
		: status === "partial"
			? "status-partial"
			: status === "missing" || status === "rejected"
				? "status-warn"
				: "status-neutral";
}
</script>

<div class="navigator-shell">
	<section class="navigator-hero card-base">
		<div class="hero-copy">
			<div class="eyebrow">SORAMAX TOOL · LOCAL-FIRST MVP</div>
			<h2>Reverse-plan your next academic and career move.</h2>
			<p>Start with a direction, compare it with evidence you provide, and turn gaps into a small, editable plan. Guidance is intentionally transparent: it is not a graduation audit, hiring prediction, or substitute for an advisor.</p>
			<div class="hero-badges">
				<span class="badge badge-primary">No account required</span>
				<span class="badge">Private by default</span>
				<span class="badge">Deterministic mode active</span>
			</div>
		</div>
		<div class="hero-stat">
			<strong>{missingSkills.length}</strong>
			<span>mapped skills to explore</span>
			<small>based only on your current local profile</small>
		</div>
	</section>

	<nav class="mode-tabs" aria-label="Career Navigator modes">
		{#each [
			{ id: "explore", title: "EXPLORE", subtitle: "Compare possible directions" },
			{ id: "build", title: "BUILD", subtitle: "Turn gaps into a roadmap" },
			{ id: "apply", title: "APPLY", subtitle: "Check a real description" },
		] as tab}
			<button class:active={mode === tab.id} class="mode-tab" on:click={() => mode = tab.id as NavigatorMode} aria-pressed={mode === tab.id}>
				<strong>{tab.title}</strong><span>{tab.subtitle}</span>
			</button>
		{/each}
	</nav>

	{#if mode === "explore"}
		<section class="grid-layout">
			<div class="card-base panel-pad">
				<div class="section-heading"><div><span class="section-kicker">01 · ORIENT</span><h3>Set your starting context</h3></div><span class="source-chip">LOCAL ONLY</span></div>
				<div class="field-grid">
					<label>School<input value={profile.school} on:input={(event) => updateProfile({ school: (event.currentTarget as HTMLInputElement).value })} /></label>
					<label>Major<input value={profile.major} on:input={(event) => updateProfile({ major: (event.currentTarget as HTMLInputElement).value })} /></label>
					<label>Academic year<select value={profile.academicYear} on:change={(event) => updateProfile({ academicYear: (event.currentTarget as HTMLSelectElement).value as AcademicYear })}><option value="undecided">Not sure yet</option><option value="first">1st year</option><option value="second">2nd year</option><option value="third">3rd year</option><option value="fourth">4th year</option><option value="graduate">Graduate</option></select></label>
					<label>Expected graduation<input type="month" value={profile.expectedGraduation ?? ""} on:input={(event) => updateProfile({ expectedGraduation: (event.currentTarget as HTMLInputElement).value })} /></label>
					<label>Weekly time budget<input type="number" min="0" max="80" step="0.5" value={profile.weeklyHours ?? 5} on:input={(event) => updateProfile({ weeklyHours: Number((event.currentTarget as HTMLInputElement).value) })} /></label>
					<label>Target region<input placeholder="e.g. Irvine, Bay Area, remote" value={profile.targetRegion ?? ""} on:input={(event) => updateProfile({ targetRegion: (event.currentTarget as HTMLInputElement).value })} /></label>
					<label>Work type<select value={profile.workType ?? "unknown"} on:change={(event) => updateProfile({ workType: (event.currentTarget as HTMLSelectElement).value as StudentProfile["workType"] })}><option value="unknown">Not specified</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option></select></label>
					<label>Target deadline<input type="date" value={profile.targetDeadline ?? ""} on:input={(event) => updateProfile({ targetDeadline: (event.currentTarget as HTMLInputElement).value })} /></label>
					<label>Interests<input placeholder="e.g. robotics, chips, measurement" value={profile.interests.join(", ")} on:input={(event) => updateProfile({ interests: (event.currentTarget as HTMLInputElement).value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
					<label>Tools<input placeholder="e.g. Git, Arduino, KiCad" value={(profile.tools ?? []).join(", ")} on:input={(event) => updateProfile({ tools: (event.currentTarget as HTMLInputElement).value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
				</div>
				<label>What do you enjoy or do well?<textarea rows="3" placeholder="Class topics, ways you like to work, or questions you want to explore." value={profile.strengths} on:input={(event) => updateProfile({ strengths: (event.currentTarget as HTMLTextAreaElement).value })}></textarea></label>
				<label>Constraints to respect<textarea rows="2" placeholder="Time, commute, budget, course load, accessibility, or uncertainty." value={profile.constraints} on:input={(event) => updateProfile({ constraints: (event.currentTarget as HTMLTextAreaElement).value })}></textarea></label>
			</div>
			<div class="card-base panel-pad guidance-card">
				<span class="section-kicker">A USEFUL DEFAULT</span>
				<h3>Undecided is a valid goal.</h3>
				<p>Compare several directions and choose a low-cost experiment. The navigator never treats a missing skill as a deficiency or asks you to optimize every activity for employment.</p>
				<ul><li>Try one small project or research conversation.</li><li>Ask an advisor to confirm official degree decisions.</li><li>Recalculate when your interests or evidence change.</li></ul>
			</div>
		</section>

		<section class="card-base panel-pad">
			<div class="section-heading"><div><span class="section-kicker">02 · COMPARE</span><h3>Five sample directions</h3></div><span class="source-chip sample-chip">SAMPLE FRAMEWORK</span></div>
			<p class="muted-text">These are planning archetypes, not promises about job availability, salary, or fit. Select one to build a roadmap.</p>
			<div class="career-grid">
				{#each careerMatches as match}
					<button class:selected={selectedCareer.id === match.career.id} class="career-card" on:click={() => chooseCareer(match.career.id)}>
						<div class="career-card-top"><span class="kind-label">{match.career.kind === "research" ? "RESEARCH" : "CAREER"}</span><span class={`signal ${match.matchLabel}`}>{match.matchLabel.replace("-", " ")}</span></div>
						<h4>{match.career.title}</h4><p>{match.career.summary}</p>
						<div class="skill-row">{#each match.career.skillIds.slice(0, 4) as skillId}<span class:known={match.matchedSkillIds.includes(skillId)}>{skillName(skillId)}</span>{/each}</div>
						<small>{match.explanation}</small>
					</button>
				{/each}
			</div>
			<div class="compare-toolbar"><span>Saved directions: {savedCareerIds.length}</span><button class="secondary-button" on:click={toggleSelectedCareerSaved}>{savedCareerIds.includes(selectedCareer.id) ? "Remove selected from comparison" : "Save selected for comparison"}</button></div>
		</section>
	{:else if mode === "build"}
		<section class="card-base panel-pad build-banner">
			<div><span class="section-kicker">BUILDING TOWARD</span><h3>{selectedCareer.title}</h3><p>{selectedCareer.summary}</p></div>
			<label class="compact-label">Workload<select value={workload} on:change={(event) => { workload = (event.currentTarget as HTMLSelectElement).value as typeof workload; recalculate(); }}><option value="light">Light · 3–5 actions</option><option value="balanced">Balanced · 5–7 actions</option><option value="stretch">Stretch · up to 10 actions</option></select></label>
		</section>
		<section class="grid-layout">
			<div class="card-base panel-pad">
				<div class="section-heading"><div><span class="section-kicker">01 · EVIDENCE</span><h3>Resume or experience notes</h3></div><span class="source-chip">REVIEW REQUIRED</span></div>
			<p class="muted-text">Text is processed in this browser. PDF/DOCX upload is intentionally a paste fallback in this MVP so binary extraction is not mistaken for evidence.</p>
			<div class="button-row"><button class="secondary-button" on:click={loadSampleResume}>Load SAMPLE resume</button><label class="file-button">Choose text file<input type="file" accept=".txt,.md,.csv,.pdf,.docx" on:change={(event) => handleFile(event, "resume")} /></label></div>
			<textarea rows="8" bind:value={resumeText} on:input={handleResumeInput} placeholder="Paste resume bullets, projects, lab work, or work experience."></textarea>
			{#if profile.experiences.length > 0}<div class="import-list"><strong>{profile.experiences.length} extracted item(s) · editable evidence</strong>{#each profile.experiences.slice(0, 6) as experience}<div class="experience-editor"><input value={experience.title} aria-label="Experience title" on:input={(event) => updateExperience(experience.id, { title: (event.currentTarget as HTMLInputElement).value })} /><textarea rows="2" aria-label="Experience description" value={experience.description} on:input={(event) => updateExperience(experience.id, { description: (event.currentTarget as HTMLTextAreaElement).value })}></textarea><input value={experience.skills.join(", ")} aria-label="Experience skills" on:input={(event) => updateExperience(experience.id, { skills: (event.currentTarget as HTMLInputElement).value.split(",").map((item) => item.trim()).filter(Boolean) })} /><button class="text-button" on:click={() => removeExperience(experience.id)}>Remove evidence</button></div>{/each}</div>{/if}
			<div class="privacy-note">Private data is not sent to a model in this build. No server endpoint is called.</div>
		</div>
			<div class="card-base panel-pad">
				<div class="section-heading"><div><span class="section-kicker">02 · ACADEMICS</span><h3>Course-plan input</h3></div><span class="source-chip">NOT AN AUDIT</span></div>
			<p class="muted-text">Paste a counselor plan or your own notes. Course titles remain unverified; course numbers, prerequisites, units, availability, and graduation rules are never inferred.</p>
			<div class="button-row"><button class="secondary-button" on:click={loadSamplePlan}>Load SAMPLE plan</button><label class="file-button">Choose text file<input type="file" accept=".txt,.md,.csv,.pdf,.docx" on:change={(event) => handleFile(event, "plan")} /></label></div>
			<textarea rows="8" bind:value={coursePlanText} on:input={importCoursePlan} placeholder="One course or note per line. Prefix lines with Completed, In progress, or Planned when known."></textarea>
			<label>Degree catalog year<input placeholder="e.g. 2024–25 (user-entered)" value={profile.catalogYear} on:input={(event) => updateProfile({ catalogYear: (event.currentTarget as HTMLInputElement).value })} /></label>
			{#if profile.courses.length > 0}<div class="course-list">{#each profile.courses as course}<div class="course-row"><span>{course.title}{#if course.tentative}<em class="tentative-course">Tentative</em>{/if}</span><select value={course.status} on:change={(event) => { profile = { ...profile, courses: updateCourseStatus(profile.courses, course.id, (event.currentTarget as HTMLSelectElement).value as typeof course.status) }; recalculate(); }}><option value="completed">Completed</option><option value="in-progress">In progress</option><option value="planned">Planned</option><option value="unknown">Needs review</option></select></div>{/each}</div>{/if}
			<div class="warning-note"><strong>Official vs recommendation:</strong> verify enrollment decisions with your UCI catalog and academic counselor. An UNKNOWN source stays unknown.</div>
			</div>
		</section>
		{#if fileMessage}<div class="notice-line">{fileMessage}</div>{/if}

		<section class="grid-layout">
			<div class="card-base panel-pad">
				<div class="section-heading"><div><span class="section-kicker">03 · GAP SIGNALS</span><h3>Skills evidence</h3></div><span class="source-chip">EXPLAINABLE</span></div>
			<div class="gap-summary"><div><strong>{matchedSkills.length}</strong><span>mapped</span></div><div><strong>{missingSkills.length}</strong><span>to explore</span></div><div><strong>{selectedCareer.skillIds.length}</strong><span>framework skills</span></div></div>
			<div class="skill-checklist">{#each selectedCareer.skillIds as skillId}<div class="skill-check"><span class:known={matchedSkills.includes(skillId)}>{matchedSkills.includes(skillId) ? "✓" : "·"}</span><div><strong>{skillName(skillId)}</strong><small>{matchedSkills.includes(skillId) ? "Found in your current notes or course text." : "Not found in your current notes; absence is not proof."}</small></div></div>{/each}</div>
			</div>
			<div class="card-base panel-pad">
				<div class="section-heading"><div><span class="section-kicker">04 · CAMPUS PATHS</span><h3>Source-backed starting points</h3></div><span class="source-chip official-chip">OFFICIAL LINKS</span></div>
			{#each campusItems as opportunity}
				{#if !isExpiredOpportunity(opportunity)}<a class="opportunity-row" href={opportunity.url} target="_blank" rel="noreferrer"><div><strong>{opportunity.title}</strong><span>{opportunity.description}</span><small>Source checked {sourceDate(opportunity.sourceEvidenceId)}</small></div><span>↗</span></a>{/if}
			{/each}
			<p class="source-footnote">Links are official starting points, not verified current events. Check the source page for dates, eligibility, and availability.</p>
			</div>
		</section>

		<section class="card-base panel-pad roadmap-panel">
			<div class="section-heading"><div><span class="section-kicker">05 · ROADMAP</span><h3>Your editable next steps</h3></div><div class="roadmap-meta"><span class="source-chip">{roadmapActions.length} ACTIONS · {roadmapHours()} HOURS</span><span>Calculated {lastCalculated}</span></div></div>
			{#if roadmapActions.length === 0}<div class="empty-state">Add some notes above to generate a local roadmap.</div>{/if}
			<div class="roadmap-list">{#each roadmapActions as action, index}<article class:rejected={action.status === "rejected"} class="roadmap-row"><div class="roadmap-index">{index + 1}</div><div class="roadmap-content"><div class="roadmap-title"><input class="roadmap-edit-title" value={action.title} aria-label={`Title for ${action.title}`} on:input={(event) => setActionField(action.id, "title", (event.currentTarget as HTMLInputElement).value)} /><span class={`horizon ${action.horizon}`}>{action.horizon.replace("-", " ")}</span></div><textarea class="roadmap-edit" rows="2" aria-label={`Why for ${action.title}`} value={action.why} on:input={(event) => setActionField(action.id, "why", (event.currentTarget as HTMLTextAreaElement).value)}></textarea><small>{action.estimatedHours ?? "?"} hours · {action.deliverable ?? "Define a deliverable"}</small>{#if action.completionEvidence}<small>Evidence: {action.completionEvidence}</small>{/if}{#if action.alternatives}<small>Alternative: {action.alternatives[0]}</small>{/if}<div class="roadmap-links">{#each action.linkedSkillIds as skillId}<span>{skillName(skillId)}</span>{/each}{#each action.linkedRequirementIds as requirementId}<span>req: {requirementId}</span>{/each}{#each action.prerequisiteActionIds ?? [] as prerequisite}<span>after: {prerequisite}</span>{/each}</div></div><div class="roadmap-actions"><select value={action.status} aria-label={`Status for ${action.title}`} on:change={(event) => setActionStatus(action.id, (event.currentTarget as HTMLSelectElement).value as RoadmapStatus)}><option value="suggested">Suggested</option><option value="accepted">Accepted</option><option value="done">Done</option><option value="rejected">Rejected</option></select><button title="Move up" disabled={index === 0} on:click={() => moveAction(action.id, -1)}>↑</button><button title="Move down" disabled={index === roadmapActions.length - 1} on:click={() => moveAction(action.id, 1)}>↓</button><button title="Delete action" on:click={() => removeAction(action.id)}>×</button></div></article>{/each}</div>
		</section>
	{:else}
		<section class="card-base panel-pad apply-banner"><div><span class="section-kicker">APPLY WITH CONTEXT</span><h3>Match one real description at a time.</h3><p>Paste a job description you are considering. The result separates matched, missing, and unknown signals; it is not a probability of getting hired.</p></div><button class="secondary-button" on:click={loadSampleJob}>Load SAMPLE posting</button></section>
		<section class="card-base panel-pad live-discovery-panel">
			<div class="section-heading"><div><span class="section-kicker">LIVE INTERNSHIP DISCOVERY</span><h3>Verified public listings</h3></div><span class="source-chip">{phase2JobSnapshot.status.toUpperCase()}</span></div>
			<p class="muted-text">Listings are build-time snapshots from allowlisted public Greenhouse, Lever, or Ashby boards. Freshness is shown; an empty snapshot is not treated as proof that no jobs exist.</p>
			<div class="live-filters"><input placeholder="Search role or skill" bind:value={liveQuery} /><input placeholder="Location" bind:value={liveLocationFilter} /><input placeholder="Employer" bind:value={liveEmployerFilter} /><label class="checkbox-label"><input type="checkbox" bind:checked={liveInternshipOnly} /> Internships only</label></div>
			{#if liveJobs.length === 0}
				<div class="empty-state"><strong>No live listings in this snapshot.</strong><span>Run <code>pnpm career-navigator:sync</code> with a reviewed board allowlist to refresh static data. Current snapshot: {phase2JobSnapshot.generatedAt || "not generated"}.</span>{#if phase2JobSnapshot.errors.length > 0}<small>{phase2JobSnapshot.errors[0].message}</small>{/if}</div>
			{:else}
				<div class="live-job-list">{#each liveJobs as posting}<article class="live-job-card"><div class="live-job-heading"><div><span class="kind-label">{posting.provider?.toUpperCase() ?? "PUBLIC"} · {posting.company}</span><h4>{posting.title}</h4></div><span class={`freshness ${posting.freshnessStatus ?? "unknown"}`}>{freshnessLabel(posting)}</span></div><p>{posting.location} · {posting.remoteMode ?? "work mode unknown"} · {posting.employmentType ?? "employment type unknown"}</p><div class="skill-row">{#each posting.requirements.slice(0, 5) as requirement}<span>{requirement.skillId ? skillName(requirement.skillId) : "Requirement unknown"}</span>{/each}</div><div class="live-job-actions"><button class="primary-button" on:click={() => selectLiveJob(posting)}>Analyze match</button><button class="secondary-button" on:click={() => saveLiveJob(posting)}>Save</button>{#if posting.applicationUrl ?? posting.url}<a class="secondary-button" href={posting.applicationUrl ?? posting.url} target="_blank" rel="noreferrer">Source ↗</a>{/if}</div></article>{/each}</div>
			{/if}
		</section>
		<section class="grid-layout">
			<div class="card-base panel-pad">
				<div class="section-heading"><div><span class="section-kicker">01 · INPUT</span><h3>Job description</h3></div><span class="source-chip">USER-PROVIDED</span></div>
			<label>Target direction<input value={selectedCareer.title} readonly /></label>
			<label>Geography<input value={jobLocation} on:input={(event) => jobLocation = (event.currentTarget as HTMLInputElement).value} /></label>
			<textarea rows="11" bind:value={jobText} placeholder="Paste the full description here. Text stays local in this MVP."></textarea>
			<div class="button-row"><button class="primary-button" on:click={analyzeUserJob}>Analyze locally</button><button class="secondary-button" on:click={loadSampleJob}>Use Embedded SAMPLE</button><button class="secondary-button" on:click={loadSampleSoftwareJob}>Use Software SAMPLE</button></div>
			<div class="job-list"><strong>Available SAMPLE fixtures</strong>{#each careerNavigatorData.jobPostings as posting}<button class:selected={activePosting.id === posting.id} class="job-row" on:click={() => selectPosting(posting)}><span><b>{posting.title}</b><small>{posting.company} · {posting.location}</small></span><em>{posting.requirements.length} requirements</em></button>{/each}</div>
			<p class="privacy-note">Prompt-like instructions inside a pasted description are treated as untrusted text, not commands.</p>
			</div>
			<div class="card-base panel-pad">
				<div class="section-heading"><div><span class="section-kicker">02 · EXPLAIN</span><h3>{matchAnalysis.posting.title}</h3></div><span class="source-chip">{matchAnalysis.posting.isSample ? "SAMPLE" : matchAnalysis.posting.provider ? `${matchAnalysis.posting.provider.toUpperCase()} SNAPSHOT` : "USER-PROVIDED"}</span></div>
			<div class="match-score"><strong>{matchAnalysis.explainableScore}%</strong><span>{matchAnalysis.scoreLabel}</span></div>
			<div class="match-counts"><span class="status-good">{matchAnalysis.matchedCount} matched</span><span class="status-partial">{matchAnalysis.partialCount} partial</span><span class="status-warn">{matchAnalysis.missingCount} missing</span><span class="status-neutral">{matchAnalysis.unknownCount} unknown</span></div>
			<div class="requirements-list">{#each matchAnalysis.matches as match}<div class="requirement-row"><div><strong>{match.requirement.label}</strong><small>{match.requirement.importance} · {match.evidence}</small></div><span class={statusClass(match.status)}>{match.status}</span></div>{/each}</div>
			<p class="source-footnote">Source: {postingSourceLabel(matchAnalysis.posting)}. Mandatory labels only reflect explicit wording found in the input.</p>
			</div>
		</section>
		<section class="card-base panel-pad">
			<div class="section-heading"><div><span class="section-kicker">03 · TRACK</span><h3>Application progress</h3></div><span class="source-chip">MANUAL ONLY</span></div>
			<div class="application-form"><input placeholder="Company" bind:value={applicationCompany} /><input placeholder="Role" bind:value={applicationRole} /><input placeholder="Location" bind:value={applicationLocation} /><input type="url" placeholder="Source URL" bind:value={applicationSourceUrl} /><input type="date" aria-label="Posted date" bind:value={applicationPostedAt} /><select bind:value={applicationStatus}><option value="saved">Saved</option><option value="planning">Planning</option><option value="applied">Applied</option><option value="interviewing">Interviewing</option><option value="rejected">Rejected</option><option value="offered">Offered</option></select><button class="primary-button" on:click={addApplication}>Add</button></div>
			{#if applications.length === 0}<div class="empty-state">No applications tracked yet. Nothing is submitted automatically.</div>{:else}<div class="application-list">{#each applications as application}<div class="application-row"><div><strong>{application.role}</strong><span>{application.company}{application.location ? ` · ${application.location}` : ""}</span>{#if application.sourceUrl}<a href={application.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>{/if}</div><select value={application.status} on:change={(event) => updateApplication(application.id, (event.currentTarget as HTMLSelectElement).value as ApplicationStatus)}><option value="saved">Saved</option><option value="planning">Planning</option><option value="applied">Applied</option><option value="interviewing">Interviewing</option><option value="rejected">Rejected</option><option value="offered">Offered</option></select></div>{/each}</div>{/if}
		</section>
	{/if}

	<footer class="navigator-footer card-base">
		<div><strong>Privacy controls</strong><span>Nothing is uploaded by this page. Local saving is off until you opt in.</span>{#if savedNotice}<small>{savedNotice}</small>{/if}</div>
		<div class="button-row"><button class:enabled={localSaveEnabled} class="secondary-button" on:click={toggleLocalSave}>{localSaveEnabled ? "Local saving on" : "Enable local saving"}</button><button class="secondary-button" disabled={!localSaveEnabled} on:click={saveDraft}>Save draft</button><button class="secondary-button" on:click={exportDraft}>Export JSON</button><button class="secondary-button" on:click={exportMarkdown}>Export Markdown</button><label class="file-button import-file">Import JSON<input type="file" accept=".json,application/json" on:change={handleDraftImport} /></label></div>
	</footer>
</div>

<style>
	.navigator-shell { display: grid; gap: 1rem; color: var(--content-meta); }
	.card-base { border: 1px solid color-mix(in srgb, var(--line-color) 70%, transparent); }
	.navigator-hero { padding: clamp(1.25rem, 3vw, 2.5rem); display: flex; gap: 2rem; justify-content: space-between; align-items: end; background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, var(--card-bg)), var(--card-bg)); }
	.hero-copy { max-width: 46rem; } .eyebrow, .section-kicker { color: var(--primary); font-size: .72rem; letter-spacing: .13em; font-weight: 800; }
	h2, h3, h4, p { margin: 0; } .navigator-hero h2 { margin: .6rem 0 .75rem; font-size: clamp(1.8rem, 4vw, 3rem); letter-spacing: -.04em; line-height: 1.05; } .navigator-hero p { color: var(--content-meta); line-height: 1.65; max-width: 42rem; }
	.hero-badges, .button-row, .match-counts, .skill-row, .roadmap-links { display: flex; gap: .5rem; flex-wrap: wrap; align-items: center; } .hero-badges { margin-top: 1.1rem; }
	.badge, .source-chip, .horizon, .signal, .skill-row span, .roadmap-links span { border: 1px solid color-mix(in srgb, var(--line-color) 65%, transparent); border-radius: 999px; padding: .3rem .6rem; font-size: .7rem; color: var(--content-meta); } .badge-primary, .source-chip { color: var(--primary); border-color: color-mix(in srgb, var(--primary) 45%, transparent); } .sample-chip { color: #b7791f; border-color: #d69e2e; } .official-chip { color: #2f855a; border-color: #68d391; }
	.hero-stat { min-width: 9rem; text-align: right; display: grid; gap: .15rem; } .hero-stat strong { font-size: 3rem; color: var(--primary); letter-spacing: -.08em; } .hero-stat span, .hero-stat small { color: var(--content-meta); } .hero-stat small { font-size: .7rem; }
	.mode-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem; } .mode-tab { text-align: left; border: 1px solid color-mix(in srgb, var(--line-color) 70%, transparent); background: var(--card-bg); padding: 1rem; border-radius: var(--radius-large); color: var(--content-meta); cursor: pointer; transition: .2s; } .mode-tab strong, .mode-tab span { display: block; } .mode-tab strong { color: var(--content-meta); font-size: .8rem; letter-spacing: .08em; } .mode-tab span { margin-top: .25rem; font-size: .78rem; } .mode-tab:hover, .mode-tab.active { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 8%, var(--card-bg)); } .mode-tab.active strong { color: var(--primary); }
	.grid-layout { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(18rem, .8fr); gap: 1rem; } .panel-pad { padding: clamp(1rem, 2.5vw, 1.7rem); } .section-heading { display: flex; justify-content: space-between; align-items: start; gap: 1rem; margin-bottom: 1rem; } .section-heading h3 { margin-top: .3rem; font-size: 1.25rem; } .muted-text, .source-footnote, .privacy-note { color: var(--content-meta); font-size: .82rem; line-height: 1.55; } .source-footnote { margin-top: .85rem; font-size: .72rem; }
	.field-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .8rem; } label { display: grid; gap: .35rem; color: var(--content-meta); font-size: .78rem; font-weight: 650; margin-bottom: .8rem; } input, textarea, select { width: 100%; border: 1px solid color-mix(in srgb, var(--line-color) 75%, transparent); border-radius: .65rem; background: color-mix(in srgb, var(--card-bg) 85%, var(--page-bg)); color: var(--content-meta); padding: .65rem .75rem; font: inherit; font-size: .85rem; } textarea { resize: vertical; line-height: 1.5; } input:focus, textarea:focus, select:focus { outline: 2px solid color-mix(in srgb, var(--primary) 45%, transparent); border-color: var(--primary); } .guidance-card { background: color-mix(in srgb, var(--primary) 7%, var(--card-bg)); } .guidance-card h3 { margin: .4rem 0 .7rem; font-size: 1.2rem; } .guidance-card p, .guidance-card li { color: var(--content-meta); line-height: 1.55; font-size: .85rem; } .guidance-card ul { margin: .9rem 0 0; padding-left: 1.1rem; display: grid; gap: .4rem; } .compare-toolbar { display: flex; align-items: center; justify-content: space-between; gap: .8rem; margin-top: 1rem; color: var(--content-meta); font-size: .75rem; } .experience-editor { display: grid; gap: .35rem; padding: .65rem 0; border-top: 1px solid color-mix(in srgb, var(--line-color) 45%, transparent); } .experience-editor textarea { font-size: .75rem; } .text-button { justify-self: start; border: 0; padding: 0; color: #b7791f; background: transparent; cursor: pointer; font: inherit; font-size: .7rem; } .roadmap-edit-title { min-width: min(100%, 22rem); width: min(100%, 22rem); padding: .2rem .35rem; font-size: .85rem; font-weight: 700; } .roadmap-edit { margin: .25rem 0; padding: .35rem; font-size: .76rem; } .import-file { display: inline-flex; align-items: center; }
	.career-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .7rem; margin-top: 1rem; } .career-card { text-align: left; display: grid; gap: .65rem; background: var(--card-bg); border: 1px solid color-mix(in srgb, var(--line-color) 70%, transparent); border-radius: .9rem; padding: 1rem; cursor: pointer; color: var(--content-meta); } .career-card:hover, .career-card.selected { border-color: var(--primary); transform: translateY(-2px); } .career-card h4 { font-size: 1rem; } .career-card p, .career-card small { color: var(--content-meta); line-height: 1.45; font-size: .76rem; } .career-card-top { display: flex; justify-content: space-between; gap: .35rem; align-items: center; } .kind-label { font-size: .63rem; letter-spacing: .1em; color: var(--primary); font-weight: 800; } .signal { font-size: .6rem; padding: .2rem .4rem; } .stronger-signal { color: #2f855a; } .developing-signal { color: #b7791f; } .explore-more { color: var(--content-meta); } .skill-row span { font-size: .63rem; padding: .2rem .4rem; } .skill-row span.known { color: var(--primary); border-color: color-mix(in srgb, var(--primary) 50%, transparent); }
	.build-banner, .apply-banner { display: flex; justify-content: space-between; gap: 1rem; align-items: end; background: color-mix(in srgb, var(--primary) 7%, var(--card-bg)); } .build-banner h3, .apply-banner h3 { margin: .35rem 0; font-size: 1.35rem; } .build-banner p, .apply-banner p { color: var(--content-meta); font-size: .82rem; } .compact-label { width: 12rem; margin: 0; } .secondary-button, .primary-button, .file-button { border-radius: .6rem; padding: .6rem .8rem; border: 1px solid color-mix(in srgb, var(--line-color) 70%, transparent); background: var(--card-bg); color: var(--content-meta); font: inherit; font-size: .78rem; cursor: pointer; } .primary-button { background: var(--primary); border-color: var(--primary); color: white; font-weight: 700; } .secondary-button:hover, .file-button:hover { border-color: var(--primary); color: var(--primary); } .secondary-button.enabled { color: var(--primary); } .file-button input { display: none; }
	.import-list, .course-list, .requirements-list, .application-list { margin-top: .8rem; display: grid; gap: .45rem; } .import-list { border-left: 2px solid var(--primary); padding-left: .8rem; } .import-list strong, .import-list span { display: block; font-size: .75rem; } .import-list em { color: var(--primary); font-style: normal; } .course-row, .requirement-row, .application-row { display: flex; justify-content: space-between; gap: .75rem; align-items: center; padding: .65rem .75rem; background: color-mix(in srgb, var(--card-bg) 80%, var(--page-bg)); border-radius: .6rem; } .course-row span, .requirement-row strong, .application-row strong { font-size: .78rem; } .tentative-course { margin-left: .4rem; color: #b7791f; font-size: .65rem; font-style: normal; } .course-row select, .application-row select { width: auto; padding: .35rem .5rem; font-size: .72rem; } .warning-note, .privacy-note { margin-top: .9rem; padding: .7rem .8rem; border-radius: .6rem; background: color-mix(in srgb, #d69e2e 10%, var(--card-bg)); font-size: .74rem; } .warning-note strong { color: #b7791f; } .notice-line { border-left: 3px solid var(--primary); padding: .65rem .8rem; font-size: .78rem; color: var(--content-meta); }
	.gap-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem; margin-bottom: 1rem; } .gap-summary div { background: color-mix(in srgb, var(--primary) 7%, var(--card-bg)); border-radius: .7rem; padding: .7rem; } .gap-summary strong, .gap-summary span { display: block; } .gap-summary strong { font-size: 1.5rem; color: var(--primary); } .gap-summary span { color: var(--content-meta); font-size: .7rem; } .skill-checklist { display: grid; gap: .45rem; } .skill-check { display: flex; gap: .65rem; align-items: start; } .skill-check > span { color: var(--content-meta); width: 1.2rem; height: 1.2rem; border: 1px solid var(--line-color); border-radius: 50%; text-align: center; line-height: 1.05rem; } .skill-check > span.known { color: #2f855a; border-color: #68d391; } .skill-check strong, .skill-check small { display: block; } .skill-check strong { font-size: .8rem; } .skill-check small { color: var(--content-meta); font-size: .72rem; margin-top: .15rem; }
	.opportunity-row { display: flex; justify-content: space-between; gap: .8rem; padding: .75rem 0; border-bottom: 1px solid color-mix(in srgb, var(--line-color) 55%, transparent); color: inherit; } .opportunity-row strong, .opportunity-row span, .opportunity-row small { display: block; } .opportunity-row strong { color: var(--primary); font-size: .8rem; } .opportunity-row span { color: var(--content-meta); font-size: .72rem; line-height: 1.45; margin-top: .2rem; } .opportunity-row small { color: var(--content-meta); font-size: .65rem; margin-top: .3rem; }
	.roadmap-panel { overflow: hidden; } .roadmap-meta { display: flex; gap: .6rem; align-items: center; color: var(--content-meta); font-size: .7rem; } .roadmap-list { display: grid; gap: .6rem; } .roadmap-row { display: grid; grid-template-columns: 2rem 1fr auto; gap: .7rem; align-items: start; border: 1px solid color-mix(in srgb, var(--line-color) 65%, transparent); border-radius: .75rem; padding: .8rem; } .roadmap-row.rejected { opacity: .55; } .roadmap-index { width: 1.7rem; height: 1.7rem; border-radius: 50%; background: color-mix(in srgb, var(--primary) 15%, var(--card-bg)); color: var(--primary); display: grid; place-items: center; font-weight: 800; font-size: .75rem; } .roadmap-title { display: flex; gap: .5rem; align-items: center; flex-wrap: wrap; } .roadmap-title strong { font-size: .85rem; } .roadmap-content p { color: var(--content-meta); font-size: .76rem; line-height: 1.5; margin: .3rem 0; } .roadmap-content small { color: var(--content-meta); font-size: .7rem; } .horizon { padding: .2rem .45rem; font-size: .6rem; color: var(--primary); } .roadmap-links { margin-top: .45rem; } .roadmap-links span { padding: .18rem .4rem; font-size: .62rem; } .roadmap-actions { display: flex; gap: .25rem; align-items: center; } .roadmap-actions select { width: auto; padding: .35rem; font-size: .7rem; } .roadmap-actions button { border: 1px solid var(--line-color); background: var(--card-bg); border-radius: .35rem; width: 1.6rem; height: 1.6rem; color: var(--content-meta); cursor: pointer; } .roadmap-actions button:disabled { opacity: .3; cursor: default; }
	.match-score { display: flex; gap: .75rem; align-items: baseline; padding: .9rem; background: color-mix(in srgb, var(--primary) 8%, var(--card-bg)); border-radius: .7rem; } .match-score strong { font-size: 2.2rem; color: var(--primary); } .match-score span { color: var(--content-meta); font-size: .75rem; } .match-counts { margin: .75rem 0; font-size: .72rem; } .status-good, .status-partial, .status-warn, .status-neutral { padding: .25rem .5rem; border-radius: 999px; font-size: .68rem; } .status-good { color: #2f855a; background: color-mix(in srgb, #68d391 16%, transparent); } .status-partial { color: #9a6700; background: color-mix(in srgb, #d69e2e 16%, transparent); } .status-warn { color: #b7791f; background: color-mix(in srgb, #d69e2e 16%, transparent); } .status-neutral { color: var(--content-meta); background: color-mix(in srgb, var(--line-color) 22%, transparent); } .requirement-row > div { min-width: 0; } .requirement-row small { display: block; color: var(--content-meta); font-size: .68rem; margin-top: .2rem; line-height: 1.4; } .requirement-row > span { flex-shrink: 0; }
	.job-list { display: grid; gap: .4rem; margin-top: 1rem; } .job-list > strong { font-size: .72rem; color: var(--content-meta); } .job-row { display: flex; justify-content: space-between; gap: .6rem; align-items: center; text-align: left; padding: .6rem .7rem; border: 1px solid color-mix(in srgb, var(--line-color) 65%, transparent); background: var(--card-bg); border-radius: .6rem; color: var(--content-meta); cursor: pointer; } .job-row.selected { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 7%, var(--card-bg)); } .job-row b, .job-row small { display: block; } .job-row b { font-size: .76rem; } .job-row small { color: var(--content-meta); font-size: .68rem; margin-top: .15rem; } .job-row em { color: var(--primary); font-size: .65rem; font-style: normal; white-space: nowrap; }
	.live-discovery-panel { background: color-mix(in srgb, var(--primary) 5%, var(--card-bg)); } .live-filters { display: grid; grid-template-columns: repeat(3, 1fr) auto; gap: .5rem; margin: .8rem 0; } .checkbox-label { display: flex; align-items: center; gap: .35rem; margin: 0; white-space: nowrap; } .checkbox-label input { width: auto; } .live-job-list { display: grid; gap: .6rem; } .live-job-card { border: 1px solid color-mix(in srgb, var(--line-color) 65%, transparent); border-radius: .75rem; padding: .8rem; background: var(--card-bg); } .live-job-heading { display: flex; justify-content: space-between; gap: .8rem; align-items: start; } .live-job-heading h4 { margin: .25rem 0; font-size: .95rem; } .live-job-card > p { color: var(--content-meta); font-size: .75rem; margin: .25rem 0 .55rem; } .freshness { border-radius: 999px; padding: .25rem .45rem; font-size: .62rem; white-space: nowrap; } .freshness.fresh { color: #2f855a; background: color-mix(in srgb, #68d391 16%, transparent); } .freshness.stale { color: #b7791f; background: color-mix(in srgb, #d69e2e 16%, transparent); } .freshness.unknown { color: var(--content-meta); background: color-mix(in srgb, var(--line-color) 20%, transparent); } .live-job-actions { display: flex; gap: .45rem; flex-wrap: wrap; margin-top: .7rem; } .live-job-actions .secondary-button { text-decoration: none; } .live-job-list .skill-row span { font-size: .62rem; padding: .2rem .4rem; }
	.application-form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; gap: .5rem; } .application-row > div span { display: block; color: var(--content-meta); font-size: .72rem; margin-top: .15rem; } .application-row > div a { display: block; color: var(--primary); font-size: .68rem; margin-top: .2rem; } .empty-state { color: var(--content-meta); border: 1px dashed var(--line-color); padding: 1.2rem; text-align: center; font-size: .8rem; border-radius: .7rem; } .navigator-footer { padding: 1rem 1.2rem; display: flex; justify-content: space-between; gap: 1rem; align-items: center; } .navigator-footer strong, .navigator-footer span, .navigator-footer small { display: block; } .navigator-footer strong { font-size: .82rem; } .navigator-footer span, .navigator-footer small { color: var(--content-meta); font-size: .72rem; margin-top: .2rem; } .navigator-footer small { color: var(--primary); }
	@media (max-width: 900px) { .career-grid { grid-template-columns: repeat(2, 1fr); } .grid-layout { grid-template-columns: 1fr; } .hero-stat { display: none; } }
	@media (max-width: 620px) { .navigator-hero, .build-banner, .apply-banner, .navigator-footer { display: grid; align-items: start; } .mode-tabs { gap: .25rem; } .mode-tab { padding: .75rem .55rem; } .mode-tab span { font-size: .65rem; } .field-grid, .career-grid, .application-form, .live-filters { grid-template-columns: 1fr; } .roadmap-row { grid-template-columns: 1.7rem 1fr; } .roadmap-actions { grid-column: 2; } .roadmap-meta { display: none; } .live-job-heading { display: grid; } .freshness { justify-self: start; } }
</style>
