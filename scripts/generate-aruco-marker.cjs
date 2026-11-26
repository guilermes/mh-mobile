/* Gera o marcador ArUco ID 0 em SVG, com o quadrado externo de 50 mm. */
const fs = require('node:fs');
const path = require('node:path');
const {AR} = require('js-aruco2');

const dictionary = new AR.Dictionary('ARUCO');
let svg = dictionary.generateSVG(0);
if (typeof svg !== 'string' || !svg.includes('<svg')) {
  throw new Error('A biblioteca não retornou um SVG válido para o marcador.');
}

svg = svg.replace(/<svg\b([^>]*)>/, (_match, attributes) => {
  const cleaned = attributes
    .replace(/\swidth=("[^"]*"|'[^']*')/i, '')
    .replace(/\sheight=("[^"]*"|'[^']*')/i, '');
  return `<svg${cleaned} width="50mm" height="50mm" preserveAspectRatio="none">`;
});

const output = path.resolve(__dirname, '../assets/aruco-marker-id0-50mm.svg');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, svg, 'utf8');
console.log(`Marcador criado: ${output}`);
console.log('Imprima em escala 100% e confirme que o quadrado preto externo mede 50 × 50 mm.');
