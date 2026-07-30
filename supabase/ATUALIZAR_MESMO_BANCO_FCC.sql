-- =====================================================================
-- PORTAL DE CARTEIRINHAS - MIGRAÇÃO NÃO DESTRUTIVA
--
-- Execute este arquivo no MESMO projeto Supabase "calculadora-fcc"
-- utilizado pelo Portal FCC.
--
-- Este SQL NÃO apaga nem altera as tabelas do Portal FCC/Kanban.
-- Ele cria somente:
--   1. public.fcc_student_cards
--   2. bucket privado fcc-student-card-photos
--   3. políticas RLS para cada usuário acessar somente os próprios dados
-- =====================================================================

create table if not exists public.fcc_student_cards (
  user_id uuid primary key references auth.users(id) on delete cascade,
  student_name text not null default 'Aluno(a) Exemplo',
  course_name text not null default 'Neuropsicologia',
  registration_number text not null default '00000000-0',
  valid_until text not null default '12/2029',
  university text not null default 'cruzeiro',
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fcc_student_cards enable row level security;

drop policy if exists "fcc_student_cards_select_own" on public.fcc_student_cards;
drop policy if exists "fcc_student_cards_insert_own" on public.fcc_student_cards;
drop policy if exists "fcc_student_cards_update_own" on public.fcc_student_cards;
drop policy if exists "fcc_student_cards_delete_own" on public.fcc_student_cards;

create policy "fcc_student_cards_select_own"
on public.fcc_student_cards
for select
to authenticated
using (auth.uid() = user_id);

create policy "fcc_student_cards_insert_own"
on public.fcc_student_cards
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "fcc_student_cards_update_own"
on public.fcc_student_cards
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "fcc_student_cards_delete_own"
on public.fcc_student_cards
for delete
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fcc-student-card-photos',
  'fcc-student-card-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fcc_student_photos_select_own" on storage.objects;
drop policy if exists "fcc_student_photos_insert_own" on storage.objects;
drop policy if exists "fcc_student_photos_update_own" on storage.objects;
drop policy if exists "fcc_student_photos_delete_own" on storage.objects;

create policy "fcc_student_photos_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'fcc-student-card-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "fcc_student_photos_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'fcc-student-card-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "fcc_student_photos_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'fcc-student-card-photos'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'fcc-student-card-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "fcc_student_photos_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'fcc-student-card-photos'
  and split_part(name, '/', 1) = auth.uid()::text
);

select
  to_regclass('public.fcc_student_cards') as tabela_criada,
  exists (
    select 1 from storage.buckets where id = 'fcc-student-card-photos'
  ) as bucket_criado,
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.fcc_student_cards'::regclass
  ) as rls_ativo;


-- Compatibilidade com a versão multiuniversidades.
-- Mantém registros existentes e muda apenas o valor padrão para novos perfis.
alter table public.fcc_student_cards
  alter column university set default 'cruzeiro';
