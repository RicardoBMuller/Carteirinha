# Portal Acadêmico — Carteirinhas V3

Portal particular para exibir duas carteirinhas estudantis separadas por conta Google.

## Alterações desta versão

- ao selecionar a foto, abre uma tela de enquadramento;
- é possível arrastar a imagem e controlar o zoom antes de salvar;
- a prévia mostra exatamente o recorte quadrado usado na carteirinha;
- foi adicionada a opção **Gerar** para criar um RGM aleatório no formato `00000000-0`;
- os textos auxiliares acima e abaixo da carteirinha foram removidos;

- a carteirinha agora é vertical, inspirada no modelo da Cruzeiro do Sul Virtual;
- não existe mais upload da imagem inteira da carteirinha;
- o upload serve somente para a foto do estudante;
- a foto é exibida no quadrado central da carteirinha;
- a edição foi movida integralmente para o botão **Perfil**;
- campos editáveis: Nome do Aluno, Curso, Matrícula/RGM e Validade;
- a instituição permanece fixa como **Cruzeiro do Sul Virtual**;
- o avatar do menu inferior continua usando a foto da conta Google;
- cada conta acessa somente a própria carteirinha.

## Reutilização do Portal FCC

Não é necessário criar outro projeto no Google Cloud e nem outro projeto no Supabase.

O `index.html` carrega diretamente o arquivo público:

`https://ricardobmuller.github.io/Portal-FCC/config.js`

O arquivo `js/config.js` reutiliza:

- `SUPABASE_URL`;
- `SUPABASE_PUBLISHABLE_KEY` ou a antiga `SUPABASE_ANON_KEY`.

O Google Client ID e o Google Client Secret continuam somente no Supabase. Eles não são colocados neste projeto.

## 1. Atualizar o mesmo Supabase

Abra o projeto **calculadora-fcc** e entre em:

`SQL Editor > New query`

Execute todo o arquivo:

`supabase/ATUALIZAR_MESMO_BANCO_FCC.sql`

O arquivo é não destrutivo. Ele não apaga nem altera projetos, salas, cartões de prova ou dados do Kanban.

Ele cria somente:

- tabela `public.fcc_student_cards`;
- bucket privado `fcc-student-card-photos`;
- políticas RLS para cada usuário acessar somente os próprios dados.

## 2. Adicionar a nova URL no Supabase Auth

No mesmo projeto Supabase, abra:

`Authentication > URL Configuration`

Não é necessário substituir a Site URL atual do Portal FCC.

Em **Redirect URLs**, adicione a URL final deste novo GitHub Pages. Exemplo:

`https://ricardobmuller.github.io/Portal-Carteirinhas/**`

Para teste local com Live Server, mantenha ou adicione:

- `http://127.0.0.1:5500/**`
- `http://localhost:5500/**`

## 3. Google Cloud

Não crie outro projeto e não crie outro OAuth Client.

A origem autorizada já utilizada continua a mesma:

`https://ricardobmuller.github.io`

A callback do Google continua sendo a mesma callback do projeto Supabase `calculadora-fcc`.

## 4. Publicar no GitHub Pages

Envie todos os arquivos deste ZIP para a raiz do novo repositório.

Depois abra:

`Settings > Pages`

Configure:

- Source: `Deploy from a branch`;
- Branch: `main`;
- Folder: `/(root)`.

## Estrutura

- `index.html` — telas e template vertical;
- `css/styles.css` — identidade visual e responsividade;
- `js/app.js` — login, navegação, edição, enquadramento da foto, banco e upload;
- `js/config.js` — ponte para reutilizar o config do Portal FCC;
- `supabase/ATUALIZAR_MESMO_BANCO_FCC.sql` — migração não destrutiva;
- `supabase/VERIFICAR_INSTALACAO.sql` — conferência opcional;
- `manifest.webmanifest` e `sw.js` — instalação como PWA.
