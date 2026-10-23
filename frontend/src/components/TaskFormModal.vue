<script setup>
// Reusable "+ Add Task" modal. Opens with v-model:open and a pre-filled
// project (+ optional work package). On save calls store.addTask and emits
// `created` with the new record so the parent can react (refresh list,
// route, etc). Pure presentational — no routing.

import { reactive, ref, computed, watch } from "vue";
import { useDataStore } from "@/stores";
import { showToast } from "@/utils/appToast";
import { useFormErrors } from "@/composables/useFormErrors";
import DeskSection from "@/components/desk/DeskSection.vue";
import DeskField from "@/components/desk/DeskField.vue";
import DeskInput from "@/components/desk/DeskInput.vue";
import DeskSelect from "@/components/desk/DeskSelect.vue";
import DeskTextarea from "@/components/desk/DeskTextarea.vue";
import DeskLinkPicker from "@/components/desk/DeskLinkPicker.vue";
import { createDataAdapter } from "@/data/adapters";
import { setTaskAssignee } from "@/data/taskAssignmentApi";
import { __ } from "@/utils/translate";

const props = defineProps({
	open: { type: Boolean, default: false },
	projectId: { type: String, default: "" },
	workPackageId: { type: String, default: "" },
});
const emit = defineEmits(["update:open", "created"]);

const store = useDataStore();
const adapter = createDataAdapter(store);
const saving = ref(false);

const { errors, applyServerErrors, setErrors, clearError } = useFormErrors({
	subject: "name",
	project: "projectId",
	exp_end_date: "endDate",
});

const projectsResource = adapter.list("Project", {
	fields: ["name", "project_name", "project_type"],
	orderBy: "modified desc",
	pageLength: 200,
});
const wpsResource = adapter.list("Work Package", {
	fields: ["name", "work_package_name", "project"],
	orderBy: "modified desc",
	pageLength: 500,
});

const form = reactive({
	projectId: "",
	workPackageId: null,
	task_type: "Activity",
	activityType: null,
	name: "",
	description: "",
	status: "Yet To Start",
	priority: "Medium",
	assignee: "",
	startDate: "",
	endDate: "",
});

// Reset the form whenever the modal opens. Pre-fill from props.
watch(
	() => props.open,
	(isOpen) => {
		if (!isOpen) return;
		form.projectId = props.projectId || projectsResource.data[0]?.name || "";
		form.workPackageId = props.workPackageId || null;
		form.task_type = "Activity";
		form.activityType = null;
		form.name = "";
		form.description = "";
		form.status = "Yet To Start";
		form.priority = "Medium";
		form.assignee = "";
		form.startDate = new Date().toISOString().slice(0, 10);
		form.endDate = "";
		setErrors({});
	}
);

const selectedProject = computed(() =>
	projectsResource.data.find((p) => p.name === form.projectId)
);
const selectedWP = computed(() => wpsResource.data.find((wp) => wp.name === form.workPackageId));
const availableWPs = computed(() =>
	wpsResource.data.filter((wp) => wp.project === form.projectId)
);
const availableActivityTypes = computed(() => {
	const pt = selectedProject.value?.project_type;
	return pt ? store.activityTypesForProjectType(pt) : store.activityTypes;
});

// Project is locked when the parent supplied it. WP is locked when both
// project + WP are supplied (work-package-scoped entry). When the parent
// supplies only the project (Tasks tab on Project Detail), WP is still
// editable.
const projectLocked = computed(() => !!props.projectId);
const wpLocked = computed(() => !!props.workPackageId);

watch(
	() => form.projectId,
	() => {
		if (
			!wpLocked.value &&
			form.workPackageId &&
			!availableWPs.value.find((wp) => wp.name === form.workPackageId)
		) {
			form.workPackageId = null;
		}
		if (
			form.activityType &&
			!availableActivityTypes.value.find((at) => at.id === form.activityType)
		) {
			form.activityType = null;
		}
	}
);

function close() {
	emit("update:open", false);
}

function validate() {
	const e = {};
	if (!form.name.trim()) e.name = __("Task name is required");
	if (!form.projectId) e.projectId = __("Project is required");
	if (form.endDate && form.startDate && form.endDate < form.startDate) {
		e.endDate = __("End must be after start");
	}
	setErrors(e);
	return Object.keys(e).length === 0;
}

async function save() {
	if (!validate()) return;
	saving.value = true;
	try {
		const task = await adapter.create("Task", {
			project: form.projectId,
			work_package: form.workPackageId,
			task_type: form.task_type,
			subject: form.name,
			description: form.description,
			task_status: form.status,
			priority: form.priority,
			exp_start_date: form.startDate,
			exp_end_date: form.endDate,
		});
		// Assignee is Frappe-native `_assign`, set after insert (single-assignee).
		if (form.assignee && task?.name) {
			try {
				await setTaskAssignee(task.name, form.assignee);
			} catch {
				/* non-fatal */
			}
		}
		emit("created", task);
		close();
	} catch (err) {
		const summary = applyServerErrors(err);
		showToast(summary ?? __("Failed to create task"), "error");
	} finally {
		saving.value = false;
	}
}
</script>

