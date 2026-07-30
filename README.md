# Portal Acadêmico Multiuniversidades — V5

Portal particular de carteirinhas estudantis com login Google e identidade visual dinâmica.

## Universidades disponíveis

Na tela **Perfil**, o estudante pode escolher uma das instituições:

- Cruzeiro do Sul Virtual
- UniBF
- UNINTER
- Sumaré EAD
- UniCesumar

A escolha altera imediatamente as cores, os fundos, os botões, o menu inferior, os cards, os destaques, o logotipo do cabeçalho e o acabamento da carteirinha.

## Recursos

- login com conta Google;
- dados individuais para cada usuário;
- edição de nome, curso, RGM e validade;
- geração aleatória do RGM;
- envio somente da foto do estudante;
- enquadramento com arraste e zoom;
- identidade visual automática por universidade;
- PWA instalável e compatível com GitHub Pages.

## Atualização do banco

Quem já instalou as versões anteriores não precisa criar outra tabela. O arquivo `banco/INSTALAR_OU_ATUALIZAR.sql` é não destrutivo e pode ser executado novamente quando necessário.

## Publicação no GitHub Pages

1. Extraia o ZIP.
2. Coloque o conteúdo da pasta no repositório.
3. Faça commit e push.
4. Em **Settings → Pages**, publique pela branch principal e pela pasta raiz.
5. Mantenha a URL publicada autorizada nas configurações de login do projeto.

## Estrutura

```text
assets/brands/       Logos vetoriais locais das cinco universidades
css/styles.css       Layout e temas dinâmicos
js/app.js            Login, perfil, persistência, foto e seleção de universidade
banco/               Scripts de instalação e verificação
index.html            Aplicação
sw.js                 Cache PWA
```

## Observação de marca

As marcas e os nomes pertencem às respectivas instituições. Os arquivos vetoriais deste projeto são representações locais para uso particular, baseadas nas identidades visuais públicas, e não indicam vínculo ou endosso institucional.
