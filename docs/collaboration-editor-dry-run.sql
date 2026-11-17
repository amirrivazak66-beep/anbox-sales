-- READ-ONLY DRY RUN. Do not execute UPDATE/INSERT/DELETE or migration.
-- Classification preserves source text and flags ambiguities for human review.
WITH candidates AS (
 SELECT id,external_id,'call_result' AS field,call_result AS original,
 CASE WHEN trim(call_result) IN ('پاسخگو نبود','پاسخگو نبودند','پاسخگو نیست','پاسگو نبودند','پپاسخگو نبودند') THEN 'پاسخ نداد'
 WHEN trim(call_result)='شماره اشتباه است' THEN 'شماره اشتباه'
 WHEN trim(call_result)='عدم همکاری-' THEN 'عدم همکاری'
 ELSE NULL END AS proposed FROM public.collaboration_requests
 UNION ALL
 SELECT id,external_id,'next_action',next_action,
 CASE WHEN trim(next_action) IN ('تماس ثانویه','تماس  ثانویه') THEN 'تماس مجدد'
 WHEN trim(next_action)='تماس' THEN 'تماس مجدد'
 ELSE NULL END FROM public.collaboration_requests
 UNION ALL
 SELECT id,external_id,'sales_stage',sales_stage,
 CASE WHEN trim(sales_stage)='عدم همکاری-' THEN 'عدم همکاری' ELSE NULL END FROM public.collaboration_requests
)
SELECT field,original,proposed,count(*) AS affected_rows,
 CASE WHEN proposed IS NOT NULL THEN 'candidate_review' ELSE 'unmapped_preserve' END AS decision
FROM candidates WHERE nullif(trim(original),'') IS NOT NULL
GROUP BY field,original,proposed ORDER BY field,affected_rows DESC,original;
-- Date audit: no inferred time for date-only values; non-date text remains untouched.
SELECT 'last_contact_text' AS field,
 CASE WHEN last_contact_text ~ '^ *14[0-9]{2}/[0-9]{1,2}/[0-9]{1,2} *$' THEN 'jalali_date_only_no_time'
 WHEN last_contact_text ~ '^ *20[0-9]{2}/[0-9]{1,2}/[0-9]{1,2} [0-9]{1,2}:[0-9]{2} *$' THEN 'gregorian_datetime'
 WHEN nullif(trim(last_contact_text),'') IS NULL THEN 'empty' ELSE 'manual_review' END AS classification,
 count(*) AS rows FROM public.collaboration_requests GROUP BY 1,2
UNION ALL
SELECT 'next_followup_text',
 CASE WHEN next_followup_text ~ '^ *14[0-9]{2}/[0-9]{1,2}/[0-9]{1,2}( [0-9]{1,2}:[0-9]{2})? *$' THEN 'jalali_date'
 WHEN next_followup_text ~ '^ *20[0-9]{2}/[0-9]{1,2}/[0-9]{1,2} [0-9]{1,2}:[0-9]{2} *$' THEN 'gregorian_datetime'
 WHEN nullif(trim(next_followup_text),'') IS NULL THEN 'empty' ELSE 'non_date_or_manual_review' END,count(*)
FROM public.collaboration_requests GROUP BY 1,2;
