<script setup>
import { reactive, ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useDataStore } from "@/stores";
import { createDataAdapter } from "@/data/adapters";
import { showToast } from "@/utils/appToast";
import { useFormErrors } from "@/composables/useFormErrors";
import { usePermissions } from "@/composables/usePermissions";
import DeskPage from "@/components/desk/DeskPage.vue";
import DeskForm from "@/components/desk/DeskForm.vue";
import DeskActionBar from "@/components/desk/DeskActionBar.vue";
import DeskSection from "@/components/desk/DeskSection.vue";
import DeskField from "@/components/desk/DeskField.vue";
import DeskInput from "@/components/desk/DeskInput.vue";
import DeskSelect from "@/components/desk/DeskSelect.vue";
import DeskTextarea from "@/components/desk/DeskTextarea.vue";
import DeskLinkPicker from "@/components/desk/DeskLinkPicker.vue";
import { __ } from "@/utils/translate";

const router = useRouter();
const route = useRoute();
const store = useDataStore();
const { canCreate } = usePermissions();
const adapter = createDataAdapter(store);

const cameFromTaskId = route.query.taskId || null;

const form = reactive({
	taskId: cameFromTaskId || "",
	entryDate: new Date().toISOString().slice(0, 10),
	progressPct: 0,
	narrative: "",
	skilledLabour: 0,
	unskilledLabour: 0,
	weather: "",
	blockerFlag: false,
	blockerNote: "",
});
const { errors, applyServerErrors, setErrors, clearError } = useFormErrors({
	task: "taskId",
	entry_date: "entryDate",
	cumulative_progress: "progressPct",
	blocker_detail: "blockerNote",
});
const saving = ref(false);

// Load the selected task to show the info banner and pre-fill progress.
const taskResource = ref(null);

function loadTaskResource(taskId) {
	if (!taskId) {
		taskResource.value = null;
		return;
	}
	taskResource.value = adapter.read("Task", taskId, {
		nameField: "name",
		fields: ["name", "subject", "status", "progress"],
		transform(rows) {
			return rows.map((row) => ({
				id: row?.name || "",
				name: row?.subject || row?.name || "",
				status: row?.status || "",
				progress: Number(row?.progress) || 0,
			}));
		},
	});
}

watch(() => form.taskId, loadTaskResource, { immediate: true });

// Extract the first row from whatever shape the adapter returns — a list
// resource (`.data` array / `{ value: [...] }`) or a document resource (`.doc`).
// Mirrors TaskDetailView's firstResourceRow so progress resolves reliably.
function firstResourceRow(resource) {
	if (resource?.doc) return resource.doc;
	const raw = resource?.data;
	if (Array.isArray(raw)) return raw[0] || null;
	if (Array.isArray(raw?.value)) return raw.value[0] || null;
	if (raw && typeof raw === "object" && "value" in raw) return raw.value || null;
	return raw || null;
}

const selectedTask = computed(() => {
	const row = firstResourceRow(taskResource.value);
	if (!row) return null;
	// Normalise here (not via the adapter transform, which only runs for the
	// list-shaped `.data` path — a `.doc` resource bypasses it).
	return {
		id: row.id || row.name || "",
		name: row.subject || row.name || "",
		status: row.status || "",
		progress: Number(row.progress) || 0,
	};
});

// The task's current cumulative progress is the monotonic floor — a new entry
// can never go below it.
const progressFloor = computed(() => Number(selectedTask.value?.progress) || 0);

// Default the entry to the task's current cumulative progress whenever the
// selected task resolves or changes. Mirrors TaskDetailView's openProgress().
watch(
	() => selectedTask.value?.id,
	() => {
		form.progressPct = progressFloor.value;
	}
);

// Live validation — surface the monotonic error the moment the value drops
// below the floor (or out of range), instead of waiting for submit.
watch(
	() => [form.progressPct, progressFloor.value],
	() => {
		const raw = form.progressPct;
		if (raw === "" || raw === null) {
			clearError("progressPct");
			return;
		}
		const pct = Number(raw);
		if (Number.isNaN(pct) || pct < 0 || pct > 100) {
			errors.value = { ...errors.value, progressPct: __("Progress must be between 0 and 100") };
		} else if (pct < progressFloor.value) {
			errors.value = {
				...errors.value,
				progressPct: __("Progress can't go below the current {0}%. Entries are cumulative.", [
					progressFloor.value,
				]),
			};
		} else {
			clearError("progressPct");
		}
	}
);

// Clamp to the floor on blur/commit so the field can't be left below the task's
// current progress (paste / typing can bypass the input's min attribute).
function clampProgress() {
	let pct = Number(form.progressPct);
	if (Number.isNaN(pct)) pct = progressFloor.value;
	form.progressPct = Math.min(100, Math.max(progressFloor.value, pct));
}

function validate() {
	const e = {};
	if (!form.taskId) e.taskId = __("Task is required");
	const pct = Number(form.progressPct);
	if (Number.isNaN(pct) || pct < 0 || pct > 100) {
		e.progressPct = __("Progress must be between 0 and 100");
	} else if (pct < progressFloor.value) {
		e.progressPct = __("Progress can't go below the current {0}%. Entries are cumulative.", [
			progressFloor.value,
		]);
	}
	if (form.blockerFlag && !form.blockerNote.trim()) {
		e.blockerNote = __("Describe the blocker");
	}
	setErrors(e);
	return Object.keys(e).length === 0;
}

