# ادامه کار — Session Handoff

این سند در پایان هر نشست با وضعیت واقعی مخزن به‌روز می‌شود. یادداشت‌های تاریخی جای بررسی وضعیت جاری GitHub و مخزن محلی را نمی‌گیرند.

## هدف ثابت
توسعهٔ یک محصول واحد با چهار ماژول تعریف‌شده در `PROJECT_SOURCE_OF_TRUTH.md`. داشبورد و قابلیت‌های CRM/فروش فعلی ماژول اول محصول‌اند و نباید صرفاً به‌دلیل تغییر معماری حذف شوند.

## وضعیت پایان نشست 2026-10-16
- `main` و `origin/main` بدون تغییر در `8a9e2eb` هستند.
- PR مستندات: [#32](https://github.com/amirrivazak66-beep/anbox-sales/pull/32)، شاخهٔ `codex/project-continuity-pack`، HEAD=`c105a03`، مقصد `main`؛ باز و merge نشده. شامل اسناد تداوم و تغییر CSV واردشده از تاریخچهٔ قبلی است.
- PR محصول: [#33](https://github.com/amirrivazak66-beep/anbox-sales/pull/33)، شاخهٔ `codex/manager-performance-alerts`، HEAD=`872923b`، مبنا `main`؛ باز و merge نشده.
- فایل‌های PR محصول: `dashboard.html`، `scripts/smoke-check.mjs`، `scripts/browser-smoke.mjs`.
- CSV بدون XLSX پیش از اصلاح فقط header صادر می‌کرد؛ اکنون ردیف‌های لید، quoting، BOM واقعی UTF-8 و CRLF دارد. مسیر XLSX و واردکردن CSV حفظ شده‌اند.
- صفحهٔ مدیرانهٔ تحلیل عملکرد اضافه شده است. تحقق هدف فقط برای KPI ثبت لید (با تاریخ معتبر) محاسبه می‌شود؛ شاخص‌های مالکیت کارشناس، مرحلهٔ قرارداد و لیدهای فاقد/عقب‌افتاده/دارای تاریخ نامعتبر فالوآپ بر داده‌های موجود تکیه دارند. هدف تعریف‌نشده، KPI مبهم و تاریخ نامعتبر به‌عنوان عملکرد واقعی یا صفر گزارش نمی‌شود.
- تست‌ها: `node scripts/smoke-check.mjs` موفق؛ `node --check scripts/browser-smoke.mjs` موفق؛ `git diff --check origin/main...HEAD` موفق. مرورگر اجرا نشد چون Playwright در محیط موجود نیست.
- هیچ اتصال، SQL، Migration یا تغییری در Supabase انجام نشد. PRها merge یا deploy نشده‌اند.

## گام دقیق بعدی
بازبینی PR محصول #33 با دادهٔ توسعهٔ تأییدشده و ارزیابی معنای KPIها/تاریخ‌های فالوآپ، بدون خواندن دیتابیس تولیدی. بعد از بازخورد، اصلاحات لازم را روی شاخهٔ محصولی و با تست انجام بده. تا زمان تأیید مالک، merge یا deploy نکن.

## شروع نشست بعدی
1. `AGENTS.md`، `docs/PROJECT_SOURCE_OF_TRUTH.md`، `docs/DECISIONS.md` و این فایل را بخوان.
2. branch، `git status`، commitهای اخیر، diff و PRها را از وضعیت واقعی بررسی کن.
3. روی شاخهٔ محصولی مستقل بمان؛ تغییرات قبلی را حفظ کن.
4. هیچ تغییر production در Supabase، migration، RLS یا دادهٔ واقعی انجام نده.

## قالب پایان نشست
- انجام‌شده:
- Branch / commit / PR:
- فایل‌های تغییرکرده:
- تست‌های اجراشده و نتیجه:
- تست‌های اجرا‌نشده و علت:
- ریسک یا تصمیم لازم از مالک:
- گام دقیق بعدی:


## نشست 2026-11-16 — درخواست همکاری
- شاخه: `feature/collaboration-requests` از `main`، بدون تغییر به `main`.
- فایل‌ها: `dashboard.html`، `scripts/collaboration-requests.js`، `docs/COLLABORATION_REQUESTS_SQL_REVIEW_ONLY.sql`.
- قابلیت پیش‌نویس: منوی مستقل، خواندن/واردکردن اکسل CRM، ویرایش، جستجو و شاخص‌های ساده.
- تست‌ها: تست smoke روی snapshot اصلی پیش از تغییر موفق؛ تست‌های شاخه و مرورگر هنوز اجرا نشده‌اند.
- ریسک: جدول Supabase موجود نیست/تأیید نشده؛ SQL فقط پیش‌نویس است. مجوزهای مدیر و مالکیت باید با تست RLS بررسی شوند. UI و جریان آپلود باید در مرورگر آزموده شوند.
- هیچ migration، تغییر production، merge یا deploy انجام نشده است.
- گام بعد: تست شاخه، بررسی schema واقعی با دسترسی مجاز، اصلاح مشکلات و سپس PR برای بازبینی.


## نشست 2026-11-16 — آغاز فاز اول
- شاخه: `feature/phase-1-collaboration-operations` از `main`.
- ممیزی فقط‌خواندنی Supabase: ۲۴۳ رکورد در `collaboration_requests`؛ همه شناسه‌های خارجی یکتا و فیلدهای شناسه/تلفن/شرکت/کارشناس موجود؛ همه در مرحله «جدید»؛ هر ۲۴۳ رکورد owner مدیر هستند؛ ۵ پروفایل sales و ۱ مدیر وجود دارد. جدول `leads` دارای ۸ رکورد است و دست‌نخورده می‌ماند.
- نکته امنیت/مالکیت: trigger فعلی تغییر owner را برای همه نقش‌ها منع می‌کند؛ باید فقط به مدیر اجازه reassignment بدهد. migration production هنوز اجرا نشده است.
- تغییر کد در branch: فیلد/گزینه نوع درخواست (unclassified/commercial/employment)، فیلتر، کنترل انتخاب نوع در ویرایش، KPI تجاری جدا از استخدامی، ستون نوع، کنترل تخصیص مالک برای مدیر، و import اکسل insert-only برای جلوگیری از overwrite.
- تست جدید `scripts/collaboration-requests-smoke.mjs` و اجرای آن در workflow CI اضافه شد.
- سند ممیزی/طرح تغییر دیتابیس: `docs/PHASE_1_DATA_OPERATIONS.md`.
- تست CI هنوز اجرا نشده؛ PR باید ساخته شود تا workflow اجرا شود. تست مرورگر و RLS واقعی هنوز اجرا نشده‌اند.
- Supabase CLI در محیط اجرا نصب نیست؛ migration استاندارد هنوز ساخته نشده. هیچ SQL، migration، داده، RLS، سایت یا main تغییر نکرده است.
- گام بعد: PR و CI، سپس migration استاندارد و بازبینی/تأیید جداگانه پیش از production migration.
