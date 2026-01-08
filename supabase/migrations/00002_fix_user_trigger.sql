-- Fix user profile trigger permissions
-- Drop and recreate with proper permissions

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

-- Recreate with service role permissions
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
exception when others then
  -- Log error but don't fail auth
  raise warning 'Failed to create user profile: %', sqlerrm;
  return new;
end;
$$;

-- Recreate trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Grant execute permission
grant execute on function public.handle_new_user() to service_role;

