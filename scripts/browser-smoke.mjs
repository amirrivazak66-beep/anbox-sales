import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const server = createServer((req, res) => {
  const pathname = new URL(req.url || "/", "http://127.0.0.1").pathname;
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!["index.html", "dashboard.html"].includes(relative)) {
    res.writeHead(404); res.end("Not found"); return;
  }
  try {
    const body = readFileSync(join(root, relative));
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404); res.end("Not found");
  }
});

const mockSupabase = `
window.supabase = {
  createClient: () => {
    const manager = { id: "test-manager", username: "test.manager", display_name: "Test Manager", role: "manager", must_change_password: false };
    const salesperson = { id: "test-sales", username: "test.sales", display_name: "Test Sales", role: "sales", must_change_password: false };
    return {
      auth: {
        getSession: async () => ({ data: { session: localStorage.getItem("__mock_auth") ? { user: { id: manager.id } } : null }, error: null }),
        setSession: async () => { localStorage.setItem("__mock_auth", "1"); return { error: null }; },
        getUser: async () => ({ data: { user: { id: manager.id } }, error: null }),
        signOut: async () => { localStorage.removeItem("__mock_auth"); return { error: null }; }
      },
      functions: {
        invoke: async (name, options) => {
          if (name === "username-login") return { data: { access_token: "mock-access", refresh_token: "mock-refresh" }, error: null };
          if (name === "admin-users") return { data: { ok: true }, error: null };
          return { data: null, error: { message: "unmocked function" } };
        }
      },
      from: (table) => {
        const filters = {};
        const builder = {
          select: () => builder,
          eq: (key, value) => { filters[key] = value; return builder; },
          neq: () => builder,
          order: () => builder,
          limit: () => builder,
          insert: () => builder,
          update: () => builder,
          delete: () => builder,
          single: async () => ({ data: manager, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
          then: (resolve, reject) => {
            let data = [];
            if (table === "profiles") {
              data = filters.role === "sales" ? [salesperson] : [manager, salesperson];
            }
            return Promise.resolve({ data, error: null }).then(resolve, reject);
          }
        };
        return builder;
      }
    };
  }
};
`;

