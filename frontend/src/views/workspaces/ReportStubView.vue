<script setup>
// Report stub — Session 35 exploratory visualisation. Reached from any of the
// 5 hardcoded report tiles on the Site Execution workspace. Desk-styled per
// §12.4 (unlike the Project Dashboard, which is Vue-styled).
//
// In production this route doesn't exist as a hand-built view: each report
// tile would route directly into Frappe's standard Report Builder URL
// (e.g. /app/query-report/Project%20Status%20Summary). This stub stands in
// so reviewers see what the *destination* feels like — Desk chrome, filter
// row, column headers, a couple of fabricated rows. Clear "stub" caveat at
// the bottom; no buttons wired to anything.
//
// NOT a Milestone 1 feature. Do not extend with real queries or store calls.

import { computed } from "vue";
import { useRoute } from "vue-router";
import DeskPage from "@/components/desk/DeskPage.vue";
import { __ } from "@/utils/translate";

const route = useRoute();

// Same hardcoded list as the workspace landing — kept in sync by copy. In
// production both surfaces would pull from Workspace Structure Settings.
const REPORTS = {
	"project-status-summary": {
		title: __("Project Status Summary"),
		desc: __("Active projects with status, progress and schedule variance."),
		columns: [__("Project"), __("Status"), __("Progress"), __("Variance"), __("End date")],
		sampleRows: [
			["BTP — Block A", "Active", "54%", "+3.2% behind", "15 Dec 2026"],
			["BTP — Block B", "Active", "38%", "+8.1% behind", "20 Feb 2027"],
			["Casagrand Towers", "Active", "21%", "-1.4% ahead", "30 Sep 2027"],
			["Aluva Metro Ph2", "Planning", "5%", "—", "10 Jun 2028"],
		],
	},
	"task-completion-by-week": {
		title: __("Task Completion by Week"),
		desc: __("Tasks completed per project, bucketed by ISO week."),
		columns: [__("Project"), __("Week of"), __("Completed"), __("In progress"), __("Open")],
		sampleRows: [
			["BTP — Block A", "11 May 2026", "4", "6", "2"],
			["BTP — Block A", "18 May 2026", "3", "5", "3"],
			["BTP — Block B", "11 May 2026", "2", "4", "5"],
			["Casagrand Towers", "11 May 2026", "1", "3", "2"],
		],
	},
	"pending-progress-entries": {
		title: __("Pending Progress Entries"),
		desc: __("Tasks that are In Progress with no Task Progress Entry filed in the last 3 days."),
		columns: [__("Task"), __("Project"), __("Assignee"), __("Last entry"), __("Days silent")],
		sampleRows: [
			["Level 5 slab reinforcement", "BTP — Block A", "Ravi Kumar", "14 May 2026", "6"],
			["MEP sleeve layout L4", "BTP — Block A", "Ravi Kumar", "13 May 2026", "7"],
			["Brick masonry Wing-2", "BTP — Block B", "Ravi Kumar", "12 May 2026", "8"],
		],
	},
	"stage-vs-actual": {
		title: __("Stage Plan vs Actual"),
		desc: __("Each stage with planned task count, completed task count, and a variance %."),
		columns: [__("Stage"), __("Project"), __("Planned"), __("Completed"), __("Variance")],
		sampleRows: [
			["Foundation", "BTP — Block A", "8", "8", "0%"],
			["Substructure", "BTP — Block A", "6", "6", "0%"],
			["Superstructure", "BTP — Block A", "14", "6", "+57% behind"],
			["Foundation", "BTP — Block B", "8", "5", "+37% behind"],
		],
	},
	"labour-deployed": {
		title: __("Labour Deployed"),
		desc: __("Skilled + unskilled labour rolled up from Task Progress Entry, by task and week."),
		columns: [__("Task"), __("Week of"), __("Skilled"), __("Unskilled"), __("Total")],
		sampleRows: [
			["Level 5 slab pour", "11 May 2026", "12", "28", "40"],
			["Brick masonry Wing-2", "11 May 2026", "8", "18", "26"],
			["Excavation tower 2", "11 May 2026", "4", "32", "36"],
			["Internal plaster L3", "11 May 2026", "10", "14", "24"],
		],
	},
};

const slug = computed(() => route.params.slug);
const report = computed(() => REPORTS[slug.value] || null);

const breadcrumbs = computed(() => [
	{ label: "BuildSuite Core", to: "/" },
	{ label: __("Site Execution"), to: "/site-execution" },
	{ label: __("Reports") },
	{ label: report.value?.title || __("Unknown report") },
]);
</script>

<template>
	<DeskPage
		:title="report ? report.title : __('Report not found')"
		:subtitle="report ? report.desc : __('No report registered for slug \'{0}\'', [slug])"
		:breadcrumbs="breadcrumbs"
	>
		<template v-if="report">
			<!-- Report filter row -->
			<div
				class="bg-ink-50 border border-ink-200 px-3 py-2 flex items-center gap-2 flex-wrap"
				style="border-radius: 6px"
			>
				<span class="text-[11px] uppercase tracking-wider text-ink-500 font-medium"
					>{{ __("Filters") }}</span
				>
				<span class="text-[11px] text-ink-400">·</span>
				<span
					class="text-[11px] bg-white border border-ink-200 px-2 py-0.5"
					style="border-radius: 9999px"
					>{{ __("Company: All") }}</span
				>
				<span
					class="text-[11px] bg-white border border-ink-200 px-2 py-0.5"
					style="border-radius: 9999px"
					>{{ __("Project: All") }}</span
				>
				<span
					class="text-[11px] bg-white border border-ink-200 px-2 py-0.5"
					style="border-radius: 9999px"
					>{{ __("Date range: This quarter") }}</span
				>
			</div>

			<!-- Report data -->
			<div class="border border-ink-200 mt-3" style="border-radius: 6px">
				<table class="w-full text-sm">
					<thead>
						<tr class="bg-ink-50 border-b border-ink-200">
							<th
								v-for="c in report.columns"
								:key="c"
								class="text-left text-[11px] uppercase tracking-wider text-ink-500 font-medium px-3 py-2"
							>
								{{ c }}
							</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="(row, i) in report.sampleRows"
							:key="i"
							class="desk-row-stripe border-b border-ink-100 last:border-b-0"
						>
							<td
								v-for="(cell, j) in row"
								:key="j"
								class="px-3 py-2 text-ink-700 tabular-nums"
							>
								{{ cell }}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</template>

		<template v-else>
			<div class="border border-ink-200 px-4 py-8 text-center" style="border-radius: 6px">
				<div class="text-sm text-ink-700 mb-1">
					{{ __("No report registered for slug") }}
					<span class="font-mono">{{ slug }}</span>.
				</div>
				<div class="text-[11px] text-ink-500">
					{{ __("Check the report tile on the Site Execution workspace.") }}
				</div>
			</div>
		</template>
	</DeskPage>
</template>
