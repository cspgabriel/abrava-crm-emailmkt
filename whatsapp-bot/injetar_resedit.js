const { execSync } = require('child_process');
const fs = require('fs');

console.log("Instalando resedit (Pure JS PE Modifier)...");
execSync('npm install resedit', { stdio: 'inherit' });

const resedit = require('resedit');

(async () => {
    try {
        console.log("Lendo arquivo executável e o ícone...");
        const exeData = fs.readFileSync('PAINEL_ABRAVACOM.exe');
        const icoData = fs.readFileSync('icone.ico');

        const exe = resedit.NtExecutable.from(exeData);
        const res = resedit.NtExecutableResource.from(exe);
        
        const iconFile = resedit.Data.IconFile.from(icoData);
        
        console.log("Injetando ícones no PE Header...");
        resedit.Resource.IconGroupEntry.replaceIconsForResource(
            res.entries, 
            1, // ID do grupo principal
            1033, // LangID en-US (Padrão PKG)
            iconFile.icons.map(item => item.data)
        );
        
        res.outputResource(exe);
        const newExe = exe.generate();
        
        fs.writeFileSync('PAINEL_ABRAVACOM.exe', Buffer.from(newExe));
        console.log("✅ ÍCONE INJETADO DIRETAMENTE NO PAINEL_ABRAVACOM.exe!");
    } catch(e) {
        console.log("ERRO FATAL:", e.message);
        console.error(e);
    }
})();
