<script setup>
// Activity Type — list view. Desk-styled (CLAUDE.md §12.4). Master DocType
// from §13.3 item 16. Renamed in Session 31 from "Task Type" to align with
// proposal §M2 — proposal reserves task_type as a Select field on Task driving
// progress flow (Activity / Milestone / Inspection). The master here is the
// construction-activity template (RCC Column Casting / Brick Masonry / etc.).
//
// Not on the sidebar (it's a setup/masters surface); reached via cross-link
// from the Tasks list, or by direct URL at /app/activity-types.

import { computed, ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { useDataStore } from "@/stores";
import DeskPage from "@/components/desk/DeskPage.vue";
import DeskList from "@/components/desk/DeskList.vue";
import DeskSelect from "@/components/desk/DeskSelect.vue";
import DeskFilterChip from "@/components/desk/DeskFilterChip.vue";
import DeskLink from "@/components/desk/DeskLink.vue";
import { __ } from "@/utils/translate";

const store = useDataStore();
const router = useRouter();

const search = ref("");
const categoryFilter = ref("");

const CATEGORIES = ["Structural", "Finishing", "MEP", "Earthwork", "Other"];

const items = computed(() => {
	const term = search.value.trim().toLowerCase();
	return store.activityTypes.filter((at) => {
		if (categoryFilter.value && at.category !== categoryFilter.value) return false;
		if (term) {
			const hay = `${at.id} ${at.name} ${at.description || ""} ${at.category}`.toLowerCase();
			if (!hay.includes(term)) return false;
		}
		return true;
	});
});

const columns = [
	{ key: "id", label: __("ID") },
	{ key: "name", label: __("Name") },
	{ key: "category", label: __("Category") },
	{ key: "skilled", label: __("Skilled %"), align: "right" },
	{ key: "unskilled", label: __("Unskilled %"), align: "right" },
	{ key: "productivity", label: __("Productivity"), align: "right" },
	{ key: "applicableProjects", label: __("Applicable types") },
];

const breadcrumbs = [{ label: "BuildSuite Core", to: "/" }, { label: __("Activity Type") }];

const subtitle = computed(
	() =>
		__("{0} of {1} · Master record · §13.3 item 16", [
			items.value.length,
			store.activityTypes.length,
		])
);

function onRowClick(row) {
	router.push(`/activity-types/${row.id}`);
}
function pct(n) {
	return Math.round((Number(n) || 0) * 100);
}
</script>

<template>
	<DeskPage :title="__('Activity Type')" :subtitle="subtitle" :breadcrumbs="breadcrumbs">
		<template #actions>
			<RouterLink to="/tasks" class="text-xs text-ink-600 hover:text-ink-900 mr-2"
				>{{ __("← Back to Tasks") }}</RouterLink
			>
			<RouterLink to="/activity-types/new" class="desk-save-btn"
				>{{ __("+ New Activity Type") }}</RouterLink
			>
		</template>

		<DeskList
			v-model="search"
			:rows="items"
			:columns="columns"
			row-key="id"
			:search-placeholder="__('Search activity types…')"
			@row-click="onRowClick"
		>
			<template #filter-chips>
				<DeskSelect v-if="!categoryFilter" v-model="categoryFilter" class="!w-40">
					<option value="">{{ __("Category: Any") }}</option>
					<option v-for="c in CATEGORIES" :key="c" :value="c">{{ __(c) }}</option>
				</DeskSelect>
				<DeskFilterChip
					v-else
					:label="__('Category')"
					:value="__(categoryFilter)"
					@remove="categoryFilter = ''"
				/>
			</template>

			<template #cell-id="{ row }">
				<DeskLink
					:to="`/activity-types/${row.id}`"
					@click.stop
					class="font-mono text-xs"
					>{{ row.id }}</DeskLink
				>
			</template>
			<template #cell-name="{ row }">
				<div class="text-sm font-medium text-ink-900">{{ row.name }}</div>
				<div v-if="row.description" class="text-[11px] text-ink-500 truncate max-w-md">
					{{ row.description }}
				</div>
			</template>
			<template #cell-category="{ row }">
				<span
					class="text-[11px] px-1.5 py-0.5 bg-ink-100 text-ink-700 font-medium"
					style="border-radius: 2px"
					>{{ __(row.category) }}</span
				>
			</template>
			<template #cell-skilled="{ row }">
				<span class="text-xs tabular-nums">{{ pct(row.defaultSkilledRatio) }}%</span>
			</template>
			<template #cell-unskilled="{ row }">
				<span class="text-xs tabular-nums text-ink-500"
					>{{ pct(row.defaultUnskilledRatio) }}%</span
				>
			</template>
			<template #cell-productivity="{ row }">
				<span class="text-xs tabular-nums"
					>{{ row.expectedProductivityPerManDay }}
					{{ __("{0}/man-day", [row.productivityUnit]) }}</span
				>
			</template>
			<template #cell-applicableProjects="{ row }">
				<div class="flex flex-wrap gap-1">
					<span
						v-for="t in row.applicableProjectTypes || []"
						:key="t"
						class="text-[10px] px-1 py-0.5 bg-brand-50 text-brand-700 font-medium"
						style="border-radius: 2px"
						>{{ __(t) }}</span
					>
					<span
						v-if="!(row.applicableProjectTypes && row.applicableProjectTypes.length)"
						class="text-[10px] text-ink-400 italic"
						>{{ __("Universal") }}</span
					>
				</div>
			</template>

			<template #empty>
				<div class="text-sm text-ink-500">
					{{ __("No activity types match these filters") }} ·
					<RouterLink to="/activity-types/new" class="desk-link"
						>{{ __("Create one →") }}</RouterLink
					>
				</div>
			</template>
		</DeskList>
	</DeskPage>
</template>
