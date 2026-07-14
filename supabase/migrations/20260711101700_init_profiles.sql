-- =====================================================================
-- SCHEMA cho Supabase — chạy 1 lần trong SQL Editor của project.
-- Tạo bảng profiles + tự động lưu thông tin khi có người đăng ký.
-- =====================================================================

-- 1) Bảng lưu thông tin người dùng
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  company text,
  role text,
  created_at timestamptz default now()
);

-- 2) Bật Row Level Security: mỗi người chỉ đọc/sửa hồ sơ của chính mình
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- 3) Hàm + trigger: khi có user mới trong auth.users, tự tạo profile.
--    Lấy full_name/company/role từ metadata gửi lên lúc đăng ký;
--    với đăng nhập Google, 'name' do Google cung cấp.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, company, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'company',
    coalesce(new.raw_user_meta_data ->> 'role', 'Người dùng')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
