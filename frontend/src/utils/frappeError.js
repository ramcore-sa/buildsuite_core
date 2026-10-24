/**
 * Utilities for parsing Frappe HTTP error responses into user-friendly
 * messages and per-field error objects.
 *
 * Frappe error response shape (HTTP 417 / 409 / 500):
 *   {
 *     exc_type: "MandatoryError",
 *     exc: "...Traceback...\nfrappe.exceptions.MandatoryError: [Project, X]: company\nfield2",
 *     _server_messages: "[{\"message\": \"...\"}]"   ← double-encoded JSON
 *   }
 */

import { __ } from "@/utils/translate";

// Human-readable labels for common Frappe field names. Falls back to
// Title-Cased snake_case for anything not listed.
const FIELD_LABELS = {
	company: __("Company"),
	project_name: __("Project Name"),
	custom_project_id: __("Project ID"),
	customer: __("Client"),
	project_type: __("Project Type"),
	expected_start_date: __("Start Date"),
	expected_end_date: __("End Date"),
	estimated_costing: __("Budget"),
	owner: __("Project Manager"),
	task: __("Task"),
	entry_date: __("Entry Date"),
	cumulative_progress: __("Progress"),
	work_package: __("Work Package"),
	work_package_name: __("Work Package Name"),
	subject: __("Task Name"),
	status: __("Status"),
};

function fieldLabel(name) {
	// Unlisted fields fall back to the raw name title-cased; those are not in
	// any catalogue, so they stay English.
	return FIELD_LABELS[name] ?? name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Strip HTML tags from a Frappe server message and decode HTML entities.
 * Frappe often wraps field names and document links in <strong><a> tags that
 * point to /desk/... URLs, which are useless in the Vue app.
 */
function stripHtml(html) {
	if (!html || !html.includes("<")) return html;
	const div = document.createElement("div");
	div.innerHTML = html;
	return (div.textContent || div.innerText || "").trim();
}

/**
 * Frappe encodes _server_messages as a JSON string whose elements are
 * themselves JSON strings or objects. Unwrap both layers safely.
 */
function parseServerMessages(raw) {
	if (!raw) return [];
	try {
		const arr = typeof raw === "string" ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
		return arr
			.map((item) => {
				let text;
				if (typeof item === "string") {
					try {
						const inner = JSON.parse(item);
						text = typeof inner === "object" ? inner.message ?? "" : String(inner);
					} catch {
						text = item;
					}
				} else {
					text = typeof item === "object" ? item.message ?? "" : String(item);
				}
				return stripHtml(text);
			})
			.filter(Boolean);
	} catch {
		return [];
	}
}

/**
 * Parse a Frappe error (the rejected value from adapter calls) into:
 *   summary     – one-line human message suitable for a toast
 *   fieldErrors – { backendFieldName: "Field is required" } for field highlights
 *
 * Returns { summary: null, fieldErrors: {} } when nothing can be extracted.
 */
export function parseFrappeError(err) {
	if (!err) return { summary: null, fieldErrors: {} };

	const excType = err.exc_type ?? "";
	const exc = typeof err.exc === "string" ? err.exc : "";
	// frappe-ui pre-parses _server_messages into err.messages (string[]).
	// Check that first; fall back to the raw _server_messages path for
	// non-frappe-ui callers that still carry the double-encoded JSON string.
	const messages =
		Array.isArray(err.messages) && err.messages.length
			? err.messages.map(stripHtml).filter(Boolean)
			: parseServerMessages(err._server_messages);

	const fieldErrors = {};

	if (excType === "MandatoryError" || exc.includes("MandatoryError")) {
		// Extract field names from the traceback tail:
		//   MandatoryError: [DocType, Name]: field1\nfield2
		const tbMatch = exc.match(/MandatoryError:\s*\[.*?\]:\s*([\s\S]+)$/);
		// Labels are collected alongside the messages rather than recovered from
		// them afterwards: the message is translated, so stripping an English
		// " is required" suffix would no longer find anything.
		const labelSet = new Set();
		if (tbMatch) {
			tbMatch[1]
				.trim()
				.split(/[\n,]+/)
				.map((f) => f.trim())
				.filter(Boolean)
				.forEach((f) => {
					fieldErrors[f] = __("{0} is required", [fieldLabel(f)]);
					labelSet.add(fieldLabel(f));
				});
		}

		// Also scan _server_messages for the same [DocType, Name]: field pattern
		for (const msg of messages) {
			const msgMatch = msg.match(/^\[.*?\]:\s*([\s\S]+)$/);
			if (msgMatch) {
				msgMatch[1]
					.trim()
					.split(/[\n,]+/)
					.map((f) => f.trim())
					.filter(Boolean)
					.forEach((f) => {
						fieldErrors[f] ??= __("{0} is required", [fieldLabel(f)]);
						labelSet.add(fieldLabel(f));
					});
			}
		}

		const labels = [...labelSet];
		return {
			summary: labels.length
				? __("Required: {0}", [labels.join(", ")])
				: __("Some required fields are missing"),
			fieldErrors,
		};
	}

	// For any other error type use the first server message, then err.message.
	return {
		summary: messages[0] ?? stripHtml(err.message) ?? __("An unexpected error occurred"),
		fieldErrors: {},
	};
}
