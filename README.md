# Portal Acadêmico Multiuniversidades — V4

Portal particular de carteirinhas estudantis, com login Google, armazenamento no mesmo projeto Supabase do Portal FCC e identidade visual dinâmica.

## Novidade desta versão

Na tela **Perfil**, o estudante pode escolher uma das instituições:

- Cruzeiro do Sul Virtual
- UniBF
- UNINTER
- Sumaré EAD
- UniCesumar

A escolha altera imediatamente:

- cores e fundos do aplicativo;
- botões, menu inferior, cards e destaques;
- logotipo do cabeçalho;
- logotipo e acabamento da carteirinha;
- nome da instituição na tela inicial e no rodapé da carteirinha.

A universidade selecionada é salva junto com os demais dados da carteirinha e fica separada por conta Google.

## Recursos mantidos

- login Google reutilizando o mesmo Google OAuth do Portal FCC;
- mesmo banco Supabase `calculadora-fcc`;
- edição de nome, curso, RGM e validade;
- geração aleatória do RGM;
- upload somente da foto do estudante;
- enquadramento, arraste e zoom da foto;
- PWA instalável e compatível com GitHub Pages;
- políticas RLS: cada usuário acessa somente os próprios dados.

## Atualização do Supabase

Quem já executou o SQL da V2 ou V3 **não precisa criar outra tabela**. A coluna `university` já existe.

O arquivo `supabase/ATUALIZAR_MESMO_BANCO_FCC.sql` continua incluído para instalação nova e também ajusta o valor padrão da universidade sem apagar registros.

## Publicação no GitHub Pages

1. Extraia o ZIP.
2. Coloque o conteúdo da pasta no repositório.
3. Faça commit e push.
4. Em **Settings → Pages**, publique pela branch principal e pasta raiz.
5. No Supabase, mantenha a URL do GitHub Pages em **Authentication → URL Configuration → Redirect URLs**.

O projeto continua carregando a configuração compartilhada em:

```text
https://ricardobmuller.github.io/Portal-FCC/config.js
```

## Estrutura

```text
assets/brands/       Logos vetoriais locais das cinco universidades
css/styles.css       Layout e temas dinâmicos
js/app.js            Login, perfil, persistência, foto e seleção de universidade
supabase/             SQL não destrutivo
index.html            Aplicação
sw.js                 Cache PWA
```

## Observação de marca

As marcas e nomes pertencem às respectivas instituições. Os arquivos vetoriais deste projeto são representações locais para uso particular, baseadas nas identidades visuais públicas, e não indicam vínculo ou endosso institucional.
