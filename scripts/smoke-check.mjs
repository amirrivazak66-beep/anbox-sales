import assert from "node:assert/strict";
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = ["index.html", "dashboard.html"];
const required = {
  "index.html": ["دستیار مدیر فروش", "dashboard.html", "id=\"features\"", "id=\"contact\""],
  "dashboard.html": ["id=\"loginPage\"", "id=\"dashboardPage\"", "handleLogin()", "loadLeads()", "renderTeam()", "renderKpi()", "loadReports()", "exportCrmBackup()", "importCrmBackup(event)", "function saveChecklist()"]
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
  if (!saveFunction || !/localStorage\.setItem\(['"]checklist_['"]\+user/.test(saveFunction[1])) errors.push("dashboard.html: saveChecklist() does not persist checklist state");
  if (/localStorage\.clear\s*\(/.test(dashboard)) errors.push("dashboard.html: localStorage.clear() is prohibited");
  if (/DROP\s+(TABLE|SCHEMA|DATABASE)|TRUNCATE\s+TABLE/i.test(dashboard)) errors.push("dashboard.html: destructive SQL marker found");

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
