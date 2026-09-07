function init() {
    const mainElement = document.getElementById('main-content') as HTMLElement;
    mainElement.innerHTML = '<div id="loading-div" class="loading-container">...</div>';
    const loadingDiv = document.getElementById('loading-div') as HTMLDivElement;
    const intervalId = window.setInterval(() => {
        loadingDiv.textContent = (loadingDiv.textContent === '...')
            ? '' 
            : loadingDiv.textContent + '.';
    }, 400);
    setTimeout(() => registerServiceWorker(intervalId), 10);
}

function registerServiceWorker(intervalId: number) {
    if ('serviceWorker' in navigator) {
        // Caminho absoluto (não relativo à <base href>): o Django serve o
        // service worker na raiz do site (view game.views.service_worker),
        // não junto dos demais arquivos estáticos, para que seu escopo
        // padrão cubra o site inteiro em vez de só /static/game/.
        navigator.serviceWorker.register('/sw.bundle.js?v=2026-09-06').then(() => importApp(intervalId));
    } else {
        importApp(intervalId);
    }
}

function importApp(intervalId: number) {
    import(/* webpackChunkName: "app" */ './app').then(module => {
        clearInterval(intervalId);
        module.init();
    });
}

document.addEventListener('DOMContentLoaded', init);