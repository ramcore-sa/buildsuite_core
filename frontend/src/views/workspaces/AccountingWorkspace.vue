<script setup>
// Accounting workspace — inherited from ERPNext V16, with BuildSuite Core customizations
// per CLAUDE.md §12.2 / §12.6. This is the first authentic workspace landing (Phase 4),
// distinct from PlaceholderView's simple shortcut-tile pattern. Other ERPNext workspaces
// (Buying / Stock / Assets / HR) can copy this file's shape when they get populated.
//
// Construction-specific hiding decisions are made VISIBLE rather than silently omitted:
// items hidden for construction live in the bottom disclosure block with the reasoning
// inline, so a reviewer can audit what's been removed and why.
//
// All link `to` targets are stubs (#) — none of these ERPNext DocTypes exist in the
// prototype. The page is a build spec for what V16 + BuildSuite extensions look like.

import DeskPage from "@/components/desk/DeskPage.vue";
import WorkspaceShortcut from "@/components/WorkspaceShortcut.vue";
import { __ } from "@/utils/translate";

const breadcrumbs = [{ label: "BuildSuite Core", to: "/" }, { label: __("Accounting") }];

// Number Cards: ERPNext-standard KPI tiles at the top of the workspace. All values
// illustrative — no accounting data exists in seed (M8 Project Finance handles petty
// cash only). Real values would come from GL aggregation.
const numberCards = [
	{ label: __("Outstanding receivables"), value: "₹—", sub: __("AR aging") },
	{ label: __("Outstanding payables"), value: "₹—", sub: __("AP aging") },
	{ label: __("Total bank balance"), value: "₹—", sub: __("all bank accounts") },
	{ label: __("Net profit (YTD)"), value: "₹—", sub: __("fiscal year to date") },
];

// Shortcuts: large primary-action tiles. ERPNext picks the 5–6 most frequent docs.
// `bs: true` marks the ones BuildSuite Core extends with custom fields (§12.6).
const shortcuts = [
	{ label: __("Sales Invoice"), icon: "📄", to: "#" },
	{ label: __("Purchase Invoice"), icon: "📥", to: "#" },
	{
		label: __("Journal Entry"),
		icon: "📋",
		to: "#",
		bs: true,
		bsNote: "BS adds project + petty_cash_request links",
	},
	{ label: __("Payment Entry"), icon: "💸", to: "#" },
	{ label: __("Bank Reconciliation"), icon: "🏦", to: "#" },
	{ label: __("Chart of Accounts"), icon: "📊", to: "#" },
];

