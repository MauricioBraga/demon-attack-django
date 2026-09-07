// Copia o build (public_html/app/) para dentro do app Django "game":
//   - app.html            -> ../game/templates/game/index.html
//   - scripts/, styles/,
//     icons/, manifest.json,
//     resources.zip, sw.bundle.js -> ../game/static/game/...
//
// Usa fs.rmSync/fs.cpSync (Node >= 16.7) em vez de comandos de shell
// (rm/cp/xcopy) para funcionar igual no Windows, Linux e macOS.
import { rmSync, cpSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const builtApp = path.join(here, 'public_html', 'app');

const templateSrc = path.join(builtApp, 'app.html');
const templateDest = path.join(here, '..', 'game', 'templates', 'game', 'index.html');
mkdirSync(path.dirname(templateDest), { recursive: true });

const staticDest = path.join(here, '..', 'game', 'static', 'game');

// Tudo que está em public_html/app/, exceto o próprio app.html (que vira
// o template Django, não um arquivo estático), vai para game/static/game/.
const STATIC_ENTRIES = ['scripts', 'styles', 'icons', 'manifest.json', 'resources.zip', 'sw.bundle.js'];

if (!existsSync(builtApp)) {
    console.error(`Pasta de build não encontrada: ${builtApp}\nRode "npm run build" antes de "npm run deploy".`);
    process.exit(1);
}

if (!existsSync(templateSrc)) {
    console.error(`Template não encontrado: ${templateSrc}`);
    process.exit(1);
}

cpSync(templateSrc, templateDest, { force: true });
console.log(`Template copiado para:\n  ${templateDest}`);

rmSync(staticDest, { recursive: true, force: true });
mkdirSync(staticDest, { recursive: true });
for (const entry of STATIC_ENTRIES) {
    const from = path.join(builtApp, entry);
    if (!existsSync(from)) {
        console.warn(`Aviso: ${from} não existe, pulando.`);
        continue;
    }
    const to = path.join(staticDest, entry);
    cpSync(from, to, { recursive: true });
}
console.log(`Arquivos estáticos copiados para:\n  ${staticDest}`);

const copied = readdirSync(staticDest);
console.log(`Conteúdo final de game/static/game/: ${copied.join(', ')}`);
