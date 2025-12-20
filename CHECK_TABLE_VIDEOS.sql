-- check_table_video_config.sql
-- Check the event's video configuration and the guests' table info to debug matching issues.

SELECT 
    name, 
    video_configuration, 
    video_url_default
FROM public.events 
WHERE id = '84d2f662-c884-48a9-955b-82903010b0a4';

SELECT 
    first_name, 
    last_name, 
    table_info, 
    assigned_video_url
FROM public.guests 
WHERE event_id = '84d2f662-c884-48a9-955b-82903010b0a4'
ORDER BY table_info;
