# Portal Acadêmico Particular

Primeira versão de um portal mobile-first para uso particular, com visual inspirado na identidade azul-clara da Cruzeiro do Sul Virtual e navegação em formato de aplicativo.

## O que já está incluído

- Login com Google preparado para Supabase.
- Modo demonstração para testar imediatamente, mesmo sem configurar banco.
- Navegação inferior com **Cursos**, **Atividades**, **Carteirinha**, **Dúvidas** e **Perfil**.
- Avatar do perfil Google no quinto botão.
- Template de carteirinha com campos editáveis:
  - Nome do aluno;
  - Curso;
  - Validade;
  - Universidade.
- Upload de uma foto da carteirinha para uso como fundo.
- Dados separados por usuário quando o Supabase estiver configurado.
- Banco com RLS e Storage privado.
- PWA instalável no celular e no computador.
- Projeto estático, pronto para GitHub Pages.

## Testar rapidamente

1. Extraia o ZIP.
2. Abra a pasta no VS Code.
3. Use a extensão **Live Server** e abra o arquivo `index.html`.
4. Na tela inicial, escolha **Visualizar demonstração**.

O modo demonstração salva os dados apenas no `localStorage` do navegador.

## Ativar login Google e sincronização

### 1. Criar o projeto no Supabase

Crie um projeto no Supabase e abra o **SQL Editor**.

### 2. Criar banco e Storage

Execute todo o conteúdo do arquivo:

```text
supabase/schema.sql
```

Esse arquivo cria:

- tabela `student_cards`;
- políticas RLS;
- bucket privado `student-cards`;
- políticas para cada usuário acessar apenas sua própria imagem.

### 3. Configurar o Google

No Supabase:

1. Acesse **Authentication > Providers > Google**;
2. habilite o provedor;
3. informe o Client ID e Client Secret do Google Cloud;
4. em **Authentication > URL Configuration**, adicione a URL do GitHub Pages em **Redirect URLs**.

Exemplo:

```text
https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/
```

### 4. Preencher as chaves

Abra `js/config.js` e informe:

```javascript
window.PORTAL_CONFIG = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "SUA_CHAVE_ANON"
};
```

A chave `anon` pode ficar no frontend. A proteção dos dados é feita pelas políticas RLS do Supabase. Nunca coloque a chave `service_role` no projeto.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todos os arquivos mantendo a estrutura de pastas.
3. Abra **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/root`.
6. Salve e aguarde a publicação.

Depois, adicione a URL publicada às URLs autorizadas do Supabase e do Google OAuth.

## Estrutura

```text
portal_carteirinhas_cruzeiro_v1/
├── assets/
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   └── config.js
├── supabase/
│   └── schema.sql
├── index.html
├── manifest.webmanifest
├── sw.js
└── README.md
```

## Observação sobre a imagem enviada

A imagem pessoal usada como referência não foi incluída dentro do projeto. Ao abrir o portal, cada pessoa pode fazer o próprio upload pelo botão **Enviar foto da carteirinha**.
