/* ManagerNegar: unified, read-only leads view. No record copying or writes. */
(function(global){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat('fa-IR').format(n);
const pct=(n,total)=>total?Math.round(n*100/total):null;
const norm=v=>String(v??'').trim().toLocaleLowerCase('fa');
const toDate=v=>{if(!v)return '';const s=String(v);return /^\d{4}-\d\d-\d\d/.test(s)?s.slice(0,10):'';};
function normalizeRows(direct,requests,profiles,isManager,userId){
 const names=new Map(profiles.map(p=>[String(p.id),p.display_name||p.username||'—']));
 const allowed=r=>isManager||String(r.owner_auth_id)===String(userId);
 return [
  ...direct.filter(allowed).map(r=>({id:String(r.id),source:'direct',company:r.company_name||'—',phone:r.phone||'',ownerId:String(r.owner_auth_id||''),owner:names.get(String(r.owner_auth_id))||r.sales_expert||'—',stage:r.sales_stage||'',status:r.lead_status||'—',followup:toDate(r.followup_date),created:toDate(r.created_at),complete:!!(r.company_name&&r.phone&&r.owner_auth_id),planned:!!r.followup_date})),
  ...requests.filter(r=>r.request_type==='commercial'&&allowed(r)).map(r=>({id:String(r.id),source:'commercial',company:r.company||r.external_id||'—',phone:r.phone||'',ownerId:String(r.owner_auth_id||''),owner:names.get(String(r.owner_auth_id))||r.expert_name||'—',stage:r.sales_stage||'',status:r.request_status||'—',followup:toDate(r.next_followup_at)||toDate(r.next_followup_text),created:toDate(r.created_at),complete:!!(r.company&&r.phone&&r.owner_auth_id),planned:!!(r.next_followup_at||r.next_followup_text&&r.next_followup_text!=='ندارد')}))
 ];
}
function mount(host,{supabase,userId,isManager=false,onOpenRequest=()=>{},onOpenDirect=()=>{}}={}){
 if(!host||!supabase||!userId)throw Error('دسترسی به داشبورد لازم است');
 host.dir='rtl';
 host.innerHTML='<style>'+
 '.ul-wrap{color:var(--txt,#e7eefb);direction:rtl}.ul-header,.ul-actions,.ul-tabs,.ul-filters{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:space-between}.ul-header{margin:3px 0 18px}.ul-heading{font-size:24px;font-weight:800}.ul-sub{font-size:12px;color:var(--txt2,#94a3b8);margin-top:5px}.ul-action,.ul-tab{font:inherit;color:inherit;cursor:pointer;border:1px solid var(--bd,#2c4261);background:#10233c;border-radius:11px;padding:10px 14px}.ul-action.primary,.ul-tab.active{background:#0868d7;color:#fff}.ul-action:focus-visible,.ul-tab:focus-visible{outline:2px solid #66c9ff}.ul-tabs{justify-content:flex-start;margin:15px 0}.ul-filters{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;align-items:center;background:#0c1d32;border:1px solid var(--bd);padding:14px;border-radius:15px;margin-bottom:15px}.ul-filters input,.ul-filters select{background:#101f37;border:1px solid #34506c;color:#fff;border-radius:9px;padding:9px;font:inherit;min-width:0;width:100%;box-sizing:border-box;max-width:100%}.ul-stats,.ul-gauges,.ul-charts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:15px 0}.ul-stat,.ul-card{background:linear-gradient(145deg,#10223b,#09182b);border:1px solid #29405e;border-radius:15px;padding:16px;min-width:0}.ul-stat small,.ul-card small{color:#a9bdd6}.ul-stat strong{display:block;font-size:27px;margin-top:10px}.ul-table-scroll{overflow-x:auto;border:1px solid #29405e;border-radius:15px}.ul-table{width:100%;border-collapse:collapse;font-size:12px;min-width:840px}.ul-table th,.ul-table td{padding:12px 9px;border-bottom:1px solid #263951;text-align:right}.ul-table th{color:#b7cbe4;background:#112743}.ul-source{display:inline-block;background:#153a72;color:#d9eaff;border-radius:99px;padding:5px 8px;white-space:nowrap}.ul-source.commercial{background:#503580}.ul-muted{color:#aabed7;font-size:12px}.ul-empty{padding:24px;text-align:center;color:#adc3df}.ul-gauges{grid-template-columns:repeat(4,minmax(0,1fr))}.ul-gauge{text-align:center}.ul-ring{width:118px;height:118px;border-radius:50%;margin:12px auto;display:grid;place-items:center;position:relative}.ul-ring:before{content:"";background:#0b1b30;border-radius:50%;position:absolute;inset:12px}.ul-ring b{position:relative;font-size:24px}.ul-charts{grid-template-columns:repeat(2,minmax(0,1fr))}.ul-bar{margin:12px 0}.ul-bar-label{display:flex;justify-content:space-between;font-size:12px;gap:8px}.ul-track{background:#1b324b;height:11px;border-radius:10px;overflow:hidden;margin-top:6px}.ul-fill{height:100%;background:linear-gradient(90deg,#0a72dd,#31c8f0);border-radius:10px}.ul-note{font-size:12px;color:#a9bbd0;margin-top:12px;line-height:1.9}.ul-hidden{display:none!important}#leads.unified-active #legacyLeadsUi{display:none}'+
 '@media(max-width:850px){.ul-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.ul-stats,.ul-gauges{grid-template-columns:repeat(2,minmax(0,1fr))}.ul-charts{grid-template-columns:1fr}}@media(max-width:450px){.ul-filters{grid-template-columns:1fr}.ul-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ul-heading{font-size:19px}}'+
 "\n.ul-wrap{--ul-blue:#126bef;--ul-border:#213d61;font-family:inherit}.ul-header{margin:12px 0 20px;align-items:flex-start}.ul-heading{font-size:27px;letter-spacing:-.3px}.ul-heading:before{content:\"◎\";color:#73baff;margin-left:12px}.ul-sub{font-size:13px;line-height:1.9}.ul-actions{justify-content:flex-start}.ul-action{transition:background .15s,border-color .15s;white-space:nowrap}.ul-action:hover,.ul-tab:hover{border-color:#5b9bec;background:#183b64}.ul-action.primary{background:linear-gradient(120deg,#513cec,#2675f4);border-color:#5c76f5;font-weight:700}.ul-action[aria-expanded=\"true\"]{background:#085bc4;border-color:#66b5ff;box-shadow:0 0 0 2px #2068d540}.ul-stats{margin:18px 0;gap:14px}.ul-stat{min-height:112px;padding:18px 20px;position:relative;border-radius:17px;background:linear-gradient(145deg,#112742,#0b1b30)}.ul-stat small{font-size:12px}.ul-stat strong{font-size:30px}.ul-stat:after{content:\"\";position:absolute;left:18px;top:20px;width:35px;height:35px;border-radius:50%;background:#126bef27;border:1px solid #217be738}.ul-stat:nth-child(2):after{background:#9259dd28;border-color:#9c69d754}.ul-stat:nth-child(3):after{background:#10bdb12b;border-color:#1dbbaa55}.ul-tabs{gap:10px;margin:22px 0 16px}.ul-tab{min-width:145px;border-radius:14px}.ul-tab.active{background:linear-gradient(135deg,#147ff7,#0952bd);border-color:#3c9dff;box-shadow:0 5px 15px #0958c43d}.ul-filters{background:linear-gradient(155deg,#0e223b,#0a1b30);padding:15px;border-radius:16px}.ul-table-scroll{background:#081a2f;box-shadow:0 15px 38px #0003}.ul-table th{background:#112943;font-size:12px}.ul-table tbody tr:nth-child(even){background:#0f2440}.ul-table tbody tr:hover{background:#163555}.ul-source{font-weight:600}.ul-source.commercial{color:#eddaff}.ul-panel{margin:20px 0 18px;padding:19px;border-radius:20px;border:1px solid #2a8cfa;background:linear-gradient(145deg,#071b32,#081426);box-shadow:0 0 0 2px #1368d31f,0 16px 36px #0004}.ul-panel[hidden]{display:none!important}.ul-panel-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;border-bottom:1px solid #234769;padding-bottom:14px}.ul-panel-title{font-size:21px;font-weight:800;margin:0}.ul-panel-title:before{content:\"◉\";color:#37b3ff;margin-left:10px}.ul-panel-tag{display:inline-block;color:#bfe5ff;border:1px solid #377cbe;background:#173a60;padding:6px 10px;border-radius:10px;font-size:11px;margin-top:10px}.ul-gauges{grid-template-columns:repeat(4,minmax(0,1fr));margin-top:18px}.ul-gauge{background:linear-gradient(145deg,#102b49,#09192c)}.ul-gauge small{font-size:13px;color:#e1ebff;font-weight:650}.ul-ring{width:126px;height:126px}.ul-ring:before{background:#0a1a2f}.ul-charts{gap:14px}.ul-charts .ul-card h3{margin:0 0 16px;font-size:15px;color:#eff7ff}.ul-bar{margin:14px 0}.ul-fill{background:linear-gradient(90deg,#1b5eec,#31d6fa)}.ul-insight{background:#122a4c;border:1px solid #36599a;border-radius:14px;padding:16px;margin-top:15px}.ul-insight strong{display:block;margin-bottom:6px;color:#f3f7ff}.ul-insight p{margin:0;line-height:1.9;color:#bdcce6;font-size:12px}.ul-empty-metric{font-size:13px;color:#d1dbeb}.ul-role-pill{font-size:12px;color:#b7dcff;border:1px solid #255c95;border-radius:12px;padding:8px 12px;background:#102c4a}\n@media(max-width:1100px){.ul-actions{gap:7px}.ul-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ul-panel{padding:14px}}\n@media(max-width:560px){.ul-gauges{grid-template-columns:repeat(2,minmax(0,1fr))}.ul-action{padding:9px 10px}.ul-panel-title{font-size:17px}.ul-stat{min-height:90px;padding:13px}.ul-tab{min-width:0;flex:1}.ul-tabs{gap:5px}.ul-gauge{padding:12px}.ul-ring{width:100px;height:100px}}\n"+
 "\n/* Reference-aligned manager/expert leads dashboard */\n.ul-wrap{max-width:none;color:#e8f0ff}.ul-header{margin:8px 0 18px;padding:0 2px;align-items:center}.ul-heading{font-size:28px;line-height:1.5}.ul-heading:before{content:\"◉\";font-size:29px;color:#b2d2ff}.ul-sub{font-size:12px;color:#a4bcd6}.ul-actions{gap:10px}.ul-action{border-radius:12px;background:#0b2139;border-color:#244a74;font-size:12px;min-height:40px}.ul-action.primary{background:linear-gradient(125deg,#5c43ef,#285bed)}.ul-stat{background:linear-gradient(155deg,#102842,#0b2037);border:1px solid #1c3d63;border-radius:16px;min-height:92px;display:flex;flex-direction:column;justify-content:center;position:relative;padding:16px 20px}.ul-stat small{font-size:12px;color:#b6cbe4;padding-left:34px}.ul-stat strong{font-size:29px;margin-top:7px}.ul-stat:after{width:37px;height:37px;top:17px;left:17px;background:#033f58;border:0}.ul-stat:nth-child(2):after{background:#4f2e80}.ul-stat:nth-child(3):after{background:#075e8b}.ul-stat:nth-child(4):after{background:#0c6047}.ul-stats{margin:18px 0 21px;gap:12px}.ul-tabs{justify-content:flex-start;gap:12px;margin:10px 0 20px}.ul-tab{border-radius:13px;min-width:177px;background:#0b1d32;color:#c2d4ec;border:1px solid #1d436b;font-size:13px;font-weight:650;min-height:50px}.ul-tab.active{background:linear-gradient(115deg,#116be7,#0a55b5);box-shadow:0 7px 17px #0455bf26}.ul-filters{border-radius:17px;border:1px solid #183f64;grid-template-columns:1.4fr repeat(4,minmax(0,1fr));padding:15px;background:#0b2138;gap:11px}.ul-filters input,.ul-filters select{background:#102945;border:1px solid #2d4c72;color:#eaf4ff;padding:11px 12px;height:42px;border-radius:10px}.ul-owner-filter[hidden]{display:none!important}.ul-filters:has(.ul-owner-filter[hidden]){grid-template-columns:1.5fr repeat(3,minmax(0,1fr))}.ul-filters input::placeholder{color:#9cb5d3}.ul-table-scroll{border:1px solid #183a60;border-radius:15px;background:#07182a}.ul-table{font-size:12px}.ul-table th{padding:14px 12px;background:#102944;color:#dfedff;font-weight:700}.ul-table td{padding:13px 10px}.ul-table tbody tr:nth-child(even){background:#102239}.ul-table tbody tr:hover{background:#163b5d}.ul-source{background:#064f81;border:1px solid #2174ad;padding:6px 9px;color:#e0f4ff}.ul-source.commercial{background:#47307b;border-color:#7650af;color:#f6eaff}.ul-status-badge{display:inline-block;border-radius:99px;padding:6px 10px;background:#102f4f;color:#c5e7ff;font-weight:600}.ul-status-badge.good{background:#0e503c;color:#77efbc}.ul-status-badge.pending{background:#634615;color:#ffe09b}.ul-row-action{background:#112e4e;border-color:#2b6196;padding:8px 11px;min-height:32px}.ul-panel{border-radius:21px;border:1px solid #1774dd;background:linear-gradient(145deg,#071a30,#0a2038);box-shadow:0 0 0 2px #0f60bf21,0 15px 30px #0004;padding:19px;margin:20px 0}.ul-panel-head{border-bottom:1px solid #264563;padding:0 0 14px}.ul-panel-title{font-size:23px}.ul-panel-tag{border:1px solid #42759f;background:#153454;color:#d7eaff}.ul-gauges{grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:18px 0}.ul-gauge{min-width:0;padding:14px 8px;text-align:center;border-radius:14px;background:linear-gradient(150deg,#102a47,#0a213b);border:1px solid #244668}.ul-gauge small{color:#f0f5ff;font-size:12px;display:block;font-weight:700;min-height:34px}.ul-gauge-visual{height:125px;display:flex;flex-direction:column;align-items:center;justify-content:center}.ul-gauge-svg{width:min(100%,180px);height:97px;display:block;margin:auto}.ul-gauge-value{font-size:23px;font-weight:800;fill:#fff}.ul-gauge .ul-muted{font-size:11px;line-height:1.8;color:#b5cee8}.ul-charts{grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.ul-charts .ul-card{border-radius:16px;padding:16px;background:linear-gradient(150deg,#102843,#0b1b30);border:1px solid #23466f;min-height:232px}.ul-charts .ul-card h3{font-size:15px;color:#eef6ff;margin:0 0 16px}.ul-donut-wrap{display:flex;align-items:center;gap:17px;justify-content:center;min-height:150px}.ul-donut{width:150px;height:150px;border-radius:50%;display:grid;place-items:center;flex:none}.ul-donut-hole{width:94px;height:94px;border-radius:50%;background:#0c2037;display:flex;flex-direction:column;align-items:center;justify-content:center}.ul-donut-hole b{font-size:25px}.ul-donut-hole small{color:#91b9db}.ul-legend{display:grid;gap:10px;min-width:100px}.ul-legend-row{font-size:11px;display:flex;align-items:center;gap:7px}.ul-legend-dot{width:10px;height:10px;border-radius:3px;flex:none}.ul-funnel{display:grid;gap:4px;justify-items:center;padding:2px 0}.ul-funnel-step{box-sizing:border-box;clip-path:polygon(0 0,100% 0,90% 100%,10% 100%);padding:10px 18px;text-align:center;color:#fff;font-weight:650;font-size:12px;min-height:40px;display:grid;place-items:center;line-height:1.4}.ul-funnel-step small{display:block;font-size:10px}.ul-bar-label{font-size:11px}.ul-bar{margin:13px 0}.ul-track{background:#193953;height:13px;border-radius:9px}.ul-fill{background:linear-gradient(90deg,#1259c8,#2db3ff)}.ul-insight{border-radius:15px;background:linear-gradient(110deg,#112e56,#142744);border:1px solid #36568b;padding:16px;margin-top:13px}.ul-insight strong{font-size:16px}.ul-insight p{font-size:12px}.ul-note{color:#8caccd;font-size:11px}\n.ul-stat-icon{position:absolute;top:20px;left:24px;font-size:21px;color:#5cd4fc;z-index:1}.ul-status-badge{white-space:nowrap}.ul-donut .ul-donut-hole{box-shadow:0 0 0 1px #2a4b65 inset}@media(max-width:1200px){.ul-gauges{grid-template-columns:repeat(3,minmax(0,1fr))}.ul-charts{grid-template-columns:repeat(2,minmax(0,1fr))}.ul-header{align-items:flex-start}.ul-actions{justify-content:flex-start}}\n@media(max-width:850px){.ul-filters,.ul-filters:has(.ul-owner-filter[hidden]){grid-template-columns:repeat(2,minmax(0,1fr))}.ul-gauges{grid-template-columns:repeat(2,minmax(0,1fr))}.ul-charts{grid-template-columns:1fr}.ul-tabs{flex-wrap:wrap}}\n@media(max-width:500px){.ul-filters,.ul-filters:has(.ul-owner-filter[hidden]){grid-template-columns:1fr}.ul-tabs{gap:6px}.ul-tab{min-width:0;flex:1 1 90px;font-size:11px}.ul-stat{padding:11px;min-height:90px}.ul-stat strong{font-size:24px}.ul-gauges{gap:7px}.ul-gauge{padding:10px 5px}.ul-gauge-svg{height:80px}.ul-donut-wrap{flex-wrap:wrap}.ul-header{gap:16px}}\n"+
 '</style><div class="ul-wrap ul-reference">
 <div class="ul-topbar">
  <div class="ul-heading-block">
   <div class="ul-title-row"><button type="button" class="ul-analytics-trigger" id="ul-analytics" aria-label="نمایش نمودارها و گیج‌ها" title="نمایش نمودارها و گیج‌ها" aria-controls="ul-analytics-panel" aria-expanded="false">◎</button><h2 class="ul-heading">مدیریت لیدها</h2></div>
   <p class="ul-sub">'+(isManager?'تمامی لیدهای فروش، شامل لیدهای ثبت‌شده مستقیم و درخواست‌های همکاری تجاری':'لیدهای شخصی من، شامل لیدهای مستقیم و درخواست‌های تجاری اختصاص‌یافته')+'</p>
  </div>
  <div class="ul-actions">
   <button type="button" class="ul-action primary" id="ul-new"><span>＋</span> ثبت لید جدید</button>
   <button type="button" class="ul-action ul-requests-link" id="ul-requests">↗ درخواست‌های همکاری</button>
  </div>
 </div>
 <div id="ul-status" role="status" class="ul-status-line">در حال دریافت لیدها…</div>
 <div class="ul-stats" id="ul-stats"></div>
 <div class="ul-tabs" role="group" aria-label="نوع لید">
  <button type="button" class="ul-tab active" data-tab="all"><span class="ul-tab-icon">▱</span> همه لیدها <span class="ul-tab-count" data-count="all">۰</span></button>
  <button type="button" class="ul-tab" data-tab="commercial"><span class="ul-tab-icon">▣</span> لیدهای تجاری <span class="ul-tab-count" data-count="commercial">۰</span></button>
  <button type="button" class="ul-tab" data-tab="direct"><span class="ul-tab-icon">♙</span> لیدهای مستقیم <span class="ul-tab-count" data-count="direct">۰</span></button>
 </div>
 <div class="ul-data-panel">
  <div class="ul-filters">
   <label class="ul-search-field"><span>⌕</span><input type="search" id="ul-search" placeholder="جستجوی سریع ..." aria-label="جستجوی لید"></label>
   <label class="ul-filter-field"><span>منبع لید</span><select id="ul-source" aria-label="فیلتر منبع لید"><option value="">همه منابع</option><option value="commercial">درخواست همکاری</option><option value="direct">لید مستقیم</option></select></label>
   <label class="ul-filter-field ul-owner-filter" '+(isManager?'':'hidden')+'><span>کارشناس</span><select id="ul-owner" aria-label="فیلتر کارشناس"><option value="">همه کارشناسان</option></select></label>
   <label class="ul-filter-field"><span>وضعیت پیگیری</span><select id="ul-status-filter" aria-label="فیلتر وضعیت"><option value="">همه وضعیت‌ها</option></select></label>
   <label class="ul-filter-field"><span>مرحله فروش</span><select id="ul-stage" aria-label="فیلتر مرحله فروش"><option value="">همه مراحل</option></select></label>
   <label class="ul-filter-field ul-time"><span>بازه زمانی</span><select id="ul-date" aria-label="بازه زمانی"><option value="all">همه زمان‌ها</option><option value="30">۳۰ روز گذشته</option><option value="90">۹۰ روز گذشته</option></select></label>
   <div class="ul-view-tools">
    <button type="button" class="ul-view-btn" id="ul-export" title="خروجی CSV لیدهای قابل مشاهده" aria-label="خروجی لیدها">⇩ خروجی</button>
    <div class="ul-view-group"><button type="button" class="ul-view-btn active" id="ul-list-view" aria-pressed="true" title="نمای جدول">☷</button><button type="button" class="ul-view-btn" id="ul-grid-view" aria-pressed="false" title="نمای کارت">▦</button></div>
   </div>
  </div>
  <section id="ul-analytics-panel" class="ul-panel" aria-label="نمودارها و گیج‌های لیدها" hidden>
   <div class="ul-panel-head"><div><h3 class="ul-panel-title">◎ '+(isManager?'تحلیل مدیریتی لیدها و گیج‌های عملکرد':'تحلیل لیدهای من و گیج‌های عملکرد')+'</h3><p class="ul-sub">'+(isManager?'تحلیل همه کارشناسان، با امکان فیلتر و تفکیک دقیق':'تحلیل و بررسی عملکرد شخصی بر اساس لیدهای خودم')+'</p></div><div class="ul-panel-head-tools"><span class="ul-panel-tag">'+(isManager?'♛ مدیر / ادمین — قابلیت تفکیک کارشناسان':'♙ فقط لیدهای من')+'</span><button type="button" id="ul-close" class="ul-close-btn" aria-label="بستن تحلیل">✕</button></div></div>
   <div class="ul-analytics-tabs" role="group" aria-label="بخش‌های تحلیل"><button type="button" class="active" data-analysis-tab="gauges">◉ گیج‌ها</button><button type="button" data-analysis-tab="charts">▥ نمودارها</button><button type="button" data-analysis-tab="summary">▤ خلاصه</button></div>
   <div id="ul-analysis-body"></div>
  </section>
  <div class="ul-table-scroll"><table class="ul-table"><thead><tr><th class="ul-check-col"><input type="checkbox" id="ul-check-all" aria-label="انتخاب همه ردیف‌های این صفحه"></th><th>شرکت / سازمان</th><th>منبع</th><th>کارشناس</th><th>مرحله فروش</th><th>وضعیت پیگیری</th><th>آخرین / برنامه پیگیری</th><th>ارزش تخمینی</th><th>عملیات</th></tr></thead><tbody id="ul-rows"></tbody></table><div id="ul-grid-rows" class="ul-grid-rows" hidden></div></div>
  <div class="ul-pagination"><span id="ul-page-info">نمایش ۰ لید</span><div class="ul-page-controls"><button type="button" id="ul-prev" class="ul-page-button" aria-label="صفحه قبل">‹</button><span id="ul-page-num">۱</span><button type="button" id="ul-next" class="ul-page-button" aria-label="صفحه بعد">›</button></div><label>نمایش در صفحه: <select id="ul-page-size" aria-label="تعداد لید در هر صفحه"><option value="10">۱۰</option><option value="20">۲۰</option><option value="50">۵۰</option></select></label></div>
 </div><p class="ul-note">درخواست‌های تجاری بدون کپی داده نمایش داده می‌شوند؛ مشاهده و ویرایش آن‌ها از رکورد اصلی انجام می‌شود.</p>
 </div>;
 const $=id=>host.querySelector('#'+id);
 let rows=[],profiles=[],tab='all',view=[];
 const status=t=>{$('ul-status').textContent=t};
 const active=()=>{let v=rows.filter(r=>tab==='all'||r.source===tab);const q=norm($('ul-search').value),owner=$('ul-owner').value,stage=$('ul-stage').value,st=$('ul-status-filter').value,days=$('ul-date').value;
  const cutoff=days==='all'?'':new Date(Date.now()-Number(days)*86400000).toISOString().slice(0,10);
  return v.filter(r=>(!q||norm(r.company).includes(q)||norm(r.phone).includes(q))&&(!owner||r.ownerId===owner)&&(!stage||String(r.stage)===stage)&&(!st||r.status===st)&&(!cutoff||(r.created&&r.created>=cutoff)));
 };
 const box=(label,n,icon)=>'<div class="ul-stat"><small>'+esc(label)+'</small><strong>'+fmt(n)+'</strong><span class="ul-stat-icon" aria-hidden="true">'+icon+'</span></div>';
 function render(){
  view=active();
  const commercial=view.filter(r=>r.source==='commercial').length,direct=view.length-commercial;
  $('ul-stats').innerHTML=box(isManager?'کل لیدها':'کل لیدهای من',view.length,'♙')+box('لید از درخواست همکاری',commercial,'♧')+box('لیدهای مستقیم',direct,'⌁')+box('دارای برنامه پیگیری',view.filter(r=>r.planned).length,'◷');
  $('ul-rows').innerHTML=view.length?view.map(r=>{
    const st=norm(r.status),kind=/(قرارداد|تکمیل|موفق|انجام)/.test(st)?'good':/(پیگیری|انتظار|مذاکره)/.test(st)?'pending':'';
    return '<tr><td><b>'+esc(r.company)+'</b><div class="ul-muted">'+esc(r.phone)+'</div></td><td><span class="ul-source '+esc(r.source)+'">'+(r.source==='commercial'?'◈ درخواست همکاری':'↗ لید مستقیم')+'</span></td><td>'+esc(r.owner)+'</td><td><span class="ul-status-badge">'+esc(r.stage||'—')+'</span></td><td><span class="ul-status-badge '+kind+'">'+esc(r.status)+'</span></td><td>'+esc(r.followup||'—')+'</td><td><button type="button" class="ul-action ul-row-action" data-source="'+esc(r.source)+'" data-id="'+esc(r.id)+'">'+(r.source==='commercial'?'مشاهده درخواست':'ویرایش لید')+'</button></td></tr>';
  }).join(''):'<tr><td colspan="7" class="ul-empty">لیدی با این فیلترها پیدا نشد.</td></tr>';
  $('ul-rows').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{if(b.dataset.source==='commercial')onOpenRequest(b.dataset.id);else onOpenDirect(b.dataset.id)});
  if(!$('ul-analytics-panel').hidden)drawAnalytics();
 }
 function gauge(label,num,den,color,detail=''){
  const v=pct(num,den),progress=(v??0)*2.514;
  return '<div class="ul-card ul-gauge"><small>'+esc(label)+'</small><div class="ul-gauge-visual"><svg class="ul-gauge-svg" viewBox="0 0 200 123" role="img" aria-label="'+esc(label)+': '+(v===null?'داده کافی نیست':fmt(v)+' درصد')+'"><path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#2d4869" stroke-width="20" stroke-linecap="round"/><path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="'+color+'" stroke-width="20" stroke-linecap="round" stroke-dasharray="'+progress.toFixed(1)+' 251.4"/><text x="100" y="99" text-anchor="middle" class="ul-gauge-value">'+(v===null?'—':fmt(v)+'٪')+'</text></svg></div><div class="ul-muted">'+(v===null?'داده کافی نیست':fmt(num)+' از '+fmt(den))+(detail?'<div>'+esc(detail)+'</div>':'')+'</div></div>';
 }
 function chart(title,items){
  const max=Math.max(1,...items.map(x=>x[1]));
  return '<section class="ul-card"><h3>'+esc(title)+'</h3>'+(items.length?items.map(([label,num])=>'<div class="ul-bar"><div class="ul-bar-label"><span>'+esc(label)+'</span><b>'+fmt(num)+'</b></div><div class="ul-track"><div class="ul-fill" style="width:'+Math.round(num/max*100)+'%"></div></div></div>').join(''):'<p class="ul-muted">داده‌ای برای نمایش وجود ندارد.</p>')+'</section>';
 }
 function tally(key){const m=new Map();view.forEach(r=>{const n=r[key]||'نامشخص';m.set(n,(m.get(n)||0)+1)});return [...m].sort((a,b)=>b[1]-a[1]).slice(0,10);}
 function donut(commercial,direct){
  const total=commercial+direct,share=pct(commercial,total)||0;
  return '<section class="ul-card"><h3>◉ تفکیک منبع لید</h3><div class="ul-donut-wrap"><div class="ul-donut" role="img" aria-label="سهم درخواست همکاری '+fmt(share)+' درصد" style="background:conic-gradient(#8d58f2 0 '+share+'%,#159ef2 '+share+'% 100%)"><div class="ul-donut-hole"><b>'+fmt(total)+'</b><small>لید</small></div></div><div class="ul-legend"><div class="ul-legend-row"><i class="ul-legend-dot" style="background:#8d58f2"></i>درخواست همکاری <b>'+fmt(commercial)+'</b></div><div class="ul-legend-row"><i class="ul-legend-dot" style="background:#159ef2"></i>لید مستقیم <b>'+fmt(direct)+'</b></div></div></div></section>';
 }
 function funnel(items){
  const palette=['#087ded','#0aa876','#cb8a19','#8548bb','#314cb6','#0a7195'],max=Math.max(1,...items.map(x=>x[1]));
  return '<section class="ul-card"><h3>▽ توزیع مراحل فروش</h3>'+(items.length?'<div class="ul-funnel">'+items.slice(0,6).map(([name,num],i)=>'<div class="ul-funnel-step" style="width:'+Math.max(49,100-i*9)+'%;background:'+palette[i%palette.length]+'"><span>'+esc(name)+' <small>'+fmt(num)+' لید</small></span></div>').join('')+'</div>':'<p class="ul-muted">مرحله فروشی ثبت نشده است.</p>')+'<p class="ul-note">این نمودار توزیع مراحل است؛ نرخ تبدیل بین مراحل محسوب نمی‌شود.</p></section>';
 }
 function drawAnalytics(){
  const area=$('ul-analysis-body');if(!area)return;
  const total=view.length,withPlan=view.filter(r=>r.planned).length,complete=view.filter(r=>r.complete).length,commercial=view.filter(r=>r.source==='commercial').length;
  const direct=total-commercial,knownStage=view.filter(r=>r.stage).length;
  const stages=tally('stage');
  const middle=isManager?chart('▥ عملکرد کارشناسان (تعداد لید)',tally('owner')):chart('▥ وضعیت لیدهای من',tally('status'));
  area.innerHTML='<div class="ul-gauges">'+
   gauge('نرخ برنامه‌ریزی پیگیری',withPlan,total,'#22d3ee')+
   gauge('تکمیل اطلاعات پایه',complete,total,'#ffbc2e')+
   gauge('سهم لیدهای تجاری',commercial,total,'#a879f6')+
   gauge('دارای مرحله فروش',knownStage,total,'#29df95')+
   gauge('سهم لید مستقیم',direct,total,'#43a4ff')+'</div>'+
   '<div class="ul-charts">'+donut(commercial,direct)+middle+funnel(stages)+
   chart('▤ وضعیت پیگیری',[['دارای برنامه',withPlan],['فاقد برنامه',total-withPlan]])+
   chart('▤ وضعیت لیدها',tally('status'))+
   chart('▤ مراحل فروش',stages)+'</div>'+
   '<div class="ul-insight"><strong>⚡ جمع‌بندی سریع</strong><p>درخواست‌های تجاری بدون ایجاد رکورد تکراری در نمای لیدها دیده می‌شوند. نمودارها فقط از رکوردهای مجاز و فیلترهای فعلی محاسبه شده‌اند. نرخ تبدیل واقعی تا زمان تعریف رویداد قابل اتکا نمایش داده نمی‌شود.</p></div>';
 }
 function toggleAnalytics(force){
  const panel=$('ul-analytics-panel');
  const shouldOpen=typeof force==='boolean'?force:panel.hidden;
  panel.hidden=!shouldOpen;
  $('ul-analytics').setAttribute('aria-expanded',String(shouldOpen));
  $('ul-analytics').textContent=shouldOpen?'◉ پنهان کردن نمودارها و گیج‌ها':'◉ نمایش نمودارها و گیج‌ها';
  if(shouldOpen){drawAnalytics();panel.scrollIntoView({behavior:'smooth',block:'start'});}
  else {$('ul-analytics').focus();}
 }
 $('ul-close').onclick=()=>toggleAnalytics(false);
 async function load(){
  status('در حال دریافت داده‌های قابل دسترس…');
  let d=supabase.from('leads').select('*').order('updated_at',{ascending:false}).limit(2000);
  let c=supabase.from('collaboration_requests').select('*').eq('request_type','commercial').order('created_at',{ascending:false}).limit(2000);
  if(!isManager){d=d.eq('owner_auth_id',userId);c=c.eq('owner_auth_id',userId)}
  const [ld,cr,pr]=await Promise.all([d,c,isManager?supabase.from('profiles').select('id,display_name,username'):supabase.from('profiles').select('id,display_name,username').eq('id',userId)]);
  if(ld.error||cr.error||pr.error)throw Error((ld.error||cr.error||pr.error).message);
  profiles=pr.data||[];rows=normalizeRows(ld.data||[],cr.data||[],profiles,isManager,userId);
  const previous=$('ul-owner').value;const options=profiles.filter(p=>rows.some(r=>r.ownerId===String(p.id)));$('ul-owner').innerHTML='<option value="">همه کارشناسان</option>'+options.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.display_name||p.username)+'</option>').join('');$('ul-owner').value=options.some(p=>String(p.id)===previous)?previous:'';
  const stages=[...new Set(rows.map(r=>String(r.stage||'')).filter(Boolean))].sort();$('ul-stage').innerHTML='<option value="">همه مراحل</option>'+stages.map(v=>'<option>'+esc(v)+'</option>').join('');
  const statuses=[...new Set(rows.map(r=>r.status).filter(Boolean))].sort();$('ul-status-filter').innerHTML='<option value="">همه وضعیت‌ها</option>'+statuses.map(v=>'<option>'+esc(v)+'</option>').join('');
  host.closest('#leads')?.classList.add('unified-active');
  status(fmt(rows.length)+' لید قابل مشاهده — داده‌ها صرفاً خوانده شدند');
  render();
 }
 $('ul-new').onclick=()=>global.openLeadModal?.();
 $('ul-analytics').onclick=()=>toggleAnalytics();
 $('ul-refresh').onclick=()=>load().catch(e=>status('بارگذاری ناموفق: '+e.message));
 $('ul-legacy').onclick=()=>{const page=host.closest('#leads');const showUnified=!page.classList.contains('unified-active');page.classList.toggle('unified-active',showUnified);$('ul-legacy').textContent=showUnified?'ابزارهای لید مستقیم':'بازگشت به نمای یکپارچه';};
 host.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;host.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));render()});
 ['ul-search','ul-owner','ul-stage','ul-status-filter','ul-date'].forEach(id=>$(id).addEventListener(id==='ul-search'?'input':'change',render));
 load().catch(e=>status('نمای یکپارچه بارگذاری نشد: '+e.message+'؛ ابزارهای قبلی همچنان در دسترس هستند.'));
}
global.ManagerNegarUnifiedLeads={mount,normalizeRows};
})(window);
