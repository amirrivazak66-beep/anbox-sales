/* Fast Persian date/time picker: native ISO values remain the source of truth. */
(function(){
'use strict';
const fa=new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'numeric',day:'numeric',timeZone:'UTC'});
const months=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const digits=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[+d]);
const parts=d=>{const p=Object.fromEntries(fa.formatToParts(d).filter(x=>x.type!=='literal').map(x=>[x.type,+x.value]));return {y:p.year,m:p.month,d:p.day};};
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const parse=s=>{const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?new Date(+m[1],+m[2]-1,+m[3],12):new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate(),12);};
const dateOf=(y,m,d)=>{const approx=new Date((y+621),2,20,12);for(let i=-380;i<=380;i++){const day=new Date(approx);day.setDate(approx.getDate()+i);const p=parts(new Date(Date.UTC(day.getFullYear(),day.getMonth(),day.getDate(),12)));if(p.y===y&&p.m===m&&p.d===d)return day;}return null;};
const jalali=d=>parts(new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),12)));
let active=null,selected=null,view=null,popup=null,clock='09:00';
function close(){if(popup)popup.remove();popup=null;active=null;}
function updateLabel(input){const btn=input._jalaliButton;if(!btn)return;const d=input.value?parse(input.value):null;const p=d?jalali(d):null;const time=input.type==='datetime-local'?(input.value.split('T')[1]||'').slice(0,5):'';btn.textContent=p?'📅 '+digits(p.y+'/'+String(p.m).padStart(2,'0')+'/'+String(p.d).padStart(2,'0'))+(time?'  ⏰ '+digits(time):''):'📅 انتخاب تاریخ'+(input.type==='datetime-local'?' و ساعت':'');}
function render(){
 if(!popup||!active)return;
 const start=dateOf(view.y,view.m,1);if(!start)return;
 const weekday=(start.getDay()+1)%7;
 const selectedIso=selected?iso(selected):'';
 let cells='';for(let i=0;i<weekday;i++)cells+='<span></span>';
 for(let day=1;day<=31;day++){const date=dateOf(view.y,view.m,day);if(!date)break;const val=iso(date);const disabled=(active.min&&val<active.min.slice(0,10))||(active.max&&val>active.max.slice(0,10));cells+='<button type="button" class="jp-day'+(val===selectedIso?' jp-selected':'')+'" data-day="'+day+'" '+(disabled?'disabled':'')+'>'+digits(day)+'</button>';}
 popup.innerHTML='<div class="jp-head"><button type="button" data-nav="-1" aria-label="ماه قبل">❯</button><strong>'+months[view.m-1]+' '+digits(view.y)+'</strong><button type="button" data-nav="1" aria-label="ماه بعد">❮</button></div><div class="jp-week">'+['ش','ی','د','س','چ','پ','ج'].map(x=>'<span>'+x+'</span>').join('')+'</div><div class="jp-days">'+cells+'</div><div class="jp-times"><strong>⏰ زمان</strong><div class="jp-presets"><button type="button" data-quick="now">امروز / اکنون</button><button type="button" data-quick="30">۳۰ دقیقه بعد</button><button type="button" data-quick="60">۱ ساعت بعد</button></div>'+(active.type==='datetime-local'?'<label>ساعت <input type="time" id="jp-clock" value="'+clock+'"></label>':'<small>این فیلد فقط تاریخ ذخیره می‌کند؛ ساعت در آن ثبت نمی‌شود.</small>')+'</div><div class="jp-actions"><button type="button" data-cancel>انصراف</button><button type="button" data-confirm>تأیید</button></div>';
}
function open(input){close();active=input;clock=(input.value.split('T')[1]||'09:00').slice(0,5);selected=parse(input.value);view=jalali(selected);popup=document.createElement('div');popup.className='jp-popup';popup.dir='rtl';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','انتخاب تاریخ شمسی و ساعت');const dialog=input.closest('dialog[open]');(dialog||document.body).appendChild(popup);render();const rect=input._jalaliButton.getBoundingClientRect();if(dialog){popup.classList.add('jp-in-dialog');popup.style.top='auto';popup.style.left='auto';}else{popup.style.top=Math.min(window.innerHeight-470,Math.max(8,rect.bottom+6))+'px';popup.style.left=Math.max(8,Math.min(rect.left,window.innerWidth-350))+'px';}}
function setQuick(minutes){const d=new Date(Date.now()+minutes*60000);selected=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);view=jalali(selected);render();if(active.type==='datetime-local'){clock=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');popup.querySelector('#jp-clock').value=clock;}}
document.addEventListener('change',e=>{if(e.target?.id==='jp-clock')clock=e.target.value;});
document.addEventListener('click',e=>{if(!popup)return;const t=e.target.closest('button');if(!popup.contains(e.target)&&e.target!==active._jalaliButton){close();return;}if(!t)return;
 if(t.hasAttribute('data-nav')){let m=view.m+Number(t.dataset.nav),y=view.y;if(m<1){m=12;y--;}if(m>12){m=1;y++;}view={y,m};render();}
 else if(t.hasAttribute('data-day')){selected=dateOf(view.y,view.m,+t.dataset.day);render();}
 else if(t.hasAttribute('data-quick'))setQuick(t.dataset.quick==='now'?0:Number(t.dataset.quick));
 else if(t.hasAttribute('data-cancel'))close();
 else if(t.hasAttribute('data-confirm')){const value=iso(selected)+(active.type==='datetime-local'?'T'+(clock):'');if((active.min&&value<active.min)||(active.max&&value>active.max))return;active.value=value;active.dispatchEvent(new Event('input',{bubbles:true}));active.dispatchEvent(new Event('change',{bubbles:true}));updateLabel(active);close();}
});
function enhance(input){if(input._jalaliButton||input.closest('.jp-popup'))return;const button=document.createElement('button');button.type='button';button.className='jp-trigger';input._jalaliButton=button;input.classList.add('jp-native');input.insertAdjacentElement('afterend',button);button.addEventListener('click',()=>open(input));input.addEventListener('change',()=>updateLabel(input));updateLabel(input);}
function scan(){document.querySelectorAll('input[type="date"],input[type="datetime-local"]').forEach(enhance);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.ManagerNegarJalaliPicker={scan,enhance};
function start(){scan();new MutationObserver(scan).observe(document.body,{subtree:true,childList:true});}
})();
