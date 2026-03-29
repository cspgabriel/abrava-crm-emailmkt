const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const glob = require('glob');

const svgs = glob.sync(path.join(__dirname, '..', 'logo-variations', '*.svg'));
if (!svgs.length) {
  console.log('Nenhum SVG encontrado em logo-variations/');
  process.exit(0);
}

(async () => {
  for (const svgPath of svgs) {
    const name = path.basename(svgPath, '.svg');
    const out = path.join(path.dirname(svgPath), `${name}.png`);
    try {
      const svgBuffer = fs.readFileSync(svgPath);
      await sharp(svgBuffer).png({compressionLevel:9}).resize(1024).toFile(out);
      console.log('Gerado:', out);
    } catch (err) {
      console.error('Erro ao converter', svgPath, err);
    }
  }
})();
