# three-nice

Uma coleção de pequenos mundos interativos com React, TypeScript e Three.js. A navegação apresenta sete experiências; as cenas respondem somente ao mouse, sem painéis de controles.

## Rodar

```sh
npm install
npm run dev
```

A home redireciona para `/mare`. `/particulas` traz um jardim com 32 mil pontos: a altura do cursor transforma esfera, galáxia e ondas; os pontos abrem espaço ao redor do mouse. Maré mantém a interação vertical de sol e ondas e o movimento horizontal da câmera.

`/liquido` traz uma escultura cromada flutuante. O movimento horizontal gira o objeto e muda os reflexos entre frio e quente; o vertical intensifica a deformação. Aproximar o cursor atrai a superfície. O ambiente de estúdio é gerado localmente e filtrado uma vez para produzir os reflexos, sem imagens externas.

`/planeta` apresenta um mundo em miniatura com florestas de pinheiros, montanhas nevadas, mares e nuvens orbitando. O movimento horizontal gira o planeta, e o vertical muda a perspectiva e transforma o dia em noite. A lua e as estrelas aparecem conforme a noite chega. Relevo e vegetação são gerados localmente; árvores e nuvens usam instâncias para manter a cena leve.

`/tunel` leva a uma viagem contínua por anéis luminosos e partículas, com curvas e profundidade. O mouse horizontal guia a direção; no topo, a viagem acelera, o campo de visão abre e os rastros se alongam; embaixo, a câmera segue em deriva lenta. A geometria é reciclada nos shaders, sem reconstrução a cada frame.

`/marte` coloca a câmera no solo, na altura de uma pessoa, diante de montanhas e dunas ferrugem. O mouse horizontal guia o olhar para os lados; o vertical permite olhar para o céu e voltar ao chão. Terreno, pedras, textura mineral e poeira são gerados localmente. A cena é uma interpretação visual de Marte.

`/sistema-solar` apresenta o Sol e os oito planetas em órbitas ilustrativas, com a Lua, os anéis de Saturno, um cinturão de asteroides e estrelas ao fundo. O mouse horizontal gira a perspectiva; o vertical muda a inclinação. Passar sobre um planeta ou seu nome destaca a órbita e pausa a cena para ler uma breve descrição. Texturas e luzes são geradas localmente; tamanhos, distâncias e velocidades foram ajustados para mostrar o conjunto.

**As 7 experiências estão concluídas.** O histórico dos objetivos está em [5.md](./5.md). As informações breves dos planetas seguem a apresentação do [sistema solar pela NASA](https://science.nasa.gov/solar-system/planets/).

## Validação

```sh
npm run build
npm run lint
npm test
```

Os onze testes usam o Chrome instalado e renderização por software. Cobrem navegação entre as sete cenas, acesso direto às rotas, transições das partículas, resposta do líquido ao mouse, rotação do planeta e transição de dia e noite, direção e velocidade do túnel, olhar lateral e vertical em Marte, órbitas e destaque dos planetas pelo mouse, ausência de controles, layout mobile, movimento reduzido e perda de contexto WebGL. Cada página libera seus recursos gráficos ao sair.

`node scripts/collection-check.mjs` salva capturas de desktop e celular em `artifacts/`, com o servidor local na porta 5173.

`node scripts/mars-check.mjs` registra o horizonte, os olhares laterais, o céu, o chão e o layout mobile de Marte.

`node scripts/solar-check.mjs` registra o sistema solar, diferentes perspectivas, planetas em destaque e o layout mobile.

Para publicar, configure a hospedagem para servir `index.html` nos caminhos da aplicação, permitindo abrir e recarregar `/mare`, `/particulas`, `/liquido`, `/planeta`, `/tunel`, `/marte` e `/sistema-solar` diretamente. `npm run build` gera a pasta `dist`; `npm run preview` permite conferir o resultado localmente.
