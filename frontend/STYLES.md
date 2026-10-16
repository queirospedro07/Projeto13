# Organização dos estilos

A interface usa CSS nativo. O Vite importa os ficheiros CSS diretamente, sem framework de classes ou etapa adicional de geração de estilos.

- Cada página e componente visual tem uma pasta própria com JSX, CSS e index.js. O componente importa o seu CSS. Por exemplo, Button.jsx importa Button.css e Login.jsx importa Login.css.
- src/index.css define a ordem das camadas e importa os estilos globais.
- src/styles/reset.css normaliza os estilos dos navegadores e inicializa as variáveis de composição visual.
- src/styles/base.css contém tipografia e regras base dos elementos HTML.
- src/styles/shared.css contém fontes, temas, animações, scrollbars, acessibilidade e estilos partilhados.
- O seletor personalizado tem os seus estilos em src/components/Select/Select.css.

## Alterar a interface

Edite as classes com o prefixo da página ou componente no respetivo CSS. As regras de responsividade estão em media queries. O tema escuro depende da classe dark no elemento html.

As camadas seguem a ordem reset, base, ui, components, pages e overrides. A camada ui contém os elementos partilhados como botões, cartões e avatares. Assim, uma página ou componente pode personalizar um componente partilhado sem depender da ordem de importação dos módulos.

Os valores que dependem dos dados ou das medidas do ecrã passam do JavaScript para variáveis CSS: percentagens de progresso, posição dos menus, enquadramento das imagens e coordenadas do efeito de luz. As propriedades de apresentação que usam esses valores ficam nos ficheiros CSS.

Execute npm run build para validar a aplicação.

Não usar `!important`. Execute `npm run styles:check` para verificar esta regra; `npm run check` também a inclui. A fonte NexoFont é definida em `styles/base.css`, com ficheiros locais e pesos 400, 500 e 700.
