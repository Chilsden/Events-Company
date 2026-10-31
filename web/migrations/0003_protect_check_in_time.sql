-- The first check-in time is evidence. Once set it cannot be cleared or changed, by anyone, including the
-- application role (which may update checked_in_at only to set it for the first time).
create function guests_protect_check_in_time() returns trigger
language plpgsql as $$
begin
  if old.checked_in_at is not null and new.checked_in_at is distinct from old.checked_in_at then
    raise exception 'checked_in_at cannot be changed once set' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger guests_protect_check_in_time
  before update on guests
  for each row execute function guests_protect_check_in_time();
