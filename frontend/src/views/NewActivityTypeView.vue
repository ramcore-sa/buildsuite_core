<script setup>
// New Activity Type — Desk-styled (CLAUDE.md §12.4). Renamed in Session 31 from
// "New Task Type" to align with proposal §M2 — see CLAUDE.md §1 reconciliation
// rule. Shape mirrors the edit mode of ActivityTypeDetailView. After save,
// routes to the created record.

import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useDataStore } from "@/stores";
import DeskPage from "@/components/desk/DeskPage.vue";
import DeskForm from "@/components/desk/DeskForm.vue";
import DeskActionBar from "@/components/desk/DeskActionBar.vue";
import DeskSection from "@/components/desk/DeskSection.vue";
import DeskField from "@/components/desk/DeskField.vue";
import DeskInput from "@/components/desk/DeskInput.vue";
import DeskSelect from "@/components/desk/DeskSelect.vue";
import DeskTextarea from "@/components/desk/DeskTextarea.vue";
import { __ } from "@/utils/translate";

const router = useRouter();
const store = useDataStore();

const CATEGORIES = ["Structural", "Finishing", "MEP", "Earthwork", "Other"];
const PROJECT_TYPES = ["Commercial", "Residential", "Infrastructure", "Industrial", "Renovation"];

const form = reactive({
	name: "",
	category: "Structural",
	description: "",
	defaultSkilledRatio: 0.5,
	defaultUnskilledRatio: 0.5,
	expectedProductivityPerManDay: 0,
	productivityUnit: "",
	defaultChecklist: [],
	applicableProjectTypes: [],
});
const errors = ref({});

function onSkilledChange() {
	const v = Number(form.defaultSkilledRatio);
	const safe = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
	form.defaultSkilledRatio = safe;
	form.defaultUnskilledRatio = Number((1 - safe).toFixed(2));
}

function addChecklistRow() {
	form.defaultChecklist.push({ item: "" });
}
function removeChecklistRow(i) {
	form.defaultChecklist.splice(i, 1);
}

function toggleProjectType(t) {
	const i = form.applicableProjectTypes.indexOf(t);
	if (i === -1) form.applicableProjectTypes.push(t);
	else form.applicableProjectTypes.splice(i, 1);
}

function validate() {
	const e = {};
	if (!form.name.trim()) e.name = __("Name is required");
	if (!form.category) e.category = __("Category is required");
	errors.value = e;
	return Object.keys(e).length === 0;
}

function save() {
	if (!validate()) return;
	const at = store.addActivityType({ ...form });
	router.push(`/activity-types/${at.id}`);
}
function cancel() {
	router.back();
}

const breadcrumbs = [
	{ label: "BuildSuite Core", to: "/" },
	{ label: __("Activity Type"), to: "/activity-types" },
	{ label: __("New") },
];
</script>

<template>
	<DeskPage
		:title="__('New Activity Type')"
		:subtitle="__('Master record · default checklist, labour mix, productivity')"
		:breadcrumbs="breadcrumbs"
	>
		<DeskForm>
			<template #action-bar>
				<DeskActionBar :save-label="__('Create Activity Type')" @save="save" @cancel="cancel" />
			</template>

			<div class="max-w-3xl mx-auto">
				<DeskSection :title="__('Basic')">
					<DeskField :label="__('Name')" required :error="errors.name">
						<DeskInput v-model="form.name" :placeholder="__('e.g. RCC Beam Casting')" />
					</DeskField>
					<DeskField :label="__('Category')" required :error="errors.category">
						<DeskSelect v-model="form.category">
							<option v-for="c in CATEGORIES" :key="c" :value="c">{{ __(c) }}</option>
						</DeskSelect>
					</DeskField>
					<DeskField :label="__('Description')">
						<DeskTextarea
							v-model="form.description"
							:rows="3"
							:placeholder="__('Brief description of the work covered…')"
						/>
					</DeskField>
				</DeskSection>

				<DeskSection :title="__('Default labour mix')" :cols="2">
					<DeskField
						:label="__('Skilled ratio (0–1)')"
						:hint="__('0.3 = 30% skilled. Unskilled auto-fills.')"
					>
						<DeskInput
							v-model="form.defaultSkilledRatio"
							type="number"
							step="0.05"
							min="0"
							max="1"
							@change="onSkilledChange"
							@blur="onSkilledChange"
						/>
					</DeskField>
					<DeskField :label="__('Unskilled ratio')" :hint="__('Read-only · auto-computed.')">
						<DeskInput :model-value="form.defaultUnskilledRatio" disabled />
					</DeskField>
				</DeskSection>

				<DeskSection :title="__('Default productivity')" :cols="2">
					<DeskField
						:label="__('Expected per man-day')"
						:hint="__('Quantity one worker is expected to complete in one day.')"
					>
						<DeskInput
							v-model="form.expectedProductivityPerManDay"
							type="number"
							step="0.1"
							min="0"
						/>
					</DeskField>
					<DeskField :label="__('Productivity unit')" :hint="__('e.g. m³, m², ton, m, nos')">
						<DeskInput v-model="form.productivityUnit" placeholder="m³" />
					</DeskField>
				</DeskSection>

				<DeskSection :title="__('Default checklist')">
					<div class="md:col-span-2">
						<ol class="space-y-1.5" v-if="form.defaultChecklist.length">
							<li
								v-for="(c, i) in form.defaultChecklist"
								:key="i"
								class="flex items-center gap-2"
							>
								<span class="text-ink-400 tabular-nums w-5 text-right text-sm"
									>{{ i + 1 }}.</span
								>
								<DeskInput
									v-model="c.item"
									:placeholder="__('Checklist item…')"
									class="flex-1"
								/>
								<button
									type="button"
									class="text-xs px-2 py-1 border border-ink-200 bg-white hover:bg-ink-50"
									style="border-radius: 2px; color: #b91c1c"
									@click="removeChecklistRow(i)"
									:title="__('Remove row')"
								>
									✕
								</button>
							</li>
						</ol>
						<div v-else class="text-[11px] text-ink-500 italic mb-2">
							{{
								__(
									"No rows yet · add checklist items workers will tick off when doing this kind of activity."
								)
							}}
						</div>
						<button
							type="button"
							class="mt-2 text-xs px-2 py-1 border border-ink-200 bg-white hover:bg-ink-50"
							style="border-radius: 2px"
							@click="addChecklistRow"
						>
							{{ __("+ Add row") }}
						</button>
					</div>
				</DeskSection>

				<DeskSection :title="__('Applicable project types')">
					<div class="md:col-span-2">
						<div class="flex flex-wrap gap-2">
							<label
								v-for="t in PROJECT_TYPES"
								:key="t"
								class="inline-flex items-center gap-1.5 text-xs text-ink-800 cursor-pointer px-2 py-1 border border-ink-200 hover:bg-ink-50"
								style="border-radius: 2px"
							>
								<input
									type="checkbox"
									:checked="form.applicableProjectTypes.includes(t)"
									class="accent-brand-600"
									@change="toggleProjectType(t)"
								/>
								{{ __(t) }}
							</label>
						</div>
						<div class="text-[11px] text-ink-500 mt-1.5">
							{{
								__(
									"Leave all unchecked to mark as universal (applies to every project type)."
								)
							}}
						</div>
					</div>
				</DeskSection>
			</div>
		</DeskForm>
	</DeskPage>
</template>
