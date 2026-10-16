import assert from "node:assert/strict";
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = ["index.html", "dashboard.html"];
const required = {
  "index.html": ["مدیرنگر", "dashboard.html", "id=\"features\"", "id=\"contact\""],
  "dashboard.html": ["<title>مدیرنگر", "aria-label=\"نشان مدیرنگر\"", "id=\"loginPage\"", "id=\"dashboardPage\"", "handleLogin()", "loadLeads()", "renderTeam()", "renderKpi()", "loadReports()", "exportCrmBackup()", "importCrmBackup(event)", "function saveChecklist()", "تناسب با محصول", "managernegar-crm-backup-"]
};
const errors = [];
const temp = mkdtempSync(join(tmpdir(), "anbox-smoke-"));

try {
  for (const relative of files) {
    const full = join(root, relative);
    assert.ok(existsSync(full), `Required file missing: ${relative}`);
    const html = readFileSync(full, "utf8");
    assert.ok(html.length > 5000, `${relative} looks unexpectedly small`);

    for (const needle of required[relative]) {
      if (!html.includes(needle)) errors.push(`${relative}: missing expected marker ${needle}`);
    }

    const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]);
    const counts = new Map();
    for (const id of ids) counts.set(id, (counts.get(id) || 0) + 1);
    for (const [id, count] of counts) {
      if (count > 1) errors.push(`${relative}: duplicate static id "${id}" appears ${count} times`);
    }

    const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
    let match;
    let inlineIndex = 0;
    while ((match = scriptRegex.exec(html))) {
      if (/\bsrc\s*=/.test(match[1])) continue;
      const code = match[2].trim();
      if (!code) continue;
      const scriptFile = join(temp, `${relative.replace(/[^a-z0-9]/gi, "_")}_${inlineIndex++}.js`);
      writeFileSync(scriptFile, code, "utf8");
      const check = spawnSync(process.execPath, ["--check", scriptFile], { encoding: "utf8" });
      if (check.status !== 0) errors.push(`${relative}: inline script syntax error\n${check.stderr || check.stdout}`);
    }

    const hrefs = [...html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
    for (const href of hrefs) {
      if (!href || href.startsWith("#") || /^(https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
      const target = href.split(/[?#]/)[0];
      if (target && !existsSync(join(root, target))) errors.push(`${relative}: local href target not found: ${href}`);
    }

    console.log(`PASS file presence/size: ${relative} (${html.length.toLocaleString()} chars)`);
    console.log(`INFO ${relative}: ${inlineIndex} inline scripts syntax-checked; ${ids.length} static IDs checked; ${hrefs.length} hrefs inspected`);
  }

  // Keep these protections explicit: smoke checks must never mutate production data or browser storage.
  const dashboard = readFileSync(join(root, "dashboard.html"), "utf8");
  const saveFunction = dashboard.match(/function saveChecklist\(\)\{([\s\S]*?)\}\s*async function openLeadModal/);
  if (!dashboard.includes("'تناسب با آن باکس':'anbox_fit'")) errors.push("dashboard.html: legacy Excel import header alias was removed");
  if (!saveFunction || !/localStorage\.setItem\(['"]checklist_['"]\+user/.test(saveFunction[1])) errors.push("dashboard.html: saveChecklist() does not persist checklist state");
  if (/localStorage\.clear\s*\(/.test(dashboard)) errors.push("dashboard.html: localStorage.clear() is prohibited");
  if (/DROP\s+(TABLE|SCHEMA|DATABASE)|TRUNCATE\s+TABLE/i.test(dashboard)) errors.push("dashboard.html: destructive SQL marker found");

  const csvFunction = dashboard.match(/function downloadCsv\(headers,filename(?:,rows=\[\])?\)\{[\s\S]*?\n\}/);
  const exportFunction = dashboard.match(/function downloadLeadsExcel\(\)\{[^\r\n]*\}/);
  if (!csvFunction || !exportFunction) {
    errors.push("dashboard.html: CSV export functions are missing");
  } else {
    try {
      const captured = {};
      const sandbox = {
        EXCEL_HEADERS: ["company", "notes"],
        EXCEL_FIELD_MAP: { company: "company_name", notes: "notes" },
        leads: [{ company_name: "Acme, Inc.", notes: 'He said "hello"' }],
        window: {},
        showNotification() {},
        Blob: class { constructor(parts, options) { this.parts = parts; this.type = options.type; } },
        URL: { createObjectURL(blob) { captured.blob = blob; return "blob:smoke-test"; }, revokeObjectURL() {} },
        document: { body: { appendChild() {} }, createElement() { return { style: {}, click() {}, remove() {} }; } },
        setTimeout() {}
      };
      runInNewContext(`${csvFunction[0]}\n${exportFunction[0]}\ndownloadLeadsExcel();`, sandbox);
      const csv = captured.blob?.parts.join("") || "";
      if (!csv.startsWith("\uFEFF") || !csv.includes('"company","notes"')) errors.push("dashboard.html: CSV fallback is missing its UTF-8 BOM/header");
      if (!csv.includes('"Acme, Inc.","He said ""hello"""')) errors.push("dashboard.html: CSV fallback omitted or failed to escape lead data when XLSX is unavailable");
      if (!csv.includes("\r\n")) errors.push("dashboard.html: CSV fallback is missing CRLF row separators");
    } catch (error) {
      errors.push("dashboard.html: CSV fallback regression test failed: " + error.message);
    }
  }
  if (!dashboard.includes('id="performanceNav"') || !dashboard.includes("page==='performance'&&currentProfile?.role!=='manager'")) {
    errors.push("dashboard.html: manager performance navigation is missing its role guard");
  }
  const performanceFunction = dashboard.match(/function buildManagerPerformance\(profiles,targets,leadRows,now=new Date\(\)\)\{[\s\S]*?\n\}/);
  if (!performanceFunction) {
    errors.push("dashboard.html: manager performance calculation is missing");
  } else {
    try {
      const buildPerformance = runInNewContext("(" + performanceFunction[0] + ")");
      const now = new Date(2026, 9, 16, 12);
      const report = buildPerformance(
        [{ id: "expert-1", display_name: "Expert One" }, { id: "expert-2", display_name: "Expert Two" }],
        [{ owner_auth_id: "expert-1", key: "received", target_daily: 2, target_monthly: 3 }],
        [
          { id: 1, owner_auth_id: "expert-1", company_name: "Overdue Co", sales_stage: "2", lead_status: "در حال پیگیری", followup_date: "2026-10-15", created_at: "2026-10-16T09:00:00" },
          { id: 2, owner_auth_id: "expert-1", company_name: "No Date Co", sales_stage: "3", lead_status: "در حال مذاکره", followup_date: null, created_at: "2026-10-05T09:00:00" },
          { id: 3, owner_auth_id: "expert-1", company_name: "Contract Co", sales_stage: "6", lead_status: "در حال عقد قرارداد", followup_date: null, created_at: "2026-09-20T09:00:00" },
          { id: 4, owner_auth_id: null, company_name: "Undated Co", sales_stage: "2", lead_status: "در حال پیگیری", followup_date: "TBD", created_at: "invalid-date" }
        ],
        now
      );
      const first = report.team[0];
      if (first.todayActual !== 1 || first.monthActual !== 2 || first.monthlyGap !== -1) errors.push("dashboard.html: lead target completion or monthly deviation is incorrect");
      if (first.activeLeads !== 2 || first.contracts !== 1 || first.overdue !== 1 || first.missingFollowup !== 1) errors.push("dashboard.html: expert performance and follow-up counts are incorrect");
      if (report.team[1].targetConfigured || report.alerts.length !== 3 || report.undated !== 1 || report.alerts[2].alert !== "فرمت تاریخ پیگیری نامعتبر") errors.push("dashboard.html: missing targets, closed leads or invalid dates are misreported");
      const fallbackReport = buildPerformance(
        [{ id: "expert-1", display_name: "Expert One" }],
        [{ owner_auth_id: "expert-1", key: "received", target: 2 }],
        [],
        now
      );
      if (fallbackReport.team[0].monthlyTarget !== 48 || fallbackReport.team[0].monthlyGap !== -48) errors.push("dashboard.html: monthly KPI target should fall back to the general target multiplied by 24");
      const undefinedReport = buildPerformance(
        [{ id: "expert-1", display_name: "Expert One" }],
        [{ owner_auth_id: "expert-1", key: "received", target_daily: 2 }],
        [],
        now
      );
      if (undefinedReport.team[0].monthlyTarget !== null || undefinedReport.team[0].monthlyGap !== null) errors.push("dashboard.html: monthly KPI target should remain undefined when neither monthly nor general target is defined");
    } catch (error) {
      errors.push("dashboard.html: manager performance regression test failed: " + error.message);
    }
  }
  if (errors.length) {
    console.error("\nSMOKE CHECK FAILED:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log("\nSMOKE CHECK PASSED: static structure, required application markers, inline JavaScript syntax, and local links.");
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
