/* Collaboration requests: preview only. Requires reviewed Supabase schema and RLS before use. */
(function(global){
'use strict';
const headers=['شناسه','تلفن','شرکت','استان','ارسال ماهانه','دسته فروش','تاریخ ثبت','کارشناس','نتیجه تماس','مرحله فروش','اولویت','تعداد تماس','تاریخ آخرین تماس','پیگیری بعدی','اقدام بعدی','توضیحات'];
const fields=['external_id','phone','company','province','monthly_shipments','sales_category','registered_at_text','expert_name','call_result','sales_stage','priority','call_count','last_contact_text','next_followup_text','next_action','notes'];
const editable=['phone','company','province','monthly_shipments','sales_category','call_result','sales_stage','priority','call_count','last_contact_text','next_followup_text','next_action','notes'];
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').trim().replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
function parseRows(rows){
 if(!Array.isArray(rows)||rows.length<2)throw Error('شیت CRM خالی است');
 const cols=rows[0].map(norm);if(headers.some(h=>!cols.includes(h)))throw Error('ستون‌های مورد انتظار در شیت CRM یافت نشد');
 const result=rows.slice(1).filter(row=>row.some(v=>String(v??'').trim())).map((row,i)=>{
 const record={};headers.forEach((h,j)=>record[fields[j]]=norm(row[cols.indexOf(h)]));
 if(!record.external_id)throw Error('شناسه ردیف '+(i+2)+' خالی است');
 record.call_count=Number(record.call_count||0);
 if(!Number.isInteger(record.call_count)||record.call_count<0)throw Error('تعداد تماس نامعتبر است');
 return record;
 });const seen=new Set();for(const r of result){if(seen.has(r.external_id))throw Error('شناسه تکراری در اکسل: '+r.external_id);seen.add(r.external_id)}return result;
}
function mount(host,{supabase,userId,isManager=false,XLSX=global.XLSX}={}){
 if(!host||!supabase||!userId)throw Error('هویت کاربر و اتصال دیتابیس الزامی است');
 host.dir='rtl';host.innerHTML='<section class="card"><h2>🤝 درخواست همکاری</h2><p>بارگذاری فایل CRM، ویرایش اطلاعات و گزارش کارشناسان</p><label>فایل اکسل <input type="file" id="cr-file" accept=".xlsx,.xls"></label> <button id="cr-reload">به‌روزرسانی</button><p id="cr-message" role="status"></p></section><section class="card" id="cr-summary"></section><section class="card"><input id="cr-search" placeholder="جستجوی شرکت، تلفن یا شناسه"><div id="cr-table" style="overflow:auto"></div></section>';
 let records=[];const message=(t)=>host.querySelector('#cr-message').textContent=t;
 async function load(){
 let query=supabase.from('collaboration_requests').select('*').order('created_at',{ascending:false}).limit(1000);
 if(!isManager)query=query.eq('owner_auth_id',userId);
 const {data,error}=await query;if(error)throw error;records=data||[];render();
 }
 function render(){
 const q=norm(host.querySelector('#cr-search').value).toLowerCase();
 const rows=records.filter(r=>[r.company,r.phone,r.external_id].some(v=>norm(v).toLowerCase().includes(q)));
 const pct=n=>rows.length?Math.round(n*100/rows.length):0;
 const contacted=rows.filter(r=>Number(r.call_count)>0).length;
 const complete=rows.filter(r=>r.company&&r.phone&&r.province&&r.sales_stage&&r.call_result).length;
 const followup=rows.filter(r=>r.next_followup_text).length;
 host.querySelector('#cr-summary').textContent='تعداد: '+rows.length+' | نرخ تماس: '+pct(contacted)+'٪ | تکمیل اطلاعات: '+pct(complete)+'٪ | دارای پیگیری: '+pct(followup)+'٪ (بر اساس رکوردهای فیلترشده)';
 host.querySelector('#cr-table').innerHTML='<table style="width:100%;min-width:800px"><thead><tr><th>شناسه</th><th>شرکت</th><th>تلفن</th><th>استان</th><th>مرحله</th><th>پیگیری</th><th>عملیات</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+escapeHTML(r.external_id)+'</td><td>'+escapeHTML(r.company)+'</td><td>'+escapeHTML(r.phone)+'</td><td>'+escapeHTML(r.province)+'</td><td>'+escapeHTML(r.sales_stage)+'</td><td>'+escapeHTML(r.next_followup_text)+'</td><td><button class="cr-edit" data-id="'+escapeHTML(r.id)+'">ویرایش</button></td></tr>').join('')+'</tbody></table>';
 host.querySelectorAll('.cr-edit').forEach(button=>button.onclick=async()=>{
 const r=records.find(x=>String(x.id)===button.dataset.id);if(!r)return;
 const dialog=document.createElement('dialog');dialog.style.cssText='max-width:650px;width:95%;border:1px solid #ddd;border-radius:12px';
 dialog.innerHTML='<form method="dialog"><h3>ویرایش درخواست</h3>'+editable.map(k=>'<label style="display:block;margin:8px 0">'+escapeHTML(headers[fields.indexOf(k)])+' <input style="width:100%" name="'+k+'" value="'+escapeHTML(r[k])+'"></label>').join('')+'<button value="save">ذخیره</button> <button value="cancel">انصراف</button></form>';
 host.append(dialog);dialog.showModal();
 dialog.querySelector('form').onsubmit=async ev=>{
 if(ev.submitter?.value!=='save')return;ev.preventDefault();
 const data=Object.fromEntries(new FormData(ev.currentTarget));data.call_count=Number(data.call_count);
 if(!Number.isInteger(data.call_count)||data.call_count<0){global.alert('تعداد تماس نامعتبر است');return}
 let update=supabase.from('collaboration_requests').update(data).eq('id',r.id);
 if(!isManager)update=update.eq('owner_auth_id',userId);
 const {error}=await update;if(error){global.alert(error.message);return}dialog.close();dialog.remove();await load();
 };dialog.onclose=()=>dialog.remove();
 });
 }
 host.querySelector('#cr-search').oninput=render;
 host.querySelector('#cr-reload').onclick=()=>load().catch(e=>message('خطا: '+e.message));
 host.querySelector('#cr-file').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
 if(!XLSX?.read)throw Error('کتابخانه اکسل هنوز بارگذاری نشده');
 if(file.size>5*1024*1024)throw Error('حجم فایل بیشتر از ۵ مگابایت است');
 const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:false});
 if(!wb.Sheets.CRM)throw Error('شیت CRM یافت نشد');
 const parsed=parseRows(XLSX.utils.sheet_to_json(wb.Sheets.CRM,{header:1,defval:'',raw:false}));
 if(!parsed.length)throw Error('فایل رکوردی ندارد');
 if(!global.confirm(parsed.length+' درخواست وارد یا به‌روزرسانی شوند؟'))return;
 for(let i=0;i<parsed.length;i+=100){
 const payload=parsed.slice(i,i+100).map(r=>({...r,owner_auth_id:userId}));
 const {error}=await supabase.from('collaboration_requests').upsert(payload,{onConflict:'owner_auth_id,external_id'});
 if(error)throw Error('خطا در دسته '+(Math.floor(i/100)+1)+': '+error.message);
 }
 await load();message(parsed.length+' درخواست ثبت یا به‌روزرسانی شد');
 }catch(err){message('خطا: '+err.message)}finally{e.target.value=''}
 };
 load().catch(e=>message('دیتابیس این بخش هنوز آماده نیست: '+e.message));
}
global.OnboxCollaborationRequests={mount,parseRows,headers};
})(window);
