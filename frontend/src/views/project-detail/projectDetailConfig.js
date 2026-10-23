// Labels are evaluated at import; the boot catalogue is inline in the page,
// so production already has the user's translations by then.
import { __ } from "@/utils/translate";

export const SUB_COLS = [
	{ key: "code", label: __("ID") },
	{ key: "name", label: __("Name") },
	{ key: "status", label: __("Status") },
	{ key: "budget", label: __("Budget"), align: "right" },
	{ key: "progress", label: __("Progress"), align: "right" },
	{ key: "pm", label: __("PM") },
];

export const WP_COLS = [
	{ key: "code", label: __("Code") },
	{ key: "name", label: __("Name") },
	{ key: "status", label: __("Status") },
	{ key: "budget", label: __("Budget"), align: "right" },
	{ key: "progress", label: __("Progress"), align: "right" },
	{ key: "timeline", label: __("Timeline") },
];

export const TASK_COLS = [
	{ key: "name", label: __("Task") },
	{ key: "project", label: __("Project") },
	{ key: "status", label: __("Status") },
	{ key: "priority", label: __("Priority") },
	{ key: "task_type", label: __("Task Type") },
	{ key: "assignee", label: __("Assignee") },
	{ key: "endDate", label: __("Due") },
	{ key: "progress", label: __("Progress"), align: "right" },
];

export const BOQ_COLS = [
	{ key: "id", label: __("ID") },
	{ key: "title", label: __("Title") },
	{ key: "revision", label: __("Rev."), align: "center" },
	{ key: "status", label: __("Status") },
	{ key: "sourceScoId", label: __("Source SCO") },
	{ key: "planned", label: __("Planned"), align: "right" },
	{ key: "actual", label: __("Actual"), align: "right" },
	{ key: "preparedDate", label: __("Prepared") },
];

export const SCO_COLS = [
	{ key: "id", label: __("ID") },
	{ key: "title", label: __("Title") },
	{ key: "impact", label: __("Impact"), align: "right" },
	{ key: "status", label: __("Status") },
	{ key: "raisedBy", label: __("Raised by") },
];

export const TEAM_COLS = [
	{ key: "member", label: __("Member") },
	{ key: "role", label: __("User") },
	{ key: "flag", label: "" },
];

export const PROJECT_REPORTS = [
	{
		slug: "project-status-summary",
		icon: "chart-line",
		label: __("Status summary"),
		desc: __("Status, progress and schedule variance."),
	},
	{
		slug: "stage-vs-actual",
		icon: "calendar",
		label: __("Stage plan vs actual"),
		desc: __("Planned vs completed task counts per stage."),
	},
	{
		slug: "task-completion-by-week",
		icon: "chart-line",
		label: __("Task completion by week"),
		desc: __("Weekly completion burn for this project."),
	},
	{
		slug: "pending-progress-entries",
		icon: "file-text",
		label: __("Pending progress"),
		desc: __("Tasks silent for 3+ days."),
	},
	{
		slug: "labour-deployed",
		icon: "workforce",
		label: __("Labour deployed"),
		desc: __("Skilled + unskilled labour by task / week."),
	},
];
