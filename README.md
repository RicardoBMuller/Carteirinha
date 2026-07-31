# Portal Acadêmico — Busca Aprimorada e Identidade Suave V9

Portal particular de carteirinhas estudantis com login Google, busca aberta de universidade e visual adaptativo.

## Alteração desta versão

A busca da versão anterior foi mantida. A mudança está apenas na aplicação da identidade visual:

- a interface continua usando a base clara azul da Cruzeiro do Sul;
- botões principais, navegação e textos mantêm cores fixas com bom contraste;
- o logo da universidade escolhida continua aparecendo no cabeçalho, login e carteirinha;
- as cores institucionais aparecem somente em detalhes suaves, como a faixa da carteirinha, pequenos contornos, fundos discretos e elementos de prévia;
- cores muito claras ou muito escuras são equilibradas antes de serem usadas nos detalhes da interface;
- temas já salvos no banco também passam automaticamente pelo novo tratamento de contraste.

Assim, universidades com amarelo, verde-claro, vermelho intenso ou paletas muito escuras não comprometem a leitura dos botões.

## Busca de universidade

A pesquisa continua combinando:

1. nomes, siglas e variações da instituição;
2. dados públicos do Wikidata e da Wikipedia;
3. consulta ao endereço oficial;
4. logo e paleta encontrados no site;
5. alternativas de logotipo no Wikimedia Commons;
6. confirmação pelo usuário antes da aplicação.

## Recursos

- acesso exclusivamente com login Google;
- busca aberta, sem lista fixa de universidades;
- confirmação visual antes de aplicar a universidade;
- edição de nome, curso, RGM e validade;
- geração aleatória do RGM;
- envio somente da foto do estudante;
- enquadramento da foto com arraste e zoom;
- dados individuais por conta;
- PWA instalável e compatível com GitHub Pages.

## Banco

Quem já executou o arquivo de instalação das versões anteriores não precisa alterar a estrutura. Em uma instalação nova, execute:

```text
banco/INSTALAR_OU_ATUALIZAR.sql
```

O script é não destrutivo e pode ser executado novamente.

## Publicação no GitHub Pages

1. Extraia o ZIP.
2. Substitua os arquivos do repositório pelo conteúdo desta pasta.
3. Faça commit e push.
4. Aguarde a atualização do GitHub Pages.
5. Atualize a página uma vez para ativar o cache V9 da PWA.

## Estrutura

```text
assets/                Ícones genéricos do portal
css/styles.css         Layout e identidade institucional suave
js/app.js              Login, pesquisa, tema, perfil, persistência e foto
banco/                 Scripts de instalação e verificação
index.html             Aplicação
sw.js                  Cache PWA
```

## Observação

A disponibilidade do logo depende do site oficial e das fontes públicas consultadas. A identidade é mostrada em uma prévia e só é aplicada após a confirmação. Marcas e nomes pertencem às respectivas instituições; o portal não indica vínculo ou endosso institucional.
