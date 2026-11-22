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
 '.ul-wrap{color:var(--txt,#e7eefb);direction:rtl}.ul-header,.ul-actions,.ul-tabs,.ul-filters{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:space-between}.ul-header{margin:3px 0 18px}.ul-heading{font-size:24px;font-weight:800}.ul-sub{font-size:12px;color:var(--txt2,#94a3b8);margin-top:5px}.ul-action,.ul-tab{font:inherit;color:inherit;cursor:pointer;border:1px solid var(--bd,#2c4261);background:#10233c;border-radius:11px;padding:10px 14px}.ul-action.primary,.ul-tab.active{background:#0868d7;color:#fff}.ul-action:focus-visible,.ul-tab:focus-visible{outline:2px solid #66c9ff}.ul-tabs{justify-content:flex-start;margin:15px 0}.ul-filters{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;align-items:center;background:#0c1d32;border:1px solid var(--bd);padding:14px;border-radius:15px;margin-bottom:15px}.ul-filters input,.ul-filters select{background:#101f37;border:1px solid #34506c;color:#fff;border-radius:9px;padding:9px;font:inherit;min-width:0;width:100%;box-sizing:border-box;max-width:100%}.ul-stats,.ul-gauges,.ul-charts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:15px 0}.ul-stat,.ul-card{background:linear-gradient(145deg,#10223b,#09182b);border:1px solid #29405e;border-radius:15px;padding:16px;min-width:0}.ul-stat small,.ul-card small{color:#a9bdd6}.ul-stat strong{display:block;font-size:27px;margin-top:10px}.ul-table-scroll{overflow-x:auto;border:1px solid #29405e;border-radius:15px}.ul-table{width:100%;border-collapse:collapse;font-size:12px;min-width:840px}.ul-table th,.ul-table td{padding:12px 9px;border-bottom:1px solid #263951;text-align:right}.ul-table th{color:#b7cbe4;background:#112743}.ul-source{display:inline-block;background:#153a72;color:#d9eaff;border-radius:99px;padding:5px 8px;white-space:nowrap}.ul-source.commercial{background:#503580}.ul-muted{color:#aabed7;font-size:12px}.ul-empty{padding:24px;text-align:center;color:#adc3df}.ul-overlay{position:fixed;inset:0;background:#010918d9;z-index:1900;display:grid;place-items:center;padding:16px}.ul-dialog{background:#07172b;border:1px solid #338de3;box-shadow:0 20px 80px #000a;border-radius:20px;width:min(1110px,96vw);max-height:92vh;overflow:auto;padding:22px}.ul-gauges{grid-template-columns:repeat(4,minmax(0,1fr))}.ul-gauge{text-align:center}.ul-ring{width:118px;height:118px;border-radius:50%;margin:12px auto;display:grid;place-items:center;position:relative}.ul-ring:before{content:"";background:#0b1b30;border-radius:50%;position:absolute;inset:12px}.ul-ring b{position:relative;font-size:24px}.ul-charts{grid-template-columns:repeat(2,minmax(0,1fr))}.ul-bar{margin:12px 0}.ul-bar-label{display:flex;justify-content:space-between;font-size:12px;gap:8px}.ul-track{background:#1b324b;height:11px;border-radius:10px;overflow:hidden;margin-top:6px}.ul-fill{height:100%;background:linear-gradient(90deg,#0a72dd,#31c8f0);border-radius:10px}.ul-note{font-size:12px;color:#a9bbd0;margin-top:12px;line-height:1.9}.ul-hidden{display:none!important}#leads.unified-active #legacyLeadsUi{display:none}'+
 '@media(max-width:850px){.ul-filters{grid-template-columns:repeat(2,minmax(0,1fr))}.ul-stats,.ul-gauges{grid-template-columns:repeat(2,minmax(0,1fr))}.ul-charts{grid-template-columns:1fr}}@media(max-width:450px){.ul-filters{grid-template-columns:1fr}.ul-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ul-heading{font-size:19px}}'+
 '</style><div class="ul-wrap"><div class="ul-header"><div><h2 class="ul-heading">مدیریت لیدها</h2><p class="ul-sub">'+(isManager?'نمای کلی همه کارشناسان، لیدهای مستقیم و درخواست‌های تجاری':'لیدها و عملکرد شخصی من')+'</p></div><div class="ul-actions"><button type="button" class="ul-action primary" id="ul-new">+ ثبت لید</button><button type="button" class="ul-action" id="ul-analytics" aria-haspopup="dialog">◉ نمودارها و گیج‌ها</button><button type="button" class="ul-action" id="ul-legacy">ابزارهای لید مستقیم</button><button type="button" class="ul-action" id="ul-refresh">به‌روزرسانی</button></div></div><div id="ul-status" role="status" class="ul-muted">در حال دریافت لیدها…</div><div class="ul-stats" id="ul-stats"></div><div class="ul-tabs" role="group" aria-label="نوع لید"><button type="button" class="ul-tab active" data-tab="all">همه لیدها</button><button type="button" class="ul-tab" data-tab="commercial">لیدهای تجاری</button><button type="button" class="ul-tab" data-tab="direct">لیدهای مستقیم</button></div><div class="ul-filters"><input type="search" id="ul-search" placeholder="جستجوی شرکت یا تلفن" aria-label="جستجوی لید"><select id="ul-owner" aria-label="فیلتر کارشناس" '+(isManager?'':'hidden')+'><option value="">همه کارشناسان</option></select><select id="ul-stage" aria-label="فیلتر مرحله فروش"><option value="">همه مراحل</option></select><select id="ul-status-filter" aria-label="فیلتر وضعیت"><option value="">همه وضعیت‌ها</option></select><select id="ul-date" aria-label="بازه زمانی"><option value="all">همه زمان‌ها</option><option value="30">۳۰ روز گذشته</option><option value="90">۹۰ روز گذشته</option></select></div><div class="ul-table-scroll"><table class="ul-table"><thead><tr><th>شرکت / تماس</th><th>منبع</th><th>کارشناس</th><th>مرحله</th><th>وضعیت</th><th>پیگیری</th><th>عملیات</th></tr></thead><tbody id="ul-rows"></tbody></table></div><p class="ul-note">درخواست‌های تجاری بدون کپی اطلاعات نمایش داده می‌شوند؛ ویرایش از منبع اصلی انجام می‌شود. نمودارها نیز فقط از داده‌های قابل مشاهده شما محاسبه می‌شوند.</p></div><div id="ul-modal-root"></div>';
 const $=id=>host.querySelector('#'+id);
 let rows=[],profiles=[],tab='all',view=[];
 const status=t=>{$('ul-status').textContent=t};
 const active=()=>{let v=rows.filter(r=>tab==='all'||r.source===tab);const q=norm($('ul-search').value),owner=$('ul-owner').value,stage=$('ul-stage').value,st=$('ul-status-filter').value,days=$('ul-date').value;
  const cutoff=days==='all'?'':new Date(Date.now()-Number(days)*86400000).toISOString().slice(0,10);
  return v.filter(r=>(!q||norm(r.company).includes(q)||norm(r.phone).includes(q))&&(!owner||r.ownerId===owner)&&(!stage||String(r.stage)===stage)&&(!st||r.status===st)&&(!cutoff||(r.created&&r.created>=cutoff)));
 };
 const box=(label,n)=>'<div class="ul-stat"><small>'+label+'</small><strong>'+fmt(n)+'</strong></div>';
 function render(){
  view=active();
  $('ul-stats').innerHTML=box('لیدهای قابل مشاهده',view.length)+box('درخواست تجاری',view.filter(r=>r.source==='commercial').length)+box('لید مستقیم',view.filter(r=>r.source==='direct').length)+box('دارای برنامه پیگیری',view.filter(r=>r.planned).length);
  $('ul-rows').innerHTML=view.length?view.map(r=>'<tr><td><b>'+esc(r.company)+'</b><div class="ul-muted">'+esc(r.phone)+'</div></td><td><span class="ul-source '+esc(r.source)+'">'+(r.source==='commercial'?'درخواست همکاری':'لید مستقیم')+'</span></td><td>'+esc(r.owner)+'</td><td>'+esc(r.stage||'—')+'</td><td>'+esc(r.status)+'</td><td>'+esc(r.followup||'—')+'</td><td><button type="button" class="ul-action" data-source="'+esc(r.source)+'" data-id="'+esc(r.id)+'">'+(r.source==='commercial'?'مشاهده درخواست':'ویرایش لید')+'</button></td></tr>').join(''):'<tr><td colspan="7" class="ul-empty">لیدی با این فیلترها پیدا نشد.</td></tr>';
  $('ul-rows').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{if(b.dataset.source==='commercial')onOpenRequest(b.dataset.id);else onOpenDirect(b.dataset.id)});
  const modal=$('ul-modal-root').querySelector('.ul-overlay');if(modal)drawAnalytics();
 }
 function gauge(label,num,den,color){const v=pct(num,den);return '<div class="ul-card ul-gauge"><small>'+label+'</small><div class="ul-ring" style="background:conic-gradient('+color+' '+(v??0)+'%,#294059 0)"><b>'+(v===null?'—':fmt(v)+'٪')+'</b></div><div class="ul-muted">'+(v===null?'داده کافی نیست':fmt(num)+' از '+fmt(den))+'</div></div>';}
 function chart(title,items){const max=Math.max(1,...items.map(x=>x[1]));return '<section class="ul-card"><h3>'+esc(title)+'</h3>'+(items.length?items.map(([label,num])=>'<div class="ul-bar"><div class="ul-bar-label"><span>'+esc(label)+'</span><b>'+fmt(num)+'</b></div><div class="ul-track"><div class="ul-fill" style="width:'+Math.round(num/max*100)+'%"></div></div></div>').join(''):'<p class="ul-muted">داده‌ای برای نمایش وجود ندارد.</p>')+'</section>';}
 function tally(key){const m=new Map();view.forEach(r=>{const n=r[key]||'نامشخص';m.set(n,(m.get(n)||0)+1)});return [...m].sort((a,b)=>b[1]-a[1]).slice(0,10);}
 function drawAnalytics(){
  const area=$('ul-modal-root').querySelector('#ul-analysis-body');if(!area)return;
  const total=view.length,withPlan=view.filter(r=>r.planned).length,complete=view.filter(r=>r.complete).length,commercial=view.filter(r=>r.source==='commercial').length;
  area.innerHTML='<div class="ul-gauges">'+gauge('دارای برنامه پیگیری',withPlan,total,'#22d3ee')+gauge('تکمیل اطلاعات پایه',complete,total,'#fbbf24')+gauge('سهم درخواست تجاری',commercial,total,'#a78bfa')+gauge('سهم لید مستقیم',total-commercial,total,'#22c55e')+'</div><div class="ul-charts">'+chart('تفکیک منبع لید',[['درخواست همکاری',commercial],['لید مستقیم',total-commercial]])+chart('مراحل ثبت‌شده فروش',tally('stage'))+(isManager?chart('عملکرد کارشناسان بر اساس تعداد لید',tally('owner')):chart('وضعیت لیدهای من',tally('status')))+chart('وضعیت پیگیری', [['دارای برنامه',withPlan],['فاقد برنامه',total-withPlan]])+'</div><p class="ul-note">شاخص‌ها بر اساس لیدهای همین فیلتر و فقط اطلاعات قابل مشاهده محاسبه شده‌اند. درصد تبدیل فروش بدون تعریف رویداد معتبر محاسبه نمی‌شود.</p>';
 }
 function openAnalytics(){
  $('ul-modal-root').innerHTML='<div class="ul-overlay" role="presentation"><section class="ul-dialog" role="dialog" aria-modal="true" aria-label="نمودارها و گیج‌های لیدها"><div class="ul-header"><div><h2 class="ul-heading">'+(isManager?'تحلیل مدیریتی لیدها':'تحلیل لیدهای من')+'</h2><p class="ul-sub">'+(isManager?'همه کارشناسان، با امکان تفکیک از فیلترهای صفحه':'فقط لیدهای اختصاص یافته به حساب شما')+'</p></div><button type="button" id="ul-close" class="ul-action" aria-label="بستن">✕ بستن</button></div><div id="ul-analysis-body"></div></section></div>';
  $('ul-close').onclick=()=>{$('ul-modal-root').innerHTML='';$('ul-analytics').focus()};
  drawAnalytics();$('ul-close').focus();
 }
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
 $('ul-analytics').onclick=openAnalytics;
 $('ul-refresh').onclick=()=>load().catch(e=>status('بارگذاری ناموفق: '+e.message));
 $('ul-legacy').onclick=()=>{const page=host.closest('#leads');const showUnified=!page.classList.contains('unified-active');page.classList.toggle('unified-active',showUnified);$('ul-legacy').textContent=showUnified?'ابزارهای لید مستقیم':'بازگشت به نمای یکپارچه';};
 host.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;host.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));render()});
 ['ul-search','ul-owner','ul-stage','ul-status-filter','ul-date'].forEach(id=>$(id).addEventListener(id==='ul-search'?'input':'change',render));
 load().catch(e=>status('نمای یکپارچه بارگذاری نشد: '+e.message+'؛ ابزارهای قبلی همچنان در دسترس هستند.'));
}
global.ManagerNegarUnifiedLeads={mount,normalizeRows};
})(window);
