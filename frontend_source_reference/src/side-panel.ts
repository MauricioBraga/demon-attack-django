import { store, saveStore } from './store';
import { setVolume } from './audio';
import { renderLeaderboard } from './hiscore';

// Abaixo dessa largura de janela (ou em modo retrato), não há espaço
// horizontal suficiente para manter o painel ao lado do jogo sem
// espremer demais a área de jogo: nesse caso o painel passa a ficar
// abaixo do jogo (rolagem normal da página) em vez de fixo à direita.
const MIN_LANDSCAPE_WIDTH_FOR_DOCKED_PANEL = 700;
const DOCKED_PANEL_WIDTH_FRACTION = 0.26;
const DOCKED_PANEL_MIN_WIDTH = 220;
const DOCKED_PANEL_MAX_WIDTH = 320;

let mounted = false;
let panelEl: HTMLDivElement | null = null;

/**
 * Verdadeiro quando há espaço suficiente (janela larga o bastante e em
 * modo paisagem) para "encaixar" o painel ao lado direito da tela do jogo.
 */
function isDocked(innerWidth: number, innerHeight: number): boolean {
    return innerWidth >= innerHeight && innerWidth >= MIN_LANDSCAPE_WIDTH_FOR_DOCKED_PANEL;
}

/**
 * Largura (em pixels) que screen.ts e start.ts devem reservar à direita
 * para o painel. Retorna 0 quando o painel está "empilhado" abaixo do
 * jogo (telas estreitas/retrato), já que nesse modo ele não disputa
 * espaço horizontal com a área de jogo.
 */
export function getSidePanelWidth(innerWidth: number, innerHeight: number): number {
    if (!isDocked(innerWidth, innerHeight)) {
        return 0;
    }
    return Math.round(Math.min(DOCKED_PANEL_MAX_WIDTH,
            Math.max(DOCKED_PANEL_MIN_WIDTH, innerWidth * DOCKED_PANEL_WIDTH_FRACTION)));
}

/**
 * Monta o painel lateral permanente (controle de volume + Top 10) uma
 * única vez, assim que o app inicia. Ele fica fora de #main-content, então
 * sobrevive a qualquer troca de tela (progresso de carregamento, demo,
 * jogo real ou o menu de opções).
 */
export function mountSidePanel() {
    if (mounted) {
        return;
    }
    mounted = true;

    panelEl = document.createElement('div');
    panelEl.id = 'side-panel';
    panelEl.innerHTML = `
        <div id="side-panel-volume">
            <span id="side-volume-icon">\u{1F50A}</span>
            <input type="range" id="side-volume-input" min="0" max="100" step="any" value="${store?.volume ?? 10}">
            <span id="side-volume-value">${Math.round(store?.volume ?? 10)}</span>
        </div>
        <div id="side-panel-leaderboard"></div>`;
    document.body.appendChild(panelEl);

    const volumeInput = document.getElementById('side-volume-input') as HTMLInputElement;
    volumeInput.addEventListener('input', onVolumeChanged);
    // Impede que teclas usadas para ajustar o slider (setas, espaço) sejam
    // também interpretadas pelo motor do jogo como comandos de movimento/tiro.
    volumeInput.addEventListener('keydown', e => e.stopPropagation());
    volumeInput.addEventListener('keyup', e => e.stopPropagation());

    updateVolumeDisplay();
    applyLayout();
    renderLeaderboard('side-panel-leaderboard');

    window.addEventListener('resize', applyLayout);
}

function onVolumeChanged() {
    const volumeInput = document.getElementById('side-volume-input') as HTMLInputElement;
    store.volume = 100 * (+volumeInput.value - +volumeInput.min) / (+volumeInput.max - +volumeInput.min);
    setVolume(store.volume);
    saveStore();
    updateVolumeDisplay();
}

function updateVolumeDisplay() {
    const icon = document.getElementById('side-volume-icon') as HTMLSpanElement;
    const value = document.getElementById('side-volume-value') as HTMLSpanElement;
    if (!icon || !value) {
        return;
    }
    const volume = store?.volume ?? 0;
    if (volume === 0) {
        icon.textContent = '\u{1F507}'; // 🔇 mudo
    } else if (volume < 33) {
        icon.textContent = '\u{1F508}'; // 🔈 volume baixo
    } else if (volume < 66) {
        icon.textContent = '\u{1F509}'; // 🔉 volume médio
    } else {
        icon.textContent = '\u{1F50A}'; // 🔊 volume alto
    }
    value.textContent = String(Math.round(volume));
}

function applyLayout() {
    if (!panelEl) {
        return;
    }
    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;
    const docked = isDocked(innerWidth, innerHeight);

    panelEl.classList.toggle('side-panel--docked', docked);
    panelEl.classList.toggle('side-panel--stacked', !docked);

    if (docked) {
        panelEl.style.width = `${getSidePanelWidth(innerWidth, innerHeight)}px`;
    } else {
        panelEl.style.width = '';
    }
}

/** Chamada pelo hiscore.ts sempre que um novo recorde é salvo. */
export function refreshLeaderboard() {
    renderLeaderboard('side-panel-leaderboard');
}