// Sections: grouped link lists below the shortcuts. Order and grouping match ERPNext V16's
// out-of-the-box Accounting workspace. Items marked `report: true` are reports (rendered
// with a small "report" hint instead of plain link).
const sections = [
	{
		title: __("Accounting Masters"),
		items: [
			{ label: __("Company") },
			{ label: __("Account") },
			{ label: __("Cost Center") },
			{ label: __("Fiscal Year") },
			{ label: __("Mode of Payment") },
			{ label: __("Payment Terms Template") },
			{ label: __("Accounts Settings") },
			{ label: __("Accounting Dimension") },
		],
	},
	{
		title: __("General Ledger"),
		items: [
			{ label: __("Journal Entry"), bs: true },
			{ label: __("Payment Entry") },
			{ label: __("Period Closing Voucher") },
			{ label: __("General Ledger"), report: true },
			{ label: __("Trial Balance"), report: true },
		],
	},
	{
		title: __("Accounts Receivable"),
		items: [
			{ label: __("Customer") },
			{ label: __("Sales Invoice") },
			{ label: __("Payment Request") },
			{ label: __("Customer Group") },
			{ label: __("Sales Person") },
			{ label: __("Dunning"), hint: "rarely used in construction; kept for AMC contracts" },
			{ label: __("Accounts Receivable"), report: true },
			{ label: __("Customer Ledger Summary"), report: true },
		],
	},
	{
		title: __("Accounts Payable"),
		items: [
			{ label: __("Supplier") },
			{ label: __("Purchase Invoice") },
			{ label: __("Supplier Group") },
			{ label: __("Payment Entry") },
			{ label: __("Accounts Payable"), report: true },
			{ label: __("Supplier Ledger Summary"), report: true },
		],
	},
	{
		title: __("Banking"),
		items: [
			{ label: __("Bank") },
			{ label: __("Bank Account") },
			{ label: __("Bank Statement Import") },
			{ label: __("Bank Reconciliation Statement") },
			{ label: __("Bank Clearance Summary"), report: true },
		],
	},
	{
		title: __("Financial Reports"),
		items: [
			{ label: __("Profit and Loss Statement"), report: true },
			{ label: __("Balance Sheet"), report: true },
			{ label: __("Cash Flow"), report: true },
			{ label: __("General Ledger"), report: true },
			{ label: __("Trial Balance"), report: true },
			{ label: __("Sales Register"), report: true },
			{ label: __("Purchase Register"), report: true },
			{ label: __("Gross and Net Profit Report"), report: true },
		],
	},
	{
		title: __("Tax & Compliance (India)"),
		items: [
			{ label: __("GST Settings") },
			{ label: __("HSN Code") },
			{ label: __("Tax Category") },
			{ label: __("Tax Rule") },
			{ label: __("Tax Withholding Category") },
			{ label: __("Sales Taxes and Charges Template") },
			{ label: __("Purchase Taxes and Charges Template") },
			{ label: __("GSTR-1"), report: true },
			{ label: __("GSTR-3B"), report: true },
			{ label: __("GST Reconciliation"), report: true },
			{ label: __("HSN-wise Outward Summary"), report: true },
		],
	},
	{
		title: __("Multi-Currency"),
		items: [
			{ label: __("Currency") },
			{ label: __("Currency Exchange") },
			{ label: __("Exchange Rate Revaluation") },
		],
		note: "rare in domestic construction; relevant for projects with foreign material imports",
	},
	{
		title: __("Cheque Printing"),
		items: [{ label: __("Cheque Print Template") }],
		note: "still common in India for vendor payments",
	},
];
</script>

<template>
	<DeskPage
		:title="__('Accounting')"
		:subtitle="__('General ledger, receivables, payables and financial reports')"
		:breadcrumbs="breadcrumbs"
	>
		<!-- Number Cards -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
			<div
				v-for="c in numberCards"
				:key="c.label"
				class="bg-white border border-ink-200 px-3 py-2"
				style="border-radius: 2px"
			>
				<div class="text-[10px] uppercase tracking-wider text-ink-500 font-medium">
					{{ c.label }}
				</div>
				<div class="text-base font-semibold text-ink-900 mt-0.5 tabular-nums">
					{{ c.value }}
				</div>
				<div class="text-[10px] text-ink-500 mt-0.5">{{ c.sub }}</div>
			</div>
		</div>

		<section class="mb-5">
			<h2 class="desk-section-title">{{ __("Shortcuts") }}</h2>
			<hr class="desk-divider" />
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				<WorkspaceShortcut
					v-for="s in shortcuts"
					:key="s.label"
					:href="s.to"
					:icon="s.icon"
					:label="s.label"
					prevent
				/>
			</div>
		</section>

		<!-- Sections grid (2 cols on desktop) -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
			<section v-for="sec in sections" :key="sec.title">
				<h2 class="desk-section-title">{{ sec.title }}</h2>
				<hr class="desk-divider" />
				<ul class="space-y-0.5">
					<li
						v-for="i in sec.items"
						:key="i.label"
						class="flex items-center gap-2 text-xs py-1 px-1 hover:bg-brand-50 cursor-pointer"
						style="border-radius: 6px"
					>
						<a href="#" class="desk-link" @click.prevent>{{ i.label }}</a>
						<span
							v-if="i.report"
							class="text-[9px] uppercase tracking-wider text-ink-400 font-semibold"
							>{{ __("report") }}</span
						>
					</li>
				</ul>
			</section>
		</div>
	</DeskPage>
</template>