let browser;
try {
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ headless: true });

  // Public landing page: brand, slider, responsive navigation.
  const landing = await browser.newPage();
  await landing.goto(base + "/", { waitUntil: "domcontentloaded" });
  assert.match(await landing.title(), /مدیرنگر/);
  assert.equal(await landing.locator(".brand").first().isVisible(), true);
  assert.match(await landing.locator(".brand").first().innerText(), /مدیرنگر/);
  await landing.locator("#nextSlide").click();
  assert.equal(await landing.locator(".slide.active").innerText().then(t => t.includes("قیف فروش")), true);
  await landing.setViewportSize({ width: 390, height: 844 });
  await landing.locator("#menuToggle").click();
  assert.equal(await landing.locator("#navlinks").evaluate(el => el.classList.contains("open")), true);
  console.log("PASS landing brand, slider and mobile navigation");

  // Dashboard: mock Supabase Auth and DB so no production credentials or data are used.
  const app = await browser.newPage();
  await app.route("https://**/*", (route) => route.abort());
  await app.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", (route) => route.fulfill({
    status: 200, contentType: "application/javascript", body: mockSupabase
  }));
  await app.goto(base + "/dashboard.html", { waitUntil: "domcontentloaded" });
  assert.match(await app.title(), /مدیرنگر/);
  assert.equal(await app.locator("#loginPage").isVisible(), true);
  await app.locator(".login-button").click();
  assert.match(await app.locator("#loginError").innerText(), /نام کاربری و رمز عبور را وارد کنید/);
  await app.locator("#username").fill("test.manager");
  await app.locator("#password").fill("test-password-for-mock-only");
  await app.locator(".login-button").click();
  await app.locator("#dashboardPage").waitFor({ state: "visible", timeout: 10000 });
  console.log("PASS login validation and mocked manager session");

  const navCases = [
    ["داشبورد", "dashboard"],
    ["لیدها", "leads"],
    ["تیم", "team"],
    ["Pipeline", "pipeline"],
    ["گزارش‌ها", "reports"],
    ["تنظیمات", "settings"]
  ];
  for (const [label, id] of navCases) {
    await app.locator(".nav-item").filter({ hasText: label }).click();
    await app.locator("#" + id + ".page.active").waitFor({ state: "visible", timeout: 5000 });
    const size = await app.locator("#" + id).evaluate(el => el.getBoundingClientRect().height);
    assert.ok(size > 0, `Page ${id} has no rendered height`);
  }
  console.log("PASS dashboard, leads, team, pipeline, reports and settings navigation");

  // Regression coverage for the settings panel: content must remain rendered, not merely have a visible wrapper.
  await app.locator("#settings-user-tab").waitFor({ state: "visible", timeout: 5000 });
  assert.equal(await app.locator("#settings-user-tab").isVisible(), true);
  assert.equal(await app.locator("#settingsUsername").isVisible(), true);
  assert.equal(await app.locator("#crmBackupInput").count(), 1);
  const settingsHeight = await app.locator("#settings").evaluate(el => el.getBoundingClientRect().height);
  assert.ok(settingsHeight > 300, `Settings content unexpectedly collapsed (height=${settingsHeight})`);

  const adminTab = app.locator("#adminTabBtn");
  assert.equal(await adminTab.isVisible(), true, "Manager should see the admin settings tab");
  await adminTab.click();
  await app.locator("#settings-admin-tab.active").waitFor({ state: "visible", timeout: 5000 });
  assert.equal(await app.locator("#newExpertUsername").isVisible(), true);
  assert.equal(await app.locator("#kpiOwnerSelect").count(), 1);
  await app.locator("#settingsTabs .tab").filter({ hasText: "اطلاعات کاربری" }).click();
  assert.equal(await app.locator("#settings-user-tab").isVisible(), true);
  console.log("PASS settings content visibility, manager controls and tab switching");

  await app.locator(".nav-item").filter({ hasText: "تیم" }).click();
  await app.locator(".tab").filter({ hasText: "چک‌لیست" }).click();
  await app.locator("#ck_0").check();
  await app.locator('button[onclick="saveChecklist()"]').click();
  assert.equal(await app.locator("#ck_0").isChecked(), true);
  await app.reload({ waitUntil: "domcontentloaded" });
  await app.locator("#dashboardPage").waitFor({ state: "visible", timeout: 10000 });
  await app.locator(".nav-item").filter({ hasText: "تیم" }).click();
  await app.locator(".tab").filter({ hasText: "چک‌لیست" }).click();
  assert.equal(await app.locator("#ck_0").isChecked(), true);
  console.log("PASS checklist save and reload persistence using mock/local test storage");

  // JSON backup contract: export and restore only synthetic browser-local data.
  await app.locator(".nav-item").filter({ hasText: "تنظیمات" }).click();
  await app.locator("#settings-user-tab").waitFor({ state: "visible", timeout: 5000 });
  await app.evaluate(() => {
    localStorage.setItem("shared_team", JSON.stringify([{ name: "Backup Team" }]));
    localStorage.setItem("shared_kpi_targets", JSON.stringify([{ key: "backup-kpi", name: "Backup KPI", target: 7 }]));
    localStorage.setItem("leads_test.manager", JSON.stringify([{ company_name: "Synthetic Backup Lead" }]));
    localStorage.setItem("kpi_backup-test", JSON.stringify({ target: 4 }));
  });
  const downloadPromise = app.waitForEvent("download");
  await app.locator('button[onclick="exportCrmBackup()"]').click();
  const backupDownload = await downloadPromise;
  const backupContent = readFileSync(await backupDownload.path(), "utf8");
  const backup = JSON.parse(backupContent);
  assert.equal(backup.format, "anbox-crm-backup");
  assert.equal(backup.version, 1);
  assert.equal(backup.keys.shared_team[0].name, "Backup Team");
  assert.equal(backup.keys.shared_kpi_targets[0].target, 7);
  assert.equal(backup.keys["leads_test.manager"][0].company_name, "Synthetic Backup Lead");
  assert.equal(backup.keys["checklist_test.manager"][0], true);
  assert.equal(backup.keys["kpi_backup-test"].target, 4);

  await app.evaluate(() => {
    localStorage.setItem("shared_team", "[]");
    localStorage.removeItem("shared_kpi_targets");
    localStorage.removeItem("leads_test.manager");
    localStorage.removeItem("checklist_test.manager");
    localStorage.removeItem("kpi_backup-test");
  });
  app.once("dialog", dialog => dialog.accept());
  await app.locator("#crmBackupInput").setInputFiles({
    name: "synthetic-crm-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(backupContent, "utf8")
  });
  await app.locator("#notification.show").filter({ hasText: "بازیابی انجام شد" }).waitFor({ state: "visible", timeout: 5000 });
  const restored = await app.evaluate(() => ({
    team: JSON.parse(localStorage.getItem("shared_team") || "null"),
    targets: JSON.parse(localStorage.getItem("shared_kpi_targets") || "null"),
    leads: JSON.parse(localStorage.getItem("leads_test.manager") || "null"),
    checklist: JSON.parse(localStorage.getItem("checklist_test.manager") || "null"),
    kpi: JSON.parse(localStorage.getItem("kpi_backup-test") || "null")
  }));
  assert.equal(restored.team[0].name, "Backup Team");
  assert.equal(restored.targets[0].target, 7);
  assert.equal(restored.leads[0].company_name, "Synthetic Backup Lead");
  assert.equal(restored.checklist[0], true);
  assert.equal(restored.kpi.target, 4);
  console.log("PASS JSON backup export/import round-trip and version-1 key compatibility");

  await browser.close();
  browser = null;
  console.log("BROWSER SMOKE CHECKS PASSED");
} finally {
  if (browser) await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
