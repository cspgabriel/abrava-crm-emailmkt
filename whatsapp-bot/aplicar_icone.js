const { execSync } = require('child_process');
const fs = require('fs');

console.log("Instalando o manipulador de imagens nativo Jimp...");
execSync('npm install jimp@0.22.10 png-to-ico rcedit', { stdio: 'inherit' });

const pngToIco = require('png-to-ico').default;
const rcedit = require('rcedit');
const Jimp = require('jimp');

(async () => {
    try {
        console.log("Comprimindo a imagem para 256x256 (Padrão Windows)...");
        const image = await Jimp.read('unnamed (2).png');
        await image.resize(256, 256).writeAsync('icon_256.png');
        
        console.log("Convertendo para .ICO e injetando na casca do RoboAbracon-VersaoFinal.exe...");
        const buf = await pngToIco('icon_256.png');
        fs.writeFileSync('icone.ico', buf);
        
        await rcedit('RoboAbracon-VersaoFinal.exe', {
            icon: 'icone.ico'
        });
        
        console.log("✅ ÍCONE APLICADO COM SUCESSO NO EXECUTÁVEL!");
    } catch(e) {
        console.log("Erro interno:");
        console.error(e);
    }
})();
