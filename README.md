# Portal Acadêmico — Busca Online de Universidade V7

Portal particular de carteirinhas estudantis com login Google e identidade visual dinâmica.

## O que mudou nesta versão

A lista fixa de universidades foi removida. Na tela **Perfil**, o estudante agora pode:

1. digitar o nome da universidade;
2. pesquisar a instituição em fontes públicas na internet;
3. escolher o resultado correto;
4. conferir o logo, as cores encontradas e uma prévia do tema;
5. aprovar a identidade visual antes de aplicá-la ao portal.

A busca utiliza dados públicos do Wikidata e arquivos de imagem do Wikimedia Commons. Ela não exige chave de API adicional e funciona em um site estático publicado no GitHub Pages. É necessário estar conectado à internet no momento da pesquisa.

## Recursos

- acesso exclusivamente com login Google;
- busca aberta de universidades;
- confirmação visual antes de aplicar o tema;
- busca complementar de alternativas de logo;
- identificação automática de cores a partir do logo;
- alteração das cores, botões, fundos, menu e carteirinha;
- dados individuais para cada usuário;
- edição de nome, curso, RGM e validade;
- geração aleatória do RGM;
- envio somente da foto do estudante;
- enquadramento da foto com arraste e zoom;
- PWA instalável e compatível com GitHub Pages.

## Atualização necessária do banco

Antes de usar a nova busca, execute no editor SQL do projeto o arquivo:

```text
banco/INSTALAR_OU_ATUALIZAR.sql
```

O script é não destrutivo. Ele mantém os registros existentes e adiciona apenas o campo JSON usado para guardar o logo, as cores e os dados da universidade selecionada.

## Publicação no GitHub Pages

1. Extraia o ZIP.
2. Coloque o conteúdo da pasta no repositório.
3. Faça commit e push.
4. Em **Settings → Pages**, publique pela branch principal e pela pasta raiz.
5. Mantenha a URL publicada autorizada nas configurações do login.

## Estrutura

```text
assets/                Ícones genéricos do portal
css/styles.css         Layout e identidade visual dinâmica
js/app.js              Login, busca, tema, perfil, persistência e foto
banco/                 Scripts de instalação e verificação
index.html             Aplicação
sw.js                  Cache PWA
```

## Observação sobre os resultados

A busca depende da disponibilidade e da qualidade dos registros públicos. Antes de aplicar, confira se o nome e o logo correspondem realmente à instituição desejada. Marcas e nomes pertencem às respectivas instituições; o portal não indica vínculo ou endosso institucional.