<template>
	<Teleport to="body">
		<div
			v-if="open"
			class="fixed inset-0 bg-ink-900/40 z-[60] flex items-center justify-center p-6"
			@click.self="close"
		>
			<div
				class="bg-white border border-ink-200 w-full max-w-2xl shadow-fp-lg flex flex-col"
				style="border-radius: 12px; max-height: calc(100vh - 3rem)"
				@click.stop
			>
				<header
					class="px-5 py-3 border-b border-ink-200 flex items-center justify-between flex-shrink-0 bg-white"
					style="border-radius: 12px 12px 0 0"
				>
					<div class="min-w-0 flex-1">
						<h2 class="text-sm font-semibold text-ink-900">{{ __("New task") }}</h2>
						<p v-if="selectedProject" class="text-[11px] text-ink-500 mt-0.5 truncate">
							{{ selectedProject.project_name
							}}<template v-if="selectedWP">
								· {{ selectedWP.work_package_name }}</template
							>
						</p>
					</div>
					<button
						type="button"
						class="text-ink-500 hover:text-ink-900 text-lg leading-none flex-shrink-0 ml-3"
						:aria-label="__('Close')"
						@click="close"
					>
						×
					</button>
				</header>

				<div class="p-5 overflow-y-auto flex-1">
					<DeskSection :title="__('Task details')">
						<DeskField :label="__('Task name')" required :error="errors.name">
							<DeskInput
								v-model="form.name"
								:placeholder="__('e.g. Level 5 column casting')"
								@input="clearError('name')"
							/>
						</DeskField>
						<DeskField
							:label="__('Task Type')"
							required
							:hint="
								__(
									'Activity = standard work with progress entries; Milestone = checkpoint; Inspection = pass/fail gate.'
								)
							"
						>
							<DeskSelect v-model="form.task_type">
								<option value="Activity">{{ __("Activity") }}</option>
								<option value="Milestone">{{ __("Milestone") }}</option>
								<option value="Inspection">{{ __("Inspection") }}</option>
							</DeskSelect>
						</DeskField>
						<DeskField :label="__('Description')">
							<DeskTextarea
								v-model="form.description"
								:rows="3"
								:placeholder="__('Optional context for this task')"
							/>
						</DeskField>
					</DeskSection>

					<DeskSection :title="__('Hierarchy')">
						<DeskField
							:label="__('Project')"
							required
							:error="errors.projectId"
							:hint="
								projectLocked
									? __('Pre-selected from where you came in — locked.')
									: ''
							"
						>
							<DeskSelect
								v-model="form.projectId"
								:disabled="projectLocked"
								@change="clearError('projectId')"
							>
								<option value="">{{ __("— Select project —") }}</option>
								<option
									v-for="p in projectsResource.data"
									:key="p.name"
									:value="p.name"
								>
									{{ p.project_name }}
								</option>
							</DeskSelect>
						</DeskField>
						<DeskField
							:label="__('Work Package')"
							:hint="
								wpLocked
									? __('Pre-selected — locked.')
									: __('Optional — leave blank to attach directly to the project.')
							"
						>
							<DeskSelect v-model="form.workPackageId" :disabled="wpLocked">
								<option :value="null">{{ __("— None —") }}</option>
								<option v-for="wp in availableWPs" :key="wp.name" :value="wp.name">
									{{ wp.work_package_name }}
								</option>
							</DeskSelect>
						</DeskField>
						<DeskField
							:label="__('Activity Type')"
							:hint="__('Optional — provides default labour mix and productivity baseline.')"
						>
							<DeskSelect v-model="form.activityType">
								<option :value="null">{{ __("— None —") }}</option>
								<option
									v-for="at in availableActivityTypes"
									:key="at.id"
									:value="at.id"
								>
									{{ at.name
									}}<template v-if="at.category"> · {{ at.category }}</template>
								</option>
							</DeskSelect>
						</DeskField>
					</DeskSection>

					<DeskSection :title="__('Schedule')">
						<DeskField :label="__('Start date')">
							<DeskInput v-model="form.startDate" type="date" />
						</DeskField>
						<DeskField :label="__('End date')" :error="errors.endDate">
							<DeskInput
								v-model="form.endDate"
								type="date"
								@change="clearError('endDate')"
							/>
						</DeskField>
					</DeskSection>

					<DeskSection :title="__('Assignment & status')">
						<DeskField :label="__('Assignee')">
							<DeskLinkPicker
								v-model="form.assignee"
								doctype="User"
								:placeholder="__('Select assignee')"
								label-field="full_name"
								value-field="name"
								:search-fields="['full_name', 'name', 'email']"
								:filters="[['enabled', '=', 1]]"
								order-by="full_name asc"
								:page-length="20"
							/>
						</DeskField>
						<DeskField :label="__('Status')">
							<!-- Option values stay the stored English Select values; only labels are translated. -->
							<DeskSelect v-model="form.status">
								<option value="Yet To Start">{{ __("Yet To Start") }}</option>
								<option value="In Progress">{{ __("In Progress") }}</option>
								<option value="In Delay">{{ __("In Delay") }}</option>
								<option value="Completed">{{ __("Completed") }}</option>
								<option value="Blocked">{{ __("Blocked", null, "Status") }}</option>
							</DeskSelect>
						</DeskField>
						<DeskField :label="__('Priority')">
							<DeskSelect v-model="form.priority">
								<option value="Low">{{ __("Low") }}</option>
								<option value="Medium">{{ __("Medium") }}</option>
								<option value="High">{{ __("High") }}</option>
							</DeskSelect>
						</DeskField>
					</DeskSection>
				</div>

				<footer
					class="px-5 py-3 border-t border-ink-200 flex items-center justify-end gap-2 flex-shrink-0 bg-white"
					style="border-radius: 0 0 12px 12px"
				>
					<button
						type="button"
						class="text-xs px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 text-ink-700"
						style="border-radius: 6px"
						@click="close"
					>
						{{ __("Cancel") }}
					</button>
					<button type="button" class="desk-save-btn" :disabled="saving" @click="save">
						{{ saving ? __("Creating…") : __("Create task") }}
					</button>
				</footer>
			</div>
		</div>
	</Teleport>
</template>
