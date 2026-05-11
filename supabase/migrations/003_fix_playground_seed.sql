-- Fix playground seed function.
-- Previous version used INSERT ... VALUES (...), (...), (...) RETURNING id INTO kg4,
-- which fails with: query returned more than one row.
-- Run this after 002_matching_and_playground.sql.

create or replace function public.seed_playground_base()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  kg1 uuid;
  kg2 uuid;
  kg3 uuid;
  kg4 uuid;
  u1 uuid;
  u2 uuid;
  u3 uuid;
  u4 uuid;
begin
  perform public.reset_playground_data();

  insert into public.kindergartens (official_number, name, normalized_name, district, address, phone, email, latitude, longitude, source_name, last_verified_at)
  values ('175', 'ДГ 175 „Слънчеви лъчи“ - сграда 2', 'дг 175 слънчеви лъчи сграда 2', 'Изгрев', 'ул. Тестова 1', '02 000 0001', 'sun@example.local', 42.6701000, 23.3501000, 'playground', now())
  returning id into kg1;

  insert into public.kindergartens (official_number, name, normalized_name, district, address, phone, email, latitude, longitude, source_name, last_verified_at)
  values ('30', 'ДГ 30 „Радецки“', 'дг 30 радецки', 'Лозенец', 'ул. Тестова 2', '02 000 0002', 'rainbow@example.local', 42.6761000, 23.3221000, 'playground', now())
  returning id into kg2;

  insert into public.kindergartens (official_number, name, normalized_name, district, address, phone, email, latitude, longitude, source_name, last_verified_at)
  values ('184', 'ДГ 184 „Мечо Пух“', 'дг 184 мечо пух', 'Красно село', 'ул. Тестова 3', '02 000 0003', 'pooh@example.local', 42.6831000, 23.2901000, 'playground', now())
  returning id into kg3;

  insert into public.kindergartens (official_number, name, normalized_name, district, address, phone, email, latitude, longitude, source_name, last_verified_at)
  values ('76', 'ДГ 76 „Сърничка“', 'дг 76 сърничка', 'Младост', 'ул. Тестова 4', '02 000 0004', 'magic@example.local', 42.6501000, 23.3801000, 'playground', now())
  returning id into kg4;

  insert into public.app_users (email, display_name, email_verified, is_playground)
  values ('test-parent-a@playground.local', 'Родител A', true, true)
  returning id into u1;

  insert into public.app_users (email, display_name, email_verified, is_playground)
  values ('test-parent-b@playground.local', 'Родител B', true, true)
  returning id into u2;

  insert into public.app_users (email, display_name, email_verified, is_playground)
  values ('test-parent-c@playground.local', 'Родител C', true, true)
  returning id into u3;

  insert into public.app_users (email, display_name, email_verified, is_playground)
  values ('test-parent-d@playground.local', 'Родител D', true, true)
  returning id into u4;

  return jsonb_build_object(
    'kindergartens', jsonb_build_array(kg1, kg2, kg3, kg4),
    'users', jsonb_build_array(u1, u2, u3, u4)
  );
end;
$$;
