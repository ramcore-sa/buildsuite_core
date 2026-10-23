// UI metadata for the 12 workspaces (CLAUDE.md §12.2). Separate from src/data/roles.js
// because that file is logic-only (visibility matrix + ordering); this one is UI-only
// (label, icon, route, group, and the live-count helper landings use on their tiles).
//
// Note: [src/layouts/DeskShell.vue](src/layouts/DeskShell.vue) has its own local copy
// of this same metadata. Eventually one should import the other — leaving them as
// parallel copies for now to avoid a refactor outside the prompt's scope.

import { __ } from "@/utils/translate";

export const WORKSPACE_META = {
	"site-execution": {
		name: __("Site Execution"),
		icon: "🏗️",
		to: "/site-execution",
		group: "buildsuite",
		desc: __("Projects, work packages, tasks, schedule."),
	},
	estimation: {
		name: __("Estimation"),
		icon: "📐",
		to: "/estimation",
		group: "buildsuite",
		desc: __("BOQ, Rate Master, revision compare."),
	},
	procurement: {
		name: __("Procurement"),
		icon: "🛒",
		to: "/procurement",
		group: "buildsuite",
		desc: __("Material requests, supplier follow-up, GRN."),
	},
	subcontract: {
		name: __("Subcontract"),
		icon: "🤝",
		to: "/subcontract",
		group: "buildsuite",
		desc: __("Vendors, work orders, RA bills, retention."),
	},
	workforce: {
		name: __("Workforce"),
		icon: "👷",
		to: "/workforce",
		group: "buildsuite",
		desc: __("Crews, overtime, wages to contractor."),
	},
	// 'scope-change' removed Session 33 — merged into Site Execution. SCO surface
	// lives at /app/sco and is reached via the Site Execution workspace tile grid.
	"project-finance": {
		name: __("Project Finance"),
		icon: "💵",
		to: "/project-finance",
		group: "buildsuite",
		desc: __("Petty cash, cost summary, project P&L."),
	},
	accounting: {
		name: __("Accounting"),
		icon: "📊",
		to: "/accounting",
		group: "erpnext",
		desc: __("Inherited from ERPNext."),
	},
	buying: {
		name: __("Buying"),
		icon: "📥",
		to: "/buying",
		group: "erpnext",
		desc: __("Inherited from ERPNext."),
	},
	stock: {
		name: __("Stock"),
		icon: "📦",
		to: "/stock",
		group: "erpnext",
		desc: __("Inherited from ERPNext."),
	},
	assets: {
		name: __("Assets"),
		icon: "🏭",
		to: "/assets",
		group: "erpnext",
		desc: __("Inherited from ERPNext — extended for Plant & Machinery."),
	},
	hr: {
		name: __("HR"),
		icon: "👤",
		to: "/hr",
		group: "erpnext",
		desc: __("Inherited from Frappe HR — office staff only."),
	},
};

// Friendly labels for access-level hints (CLAUDE.md §12.3). The DeskShell sidebar uses
// single-letter abbreviations (R, A, C, …); landings have more horizontal space so they
// show the full word.
export const ACCESS_LABEL = {
	read: __("Read"),
	approve: __("Approve"),
	"create-own": __("Create"),
	"self-service": __("Self-service"),
	"team-only": __("Team"),
	"pay-only": __("Pay"),
	"mr-only": __("MR raise"),
};

// One-line "live metric" string for a workspace tile. Returns null when the seed/store
// doesn't have data to back a real number — callers should omit the metric line rather
// than display a fake count. Reading the store here keeps the call site's computed()
// reactive to the underlying state.
export function workspaceMetric(slug, store) {
	switch (slug) {
		case "site-execution": {
			// Session 33: includes pending-SCO count since Scope Change merged here.
			const projects = store.activeProjectsCount;
			const scos = store.pendingScosCount;
			// Each count is its own phrase so the singular/plural pair is a whole
			// string a translator can render, not an English "s" suffix.
			const base =
				projects === 1
					? __("{0} active project", [projects])
					: __("{0} active projects", [projects]);
			if (!scos) return base;
			const pending =
				scos === 1 ? __("{0} pending SCO", [scos]) : __("{0} pending SCOs", [scos]);
			return `${base} · ${pending}`;
		}
		case "estimation": {
			const active = store.activeBoqsCount;
			const draft = store.draftBoqsCount;
			if (!active && !draft) return null;
			return draft === 1
				? __("{0} active · {1} draft BOQ", [active, draft])
				: __("{0} active · {1} draft BOQs", [active, draft]);
		}
		// The four below have no domain data in seed yet — return null to omit the metric.
		case "procurement":
		case "subcontract":
		case "workforce":
		case "project-finance":
			return null;
		// ERPNext workspaces — placeholder data only.
		case "accounting":
		case "buying":
		case "stock":
		case "assets":
		case "hr":
			return null;
		default:
			return null;
	}
}
