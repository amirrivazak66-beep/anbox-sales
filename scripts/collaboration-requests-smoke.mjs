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
console.log("PASS collaboration request type classification, parser defaults and safe insert-only import");
