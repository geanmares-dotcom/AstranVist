const fs = require('fs');
const dark = fs.readFileSync('c:/Users/gean.mares/.gemini/antigravity/scratch/AstranVist/web/src/assets/logo-dark.png').toString('base64');
const light = fs.readFileSync('c:/Users/gean.mares/.gemini/antigravity/scratch/AstranVist/web/src/assets/logo-light.png').toString('base64');
fs.writeFileSync('c:/Users/gean.mares/.gemini/antigravity/scratch/AstranVist/web/src/assets/logos.ts', 'export const logoDarkBase64 = "data:image/png;base64,' + dark + '";\nexport const logoLightBase64 = "data:image/png;base64,' + light + '";\n');
