/* ManagerNegar Phase 3 management analytics */
(function(global){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fa=n=>Number(n||0).toLocaleString('fa-IR');
const key=d=>{if(!d)return '';const x=new Date(d);return Number.isNaN(x.getTime())?'':x.toISOString().slice(0,10)};
const fmt=d=>d?new Date(d).toLocaleDateString('fa-IR'):'—';
const group=(rows,k)=>{const m=new Map();rows.forEach(r=>{const v=String(r[k]??'').trim()||'ثبت‌نشده';m.set(v,(m.get(v)||0)+1)});return [...m.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'fa'))};
const card=(label,value,note='')=>'<article class="p3-kpi"><small>'+esc(label)+'</small><strong>'+fa(value)+'</strong>'+(note?'<span>'+esc(note)+'</span>':'')+'</article>';
const bars=(title,items,total)=>'<section class="p3-card"><h3>'+esc(title)+'</h3>'+(items.length?items.map(([n,v])=>'<div class="p3-bar-row"><div><span>'+esc(n)+'</span><b>'+fa(v)+'</b></div><div class="p3-track"><i style="width:'+Math.max(1,Math.round(v/(total||1)*100))+'%"></i></div></div>').join(''):'<p class="p3-muted">داده‌ای ثبت نشده است.</p>')+'</section>';
function mount(host,{supabase,userId,isManager=false,XLSX=global.XLSX}={}){
 if(!host||!supabase||!userId)throw Error('اتصال و هویت کاربر الزامی است');
 host.dir='rtl';if(!isManager){host.innerHTML='<section class="p3-card">گزارش مدیریتی فقط برای مدیر سیستم قابل مشاهده است.</section>';return;}
 host.innerHTML=\`
 <style>
 .p3-wrap{direction:rtl;color:var(--txt,#e7eefb)}.p3-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:8px 0 16px}.p3-actions,.p3-filters{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.p3-btn{border:1px solid var(--bd,#263b59);border-radius:9px;background:#1769e8;color:#fff;padding:9px 13px;font:inherit;cursor:pointer}.p3-btn.alt{background:transparent;color:inherit}.p3-filters{padding:13px;background:var(--card,rgba(15,28,48,.7));border:1px solid var(--bd);border-radius:12px;margin-bottom:14px}.p3-filters label{display:grid;gap:4px;color:var(--txt2);font-size:11px}.p3-filters input,.p3-filters select{min-width:145px;max-width:100%;padding:9px;border-radius:8px;border:1px solid var(--bd);background:#101d32;color:inherit;font:inherit}.p3-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin:13px 0}.p3-kpi,.p3-card{background:var(--card,rgba(15,28,48,.7));border:1px solid var(--bd,#263b59);border-radius:13px;padding:15px;min-width:0}.p3-kpi small,.p3-kpi span,.p3-muted{display:block;color:var(--txt2,#94a3b8);font-size:11px}.p3-kpi strong{display:block;font-size:27px;margin:7px 0}.p3-kpi span{line-height:1.8}.p3-layout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin:13px 0}.p3-card h3{font-size:15px;margin:0 0 13px}.p3-bar-row{margin:11px 0}.p3-bar-row>div:first-child{display:flex;justify-content:space-between;gap:8px;font-size:12px}.p3-track{height:8px;border-radius:8px;background:#23344c;margin-top:6px;overflow:hidden}.p3-track i{display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,#0d9488,#38bdf8)}.p3-table{overflow:auto}.p3-table table{width:100%;border-collapse:collapse;min-width:620px;font-size:12px}.p3-table th,.p3-table td{padding:10px;border-bottom:1px solid var(--bd);text-align:right;white-space:nowrap}.p3-note{border:1px solid rgba(245,158,11,.35);background:rgba(245,158,11,.07);border-radius:10px;padding:11px 13px;color:var(--txt2);font-size:12px;line-height:1.9;margin:12px 0}.p3-status{font-size:12px;color:var(--txt2);min-height:22px}.p3-section-title{margin:22px 0 10px;font-size:17px}@media(max-width:850px){.p3-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.p3-layout{grid-template-columns:1fr}}@media(max-width:480px){.p3-grid{grid-template-columns:1fr 1fr}.p3-filters>*{flex:1 1 130px}}
 </style>
 <div class="p3-wrap">
 <div class="p3-head"><div><h2 style="margin:0">📈 تحلیل و گزارش مدیریتی</h2><p class="p3-muted">تحلیل درخواست‌های همکاری، قیف تجاری و لیدهای استخدامی</p></div><div class="p3-actions"><button class="p3-btn alt" id="p3-refresh">به‌روزرسانی</button><button class="p3-btn alt" id="p3-export">خروجی Excel</button><button class="p3-btn" id="p3-pdf">چاپ / ذخیره PDF</button></div></div>
 <div class="p3-filters"><label>از تاریخ<input type="date" id="p3-from"></label><label>تا تاریخ<input type="date" id="p3-to"></label><label>نوع درخواست<select id="p3-type"><option value="all">همه انواع</option><option value="commercial">تجاری</option><option value="employment">استخدامی</option><option value="unclassified">تعیین‌نشده</option></select></label><label>کارشناس مسئول<select id="p3-owner"><option value="">همه کارشناسان</option></select></label><label>وضعیت درخواست<select id="p3-status"><option value="">همه وضعیت‌ها</option></select></label></div>
 <div class="p3-status" id="p3-status-msg">در حال دریافت داده‌ها…</div><h3 class="p3-section-title">شاخص‌های کلیدی عملکرد</h3><div class="p3-grid" id="p3-kpis"></div><div class="p3-note" id="p3-quality"></div>
 <div class="p3-layout"><div id="p3-funnel"></div><div id="p3-owner-report"></div></div><div class="p3-layout"><div id="p3-province"></div><div id="p3-category"></div></div><div class="p3-layout"><div id="p3-results"></div><div id="p3-overdue"></div></div>
 <h3 class="p3-section-title">لیدهای استخدامی و ارجاع منابع انسانی</h3><div class="p3-grid" id="p3-hr-kpis"></div><section class="p3-card"><div class="p3-table" id="p3-hr-table"></div></section>
 <h3 class="p3-section-title">خلاصه مدیریتی و کیفیت داده</h3><section class="p3-card" id="p3-insights"></section></div>\`;
 const $=id=>host.querySelector('#'+id);let requests=[],followups=[],profiles=[],filtered=[],last=null;
 const status=t=>{$('p3-status-msg').textContent=t};
 const inRange=r=>{const d=key(r.created_at);return (!$('p3-from').value||d>=$('p3-from').value)&&(!$('p3-to').value||d<=$('p3-to').value)};
 function filter(){const type=$('p3-type').value,owner=$('p3-owner').value,st=$('p3-status').value;filtered=requests.filter(r=>inRange(r)&&(type==='all'||r.request_type===type)&&(!owner||r.owner_auth_id===owner)&&(!st||r.request_status===st));render();}
 function render(){
 const all=filtered,commercial=all.filter(r=>r.request_type==='commercial'),employment=all.filter(r=>r.request_type==='employment'),unknown=all.filter(r=>r.request_type==='unclassified'),classified=all.length-unknown.length;
 const hr=employment.filter(r=>r.request_status==='ارجاع به منابع انسانی'),complete=commercial.filter(r=>r.request_status==='تکمیل‌شده'||/عقد قرارداد|قرارداد نهایی/.test(r.sales_stage||'')),rejected=commercial.filter(r=>r.request_status==='ردشده');
 const related=followups.filter(f=>all.some(r=>r.id===f.request_id)),late=related.filter(f=>!f.completed_at&&f.due_at&&new Date(f.due_at).getTime()<Date.now()),open=related.filter(f=>!f.completed_at);
 const name=id=>{const p=profiles.find(x=>x.id===id);return p?.display_name||p?.username||'بدون کارشناس'};
 const followMap=new Map();related.forEach(f=>{if(!followMap.has(f.request_id))followMap.set(f.request_id,[]);followMap.get(f.request_id).push(f)});
 $('p3-kpis').innerHTML=[card('کل درخواست‌ها',all.length),card('درخواست تجاری',commercial.length),card('درخواست استخدامی',employment.length),card('تعیین‌نشده',unknown.length),card('تکمیل قرارداد / فروش',complete.length),card('ردشده',rejected.length),card('نرخ تبدیل تجاری',commercial.length?Math.round(complete.length/commercial.length*100)+'٪':'—','تکمیل‌شده ÷ کل درخواست تجاری'),card('نرخ تعیین نوع',all.length?Math.round(classified/all.length*100)+'٪':'—','درصد درخواست‌های دارای نوع مشخص'),card('پیگیری معوق',late.length)].join('');
 $('p3-funnel').innerHTML=bars('قیف درخواست‌های تجاری بر اساس مرحله ثبت‌شده',group(commercial,'sales_stage'),commercial.length);
 const om=new Map();commercial.forEach(r=>{const n=name(r.owner_auth_id);if(!om.has(n))om.set(n,{requests:0,completed:0,rejected:0,calls:0,followups:0});const x=om.get(n);x.requests++;if(r.request_status==='تکمیل‌شده'||/عقد قرارداد|قرارداد نهایی/.test(r.sales_stage||''))x.completed++;if(r.request_status==='ردشده')x.rejected++;x.calls+=Number(r.call_count||0);x.followups+=(followMap.get(r.id)||[]).length});
 const owners=[...om.entries()].sort((a,b)=>b[1].requests-a[1].requests);
 $('p3-owner-report').innerHTML='<section class="p3-card"><h3>مقایسه عملکرد کارشناسان تجاری</h3><div class="p3-table"><table><thead><tr><th>کارشناس</th><th>درخواست</th><th>تماس ثبت‌شده</th><th>پیگیری</th><th>تکمیل</th><th>ردشده</th></tr></thead><tbody>'+owners.map(([n,x])=>'<tr><td>'+esc(n)+'</td><td>'+fa(x.requests)+'</td><td>'+fa(x.calls)+'</td><td>'+fa(x.followups)+'</td><td>'+fa(x.completed)+'</td><td>'+fa(x.rejected)+'</td></tr>').join('')+'</tbody></table></div></section>';
 $('p3-province').innerHTML=bars('توزیع درخواست‌های تجاری بر اساس استان',group(commercial,'province').slice(0,12),commercial.length);
 $('p3-category').innerHTML=bars('توزیع درخواست‌های تجاری بر اساس دسته فروش',group(commercial,'sales_category').slice(0,12),commercial.length);
 const failed=group(commercial.filter(r=>r.request_status==='ردشده'||/عدم توافق|رد|ناموفق/.test(r.call_result||'')),'call_result').slice(0,10);
 $('p3-results').innerHTML=bars('نتایج تماس / دلایل ثبت‌شده برای موارد ناموفق',failed,commercial.length);
 $('p3-overdue').innerHTML=bars('پیگیری‌های باز و معوق',[['باز',open.length],['عقب‌افتاده',late.length],['تکمیل‌شده',related.filter(f=>f.completed_at).length]],Math.max(1,open.length));
 $('p3-hr-kpis').innerHTML=[card('کل لید استخدامی',employment.length),card('ارجاع به منابع انسانی',hr.length),card('در انتظار ارجاع',employment.length-hr.length)].join('');
 $('p3-hr-table').innerHTML=employment.length?'<table><thead><tr><th>شناسه</th><th>نام / شرکت</th><th>تلفن</th><th>کارشناس</th><th>وضعیت</th><th>تاریخ</th></tr></thead><tbody>'+employment.map(r=>'<tr><td>'+esc(r.external_id)+'</td><td>'+esc(r.company)+'</td><td>'+esc(r.phone)+'</td><td>'+esc(name(r.owner_auth_id))+'</td><td>'+esc(r.request_status)+'</td><td>'+esc(fmt(r.created_at))+'</td></tr>').join('')+'</tbody></table>':'<p class="p3-muted">در بازه انتخاب‌شده لید استخدامی وجود ندارد.</p>';
 const notes=[];if(unknown.length)notes.push('تعداد '+fa(unknown.length)+' درخواست هنوز تعیین نوع نشده‌اند؛ نرخ تبدیل تجاری نماینده کل ورودی‌ها نیست.');if(!commercial.length)notes.push('در این فیلتر درخواست تجاری برای محاسبه نرخ تبدیل وجود ندارد.');if(commercial.length&&commercial.every(r=>!r.sales_stage||r.sales_stage==='جدید'))notes.push('مرحله قیف فروش هنوز برای بیشتر درخواست‌های تجاری تکمیل نشده است.');if(!related.length)notes.push('هنوز رویداد پیگیری در جدول فاز دوم ثبت نشده؛ شمارنده تماس از درخواست‌ها خوانده می‌شود.');if(employment.length&&!hr.length)notes.push('لید استخدامی وجود دارد اما هنوز ارجاعی به منابع انسانی ثبت نشده است.');
 $('p3-quality').textContent='کیفیت داده: '+(notes.length?notes.join(' '):'برای فیلتر انتخاب‌شده مانع عمده‌ای در داده‌های گزارش شناسایی نشد.');
 $('p3-insights').innerHTML='<ul style="margin:0;padding-right:20px;line-height:2">'+(notes.length?notes.map(x=>'<li>'+esc(x)+'</li>').join(''):'<li>شاخص‌ها بر اساس داده‌های ثبت‌شده محاسبه شده‌اند.</li>')+'</ul><p class="p3-muted">نرخ تبدیل قراردادی فقط با وضعیت «تکمیل‌شده» یا مرحله حاوی «عقد قرارداد» محاسبه می‌شود؛ در صورت ناکافی بودن داده، نتیجه نباید به‌عنوان نرخ قطعی تفسیر شود.</p>';
 last={all,commercial,employment,unknown,late,owners,failed};
 }
 async function load(){
 status('در حال دریافت درخواست‌ها، پیگیری‌ها و کارشناسان…');
 const [rq,fu,pr]=await Promise.all([supabase.from('collaboration_requests').select('*').order('created_at',{ascending:false}).limit(5000),supabase.from('collaboration_request_followups').select('*').order('created_at',{ascending:false}).limit(10000),supabase.from('profiles').select('id,username,display_name,role').eq('role','sales')]);
 if(rq.error)throw rq.error;if(fu.error)throw fu.error;if(pr.error)throw pr.error;
 requests=rq.data||[];followups=fu.data||[];profiles=pr.data||[];
 const owners=new Map();profiles.forEach(p=>owners.set(p.id,p.display_name||p.username));requests.forEach(r=>{if(r.owner_auth_id&&!owners.has(r.owner_auth_id))owners.set(r.owner_auth_id,'کارشناس نامشخص')});
 $('p3-owner').innerHTML='<option value="">همه کارشناسان</option>'+[...owners.entries()].map(([id,n])=>'<option value="'+esc(id)+'">'+esc(n)+'</option>').join('');
 $('p3-status').innerHTML='<option value="">همه وضعیت‌ها</option>'+[...new Set(requests.map(r=>r.request_status).filter(Boolean))].sort().map(s=>'<option value="'+esc(s)+'">'+esc(s)+'</option>').join('');
 filter();status(fa(requests.length)+' درخواست، '+fa(followups.length)+' پیگیری و '+fa(profiles.length)+' کارشناس دریافت شد.');
 }
 function exportExcel(){
 if(!last)return;if(!XLSX?.utils?.book_new||!XLSX?.writeFile){status('کتابخانه Excel بارگذاری نشده است.');return;}
 const wb=XLSX.utils.book_new(),add=(name,rows)=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),name);
 add('خلاصه مدیریتی',[{شاخص:'کل درخواست‌ها',مقدار:last.all.length},{شاخص:'تجاری',مقدار:last.commercial.length},{شاخص:'استخدامی',مقدار:last.employment.length},{شاخص:'تعیین‌نشده',مقدار:last.unknown.length},{شاخص:'پیگیری معوق',مقدار:last.late.length}]);
 add('درخواست‌ها',last.all.map(r=>({شناسه:r.external_id,نام_شرکت:r.company,تلفن:r.phone,نوع:r.request_type,وضعیت:r.request_status,استان:r.province,دسته_فروش:r.sales_category,کارشناس:r.expert_name,مرحله:r.sales_stage,نتیجه_تماس:r.call_result,تعداد_تماس:r.call_count,تاریخ_ثبت:r.created_at})));
 add('لیدهای استخدامی',last.employment.map(r=>({شناسه:r.external_id,نام:r.company,تلفن:r.phone,کارشناس:r.expert_name,وضعیت:r.request_status,تاریخ:r.created_at})));
 add('عملکرد کارشناسان',last.owners.map(([کارشناس,x])=>({کارشناس,...x})));
 XLSX.writeFile(wb,'modirnegar-phase3-management-report.xlsx');status('فایل Excel با '+fa(last.all.length)+' درخواست ساخته شد.');
 }
 function exportPdf(){
 if(!last)return;const w=global.open('','_blank');if(!w){status('پنجره چاپ مسدود شد؛ اجازه پنجره جدید را بدهید.');return;}
 const body=$('.p3-wrap').innerHTML.replace(/<style>[\s\S]*?<\/style>/,'');
 w.document.write('<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>گزارش مدیریتی مدیرنگر</title><style>body{font:12px Tahoma;direction:rtl;color:#17243a;padding:24px}.p3-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.p3-kpi,.p3-card{border:1px solid #ccd5e2;border-radius:8px;padding:10px;margin:8px 0;break-inside:avoid}.p3-kpi strong{display:block;font-size:20px}.p3-layout{display:grid;grid-template-columns:1fr 1fr;gap:8px}.p3-bar-row{margin:8px}.p3-track{height:7px;background:#ddd}.p3-track i{display:block;height:7px;background:#1675d1}.p3-table table{width:100%;border-collapse:collapse}.p3-table th,.p3-table td{border:1px solid #ddd;padding:6px;text-align:right;font-size:10px}.p3-muted,.p3-kpi span{color:#555}.p3-note{padding:10px;border:1px solid #ddd;margin:10px 0}</style><body>'+body+'<script>window.onload=()=>window.print()<\/script></body></html>');w.document.close();
 }
 ['p3-from','p3-to','p3-type','p3-owner','p3-status'].forEach(id=>$(id).addEventListener('change',filter));
 $('p3-refresh').onclick=()=>load().catch(e=>{console.error(e);status('خطا در دریافت داده‌ها: '+e.message)});
 $('p3-export').onclick=exportExcel;$('p3-pdf').onclick=exportPdf;
 load().catch(e=>{console.error('Phase 3 analytics load failed',e);status('بارگذاری گزارش ناموفق بود: '+e.message)});
}
global.OnboxPhase3Analytics={mount};
})(window);