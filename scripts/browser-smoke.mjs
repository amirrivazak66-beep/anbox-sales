import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const server = createServer((req, res) => {
  const pathname = new URL(req.url || "/", "http://127.0.0.1").pathname;
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!["index.html", "dashboard.html", "scripts/unified-leads.js"].includes(relative)) {
    res.writeHead(404); res.end("Not found"); return;
  }
  try {
    const body = readFileSync(join(root, relative));
    res.writeHead(200, { "content-type": relative.endsWith(".js") ? "application/javascript; charset=utf-8" : "text/html; charset=utf-8", "cache-control": "no-store" });
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
    let cloudChecklistRow = null;
    try { cloudChecklistRow = JSON.parse(localStorage.getItem("__mock_cloud_checklist") || "null"); } catch {}
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
          maybeSingle: async () => ({ data: table === "crm_checklists" ? cloudChecklistRow : null, error: null }),
          upsert: (row) => { if (table === "crm_checklists") { cloudChecklistRow = row; localStorage.setItem("__mock_cloud_checklist", JSON.stringify(row)); } return builder; },
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
  
  // Global call count control is intentionally absent; per-request editing remains available.
  await app.addScriptTag({ content: readFileSync(resolve(root, "scripts/collaboration-requests.js"), "utf8") });
  assert.ok(!readFileSync(resolve(root, "scripts/collaboration-requests.js"), "utf8").includes('id="cr-call-count-default"'));
  console.log("PASS global call count control removed");

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
  // Manager-only aggregate insights appear in the new unified leads view.
  await app.locator(".nav-item").filter({ hasText: "لیدها" }).click();
  await app.locator("#ul-status").filter({ hasText: "لید قابل مشاهده" }).waitFor({ state: "visible", timeout: 10000 });
  assert.equal(await app.locator("#ul-owner").isVisible(), true, "manager needs an expert filter");
  assert.equal(await app.locator("#ul-rows tr").count(), 1, "empty state should be visible with mock data");
  await app.locator("#ul-analytics").click();
  await app.locator("#ul-analytics-panel").waitFor({ state: "visible", timeout: 5000 });
  assert.equal(await app.locator("#ul-analytics").getAttribute("aria-expanded"), "true");
  assert.equal(await app.locator("#ul-analytics").innerText(),"◎","analytics trigger must remain an icon rather than overlap page title");
  assert.equal(await app.locator("#ul-analytics-panel").evaluate(el => getComputedStyle(el).position),"static");
  assert.equal(await app.locator("#ul-analysis-body .ul-gauge-svg").count(),5,"all gauges should use semicircular SVG");
  assert.equal(await app.locator("#ul-analysis-body .ul-donut").count(),1,"lead source donut should appear");
  assert.match(await app.locator("#ul-analysis-body").innerText(),/توزیع مراحل فروش/,"funnel section must show empty state if no stages exist");
  assert.equal(await app.locator("#ul-analytics-panel").evaluate(el => el.closest("#leads")?.id),"leads");
  assert.equal(await app.locator("#ul-analysis-body .ul-gauge").count(), 5);
  assert.match(await app.locator("#ul-analysis-body").innerText(), /داده کافی نیست/);
  await app.locator("#ul-close").click();
  assert.equal(await app.locator("#ul-analytics-panel").isVisible(),false);
  console.log("PASS unified leads manager filters and embedded analytics panel");

  mkdirSync("artifacts", {recursive:true});
  // Visual role previews with synthetic records only. Never connect to production.
  const preview = await app.evaluate(() => {
    const entries = {
      leads: [
        {id:"d-a",owner_auth_id:"expert-a",company_name:"فروشگاه نمونه الف",phone:"09120000001",sales_stage:"تماس اولیه",lead_status:"در حال پیگیری",created_at:"2026-11-20"},
        {id:"d-b",owner_auth_id:"expert-b",company_name:"فروشگاه نمونه ب",phone:"09120000002",sales_stage:"مذاکره",lead_status:"در حال پیگیری",created_at:"2026-11-19"}
      ],
      collaboration_requests: [
        {id:"c-a",owner_auth_id:"expert-a",company:"شرکت نمونه تجاری",phone:"09120000003",request_type:"commercial",sales_stage:"نیازسنجی",request_status:"جدید",created_at:"2026-11-20"},
        {id:"c-b",owner_auth_id:"expert-b",company:"شرکت نمونه دوم",phone:"09120000004",request_type:"commercial",sales_stage:"ارسال تعرفه",request_status:"در حال پیگیری",created_at:"2026-11-20"},
        {id:"h-a",owner_auth_id:"expert-a",company:"درخواست استخدام نمونه",request_type:"employment",created_at:"2026-11-20"}
      ],
      profiles: [
        {id:"expert-a",display_name:"کارشناس اول",username:"first"},
        {id:"expert-b",display_name:"کارشناس دوم",username:"second"}
      ]
    };
    const db={from(table){
      const filters=[];
      let pending=null;
      const q={select(){return q},eq(field,value){filters.push([field,value]);return q},order(){return q},limit(){return q},update(payload){pending=payload;return q},
        maybeSingle(){const matched=(entries[table]||[]).find(row=>filters.every(([field,value])=>String(row[field])===String(value)));
          if(matched&&pending)Object.assign(matched,pending);
          return Promise.resolve({data:matched?{id:matched.id}:null,error:null});
        },then(resolve,reject){
        let data=(entries[table]||[]).filter(row=>filters.every(([field,value])=>String(row[field])===String(value)));
        return Promise.resolve({data,error:null}).then(resolve,reject);
      }};
      return q;
    }};
    window.__unifiedPreviewDb=db;
    return true;
  });
  assert.equal(preview,true);
  await app.setViewportSize({width:1672,height:941});
  await app.evaluate(() => {const toast=document.getElementById("notification");if(toast)toast.style.display="none";});
  await app.evaluate(() => {
    window.ManagerNegarUnifiedLeads.mount(document.getElementById("unifiedLeadsMount"),{
      supabase:window.__unifiedPreviewDb,userId:"manager",isManager:true,
      onOpenRequest:id=>{window.__openedUnified={source:"commercial",id}},onOpenDirect:id=>{window.__openedUnified={source:"direct",id}}
    });
  });
  await app.locator("#ul-status").filter({hasText:"۴ لید"}).waitFor({state:"visible",timeout:5000});
  assert.equal(await app.locator("#ul-rows tr").count(),4);
  assert.equal(await app.locator("#ul-owner").isVisible(),true);
  assert.match(await app.locator(".header-title").innerText(),/لیدها/);
  const cardRect=await app.locator(".ul-stat").first().boundingBox();
  const iconRect=await app.locator(".ul-stat-icon").first().boundingBox();
  assert.ok(cardRect && iconRect && iconRect.y>=cardRect.y && iconRect.y+iconRect.height<=cardRect.y+cardRect.height,"KPI icon must remain fully inside card");
  assert.equal(await app.locator("#ul-export").isVisible(),true);
  assert.equal(await app.locator(".ul-table th").count(),10);
  await app.screenshot({path:"artifacts/unified-leads-manager.png",fullPage:true});
  await app.locator("#ul-owner").selectOption("expert-a");
  assert.equal(await app.locator("#ul-rows tr").count(),2,"manager expert filter should show one owner's records");
  assert.equal(await app.locator("#ul-analytics-panel").isVisible(),true,"charts open on load");
  assert.match(await app.locator("#ul-analysis-body").innerText(),/۱ از ۲/);
  await app.locator("#ul-close").click();
  await app.locator("#ul-owner").selectOption("");
  await app.locator("#ul-analytics").click();
  assert.equal(await app.locator("#ul-analysis-body .ul-funnel").count(),1,"funnel appears for synthetic leads with stages");
  await app.screenshot({path:"artifacts/unified-leads-manager-charts.png",fullPage:true});
  await app.locator("#ul-close").click();
  await app.evaluate(() => {document.getElementById("sidebarUsername").textContent="کارشناس اول";document.getElementById("headerUsername").textContent="کارشناس اول";});
  await app.evaluate(() => {
    window.ManagerNegarUnifiedLeads.mount(document.getElementById("unifiedLeadsMount"),{
      supabase:window.__unifiedPreviewDb,userId:"expert-a",isManager:false,
      onOpenRequest:id=>{window.__openedUnified={source:"commercial",id}},onOpenDirect:id=>{window.__openedUnified={source:"direct",id}}
    });
  });
  await app.locator("#ul-status").filter({hasText:"۲ لید"}).waitFor({state:"visible",timeout:5000});
  // Both source types must edit and save *in the same row* without navigation.
  for (const [key,stage,status] of [["commercial:c-a","مذاکره","در حال پیگیری"],["direct:d-a","2","در حال پیگیری"]]) {
    const row=app.locator('#ul-rows tr[data-record-key="'+key+'"]');
    await row.locator("[data-inline-open]").click();
    await row.locator('[data-edit="stage"]').selectOption(stage);
    await row.locator('[data-edit="status"]').selectOption(status);
    await row.locator('[data-edit="nextAction"]').fill("تماس تست");
    await row.locator('[data-edit="followupRaw"]').fill("1405/09/02");
    await row.locator("[data-inline-save]").click();
    await app.locator("#ul-status").filter({hasText:"ذخیره شد"}).waitFor({state:"visible",timeout:5000});
    assert.equal(await row.locator("[data-inline-open]").count(),1,"row returns to inline view after save");
    assert.match(await row.innerText(), /تماس تست/);
    assert.equal(await app.evaluate(()=>window.__openedUnified??null),null,"inline save must never navigate to original page");
  }
  const beforeCancel=await app.locator('#ul-rows tr[data-record-key="commercial:c-a"]').innerText();
  await app.locator('#ul-rows tr[data-record-key="commercial:c-a"] [data-inline-open]').click();
  await app.locator('#ul-rows tr[data-record-key="commercial:c-a"] [data-edit="nextAction"]').fill("نباید ذخیره شود");
  await app.locator('#ul-rows tr[data-record-key="commercial:c-a"] [data-inline-cancel]').click();
  assert.equal((await app.locator('#ul-rows tr[data-record-key="commercial:c-a"]').innerText()).includes("نباید ذخیره شود"),false,"cancel discards unsaved changes");

  assert.equal(await app.locator("#ul-rows tr").count(),2);
  assert.equal(await app.locator("#ul-owner").isVisible(),false,"expert must not have cross-owner filter");
  assert.equal(await app.locator("#ul-rows").innerText().then(t=>t.includes("فروشگاه نمونه ب")),false,"another expert's lead must be excluded");
  await app.screenshot({path:"artifacts/unified-leads-expert.png",fullPage:true});
  await app.locator("#ul-analytics").click();
  await app.screenshot({path:"artifacts/unified-leads-expert-charts.png",fullPage:true});
  await app.locator("#ul-close").click();
  await app.evaluate(() => {document.getElementById("sidebarUsername").textContent="Test Manager";document.getElementById("headerUsername").textContent="Test Manager";});
  console.log("PASS role-separated synthetic leads and visual screenshot previews");

  await app.locator(".nav-item").filter({ hasText: "تنظیمات" }).click();


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
  await app.waitForFunction(() => JSON.parse(localStorage.getItem("__mock_cloud_checklist") || "null")?.items?.[0] === true);
  console.log("PASS checklist cloud upsert using mocked Supabase");
  await app.reload({ waitUntil: "domcontentloaded" });
  await app.locator("#dashboardPage").waitFor({ state: "visible", timeout: 10000 });
  await app.locator(".nav-item").filter({ hasText: "تیم" }).click();
  await app.locator(".tab").filter({ hasText: "چک‌لیست" }).click();
  assert.equal(await app.locator("#ck_0").isChecked(), true);

  // Simulate an older local checklist that differs from cloud; it must survive until explicit save.
  await app.evaluate(() => localStorage.setItem("checklist_test.manager", JSON.stringify(new Array(10).fill(false))));
  await app.reload({ waitUntil: "domcontentloaded" });
  await app.locator("#dashboardPage").waitFor({ state: "visible", timeout: 10000 });
  await app.locator(".nav-item").filter({ hasText: "تیم" }).click();
  await app.locator(".tab").filter({ hasText: "چک‌لیست" }).click();
  assert.equal(await app.locator("#ck_0").isChecked(), true, "Cloud state should be displayed when it differs from local state");
  assert.equal(await app.evaluate(() => JSON.parse(localStorage.getItem("checklist_test.manager"))[0]), false, "Local conflict must not be overwritten during load");
  await app.locator("#ck_1").check();
  assert.equal(await app.evaluate(() => JSON.parse(localStorage.getItem("checklist_test.manager"))[0]), false, "Local conflict must remain until explicit save");
  await app.locator('button[onclick="saveChecklist()"]').click();
  await app.waitForFunction(() => JSON.parse(localStorage.getItem("__mock_cloud_checklist") || "null")?.items?.[1] === true);
  assert.equal(await app.evaluate(() => JSON.parse(localStorage.getItem("checklist_test.manager"))[0]), true, "Explicit save should reconcile local and cloud state");
  console.log("PASS checklist save, reload and local/cloud conflict preservation using mock data");

  // JSON backup contract: export and restore only synthetic browser-local data.
  await app.locator(".nav-item").filter({ hasText: "تنظیمات" }).click();
  await app.locator("#settings-user-tab").waitFor({ state: "attached", timeout: 5000 });
  await app.locator("#settingsTabs .tab").filter({ hasText: "اطلاعات کاربری" }).click();
  await app.locator("#settings-user-tab.active").waitFor({ state: "visible", timeout: 5000 });
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
