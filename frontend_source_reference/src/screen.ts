import { startAnimation, stopAnimation } from './animate';
import { acquireWakeLock, releaseWakeLock } from './wake-lock';
import { NoParamVoidFunc } from './no-param-void-func';
import { enter as enterStart } from './start';
import { PhysicalDimensions, Resolution } from './graphics';
import { startInput, stopInput, resetInput } from './input';
import { renderScreen, resetGame, saveGame } from './game/game';
import { stopAll } from './audio';
import { getSidePanelWidth } from './side-panel';

export let dpr: number;

let mainCanvas: HTMLCanvasElement;
let mainCtx: CanvasRenderingContext2D | null;
let mainCanvasWidth: number;
let mainCanvasHeight: number;

let screenCanvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D | null;

let removeMediaEventListener: NoParamVoidFunc | null = null;
let exiting = false;

let screenWidth: number;
let screenHeight: number;
let screenX: number;
let screenY: number;

function updatePixelRatio() {
    if (removeMediaEventListener !== null) {
        removeMediaEventListener();
        removeMediaEventListener = null;
    }

    if (exiting) {
        return;
    }

    const media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    media.addEventListener("change", updatePixelRatio);
    removeMediaEventListener = () => media.removeEventListener("change", updatePixelRatio);

    onWindowResized();
};

export function enter(demo: boolean = false) {
    exiting = false;

    resetGame(demo);

    document.body.style.backgroundColor = '#C2BCB1';

    screenCanvas = document.createElement('canvas');
    screenCanvas.width = Resolution.WIDTH;
    screenCanvas.height = Resolution.HEIGHT;  
    ctx = screenCanvas.getContext('2d');

    const mainElement = document.getElementById("main-content") as HTMLElement;
    mainElement.innerHTML = `<canvas id="main-canvas" class="canvas" width="1" height="1"></canvas>`;
    mainCanvas = document.getElementById("main-canvas") as HTMLCanvasElement;
    mainCanvas.style.touchAction = 'none';

    // Garante que a tela do jogo já receba o foco assim que aparecer, para
    // que teclas (como espaço) funcionem imediatamente, sem exigir um clique
    // prévio do usuário em algum elemento da página.
    mainCanvas.tabIndex = -1;
    mainCanvas.focus({ preventScroll: true });

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('resize', onWindowResized);    
    window.addEventListener('focus', onVisibilityChanged);
    window.addEventListener('blur', onVisibilityChanged);
    document.addEventListener('visibilitychange', onVisibilityChanged);
    
    acquireWakeLock();
    updatePixelRatio();
    startInput();
    startAnimation();
}

function cleanUp() {
    if (exiting) {
        return;
    }

    exiting = true;
    stopAnimation();
    stopInput();
    stopAll();
    releaseWakeLock();
    
    window.removeEventListener('beforeunload', onBeforeUnload);
    window.removeEventListener('resize', onWindowResized);    
    window.removeEventListener('focus', onVisibilityChanged);
    window.removeEventListener('blur', onVisibilityChanged);
    document.removeEventListener('visibilitychange', onVisibilityChanged);

    if (removeMediaEventListener !== null) {
        removeMediaEventListener();
        removeMediaEventListener = null;
    }

    saveGame();
}

export function exit() {
    cleanUp();
    enterStart();
}

export function render() {
    if (!mainCtx) {
        onWindowResized();
        return;
    }
    if (!ctx) {
        return;
    }
    
    mainCtx.imageSmoothingEnabled = false;
    mainCtx.fillStyle = '#0F0F0F';    
    mainCtx.fillRect(0, 0, mainCanvasWidth, mainCanvasHeight);

    ctx.imageSmoothingEnabled = false;
    renderScreen(ctx);

    mainCtx.drawImage(screenCanvas, screenX, screenY, screenWidth, screenHeight);

    // hamburger icon
    mainCtx.imageSmoothingEnabled = true;
    mainCtx.fillStyle = '#FFFFFF';    
    mainCtx.fillRect(27, 21, 18, 1);
    mainCtx.fillRect(27, 27, 18, 1);
    mainCtx.fillRect(27, 33, 18, 1);
}

function onWindowResized() {

    if (exiting) {
        return;
    }

    mainCtx = null;
    mainCanvas = document.getElementById("main-canvas") as HTMLCanvasElement;
    mainCanvas.style.display = 'none';

    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;

    // Reserva, à direita, a largura ocupada pelo painel de recordes/volume
    // (ver src/side-panel.ts), para que a tela do jogo não fique por baixo
    // dele. Em telas estreitas/retrato o painel fica empilhado abaixo do
    // jogo, então nada é reservado aqui (sidePanelWidth === 0).
    const sidePanelWidth = getSidePanelWidth(innerWidth, innerHeight);
    const availableWidth = innerWidth - sidePanelWidth;

    mainCanvas.style.display = 'block';
    mainCanvas.style.width = `${availableWidth}px`;
    mainCanvas.style.height = `${innerHeight}px`;    
    mainCanvas.style.position = 'absolute';
    mainCanvas.style.left = '0px';
    mainCanvas.style.top = '0px';

    dpr = window.devicePixelRatio || 1;
    mainCanvas.width = Math.floor(dpr * availableWidth);
    mainCanvas.height = Math.floor(dpr * innerHeight);

    const transform = new DOMMatrix();
    if (innerWidth >= innerHeight) {
        // Landscape mode
        mainCanvasWidth = availableWidth;
        mainCanvasHeight = innerHeight;
        transform.a = transform.d = dpr;
        transform.b = transform.c = transform.e = transform.f = 0;
    } else {
        // Portrait mode (sidePanelWidth é sempre 0 aqui, painel fica abaixo)
        mainCanvasWidth = innerHeight;
        mainCanvasHeight = availableWidth;
        transform.a = transform.d = transform.e = 0;
        transform.c = dpr;
        transform.b = -transform.c;        
        transform.f = dpr * innerHeight;
    }

    mainCtx = mainCanvas.getContext('2d');
    if (!mainCtx) {
        return;
    }
    mainCtx.setTransform(transform);

    screenHeight = mainCanvasHeight;
    screenWidth = screenHeight * PhysicalDimensions.WIDTH / PhysicalDimensions.HEIGHT;
    if (screenWidth > mainCanvasWidth) {
        screenWidth = mainCanvasWidth;
        screenHeight = screenWidth * PhysicalDimensions.HEIGHT / PhysicalDimensions.WIDTH;
        screenX = 0;
        screenY = Math.round((mainCanvasHeight - screenHeight) / 2);
    } else {
        // Quando o painel está encaixado à direita, a tela do jogo fica
        // colada a ele (em vez de solta no meio ou grudada na borda
        // esquerda da janela) — a folga sobra do lado esquerdo.
        screenX = sidePanelWidth > 0 ? (mainCanvasWidth - screenWidth) : Math.round((mainCanvasWidth - screenWidth) / 2);
        screenY = 0;
    }

    render();
}

function onVisibilityChanged() {
    if (!exiting && document.visibilityState === 'visible' && document.hasFocus()) {
        acquireWakeLock();
        resetInput();
        startAnimation();
    } else {
        stopAnimation();
        stopAll();
    }
}

function onBeforeUnload() {
    cleanUp();    
}