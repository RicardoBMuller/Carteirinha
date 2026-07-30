select
  c.relname as tabela,
  c.relrowsecurity as rls_ativo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'fcc_student_cards';

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'fcc_student_cards'
order by ordinal_position;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'fcc-student-card-photos';

select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'fcc_student_cards'
order by policyname;
