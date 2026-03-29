Geração de variações da logo

Arquivos:
- variation-01_flat.svg — estilo flat com paleta original
- variation-02_gradient.svg — fundo gradiente e montanhas com gradiente
- variation-03_monochrome.svg — versão monocromática
- variation-04_inverted.svg — versão invertida (claro em fundo escuro)
- variation-05_horizontal.svg — layout horizontal (ícone à esquerda)
- variation-06_stacked.svg — layout empilhado (ícone acima do texto)
- variation-07_badge.svg — versão em badge/círculo
- variation-08_outline.svg — versão outline/contorno
- variation-09_textonly.svg — texto apenas
- variation-10_retro.svg — paleta retrô

Como gerar PNGs rapidamente:

Opção 1 — Inkscape (local):

```bash
# exportar 1024x614 PNG
inkscape logo-variations/variation-01_flat.svg --export-type=png --export-filename=logo-variations/variation-01_flat.png --export-width=1024
```

Opção 2 — ImageMagick (rsvg-convert recomendado para SVG estáveis):

```bash
rsvg-convert -w 1024 logo-variations/variation-01_flat.svg -o logo-variations/variation-01_flat.png
```

Opção 3 — Node (usar Sharp). Instale dependências e rode o script:

```bash
npm install sharp glob
node scripts/convert-svgs-to-png.js
```

O script `scripts/convert-svgs-to-png.js` lê todos os SVGs em `logo-variations/` e gera PNGs `1024px` no mesmo diretório.
