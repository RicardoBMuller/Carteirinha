-- ============================================================
-- Portal Acadêmico Particular - Banco e políticas de segurança
-- Execute todo este arquivo no SQL Editor do Supabase.
-- ============================================================

create table if not exists public.student_cards (
  user_id uuid primary key references auth.users(id) on delete cascade,
  student_name text not null default 'Aluno(a) Exemplo',
  course_name text not null default 'Neuropsicologia',
  valid_until text not null default '12/2029',
  university text not null default 'Cruzeiro do Sul Virtual',
  image_path text,
  updated_at timestamptz not null default now()
);

alter table public.student_cards enable row level security;

drop policy if exists "Usuário visualiza a própria carteirinha" on public.student_cards;
drop policy if exists "Usuário cria a própria carteirinha" on public.student_cards;
drop policy if exists "Usuário altera a própria carteirinha" on public.student_cards;
drop policy if exists "Usuário exclui a própria carteirinha" on public.student_cards;

create policy "Usuário visualiza a própria carteirinha"
on public.student_cards
for select
using (auth.uid() = user_id);

create policy "Usuário cria a própria carteirinha"
on public.student_cards
for insert
with check (auth.uid() = user_id);

create policy "Usuário altera a própria carteirinha"
on public.student_cards
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Usuário exclui a própria carteirinha"
on public.student_cards
for delete
using (auth.uid() = user_id);

-- Bucket privado para a imagem enviada.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-cards',
  'student-cards',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Usuário visualiza suas próprias imagens" on storage.objects;
drop policy if exists "Usuário envia suas próprias imagens" on storage.objects;
drop policy if exists "Usuário atualiza suas próprias imagens" on storage.objects;
drop policy if exists "Usuário remove suas próprias imagens" on storage.objects;

create policy "Usuário visualiza suas próprias imagens"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'student-cards'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Usuário envia suas próprias imagens"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'student-cards'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Usuário atualiza suas próprias imagens"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'student-cards'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'student-cards'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Usuário remove suas próprias imagens"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'student-cards'
  and split_part(name, '/', 1) = auth.uid()::text
);
