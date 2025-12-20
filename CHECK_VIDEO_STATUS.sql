-- check_video_status.sql
-- Check if any guest in this event actually has a video URL assigned.
SELECT first_name, last_name, assigned_video_url 
FROM public.guests 
WHERE event_id = '84d2f662-c884-48a9-955b-82903010b0a4'
AND assigned_video_url IS NOT NULL;
