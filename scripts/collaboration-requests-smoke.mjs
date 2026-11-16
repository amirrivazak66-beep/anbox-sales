import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const file = resolve("scripts/collaboration-requests.js");
const source = readFileSync(file, "utf8");
const syntax = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);
const context = { window: {} };
runInNewContext(source, context);
const api = context.window.OnboxCollaborationRequests;
assert.ok(api, "module API must be exposed");
const rows = api.parseRows([
  ["شناسه", "تلفن", "شرکت", "استان", "ارسال ماهانه", "دسته فروش", "تاریخ ثبت", "کارشناس", "نتیجه تماس", "مرحله فروش", "اولویت", "تعداد تماس", "تاریخ آخرین تماس", "پیگیری بعدی", "اقدام بعدی", "توضیحات"],
  ["REQ-001", "09120000000", "شرکت نمونه", "تهران", "100", "پخش", "1405/08/01", "کارشناس نمونه", "", "جدید", "متوسط", "0", "", "", "", ""]
]);
assert.equal(rows.length, 1);
assert.equal(rows[0].request_type, "unclassified", "new imports must wait for explicit commercial/employment classification");
assert.equal(rows[0].external_id, "REQ-001");
assert.ok(source.includes("requestTypeOptions"), "classification options must be present");
assert.ok(source.includes("cr-type"), "request type filter must be present");
assert.ok(source.includes(".insert(payload)"), "Excel imports must insert new records");
assert.ok(!source.includes(".upsert(payload"), "Excel re-import must not silently overwrite manual updates");
assert.ok(source.includes("data-refer-hr"), "employment requests must expose an HR referral action");
assert.ok(source.includes("if(!isManager){message('فقط مدیر"), "only managers may trigger HR referral");
assert.ok(source.includes("request_status:'ارجاع به منابع انسانی'"), "HR referral must persist in the request status");
assert.ok(source.includes("request_status==='ارجاع به منابع انسانی'"), "referred requests must not be referred twice");
assert.ok(source.includes("record_collaboration_followup"), "phase 2 must record interactions through the database RPC");
assert.ok(source.includes("complete_collaboration_followup"), "phase 2 must support completing due follow-ups");
assert.ok(source.includes("data-add-followup"), "each request must expose a follow-up action");
assert.ok(source.includes("data-history"), "each request must expose its interaction history");
assert.ok(source.includes("cr-followup-list"), "phase 2 must show due follow-up tasks");
assert.ok(source.includes("cr-export-daily"), "phase 2 must export a daily activity report");
assert.ok(source.includes("p_due_at:due.toISOString()"), "follow-up due dates must be persisted as timestamps");
console.log("PASS collaboration request type classification, parser defaults and safe insert-only import");
