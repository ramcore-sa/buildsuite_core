<script setup>
import { ref, watch } from "vue";
import DeskField from "@/components/desk/DeskField.vue";
import DeskInput from "@/components/desk/DeskInput.vue";
import DeskSelect from "@/components/desk/DeskSelect.vue";
import { createCustomer } from "@/data/customersApi";
import { __ } from "@/utils/translate";

const props = defineProps({ open: { type: Boolean, default: false } });
const emit = defineEmits(["close", "created"]);

const name = ref("");
const type = ref("Company");
const error = ref("");
const saving = ref(false);

watch(
	() => props.open,
	(o) => {
		if (o) {
			name.value = "";
			type.value = "Company";
			error.value = "";
			saving.value = false;
		}
	}
);

async function save() {
	if (!name.value.trim()) {
		error.value = __("Customer name is required");
		return;
	}
	saving.value = true;
	error.value = "";
	try {
		const c = await createCustomer(name.value.trim(), type.value);
		emit("created", c.name);
		emit("close");
	} catch (e) {
		error.value = e?.message || __("Failed to create customer");
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
			@click.self="emit('close')"
		>
			<div
				class="bg-white border border-ink-200 w-full max-w-md shadow-fp-lg flex flex-col"
				style="border-radius: 12px"
				@click.stop
			>
				<header
					class="px-5 py-3 border-b border-ink-200 flex items-center justify-between bg-white"
					style="border-radius: 12px 12px 0 0"
				>
					<h2 class="text-sm font-semibold text-ink-900">{{ __("New customer") }}</h2>
					<button
						type="button"
						class="text-ink-500 hover:text-ink-900 text-lg leading-none"
						:aria-label="__('Close')"
						@click="emit('close')"
					>
						x
					</button>
				</header>
				<div class="p-5 space-y-3">
					<DeskField :label="__('Customer name')" required :error="error">
						<DeskInput
							v-model="name"
							:placeholder="__('e.g. Prestige Group')"
							@keyup.enter="save"
						/>
					</DeskField>
					<DeskField :label="__('Customer type')">
						<DeskSelect v-model="type">
							<!-- The value stays the English Customer Type option; only the label is translated. -->
							<option value="Company">{{ __("Company") }}</option>
							<option value="Individual">{{ __("Individual") }}</option>
							<option value="Partnership">{{ __("Partnership") }}</option>
						</DeskSelect>
					</DeskField>
				</div>
				<footer
					class="px-5 py-3 border-t border-ink-200 flex items-center justify-end gap-2 bg-white"
					style="border-radius: 0 0 12px 12px"
				>
					<button
						type="button"
						class="text-xs px-3 py-1.5 border border-ink-200 bg-white hover:bg-ink-50 text-ink-700"
						style="border-radius: 6px"
						@click="emit('close')"
					>
						{{ __("Cancel") }}
					</button>
					<button
						type="button"
						class="desk-save-btn"
						:disabled="!name.trim() || saving"
						@click="save"
					>
						{{ saving ? __("Creating…") : __("Create customer") }}
					</button>
				</footer>
			</div>
		</div>
	</Teleport>
</template>
