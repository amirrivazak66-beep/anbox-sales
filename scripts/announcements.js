(function(global){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const seenKey=id=>'managernegar-announcements-seen-'+id;
function readSeen(id){try{return JSON.parse(localStorage.getItem(seenKey(id))||'[]')}catch(_){return []}}
function markSeen(id,ids){try{localStorage.setItem(seenKey(id),JSON.stringify([...new Set([...readSeen(id),...ids])].slice(-500)))}catch(_){}}
async function refreshBadge(supabase,userId){
 if(!supabase||!userId)return;
 const {data,error}=await supabase.from('app_announcements').select('id').eq('published',true).limit(200);
 if(error)return;
 const unread=(data||[]).filter(x=>!readSeen(userId).includes(x.id)).length;
 const badge=document.getElementById('announcementBadge');if(badge){badge.textContent=unread?unread.toLocaleString('fa-IR'):'';badge.style.display=unread?'inline-block':'none';}
 const bell=document.querySelector('.ref-bell');if(bell)bell.title=unread?'اعلام‌های خوانده‌نشده: '+unread:'اعلام‌ها';
}
async function mount(host,{supabase,userId,isManager=false}={}){
 if(!host||!supabase||!userId)return;
 host.innerHTML='<div class="card"><h2 style="margin-bottom:12px">📣 اعلام‌ها و به‌روزرسانی‌های مدیرنگر</h2><div id="announcementsStatus">در حال دریافت اعلام‌ها…</div><div id="announcementsEditor"></div><div id="announcementsList"></div></div>';
 const status=host.querySelector('#announcementsStatus'),editor=host.querySelector('#announcementsEditor'),list=host.querySelector('#announcementsList');
 if(isManager){
  editor.innerHTML='<form id="announcementsForm" style="display:grid;gap:10px;margin:16px 0;padding:14px;border:1px solid var(--bd);border-radius:12px"><strong>ثبت اعلام جدید (فقط مدیر)</strong><input name="title" required minlength="3" maxlength="160" placeholder="عنوان اعلام" style="padding:12px;border-radius:8px"><textarea name="body" required minlength="3" maxlength="6000" rows="5" placeholder="متن به‌روزرسانی برای کاربران" style="padding:12px;border-radius:8px"></textarea><label><input type="checkbox" name="published" checked> انتشار برای همه کاربران</label><button class="btn" type="submit">ثبت اعلام</button></form>';
  editor.querySelector('form').onsubmit=async e=>{
   e.preventDefault();const form=e.currentTarget,button=form.querySelector('button'),values=new FormData(form);
   button.disabled=true;const {error}=await supabase.from('app_announcements').insert({title:String(values.get('title')||'').trim(),body:String(values.get('body')||'').trim(),published:values.has('published'),created_by:userId});
   button.disabled=false;if(error){status.textContent='خطا در ثبت: '+error.message;return}
   form.reset();status.textContent='اعلام ثبت شد.';await load();
  };
 }
 async function load(){
  const {data,error}=await supabase.from('app_announcements').select('id,title,body,published,created_at').order('created_at',{ascending:false}).limit(200);
  if(error){status.textContent='دریافت اعلام‌ها ناموفق بود: '+error.message;return}
  status.textContent=(data||[]).length?'آخرین اطلاعیه‌ها':'هنوز اعلامی ثبت نشده است.';
  list.innerHTML=(data||[]).map(a=>'<article style="border:1px solid var(--bd);padding:15px;border-radius:12px;margin:12px 0"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><strong>'+esc(a.title)+'</strong><small>'+esc(new Date(a.created_at).toLocaleString('fa-IR'))+(a.published?'':' · پیش‌نویس')+'</small></div><p style="white-space:pre-wrap;margin-top:10px;line-height:1.9">'+esc(a.body)+'</p>'+(isManager?'<button type="button" class="btn secondary" data-toggle="'+a.id+'" data-published="'+a.published+'" style="margin-top:10px">'+(a.published?'لغو انتشار':'انتشار')+'</button>':'')+'</article>').join('');
  if(isManager)list.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=async()=>{b.disabled=true;const {error}=await supabase.from('app_announcements').update({published:b.dataset.published!=='true',updated_at:new Date().toISOString()}).eq('id',Number(b.dataset.toggle));if(error){status.textContent=error.message;b.disabled=false;return}await load();});
  markSeen(userId,(data||[]).filter(a=>a.published).map(a=>a.id));await refreshBadge(supabase,userId);
 }
 await load();
}
global.ManagerNegarAnnouncements={mount,refreshBadge};
})(window);
