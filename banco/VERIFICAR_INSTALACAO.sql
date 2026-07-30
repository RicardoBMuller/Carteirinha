select
  c.relname as tabela,
  c.relrowsecurity as rls_ativo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'fcc_student_cards';

select id, name, public, file_size_limit
from storage.buckets
where id = 'fcc-student-card-photos';

select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'fcc_student_cards'
order by policyname;
