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
  // Regression: Phase 3 PDF print must read the class-based report wrapper.
  const phase3 = readFileSync(join(root, "scripts/phase3-management-analytics.js"), "utf8");
  const phase3Check = spawnSync(process.execPath, ["--check", join(root, "scripts/phase3-management-analytics.js")], { encoding: "utf8" });
  if (phase3Check.status !== 0) errors.push("Phase 3 analytics script syntax error: " + (phase3Check.stderr || phase3Check.stdout));
  if (!phase3.includes("const report=host.querySelector('.p3-wrap')")) errors.push("Phase 3 print must select the report by class");
  if (phase3.includes("$('.p3-wrap')")) errors.push("Phase 3 print uses the ID-only selector helper for a class");
  if (!phase3.includes("const body=report.innerHTML")) errors.push("Phase 3 print body is not built from the report wrapper");
  // Unified leads must preserve source records and enforce expert ownership in the view model.
  const unifiedFile = join(root, "scripts/unified-leads.js");
  const unifiedScript = readFileSync(unifiedFile, "utf8");
  const unifiedCheck = spawnSync(process.execPath, ["--check", unifiedFile], { encoding: "utf8" });
  if (unifiedCheck.status !== 0) errors.push("unified-leads.js: syntax error " + (unifiedCheck.stderr || unifiedCheck.stdout));
  else {
    const scope = { window: {} };
    runInNewContext(unifiedScript, scope);
    const normalize = scope.window.ManagerNegarUnifiedLeads.normalizeRows;
    const direct = [{id:"d1",owner_auth_id:"expert-a",company_name:"Direct A",phone:"1"},{id:"d2",owner_auth_id:"expert-b",company_name:"Direct B",phone:"2"}];
    const requests = [{id:"c1",owner_auth_id:"expert-a",request_type:"commercial",company:"Commercial A",phone:"3"},{id:"c2",owner_auth_id:"expert-b",request_type:"commercial",company:"Commercial B",phone:"4"},{id:"c3",owner_auth_id:"expert-a",request_type:"employment",company:"Employment A"}];
    const profiles = [{id:"expert-a",display_name:"A"},{id:"expert-b",display_name:"B"}];
    const personal = normalize(direct,requests,profiles,false,"expert-a");
    assert.deepEqual(JSON.parse(JSON.stringify(personal.map(x=>x.id).sort())),["c1","d1"],"expert sees only owned direct and commercial requests");
    const managerial = normalize(direct,requests,profiles,true,"manager");
    assert.equal(managerial.length,4,"manager sees two direct and two commercial records without employment");
    assert.equal(direct.length,2,"source records remain intact");
    assert.ok(!unifiedScript.includes(".insert(")&&!unifiedScript.includes(".upsert("),"unified view must never duplicate lead records");
    assert.ok(unifiedScript.includes("global.confirm(")&&unifiedScript.includes(".delete().eq('id',r.id)")&&unifiedScript.includes("query=query.eq('owner_auth_id',userId)"),"delete requires confirmation, original row ID, and expert ownership");
    assert.ok(unifiedScript.includes(".update(payload).eq('id',r.id)")&&unifiedScript.includes("if(!isManager)query=query.eq('owner_auth_id',userId)"),"inline update must target the original ID and scope expert edits to ownership");
  }
  const dashboard = readFileSync(join(root, "dashboard.html"), "utf8");
  const csvParserMatch = dashboard.match(/function parseCsvRows\(text\)\{[^\r\n]*\}/);
  if (!csvParserMatch) {
    errors.push("dashboard.html: parseCsvRows() is missing");
  } else {
    try {
      const parseCsvRows = runInNewContext("(" + csvParserMatch[0] + ")");
      const expectedRows = [{ company: "Acme", note: "Call, after lunch" }];
      for (const [label, lineEnding] of [["LF", "\n"], ["CRLF", "\r\n"]]) {
        const sample = ["company,note", "\"Acme\",\"Call, after lunch\"", ""].join(lineEnding);
        const actualRows = JSON.parse(JSON.stringify(parseCsvRows("\uFEFF" + sample)));
        if (JSON.stringify(actualRows) !== JSON.stringify(expectedRows)) {
          errors.push("dashboard.html: parseCsvRows() failed " + label + " CSV with BOM or quoted comma");
        }
      }
    } catch (error) {
      errors.push("dashboard.html: parseCsvRows() could not be tested: " + error.message);
    }
  }
  const saveFunction = dashboard.match(/function saveChecklist\(\)\{([\s\S]*?)\}\s*async function openLeadModal/);
  if (!dashboard.includes("'تناسب با آن باکس':'anbox_fit'")) errors.push("dashboard.html: legacy Excel import header alias was removed");
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
