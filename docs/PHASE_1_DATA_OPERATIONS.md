# فاز اول — مدیریت و اصلاح اطلاعات درخواست همکاری

**وضعیت:** در حال توسعه روی شاخه `feature/phase-1-collaboration-operations`؛ هیچ تغییر production در این مرحله اعمال نشده است.

## تصمیم‌های تأییدشده مالک
- شروع فاز اول با محدوده و برآورد ۵ تا ۶ روز کاری.
- کارشناس نوع هر رکورد را تعیین می‌کند: تجاری یا استخدامی.
- رکورد استخدامی از قیف و KPI تجاری جدا می‌شود؛ ارجاع به منابع انسانی و خروجی مدیریتی در فاز سوم انجام می‌شود.
- حفظ اطلاعات و ساختار سایر ماژول‌های مدیرنگر الزامی است.
- آپلود مجدد نباید ویرایش‌های دستی کارشناس را بدون تأیید بازنویسی کند.

## ممیزی فقط‌خواندنی Supabase در 2026-11-16
پروژه بررسی‌شده: `uaydruhkevdmvpyefdjm`.

- جدول `collaboration_requests`: تعداد ۲۴۳ رکورد.
- هر ۲۴۳ رکورد دارای `external_id` یکتا در کل جدول هستند.
- هیچ رکوردی فاقد owner، شناسه، تلفن، شرکت یا نام کارشناس نبود.
- هر ۲۴۳ رکورد در حال حاضر `sales_stage = 'جدید'` دارند.
- هر ۲۴۳ رکورد به یک پروفایل مدیر مالکیت دارند؛ هیچ‌کدام به پروفایل sales متصل نیستند.
- جدول `profiles`: یک مدیر و پنج کارشناس فروش.
- trigger فعلی `prevent_collaboration_owner_change` هر نوع تغییر `owner_auth_id` را ممنوع می‌کند؛ بنابراین حتی مدیر هم فعلاً نمی‌تواند مالک رکورد را تغییر دهد.
- جدول `leads` جداگانه ۸ رکورد دارد؛ این فاز فقط روی ماژول `collaboration_requests` کار می‌کند و جدول `leads` را تغییر نمی‌دهد.
- این بررسی فقط aggregate/schema/policy بود؛ هیچ مقدار شخصی یا متن رکوردها استخراج یا تغییر داده نشد.

## تغییرات کدی انجام‌شده در شاخه
- اضافه شدن گزینه‌های نوع درخواست: `unclassified`, `commercial`, `employment`.
- رکوردهای جدید واردشده از اکسل تا زمان تعیین نوع، `unclassified` می‌مانند.
- اضافه شدن فیلتر نوع درخواست و فیلد انتخاب نوع در فرم ویرایش.
- KPIهای تجاری فقط از رکوردهای طبقه‌بندی‌شده به‌عنوان `commercial` محاسبه می‌شوند.
- جدول فهرست، نوع درخواست را نشان می‌دهد.
- کنترل تخصیص مالک در فرم ویرایش مدیر اضافه شده؛ اما تا اصلاح trigger دیتابیس و تأیید/اجرای migration، تغییر مالک در production ممکن نیست.
- ورود اکسل به حالت insert-only تغییر کرده: شناسه‌های موجود برای همان مالک رد می‌شوند و رکورد قبلی با اطلاعات اکسل overwrite نمی‌شود.

## تغییر دیتابیس موردنیاز — فقط پیشنهاد، اجرا نشده
1. افزودن `request_type text not null default 'unclassified'` با CHECK روی سه مقدار مجاز. تمام ۲۴۳ رکورد موجود به‌طور پیش‌فرض «تعیین‌نشده» خواهند بود؛ هیچ‌کدام خودکار تجاری/استخدامی فرض نمی‌شوند.
2. اصلاح trigger مالکیت تا تغییر `owner_auth_id` فقط وقتی مجاز باشد که `public.is_crm_manager()` درست باشد؛ کارشناس نتواند مالکیت را تغییر دهد.
3. ایجاد جدول append-only برای رخدادهای درخواست (تغییر نوع، تخصیص مالک، تغییر مرحله و ویرایش‌های کلیدی) با RLS و actor برابر `auth.uid()`.
4. آزمون RLS با حساب مدیر و دو حساب کارشناس؛ بررسی اینکه کارشناس فقط رکوردهای خودش را می‌بیند و مدیر می‌تواند تخصیص دهد.

### SQL پیشنهادی برای بازبینی
```sql
alter table public.collaboration_requests
  add column if not exists request_type text not null default 'unclassified';

alter table public.collaboration_requests
  add constraint collaboration_requests_request_type_check
  check (request_type in ('unclassified','commercial','employment'));

create or replace function public.prevent_collaboration_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_auth_id is distinct from old.owner_auth_id
     and not (select public.is_crm_manager()) then
    raise exception 'Only CRM managers may reassign collaboration requests';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
```

این SQL به‌تنهایی audit log را ایجاد نمی‌کند؛ جدول رخدادها، policyها و trigger ثبت رخداد باید در migration جداگانه و پس از بازبینی اضافه شوند. هیچ‌یک از SQLهای بالا روی دیتابیس عملیاتی اجرا نشده‌اند.

## تست‌ها و محدودیت‌ها
- تست جدید `scripts/collaboration-requests-smoke.mjs` اضافه شده تا parse اکسل، پیش‌فرض تعیین‌نشده، فیلتر نوع و insert-only را بررسی کند.
- workflow موجود به اجرای تست جدید متصل شده است.
- GitHub Actions هنوز باید پس از باز شدن PR اجرا شود.
- تست مرورگر با Supabase mock و تست واقعی RLS با حساب‌های کاربری هنوز اجرا نشده‌اند.
- تغییرات تا زمان migration دیتابیس با schema production سازگارِ قابل انتشار نیستند؛ merge/deploy ممنوع است.

## گام بعدی
- اجرای CI و رفع خطاها.
- تکمیل migration استاندارد با Supabase CLI (در محیط فعلی CLI نصب نیست، پس migration file هنوز ساخته نشده).
- بازبینی و تأیید صریح مالک برای اجرای migration در Supabase production.
- تست RLS و تخصیص با حساب‌های واقعی.
- تکمیل پیش‌نمایش و گزارش نتیجه آپلود اکسل و صفحه‌بندی رکوردها.
