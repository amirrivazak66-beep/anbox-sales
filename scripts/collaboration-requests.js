/* Collaboration requests CRM module. */
(function(global){
'use strict';
const schema=[
 ['external_id','شناسه',['شناسه','کد','کد درخواست','شماره','ردیف']],
 ['request_type','نوع درخواست',[]],
 ['request_status','وضعیت درخواست',[]],
 ['phone','تلفن',['تلفن','شماره تماس','موبایل','شماره موبایل']],
 ['company','شرکت',['شرکت','نام شرکت','نام مجموعه','نام مشتری']],
 ['province','استان',['استان','استان محل فعالیت']],
 ['monthly_shipments','ارسال ماهانه',['ارسال ماهانه','تعداد ارسال ماهانه','حجم ارسال ماهانه']],
 ['sales_category','دسته فروش',['دسته فروش','نوع فروش','گروه فروش']],
 ['registered_at_text','تاریخ ثبت',['تاریخ ثبت','تاریخ درخواست','تاریخ']],
 ['expert_name','کارشناس',['کارشناس','نام کارشناس','کارشناس فروش']],
 ['call_result','نتیجه تماس',['نتیجه تماس','وضعیت تماس','نتیجه پیگیری']],
 ['sales_stage','مرحله فروش',['مرحله فروش','مرحله','وضعیت فروش']],
 ['priority','اولویت',['اولویت','درجه اهمیت']],
 ['call_count','تعداد تماس',['تعداد تماس','دفعات تماس','تعداد پیگیری']],
 ['last_contact_text','تاریخ آخرین تماس',['تاریخ آخرین تماس','آخرین تماس']],
 ['next_followup_text','پیگیری بعدی',['پیگیری بعدی','تاریخ پیگیری بعدی','تاریخ پیگیری']],
 ['next_action','اقدام بعدی',['اقدام بعدی','اقدام لازم','اقدام']],
 ['notes','توضیحات',['توضیحات','شرح','یادداشت']]
];
const editable=schema.filter(x=>!['external_id','expert_name','registered_at_text'].includes(x[0])).map(x=>x[0]);
const requestTypeLabels={unclassified:'تعیین‌نشده',commercial:'تجاری',employment:'استخدامی'};
const requestTypeOptions=['unclassified','commercial','employment'];
const requestStatusLabels=['جدید','در حال بررسی','نیازمند اطلاعات','در حال پیگیری','در انتظار پاسخ','جلسه/مذاکره','ارجاع به منابع انسانی','تکمیل‌شده','ردشده','بسته‌شده'];
const norm=v=>String(v??'').trim().replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(a,b)=>b?Math.min(100,Math.round(a*100/b)):0;
function parseRows(rows){
 if(!Array.isArray(rows)||rows.length<2)throw Error('فایل باید حداقل یک ردیف عنوان و یک ردیف داده داشته باشد');
 const heads=rows[0].map(norm),mapped={};
 schema.forEach(([key,,aliases])=>{mapped[key]=heads.findIndex(h=>aliases.some(a=>norm(a).toLowerCase()===h.toLowerCase()))});
 if(mapped.external_id<0)throw Error('ستون شناسه درخواست پیدا نشد. لطفاً فایل نمونه اکسل را با قالب مورد انتظار تطبیق دهید.');
 const output=rows.slice(1).filter(row=>row.some(v=>String(v??'').trim())).map((row,i)=>{
 const o={};schema.forEach(([key],j)=>{o[key]=mapped[key]>=0?norm(row[mapped[key]]):''});
 if(!o.external_id)throw Error('شناسه در ردیف '+(i+2)+' خالی است');
 o.call_count=Number(o.call_count||0);if(!Number.isInteger(o.call_count)||o.call_count<0)throw Error('تعداد تماس در ردیف '+(i+2)+' نامعتبر است');
 o.request_type='unclassified';o.request_status='جدید';
 o.request_status='جدید';
 return o;
 });
 const counts=new Map();for(const o of output)counts.set(o.external_id,(counts.get(o.external_id)||0)+1);const seen=new Set();for(const o of output){if(counts.get(o.external_id)>1){if(!o.phone)throw Error('شناسه تکراری '+o.external_id+' بدون تلفن قابل تفکیک است');o.external_id=o.external_id+'-'+o.phone}if(seen.has(o.external_id))throw Error('شناسه/تلفن تکراری در فایل: '+o.external_id);seen.add(o.external_id)}
 return output;
}
function mount(host,{supabase,userId,isManager=false,XLSX=global.XLSX}={}){
 if(!host||!supabase||!userId)throw Error('هویت کاربر و اتصال دیتابیس الزامی است');
 host.dir='rtl';host.innerHTML=`
 <style>
 .cr-wrap{color:var(--txt,#e2e8f0);direction:rtl}.cr-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:18px}.cr-actions{display:flex;gap:8px;flex-wrap:wrap}.cr-btn{border:1px solid var(--bd, #334155);border-radius:10px;padding:10px 14px;background:#2563eb;color:white;cursor:pointer;font:inherit}.cr-btn.alt{background:transparent;color:inherit}.cr-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.cr-kpi,.cr-panel{background:var(--card,rgba(15,23,42,.65));border:1px solid var(--bd,rgba(59,130,246,.18));border-radius:14px;padding:16px;margin-bottom:14px}.cr-kpi small,.cr-muted{color:var(--txt2,#94a3b8)}.cr-kpi strong{display:block;font-size:25px;margin-top:7px}.cr-gauges{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.cr-followup-list{display:grid;gap:8px}.cr-followup-item{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px;border:1px solid var(--bd);border-radius:11px}.cr-followup-item.overdue{border-color:#b45353}.cr-followup-meta{font-size:11px;color:var(--txt2);margin-top:5px}.cr-btn.sm{padding:7px 10px;font-size:11px}.cr-edit textarea{width:100%;min-height:80px;background:#101b30;color:white;border:1px solid var(--bd);padding:10px}.cr-edit input{width:100%;background:#101b30;color:white;border:1px solid var(--bd);padding:10px}.cr-history-item{padding:10px 0;border-bottom:1px solid var(--bd)}@media(max-width:850px){.cr-followup-item{display:block}}.cr-gauge{width:132px;height:132px;margin:12px auto;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--g) calc(var(--v)*1%),rgba(148,163,184,.18) 0);position:relative}.cr-gauge:before{content:'';position:absolute;inset:12px;border-radius:50%;background:#111c31}.cr-gauge b{z-index:1;font-size:23px}.cr-filters{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:9px}.cr-filters input,.cr-filters select,.cr-edit input,.cr-edit select{width:100%;padding:10px;border-radius:9px;border:1px solid var(--bd);background:rgba(15,23,42,.75);color:inherit;font:inherit}.cr-table{overflow:auto}.cr-table table{width:100%;min-width:760px;border-collapse:collapse}.cr-table th,.cr-table td{text-align:right;padding:11px;border-bottom:1px solid var(--bd);font-size:13px}.cr-pill{padding:4px 8px;border-radius:18px;background:rgba(59,130,246,.18)}.cr-edit{max-width:680px;width:95%;max-height:85vh;overflow:auto;background:#101b30;color:#fff;border:1px solid var(--bd);border-radius:14px;padding:18px;margin:auto}.cr-edit label{display:block;margin:10px 0}.cr-edit button{margin-top:10px}.cr-status{margin:8px 0;min-height:22px;color:#93c5fd}@media(max-width:850px){.cr-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cr-gauges{grid-template-columns:1fr}.cr-filters{grid-template-columns:repeat(2,minmax(0,1fr))}}
 </style>
 <div class="cr-wrap">
 <div class="cr-head"><div><h2>🤝 درخواست همکاری</h2><p class="cr-muted">مدیریت درخواست‌های همکاری کارشناسان</p></div>
 <div class="cr-actions"><label class="cr-btn" for="cr-file">⬆ آپلود اکسل درخواست همکاری</label><input hidden type="file" id="cr-file" accept=".xlsx,.xls"><select id="cr-import-owner" aria-label="مالک فایل"></select><button class="cr-btn alt" id="cr-export-employment">خروجی استخدامی Excel</button><button class="cr-btn alt" id="cr-reload">به‌روزرسانی</button></div></div>
 <p class="cr-status" id="cr-message" role="status" aria-live="polite"></p>
 <div class="cr-grid" id="cr-kpis"></div>
 <section class="cr-panel"><div class="cr-head"><div><h3>◷ کارهای پیگیری</h3><p class="cr-muted">پیگیری‌های امروز و عقب‌افتاده</p></div><div class="cr-actions"><button class="cr-btn alt" id="cr-export-daily">خروجی گزارش روزانه Excel</button><button class="cr-btn alt" id="cr-followup-reload">به‌روزرسانی</button></div></div><div class="cr-grid" id="cr-followup-kpis"></div>
 <div class="cr-filters" style="margin:12px 0"><label class="cr-muted">از تاریخ فعالیت<input id="cr-followup-from" type="date"></label><label class="cr-muted">تا تاریخ فعالیت<input id="cr-followup-to" type="date"></label><select id="cr-followup-status"><option value="all">همه وضعیت‌ها</option><option value="open">باز</option><option value="overdue">عقب‌افتاده</option><option value="today">موعد امروز</option><option value="completed">تکمیل‌شده</option></select>${isManager?'<select id="cr-followup-expert"><option value="">همه کارشناسان</option></select>':''}</div>
 ${isManager?'<div class="cr-panel"><h4>مقایسه عملکرد کارشناسان</h4><div class="cr-table" id="cr-expert-report"></div></div>':''}
 <div id="cr-followup-list" class="cr-followup-list">در حال دریافت پیگیری‌ها…</div></section>
 <div class="cr-panel"><h3>گزارش عملکرد</h3><div class="cr-gauges" id="cr-gauges"></div></div>
 <div class="cr-panel"><div class="cr-filters">
 <input id="cr-search" placeholder="جستجو در شرکت، تلفن و شناسه">
 <select id="cr-province"><option value="">همه استان‌ها</option></select>
 <select id="cr-result"><option value="">همه نتایج تماس</option></select>
 <select id="cr-stage"><option value="">همه مراحل</option></select>
 <select id="cr-priority"><option value="">همه اولویت‌ها</option></select><select id="cr-expert"><option value="">همه کارشناسان</option></select><select id="cr-category"><option value="">همه دسته‌ها</option></select><select id="cr-type"><option value="">همه انواع درخواست</option><option value="unclassified">تعیین‌نشده</option><option value="commercial">تجاری</option><option value="employment">استخدامی</option></select>
 </div></div>
 <div class="cr-panel"><div class="cr-actions" id="cr-views"><button class="cr-btn alt" data-view="all">همه</button><button class="cr-btn alt" data-view="commercial">تجاری</button><button class="cr-btn alt" data-view="employment">استخدامی</button><button class="cr-btn alt" data-view="unclassified">تعیین‌نشده</button></div><div class="cr-table" id="cr-table"></div></div></div>`;
 let records=[],expertProfiles=[],view='all';
 const ownerName=id=>id===userId?(isManager?'مدیر':'شما'):(expertProfiles.find(p=>p.id===id)?.display_name||expertProfiles.find(p=>p.id===id)?.username||'کارشناس نامشخص');
 const el=id=>host.querySelector('#'+id),message=t=>{el('cr-message').textContent=t};
 const distinct=k=>[...new Set(records.map(r=>r[k]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fa'));
 function fill(id,values,label){const select=el(id),v=select.value;select.innerHTML='<option value="">'+label+'</option>'+values.map(x=>'<option>'+esc(x)+'</option>').join('');select.value=v}
 function filtered(){const q=norm(el('cr-search').value).toLowerCase();return records.filter(r=>(view==='all'||r.request_type===view||(view==='unclassified'&&(!r.request_type||r.request_type==='unclassified')))&&(!q||[r.company,r.phone,r.external_id].some(v=>norm(v).toLowerCase().includes(q)))&&(!el('cr-province').value||r.province===el('cr-province').value)&&(!el('cr-result').value||r.call_result===el('cr-result').value)&&(!el('cr-stage').value||r.request_status===el('cr-stage').value)&&(!el('cr-priority').value||r.priority===el('cr-priority').value)&&(!el('cr-expert').value||r.expert_name===el('cr-expert').value)&&(!el('cr-category').value||r.sales_category===el('cr-category').value)&&(!el('cr-type').value||r.request_type===el('cr-type').value))}
 function gauge(title,value,color){return '<div><div style="text-align:center">'+title+'</div><div class="cr-gauge" style="--v:'+value+';--g:'+color+'"><b>'+value+'٪</b></div><div class="cr-muted" style="text-align:center">۰٪ — ۱۰۰٪</div></div>'}
 function render(){
 const rows=filtered(),commercialRows=rows.filter(r=>r.request_type==='commercial'),total=commercialRows.length,followed=commercialRows.filter(r=>Number(r.call_count)>0).length,completed=commercialRows.filter(r=>r.company&&r.phone&&r.province&&r.sales_stage&&r.call_result).length,need=commercialRows.filter(r=>!r.next_followup_text||r.next_followup_text==='ندارد'||!r.call_result).length,actioned=commercialRows.filter(r=>r.next_action&&r.next_action!=='بدون اقدام').length;
 const employmentCount=records.filter(r=>r.request_type==='employment').length,unclassifiedCount=records.filter(r=>!r.request_type||r.request_type==='unclassified').length;el('cr-kpis').innerHTML=[['لیدهای تجاری',rows.filter(r=>r.request_type==='commercial').length],['لیدهای استخدامی',employmentCount],['نیازمند تعیین نوع',unclassifiedCount],['نیازمند اقدام',need]].map(([a,b])=>'<div class="cr-kpi"><small>'+a+'</small><strong>'+b.toLocaleString('fa-IR')+'</strong></div>').join('');
 el('cr-gauges').innerHTML=gauge('نرخ پیگیری',pct(followed,total),'#3b82f6')+gauge('تکمیل اطلاعات',pct(completed,total),'#22c55e')+gauge('نرخ اقدام ثبت‌شده',pct(actioned,total),'#a78bfa');
 el('cr-table').innerHTML='<table><thead><tr><th>شرکت/متقاضی</th><th>نوع درخواست</th><th>استان</th><th>تلفن</th><th>وضعیت درخواست</th><th>پیگیری بعدی</th><th>مالک</th><th>عملیات</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r.company)+'</td><td><span class="cr-pill">'+esc(requestTypeLabels[r.request_type||'unclassified'])+'</span></td><td>'+esc(r.province)+'</td><td>'+esc(r.phone)+'</td><td><span class="cr-pill">'+esc(r.request_status||r.sales_stage)+'</span></td><td>'+esc(r.next_followup_text)+'</td><td>'+esc(ownerName(r.owner_auth_id))+'</td><td><button class="cr-btn alt" data-edit="'+esc(r.id)+'">ویرایش</button> <button class="cr-btn sm" data-add-followup="'+esc(r.id)+'">ثبت پیگیری</button> <button class="cr-btn alt sm" data-history="'+esc(r.id)+'">سوابق</button>'+(isManager&&r.request_type==='employment'?(r.request_status==='ارجاع به منابع انسانی'?'<span class="cr-pill">ارجاع شده</span>':' <button class="cr-btn" data-refer-hr="'+esc(r.id)+'">ارجاع به منابع انسانی</button>'):'')+'</td></tr>').join('')+'</tbody></table>';
 host.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(records.find(r=>String(r.id)===b.dataset.edit)));
 host.querySelectorAll('[data-add-followup]').forEach(b=>b.onclick=()=>openFollowup(records.find(r=>String(r.id)===b.dataset.addFollowup)));
 host.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>showHistory(records.find(r=>String(r.id)===b.dataset.history)));
 host.querySelectorAll('[data-refer-hr]').forEach(b=>b.onclick=async()=>{
  if(!isManager){message('فقط مدیر می‌تواند درخواست را به منابع انسانی ارجاع دهد');return}
  const r=records.find(x=>String(x.id)===b.dataset.referHr);
  if(!r||r.request_type!=='employment'){message('فقط درخواست استخدامی قابل ارجاع است');return}
  if(r.request_status==='ارجاع به منابع انسانی'){message('این درخواست قبلاً ارجاع شده است');return}
  if(!global.confirm('درخواست «'+(r.company||r.phone||r.external_id)+'» به منابع انسانی ارجاع شود؟'))return;
  b.disabled=true;
  const {data,error}=await supabase.from('collaboration_requests').update({request_status:'ارجاع به منابع انسانی'}).eq('id',r.id).select('id,request_status').maybeSingle();
  if(error){b.disabled=false;message('ارجاع انجام نشد: '+error.message);return}
  if(!data){b.disabled=false;message('درخواست به‌روزرسانی نشد؛ دسترسی مدیر یا مالکیت رکورد را بررسی کنید');return}
  await load();message('درخواست با موفقیت در مدیرنگر به منابع انسانی ارجاع شد؛ تاریخ و عامل تغییر در تاریخچه ثبت شد');
 });
 }
 async function load(){if(isManager){const p=await supabase.from('profiles').select('id,display_name,username,role').eq('role','sales').order('display_name');if(p.error)throw p.error;expertProfiles=p.data||[];const fs=el('cr-followup-expert');if(fs){const selected=fs.value;fs.innerHTML='<option value="">همه کارشناسان</option>'+expertProfiles.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.display_name||p.username)+'</option>').join('');fs.value=selected}}let q=supabase.from('collaboration_requests').select('*').order('created_at',{ascending:false}).limit(2000);if(!isManager)q=q.eq('owner_auth_id',userId);const {data,error}=await q;if(error)throw error;records=data||[];await loadFollowups();fill('cr-province',distinct('province'),'همه استان‌ها');fill('cr-result',distinct('call_result'),'همه نتایج تماس');fill('cr-stage',distinct('request_status'),'همه وضعیت‌ها');fill('cr-priority',distinct('priority'),'همه اولویت‌ها');fill('cr-expert',distinct('expert_name'),'همه کارشناسان');fill('cr-category',distinct('sales_category'),'همه دسته‌ها');const ownerSelect=el('cr-import-owner');ownerSelect.innerHTML=(isManager?'<option value="">انتخاب مالک فایل</option>':'')+(isManager?expertProfiles.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.display_name||p.username)+'</option>').join(''):'<option value="'+esc(userId)+'">درخواست‌های من</option>')+(isManager?'<option value="'+esc(userId)+'">مدیر</option>':'');if(!isManager)ownerSelect.value=userId;el('cr-export-employment').hidden=!isManager;render();message('اطلاعات به‌روز شد: '+records.length.toLocaleString('fa-IR')+' درخواست');}

 let followups=[];
 const fmtDate=v=>v?new Date(v).toLocaleString('fa-IR'):'بدون موعد';
 async function loadFollowups(){const {data,error}=await supabase.from('collaboration_request_followups').select('*').order('due_at',{ascending:true,nullsFirst:false}).limit(1000);if(error)throw error;followups=data||[];renderFollowups();}
 function renderFollowups(){
  const now=new Date(),from=el('cr-followup-from')?.value,to=el('cr-followup-to')?.value,status=el('cr-followup-status')?.value||'all',expert=el('cr-followup-expert')?.value||'';
  const byId=new Map(records.map(r=>[String(r.id),r]));
  const inRange=f=>{const d=new Date(f.created_at);if(from&&d<new Date(from+'T00:00:00'))return false;if(to&&d>=new Date(to+'T00:00:00'))return false;return true};
  const scoped=followups.filter(f=>{const r=byId.get(String(f.request_id));if(!inRange(f))return false;if(expert&&r?.owner_auth_id!==expert)return false;const late=!f.completed_at&&f.due_at&&new Date(f.due_at)<now;const today=!f.completed_at&&f.due_at&&new Date(f.due_at).toDateString()===now.toDateString();if(status==='open'&&f.completed_at)return false;if(status==='overdue'&&!late)return false;if(status==='today'&&!today)return false;if(status==='completed'&&!f.completed_at)return false;return true});
  const open=scoped.filter(f=>!f.completed_at),late=open.filter(f=>f.due_at&&new Date(f.due_at)<now),today=open.filter(f=>f.due_at&&new Date(f.due_at).toDateString()===now.toDateString()),done=scoped.filter(f=>f.completed_at);
  el('cr-followup-kpis').innerHTML=[['عقب‌افتاده',late.length],['موعد امروز',today.length],['باز',open.length],['تکمیل‌شده',done.length]].map(([a,b])=>'<div class="cr-kpi"><small>'+a+'</small><strong>'+b.toLocaleString('fa-IR')+'</strong></div>').join('');
  if(isManager){
   const owners=new Map();
   records.forEach(r=>{const id=r.owner_auth_id;if(!owners.has(id))owners.set(id,{id,name:ownerName(id),requests:0,calls:0,notes:0,completed:0,open:0,overdue:0});owners.get(id).requests++});
   scoped.forEach(f=>{const r=byId.get(String(f.request_id));if(!r)return;const o=owners.get(r.owner_auth_id);if(!o)return;if(f.interaction_type==='call')o.calls++;else o.notes++;if(f.completed_at)o.completed++;else{o.open++;if(f.due_at&&new Date(f.due_at)<now)o.overdue++}});
   const report=el('cr-expert-report');if(report)report.innerHTML='<table><thead><tr><th>کارشناس</th><th>درخواست‌ها</th><th>تماس‌ها</th><th>یادداشت‌ها</th><th>تکمیل‌شده</th><th>باز</th><th>معوق</th></tr></thead><tbody>'+[...owners.values()].sort((a,b)=>b.calls-a.calls||b.requests-a.requests).map(o=>'<tr><td>'+esc(o.name)+'</td><td>'+o.requests.toLocaleString('fa-IR')+'</td><td>'+o.calls.toLocaleString('fa-IR')+'</td><td>'+o.notes.toLocaleString('fa-IR')+'</td><td>'+o.completed.toLocaleString('fa-IR')+'</td><td>'+o.open.toLocaleString('fa-IR')+'</td><td>'+o.overdue.toLocaleString('fa-IR')+'</td></tr>').join('')+'</tbody></table>';
  }
  const list=el('cr-followup-list'),visible=scoped.slice().sort((a,b)=>{if(a.completed_at&&!b.completed_at)return 1;if(!a.completed_at&&b.completed_at)return -1;return (a.due_at?new Date(a.due_at).getTime():Infinity)-(b.due_at?new Date(b.due_at).getTime():Infinity)}).slice(0,100);
  list.innerHTML=visible.map(f=>{const r=byId.get(String(f.request_id)),isLate=!f.completed_at&&f.due_at&&new Date(f.due_at)<now,state=f.completed_at?'تکمیل‌شده':isLate?'عقب‌افتاده':f.due_at&&new Date(f.due_at).toDateString()===now.toDateString()?'امروز':'باز';return '<article class="cr-followup-item '+(isLate?'overdue':'')+'"><div><b>'+esc(r?.company||r?.external_id||'درخواست همکاری')+'</b><div class="cr-followup-meta">'+esc(ownerName(r?.owner_auth_id))+' · '+esc(f.next_action||'بدون اقدام')+' · '+fmtDate(f.due_at)+' · '+state+' · ثبت: '+fmtDate(f.created_at)+'</div></div><div class="cr-actions">'+(f.completed_at?'<span class="cr-pill">تکمیل‌شده</span>':'<button class="cr-btn sm" data-complete-followup="'+esc(f.id)+'">تکمیل پیگیری</button>')+(r?'<button class="cr-btn alt sm" data-history="'+esc(r.id)+'">سوابق</button>':'')+'</div></article>'}).join('')||'<p class="cr-muted">موردی با فیلترهای انتخاب‌شده پیدا نشد.</p>';
  list.querySelectorAll('[data-complete-followup]').forEach(b=>b.onclick=async()=>{if(!global.confirm('پیگیری انجام‌شده ثبت شود؟'))return;b.disabled=true;const {data,error}=await supabase.rpc('complete_collaboration_followup',{p_followup_id:b.dataset.completeFollowup});if(error){b.disabled=false;message('خطا: '+error.message);return}await loadFollowups();message(data?'پیگیری تکمیل شد.':'این پیگیری قبلاً تکمیل شده است.')});
  list.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>showHistory(records.find(r=>String(r.id)===b.dataset.history)));
 }
  function openFollowup(r){if(!r)return;const d=document.createElement('dialog');d.className='cr-edit';d.innerHTML='<form><h3>ثبت تماس و پیگیری</h3><p>'+esc(r.company||r.external_id)+'</p><label>نوع تعامل<select name="interaction_type"><option value="call">تماس</option><option value="note">یادداشت</option></select></label><label>نتیجه تماس<input name="call_result" maxlength="300"></label><label>توضیحات<textarea name="notes" maxlength="5000"></textarea></label><label>اقدام بعدی<input name="next_action" required maxlength="500"></label><label>موعد پیگیری<input name="due_at" type="datetime-local" required></label><button class="cr-btn" type="submit">ذخیره</button><button class="cr-btn alt" type="button" data-cancel>انصراف</button></form>';host.append(d);d.showModal();d.querySelector('[data-cancel]').onclick=()=>d.close();d.querySelector('form').onsubmit=async e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.currentTarget)),due=new Date(v.due_at);if(!v.next_action.trim()||!v.due_at||Number.isNaN(due.getTime())){message('اقدام بعدی و موعد معتبر الزامی است');return}const btn=e.submitter;btn.disabled=true;const {data,error}=await supabase.rpc('record_collaboration_followup',{p_request_id:r.id,p_interaction_type:v.interaction_type,p_call_result:v.call_result,p_notes:v.notes,p_next_action:v.next_action,p_due_at:due.toISOString()});if(error){btn.disabled=false;message('ثبت ناموفق: '+error.message);return}d.close();await load();message('پیگیری ثبت شد.')};d.onclose=()=>d.remove();}
 async function showHistory(r){if(!r)return;const d=document.createElement('dialog');d.className='cr-edit';d.innerHTML='<h3>تاریخچه پیگیری</h3><div id="cr-history-list">در حال دریافت…</div><button class="cr-btn alt">بستن</button>';host.append(d);d.showModal();d.querySelector('button').onclick=()=>d.close();const {data,error}=await supabase.from('collaboration_request_followups').select('*').eq('request_id',r.id).order('created_at',{ascending:false}).limit(100);const box=d.querySelector('#cr-history-list');box.innerHTML=error?'خطا در دریافت تاریخچه: '+esc(error.message):(data||[]).map(f=>'<article class="cr-history-item"><b>'+(f.interaction_type==='call'?'تماس':'یادداشت')+'</b> · '+fmtDate(f.created_at)+'<br>نتیجه: '+esc(f.call_result||'—')+'<br>توضیحات: '+esc(f.notes||'—')+'<br>اقدام بعدی: '+esc(f.next_action||'—')+'<br>موعد: '+fmtDate(f.due_at)+'<br>'+(f.completed_at?'تکمیل‌شده':'باز')+'</article>').join('')||'سابقه‌ای ثبت نشده است';d.onclose=()=>d.remove();}
 function exportDailyReport(){if(!XLSX?.utils?.json_to_sheet||!XLSX?.writeFile){message('کتابخانه اکسل در دسترس نیست');return}const s=new Date();s.setHours(0,0,0,0);const e=new Date(s);e.setDate(e.getDate()+1);const rows=followups.filter(f=>new Date(f.created_at)>=s&&new Date(f.created_at)<e).map(f=>{const r=records.find(x=>String(x.id)===String(f.request_id));return {تاریخ:fmtDate(f.created_at),شرکت:r?.company||'',شناسه:r?.external_id||'',کارشناس:r?.expert_name||'',نوع:f.interaction_type,نتیجه:f.call_result,توضیحات:f.notes,اقدام_بعدی:f.next_action,موعد:fmtDate(f.due_at),وضعیت:f.completed_at?'تکمیل‌شده':'باز'}});const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'گزارش روزانه');XLSX.writeFile(wb,'managernegar-daily-followups.xlsx');message(rows.length.toLocaleString('fa-IR')+' فعالیت خروجی گرفته شد');}
 function edit(r){
  if(!r)return;
  const dialog=document.createElement('dialog');dialog.className='cr-edit';
  const ownerField=isManager?'<label>کارشناس مسئول<select name="owner_auth_id"><option value="'+esc(userId)+'" '+(r.owner_auth_id===userId?'selected':'')+'>مدیر</option>'+expertProfiles.map(p=>'<option value="'+esc(p.id)+'" '+(r.owner_auth_id===p.id?'selected':'')+'>'+esc(p.display_name||p.username)+'</option>').join('')+'</select></label>':'';
  const fields=editable.map(k=>{const f=schema.find(x=>x[0]===k);
   if(k==='request_type')return '<label>'+esc(f[1])+'<select name="request_type">'+requestTypeOptions.map(v=>'<option value="'+v+'" '+((r.request_type||'unclassified')===v?'selected':'')+'>'+requestTypeLabels[v]+'</option>').join('')+'</select></label>';
   if(k==='request_status')return '<label>'+esc(f[1])+'<select name="request_status">'+requestStatusLabels.map(v=>'<option '+((r.request_status||'جدید')===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label>';
   return '<label>'+esc(f[1])+'<input name="'+k+'" value="'+esc(r[k])+'"></label>';
  }).join('');
  dialog.innerHTML='<form method="dialog"><h3>ویرایش درخواست همکاری</h3>'+fields+ownerField+'<button class="cr-btn" value="save">ذخیره تغییرات</button> <button class="cr-btn alt" value="cancel">انصراف</button></form><section class="cr-panel" id="cr-history">در حال دریافت تاریخچه…</section>';
  host.append(dialog);dialog.showModal();
  supabase.from('collaboration_request_events').select('created_at,event_type,changed_fields,old_values,new_values').eq('request_id',r.id).order('created_at',{ascending:false}).limit(50).then(({data,error})=>{
   const box=dialog.querySelector('#cr-history');if(!box)return;
   if(error){box.textContent='تاریخچه در دسترس نیست: '+error.message;return}
   box.innerHTML='<h4>تاریخچه تغییرات</h4>'+((data||[]).map(ev=>'<p><b>'+esc(ev.event_type)+'</b> · '+esc(new Date(ev.created_at).toLocaleString('fa-IR'))+'<br><small>'+esc((ev.changed_fields||[]).join('، '))+'</small></p>').join('')||'<p>هنوز سابقه‌ای ثبت نشده است.</p>');
  }).catch(()=>{const box=dialog.querySelector('#cr-history');if(box)box.textContent='تاریخچه بارگذاری نشد'});
  dialog.querySelector('form').onsubmit=async e=>{
   if(e.submitter?.value!=='save')return;e.preventDefault();
   const d=Object.fromEntries(new FormData(e.currentTarget));d.call_count=Number(d.call_count);
   if(!requestTypeOptions.includes(d.request_type)){message('نوع درخواست نامعتبر است');return}
   if(!requestStatusLabels.includes(d.request_status)){message('وضعیت درخواست نامعتبر است');return}
   if(isManager&&d.owner_auth_id){const p=expertProfiles.find(x=>x.id===d.owner_auth_id);d.expert_name=p?(p.display_name||p.username):'مدیر'}else delete d.owner_auth_id;
   if(!Number.isInteger(d.call_count)||d.call_count<0){message('تعداد تماس نامعتبر است');return}
   let q=supabase.from('collaboration_requests').update(d).eq('id',r.id);if(!isManager)q=q.eq('owner_auth_id',userId);
   const {error}=await q;if(error){message('خطا در ذخیره: '+error.message);return}
   dialog.close();await load();
  };
  dialog.onclose=()=>dialog.remove();
 }
 el('cr-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(!XLSX?.read)throw Error('کتابخانه اکسل بارگذاری نشده است');if(file.size>10*1024*1024)throw Error('حداکثر حجم فایل ۱۰ مگابایت است');const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});const sheet=wb.Sheets.CRM||wb.Sheets[wb.SheetNames[0]];if(!sheet)throw Error('شیت قابل خواندن نیست');const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false});const parsed=parseRows(rows);if(!parsed.length)throw Error('هیچ ردیف داده‌ای پیدا نشد');const targetOwner=el('cr-import-owner').value||(!isManager?userId:'');if(!targetOwner)throw Error('برای فایل، مالک را انتخاب کنید');const ownerLabel=targetOwner===userId?(isManager?'مدیر':'شما'):(expertProfiles.find(p=>p.id===targetOwner)?.display_name||'کارشناس');if(!global.confirm(parsed.length+' درخواست به نام '+ownerLabel+' ثبت شود؟'))return;let existingQuery=supabase.from('collaboration_requests').select('external_id');if(!isManager)existingQuery=existingQuery.eq('owner_auth_id',userId);const existing=await existingQuery.in('external_id',parsed.map(r=>r.external_id));if(existing.error)throw existing.error;const known=new Set((existing.data||[]).map(r=>r.external_id));const fresh=parsed.filter(r=>!known.has(r.external_id));const skipped=parsed.length-fresh.length;if(!fresh.length){message('تمام '+skipped+' ردیف قبلاً ثبت شده‌اند؛ هیچ اطلاعاتی بازنویسی نشد');return}for(let i=0;i<fresh.length;i+=100){const payload=fresh.slice(i,i+100).map(r=>({...r,owner_auth_id:targetOwner}));const {error}=await supabase.from('collaboration_requests').insert(payload);if(error)throw error}await load();message(fresh.length.toLocaleString('fa-IR')+' درخواست جدید ثبت شد؛ '+skipped+' ردیف تکراری بدون بازنویسی رد شد')}catch(err){message('خطا: '+(err.message||String(err)))}finally{e.target.value=''}};
 ['cr-search','cr-province','cr-result','cr-stage','cr-priority','cr-expert','cr-category','cr-type'].forEach(id=>el(id).addEventListener(id==='cr-search'?'input':'change',render));
 ['cr-followup-from','cr-followup-to','cr-followup-status'].forEach(id=>el(id).addEventListener('change',renderFollowups));
 if(isManager)el('cr-followup-expert').addEventListener('change',renderFollowups);
 host.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render()});
 el('cr-export-employment').onclick=()=>{const rows=records.filter(r=>r.request_type==='employment').map(r=>({شناسه:r.external_id,متقاضی:r.company,تلفن:r.phone,استان:r.province,کارشناس:r.expert_name,مالک:ownerName(r.owner_auth_id),وضعیت:r.request_status||'جدید',پیگیری:r.next_followup_text,اقدام:r.next_action,توضیحات:r.notes}));if(!XLSX?.utils?.json_to_sheet||!XLSX?.writeFile){message('کتابخانه اکسل در دسترس نیست');return}const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'استخدامی');XLSX.writeFile(wb,'managernegar-employment-requests.xlsx');message(rows.length.toLocaleString('fa-IR')+' درخواست استخدامی خروجی گرفته شد')};
 el('cr-reload').onclick=()=>load().catch(e=>message('خطا در دریافت اطلاعات: '+e.message));
 el('cr-followup-reload').onclick=()=>loadFollowups().catch(e=>message('خطا در دریافت پیگیری‌ها: '+e.message));
 el('cr-export-daily').onclick=exportDailyReport;
 load().catch(e=>message('خطا در اتصال دیتابیس درخواست همکاری: '+e.message));
}
global.OnboxCollaborationRequests={mount,parseRows,schema};
})(window);
