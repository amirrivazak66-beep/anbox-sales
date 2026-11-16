/* Collaboration requests CRM module. */
(function(global){
'use strict';
const schema=[
 ['external_id','شناسه',['شناسه','کد','کد درخواست','شماره','ردیف']],
 ['request_type','نوع درخواست',[]],
 ['request_status','وضعیت درخواست',[]],
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
 .cr-wrap{color:var(--txt,#e2e8f0);direction:rtl}.cr-head{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:18px}.cr-actions{display:flex;gap:8px;flex-wrap:wrap}.cr-btn{border:1px solid var(--bd, #334155);border-radius:10px;padding:10px 14px;background:#2563eb;color:white;cursor:pointer;font:inherit}.cr-btn.alt{background:transparent;color:inherit}.cr-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.cr-kpi,.cr-panel{background:var(--card,rgba(15,23,42,.65));border:1px solid var(--bd,rgba(59,130,246,.18));border-radius:14px;padding:16px;margin-bottom:14px}.cr-kpi small,.cr-muted{color:var(--txt2,#94a3b8)}.cr-kpi strong{display:block;font-size:25px;margin-top:7px}.cr-gauges{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.cr-gauge{width:132px;height:132px;margin:12px auto;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--g) calc(var(--v)*1%),rgba(148,163,184,.18) 0);position:relative}.cr-gauge:before{content:'';position:absolute;inset:12px;border-radius:50%;background:#111c31}.cr-gauge b{z-index:1;font-size:23px}.cr-filters{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:9px}.cr-filters input,.cr-filters select,.cr-edit input,.cr-edit select{width:100%;padding:10px;border-radius:9px;border:1px solid var(--bd);background:rgba(15,23,42,.75);color:inherit;font:inherit}.cr-table{overflow:auto}.cr-table table{width:100%;min-width:760px;border-collapse:collapse}.cr-table th,.cr-table td{text-align:right;padding:11px;border-bottom:1px solid var(--bd);font-size:13px}.cr-pill{padding:4px 8px;border-radius:18px;background:rgba(59,130,246,.18)}.cr-edit{max-width:680px;width:95%;max-height:85vh;overflow:auto;background:#101b30;color:#fff;border:1px solid var(--bd);border-radius:14px;padding:18px;margin:auto}.cr-edit label{display:block;margin:10px 0}.cr-edit button{margin-top:10px}.cr-status{margin:8px 0;min-height:22px;color:#93c5fd}@media(max-width:850px){.cr-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cr-gauges{grid-template-columns:1fr}.cr-filters{grid-template-columns:repeat(2,minmax(0,1fr))}}
 </style>
 <div class="cr-wrap">
 <div class="cr-head"><div><h2>🤝 درخواست همکاری</h2><p class="cr-muted">مدیریت درخواست‌های همکاری کارشناسان</p></div>
 <div class="cr-actions"><label class="cr-btn" for="cr-file">⬆ آپلود اکسل درخواست همکاری</label><input hidden type="file" id="cr-file" accept=".xlsx,.xls"><select id="cr-import-owner" aria-label="مالک فایل"></select><button class="cr-btn alt" id="cr-export-employment">خروجی استخدامی Excel</button><button class="cr-btn alt" id="cr-reload">به‌روزرسانی</button></div></div>
 <p class="cr-status" id="cr-message" role="status" aria-live="polite"></p>
 <div class="cr-grid" id="cr-kpis"></div>
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
 el('cr-table').innerHTML='<table><thead><tr><th>شرکت/متقاضی</th><th>نوع درخواست</th><th>استان</th><th>تلفن</th><th>وضعیت درخواست</th><th>پیگیری بعدی</th><th>مالک</th><th>عملیات</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(r.company)+'</td><td><span class="cr-pill">'+esc(requestTypeLabels[r.request_type||'unclassified'])+'</span></td><td>'+esc(r.province)+'</td><td>'+esc(r.phone)+'</td><td><span class="cr-pill">'+esc(r.request_status||r.sales_stage)+'</span></td><td>'+esc(r.next_followup_text)+'</td><td>'+esc(ownerName(r.owner_auth_id))+'</td><td><button class="cr-btn alt" data-edit="'+esc(r.id)+'">ویرایش</button></td></tr>').join('')+'</tbody></table>';
 host.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(records.find(r=>String(r.id)===b.dataset.edit)));
 }
 async function load(){if(isManager){const p=await supabase.from('profiles').select('id,display_name,username,role').eq('role','sales').order('display_name');if(p.error)throw p.error;expertProfiles=p.data||[]}let q=supabase.from('collaboration_requests').select('*').order('created_at',{ascending:false}).limit(2000);if(!isManager)q=q.eq('owner_auth_id',userId);const {data,error}=await q;if(error)throw error;records=data||[];fill('cr-province',distinct('province'),'همه استان‌ها');fill('cr-result',distinct('call_result'),'همه نتایج تماس');fill('cr-stage',distinct('request_status'),'همه وضعیت‌ها');fill('cr-priority',distinct('priority'),'همه اولویت‌ها');fill('cr-expert',distinct('expert_name'),'همه کارشناسان');fill('cr-category',distinct('sales_category'),'همه دسته‌ها');const ownerSelect=el('cr-import-owner');ownerSelect.innerHTML=(isManager?'<option value="">انتخاب مالک فایل</option>':'')+(isManager?expertProfiles.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.display_name||p.username)+'</option>').join(''):'<option value="'+esc(userId)+'">درخواست‌های من</option>')+(isManager?'<option value="'+esc(userId)+'">مدیر</option>':'');if(!isManager)ownerSelect.value=userId;el('cr-export-employment').hidden=!isManager;render();message('اطلاعات به‌روز شد: '+records.length.toLocaleString('fa-IR')+' درخواست');}
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
 el('cr-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(!XLSX?.read)throw Error('کتابخانه اکسل بارگذاری نشده است');if(file.size>10*1024*1024)throw Error('حداکثر حجم فایل ۱۰ مگابایت است');const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});const sheet=wb.Sheets.CRM||wb.Sheets[wb.SheetNames[0]];if(!sheet)throw Error('شیت قابل خواندن نیست');const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false});const parsed=parseRows(rows);if(!parsed.length)throw Error('هیچ ردیف داده‌ای پیدا نشد');const targetOwner=el('cr-import-owner').value||(!isManager?userId:'');if(!targetOwner)throw Error('برای فایل، مالک را انتخاب کنید');const ownerLabel=targetOwner===userId?'مدیر':(expertProfiles.find(p=>p.id===targetOwner)?.display_name||'کارشناس');if(!global.confirm(parsed.length+' درخواست به نام '+ownerLabel+' ثبت شود؟'))return;const existing=await supabase.from('collaboration_requests').select('external_id').eq('owner_auth_id',targetOwner).in('external_id',parsed.map(r=>r.external_id));if(existing.error)throw existing.error;const known=new Set((existing.data||[]).map(r=>r.external_id));const fresh=parsed.filter(r=>!known.has(r.external_id));const skipped=parsed.length-fresh.length;if(!fresh.length){message('تمام '+skipped+' ردیف قبلاً ثبت شده‌اند؛ هیچ اطلاعاتی بازنویسی نشد');return}for(let i=0;i<fresh.length;i+=100){const payload=fresh.slice(i,i+100).map(r=>({...r,owner_auth_id:targetOwner}));const {error}=await supabase.from('collaboration_requests').insert(payload);if(error)throw error}await load();message(fresh.length.toLocaleString('fa-IR')+' درخواست جدید ثبت شد؛ '+skipped+' ردیف تکراری بدون بازنویسی رد شد')}catch(err){message('خطا: '+(err.message||String(err)))}finally{e.target.value=''}};
 ['cr-search','cr-province','cr-result','cr-stage','cr-priority','cr-expert','cr-category','cr-type'].forEach(id=>el(id).addEventListener(id==='cr-search'?'input':'change',render));
 host.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render()});
 el('cr-export-employment').onclick=()=>{const rows=records.filter(r=>r.request_type==='employment').map(r=>({شناسه:r.external_id,متقاضی:r.company,تلفن:r.phone,استان:r.province,کارشناس:r.expert_name,مالک:ownerName(r.owner_auth_id),وضعیت:r.request_status||'جدید',پیگیری:r.next_followup_text,اقدام:r.next_action,توضیحات:r.notes}));if(!XLSX?.utils?.json_to_sheet||!XLSX?.writeFile){message('کتابخانه اکسل در دسترس نیست');return}const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'استخدامی');XLSX.writeFile(wb,'managernegar-employment-requests.xlsx');message(rows.length.toLocaleString('fa-IR')+' درخواست استخدامی خروجی گرفته شد')};
 el('cr-reload').onclick=()=>load().catch(e=>message('خطا در دریافت اطلاعات: '+e.message));
 load().catch(e=>message('خطا در اتصال دیتابیس درخواست همکاری: '+e.message));
}
global.OnboxCollaborationRequests={mount,parseRows,schema};
})(window);
