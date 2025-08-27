create
or replace function public.firebase_uid () returns text language sql stable parallel SAFE as $function$
select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$function$;