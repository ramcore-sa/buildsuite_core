<script setup>
// Project Type Settings — create form. Session 39 (exploratory). Admin/BSA only.

import { reactive, ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDataStore } from "@/stores";
import { PROJECT_TYPE_TEMPLATES } from "@/data/projectTypeTemplates";
import DeskPage from "@/components/desk/DeskPage.vue";
import DeskForm from "@/components/desk/DeskForm.vue";
import DeskActionBar from "@/components/desk/DeskActionBar.vue";
import DeskSection from "@/components/desk/DeskSection.vue";
import DeskField from "@/components/desk/DeskField.vue";
import DeskInput from "@/components/desk/DeskInput.vue";
import DeskSelect from "@/components/desk/DeskSelect.vue";
import { __ } from "@/utils/translate";

const router = useRouter();
const store = useDataStore();

const form = reactive({
	name: "",
	workPackageLabel: "",
	workPackageLabelPlural: "",
	defaultTemplate: "",
	enabled: true,
	sort_order: "",
});
const errors = ref({});
const saving = ref(false);

const templateOptions = computed(() => Object.keys(PROJECT_TYPE_TEMPLATES));

function validate() {
	const e = {};
	if (!form.name.trim()) e.name = __("Name is required");
	// Defend against duplicate names — the join key onto project.type is `name`.
	if (
		form.name.trim() &&
		store.projectTypes.find((pt) => pt.name.toLowerCase() === form.name.trim().toLowerCase())
	) {
		e.name = __('A project type named "{0}" already exists.', [form.name.trim()]);
	}
	errors.value = e;
	return Object.keys(e).length === 0;
}

function save() {
	if (!validate()) return;
	saving.value = true;
	const record = store.addProjectType({
		name: form.name.trim(),
		workPackageLabel: form.workPackageLabel.trim(),
		workPackageLabelPlural: form.workPackageLabelPlural.trim(),
		defaultTemplate: form.defaultTemplate,
		enabled: form.enabled,
		sort_order: form.sort_order,
	});
	saving.value = false;
	router.push(`/settings/project-types/${record.id}`);
}
function cancel() {
	router.back();
}

const breadcrumbs = [
	{ label: "BuildSuite Core", to: "/" },
	{ label: __("Settings"), to: "/settings" },
	{ label: __("Project Types"), to: "/settings/project-types" },
	{ label: __("New") },
];

// Kept in script: the example names are double-quoted, which a quoted template
// attribute cannot hold.
const singularHint = __(
	'e.g. "Block", "Tower", "Villa Type", "Chainage Segment", "Package". Leave empty to use the site default.'
);

onMounted(() => {
	if (!store.isAdmin) router.replace("/settings");
});
</script>

<template>
	<DeskPage :title="__('New Project Type')" :breadcrumbs="breadcrumbs">
		<DeskForm>
			<template #action-bar>
				<DeskActionBar
					:save-label="saving ? __('Creating…') : __('Create project type')"
					:saving="saving"
					@save="save"
					@cancel="cancel"
				/>
			</template>

			<div class="max-w-3xl mx-auto">
				<DeskSection :title="__('Basic')">
					<DeskField
						:label="__('Project Type name')"
						required
						:error="errors.name"
						:hint="__('e.g. Commercial, Residential, Infrastructure, EPC, Interiors.')"
					>
						<DeskInput v-model="form.name" :placeholder="__('e.g. EPC')" />
					</DeskField>
					<DeskField
						:label="__('Sort order')"
						:hint="__('Position in the new-project type dropdown.')"
					>
						<DeskInput
							v-model="form.sort_order"
							type="number"
							:placeholder="__('auto-appended')"
						/>
					</DeskField>
					<DeskField :label="__('Enabled')">
						<label class="flex items-center gap-2 py-1 text-sm cursor-pointer">
							<input
								type="checkbox"
								v-model="form.enabled"
								class="accent-brand-600"
							/>
							<span>{{
								form.enabled
									? __("Enabled — appears in the new-project dropdown")
									: __("Disabled — hidden from the new-project dropdown")
							}}</span>
						</label>
					</DeskField>
				</DeskSection>

				<DeskSection :title="__('Work Package label')">
					<DeskField
						:label="__('Singular')"
						:hint="singularHint"
					>
						<DeskInput v-model="form.workPackageLabel" :placeholder="__('Work Package')" />
					</DeskField>
					<DeskField :label="__('Plural')">
						<DeskInput
							v-model="form.workPackageLabelPlural"
							:placeholder="__('Work Packages')"
						/>
					</DeskField>
				</DeskSection>

				<DeskSection :title="__('Default template')">
					<DeskField
						:label="__('Template')"
						:hint="
							__(
								'Seeds default stages, work packages and tasks on new projects of this type. Leave empty to create empty projects.'
							)
						"
					>
						<DeskSelect v-model="form.defaultTemplate">
							<option value="">{{ __("— No template —") }}</option>
							<option v-for="t in templateOptions" :key="t">{{ t }}</option>
						</DeskSelect>
					</DeskField>
				</DeskSection>
			</div>
		</DeskForm>
	</DeskPage>
</template>
