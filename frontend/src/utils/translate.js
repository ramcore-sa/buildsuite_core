// Translation for the SPA, the same contract as Frappe desk's `__()`.
//
// The catalogue is not fetched: www/core.py already renders the user's full
// message dictionary into the page as `window.translated_messages` (from
// frappe.translate.get_messages_for_boot), inline and before the module
// script, so even module-level constants (router titles, role tables) see it
// in production. The catalogue is read on every call rather than captured at
// import because the dev server only copies the boot onto window in main.js,
// after those modules were evaluated; components rendered later still pick
// it up there.
//
// Every string the user can read goes through `__`, so a translations app
// further down apps.txt (RAMCORE's ramcore_app) can supply Arabic without
// touching this repository again.

function messages() {
	return (typeof window !== "undefined" && window.translated_messages) || {};
}

function format(text, replace) {
	if (!replace) return text;
	const args = Array.isArray(replace) ? replace : [replace];
	return text.replace(/\{(\d+)\}/g, (match, index) =>
		args[index] !== undefined && args[index] !== null ? args[index] : match
	);
}

/**
 * Translate `message` and fill `{0}`, `{1}`… from `replace`.
 *
 * Placeholders are substituted after lookup, so the catalogue key is the
 * template ("{0} tasks") rather than every rendered variant ("3 tasks").
 * `context` disambiguates one English word with two meanings, stored by Frappe
 * under "message:context".
 */
export function __(message, replace, context = null) {
	if (message === null || message === undefined || message === "") return message;
	const text = String(message);
	const catalogue = messages();
	let translated = context ? catalogue[`${text}:${context}`] : undefined;
	if (!translated) translated = catalogue[text] || text;
	return format(translated, replace);
}

// Templates call `__()` directly through globalProperties, as in Frappe's own
// Vue apps; `window.__` covers plain modules and anything frappe-ui renders.
export const translationPlugin = {
	install(app) {
		app.config.globalProperties.__ = __;
		if (typeof window !== "undefined") window.__ = __;
	},
};