async function save() {
	if (!validate()) return;
	saving.value = true;
	try {
		const created = await adapter.create("Task Progress Entry", {
			task: form.taskId,
			entry_date: form.entryDate,
			cumulative_progress: Number(form.progressPct),
			narrative: form.narrative,
			skilled: Number(form.skilledLabour) || 0,
			unskilled: Number(form.unskilledLabour) || 0,
			weather: form.weather,
			blocker: form.blockerFlag ? 1 : 0,
			blocker_detail: form.blockerNote,
		});
		if (cameFromTaskId) {
			router.push(`/tasks/${cameFromTaskId}`);
		} else {
			router.push(`/progress-entries/${created.name || created.id}`);
		}
	} catch (err) {
		showToast(applyServerErrors(err) ?? __("Failed to file progress entry"), "error");
	} finally {
		saving.value = false;
	}
}
function cancel() {
	router.back();
}

const WEATHER_OPTIONS = ["Clear", "Rainy", "Hot", "Cold", "Storm"];

const breadcrumbs = [
	{ label: "BuildSuite Core", to: "/" },
	{ label: __("Task Progress Entry"), to: "/progress-entries" },
	{ label: __("New") },
];
</script>

<template>
	<DeskPage
		:title="__('New Progress Entry')"
		:subtitle="__('File today\'s progress against a task — labour, weather, blockers')"
		:breadcrumbs="breadcrumbs"
	>
		<div
			v-if="!canCreate('taskProgressEntry')"
			class="px-3 py-2 bg-warning-50 border border-warning-100 text-xs text-warning-700 dark:bg-ink-800 dark:border-ink-700"
			style="border-radius: 6px"
		>
			{{ __("You don't have permission to file a progress entry.") }}
		</div>
		<DeskForm v-else>
			<template #action-bar>
				<DeskActionBar
					:save-label="saving ? __('Filing…') : __('File entry')"
					:saving="saving"
					@save="save"
					@cancel="cancel"
				/>
			</template>

			<div class="max-w-3xl mx-auto">
				<DeskSection :title="__('Task & date')" :cols="2">
					<DeskField :label="__('Task')" required :error="errors.taskId">
						<DeskLinkPicker
							v-model="form.taskId"
							doctype="Task"
							label-field="subject"
							value-field="name"
							:search-fields="['subject', 'name']"
							:page-length="20"
							:placeholder="__('— Select task —')"
						/>
					</DeskField>
					<DeskField :label="__('Entry date')">
						<DeskInput v-model="form.entryDate" type="date" />
					</DeskField>
					<div
						v-if="selectedTask"
						class="md:col-span-2 text-xs text-ink-500 bg-ink-50 border border-ink-200 px-3 py-2"
						style="border-radius: 2px"
					>
						{{ __("Selected task") }}
						<strong class="text-ink-800">{{ selectedTask.name }}</strong>
						{{ __("is currently at") }}
						<strong class="text-ink-800 tabular-nums"
							>{{ selectedTask.progress }}% · {{ __(selectedTask.status) }}</strong
						>.
						{{
							__(
								"The Cumulative progress % you enter below will become the task's new state on save."
							)
						}}
					</div>
				</DeskSection>

				<DeskSection :title="__('Progress')" :cols="2">
					<DeskField
						:label="__('Cumulative progress (%)')"
						required
						:hint="
							__(
								'The NEW cumulative % after this entry — not a delta. Can\'t go below the current {0}%.',
								[progressFloor]
							)
						"
						:error="errors.progressPct"
					>
						<DeskInput
							v-model="form.progressPct"
							type="number"
							:min="progressFloor"
							max="100"
							step="1"
							@change="clampProgress"
							@blur="clampProgress"
						/>
					</DeskField>
					<div class="md:col-span-2">
						<DeskField
							:label="__('Narrative')"
							:hint="__('What was completed today? Any context worth recording?')"
						>
							<DeskTextarea
								v-model="form.narrative"
								:rows="3"
								:placeholder="__('e.g. Bays 3-4 complete; 285 of 380 m² done. Cube test taken.')"
							/>
						</DeskField>
					</div>
				</DeskSection>

				<DeskSection :title="__('Labour deployed today')" :cols="2">
					<DeskField
						:label="__('Skilled labour')"
						:hint="__('Count of skilled workers on site today')"
					>
						<DeskInput v-model="form.skilledLabour" type="number" />
					</DeskField>
					<DeskField
						:label="__('Unskilled labour')"
						:hint="__('Count of unskilled workers / helpers')"
					>
						<DeskInput v-model="form.unskilledLabour" type="number" />
					</DeskField>
				</DeskSection>

				<DeskSection :title="__('Site conditions')" :cols="2">
					<DeskField :label="__('Weather')" :hint="__('Optional · only if it\'s worth recording')">
						<DeskSelect v-model="form.weather">
							<option value="">{{ __("— No record —") }}</option>
							<option v-for="w in WEATHER_OPTIONS" :key="w" :value="w">
								{{ __(w, null, 'Weather') }}
							</option>
						</DeskSelect>
					</DeskField>
					<DeskField :label="__('Blocker')">
						<label
							class="flex items-center gap-2 py-1 text-sm text-ink-700 cursor-pointer"
						>
							<input
								v-model="form.blockerFlag"
								type="checkbox"
								class="h-3.5 w-3.5"
							/>
							{{ __("Flag a blocker on this entry") }}
						</label>
					</DeskField>
					<div v-if="form.blockerFlag" class="md:col-span-2">
						<DeskField
							:label="__('Blocker detail')"
							required
							:hint="__('What blocked progress today?')"
							:error="errors.blockerNote"
						>
							<DeskTextarea
								v-model="form.blockerNote"
								:rows="2"
								:placeholder="__('e.g. Afternoon shower delayed final bay by 2 hours')"
							/>
						</DeskField>
					</div>
				</DeskSection>
			</div>
		</DeskForm>
	</DeskPage>
</template>
