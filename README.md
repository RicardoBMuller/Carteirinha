# Portal Acadêmico — Busca Aprimorada de Universidade V8

Portal particular de carteirinhas estudantis com login Google e identidade visual dinâmica.

## Busca revisada

A pesquisa de universidade agora combina várias etapas para reduzir resultados errados e identidades incompletas:

1. pesquisa o nome informado e variações como “Universidade”, “Faculdade” e “Centro Universitário”;
2. considera nomes alternativos, siglas e páginas em português e inglês;
3. ordena os resultados pela semelhança do nome e pela identificação como instituição de ensino;
4. consulta os dados públicos do Wikidata e da Wikipedia;
5. usa o endereço oficial encontrado para consultar o logo e a paleta visual do próprio site;
6. procura alternativas de logo no Wikimedia Commons somente quando os arquivos parecem realmente logotipos;
7. apresenta todas as opções encontradas para aprovação antes de alterar o portal.

A busca continua aberta: não existe uma lista fixa de universidades. Há apenas correções internas de apelidos conhecidos para ajudar quando o nome público e o cadastro online são diferentes.

## Melhorias desta versão

- reconhecimento aprimorado de nomes parciais e siglas;
- prioridade para instituições de ensino e resultados brasileiros;
- consulta ao site oficial antes de escolher o logo;
- cores extraídas da identidade encontrada no site;
- rejeição de fotos de prédios e campus que antes podiam aparecer como se fossem logos;
- ícone oficial do domínio como alternativa quando não existe um logotipo público maior;
- tratamento especial para nomes conhecidos por variações, como Anhembi Morumbi;
- cache atualizado da PWA.

## Recursos do portal

- acesso exclusivamente com login Google;
- confirmação visual antes de aplicar o tema;
- alteração automática de cores, botões, fundos, menu e carteirinha;
- dados individuais para cada usuário;
- edição de nome, curso, RGM e validade;
- geração aleatória do RGM;
- envio somente da foto do estudante;
- enquadramento da foto com arraste e zoom;
- PWA instalável e compatível com GitHub Pages.

## Banco

Quem já executou o arquivo da versão anterior não precisa alterar a estrutura novamente. Em uma instalação nova, execute:

```text
banco/INSTALAR_OU_ATUALIZAR.sql
```

O script é não destrutivo e pode ser executado novamente.

## Publicação no GitHub Pages

1. Extraia o ZIP.
2. Substitua os arquivos do repositório pelo conteúdo desta pasta.
3. Faça commit e push.
4. Aguarde a atualização do GitHub Pages.
5. No primeiro acesso, atualize a página para que o novo cache da PWA seja ativado.

## Estrutura

```text
assets/                Ícones genéricos do portal
css/styles.css         Layout e identidade visual dinâmica
js/app.js              Login, pesquisa, tema, perfil, persistência e foto
banco/                 Scripts de instalação e verificação
index.html             Aplicação
sw.js                  Cache PWA
```

## Observação

A disponibilidade do logo depende do site oficial e das fontes públicas consultadas. A identidade sempre é mostrada em uma prévia e só é aplicada após a confirmação do usuário. Marcas e nomes pertencem às respectivas instituições; o portal não indica vínculo ou endosso institucional.
