-- historical hotfix. you shouldn't need to run this
update users
set
  data = jsonb_set(
    data,
    '{link}',
    coalesce((data -> 'link'), '{}'::jsonb),
    true
  )
where
  data -> 'link' is null
