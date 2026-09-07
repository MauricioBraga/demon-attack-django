import { enter as enterGame } from './screen';
import { store, saveStore } from './store';
import { getSidePanelWidth } from './side-panel';

let landscape = false;

export function enter() {
    document.body.style.backgroundColor = '#0F0F0F';

    window.addEventListener('resize', windowResized);

    const mainElement = document.getElementById('main-content') as HTMLElement;
    mainElement.innerHTML = `
            <div id="start-container">
                <div id="start-div">
                    <div id="high-score-div">High Score: ${store.highScore}</div>
                    <div class="checkboxes-div">
                        <div class="checkbox-item">
                            <input type="checkbox" id="autofire-checkbox" name="autofire-checkbox">
                            <label for="autofire-checkbox">
                                <span class="custom-checkbox"></span>
                                Autofire
                            </label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="tracer-checkbox" name="tracer-checkbox">
                            <label for="tracer-checkbox">
                                <span class="custom-checkbox"></span>
                                Tracer
                            </label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="fast-checkbox" name="fast-checkbox">
                            <label for="fast-checkbox">
                                <span class="custom-checkbox"></span>
                                Fast
                            </label>
                        </div>
                    </div>
                    <div id="go-div">
                        <button id="start-button">Start</button>
                    </div>
                </div>
            </div>`;

    const autofireCheckbox = document.getElementById('autofire-checkbox') as HTMLInputElement;
    autofireCheckbox.checked = store.autofire;

    const tracerCheckbox = document.getElementById('tracer-checkbox') as HTMLInputElement;
    tracerCheckbox.checked = store.tracer;

    const fastCheckbox = document.getElementById('fast-checkbox') as HTMLInputElement;
    fastCheckbox.checked = store.fast;

    const startButton = document.getElementById('start-button') as HTMLButtonElement;
    startButton.addEventListener('click', startButtonClicked);

    windowResized();
}

export function exit() {
    window.removeEventListener('resize', windowResized);

    const startButton = document.getElementById('start-button') as HTMLButtonElement;
    startButton.removeEventListener('click', startButtonClicked);

    const autofireCheckbox = document.getElementById('autofire-checkbox') as HTMLInputElement;
    store.autofire = autofireCheckbox.checked;

    const tracerCheckbox = document.getElementById('tracer-checkbox') as HTMLInputElement;
    store.tracer = tracerCheckbox.checked;

    const fastCheckbox = document.getElementById('fast-checkbox') as HTMLInputElement;
    store.fast = fastCheckbox.checked;

    saveStore();
}

function startButtonClicked() {
    const autofireCheckbox = document.getElementById('autofire-checkbox') as HTMLInputElement;
    store.autofire = autofireCheckbox.checked;

    const tracerCheckbox = document.getElementById('tracer-checkbox') as HTMLInputElement;
    store.tracer = tracerCheckbox.checked;

    const fastCheckbox = document.getElementById('fast-checkbox') as HTMLInputElement;
    store.fast = fastCheckbox.checked;

    exit();
    enterGame();
}

function windowResized() {
    const startContainer = document.getElementById('start-container') as HTMLDivElement;
    const startDiv = document.getElementById('start-div') as HTMLDivElement;

    startContainer.style.width = startContainer.style.height = '';
    startContainer.style.left = startContainer.style.top = '';
    startContainer.style.display = 'none';

    startDiv.style.left = startDiv.style.top = startDiv.style.transform = '';
    startDiv.style.display = 'none';

    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;
    landscape = (innerWidth >= innerHeight);

    // Reserva a mesma largura ocupada pelo painel de recordes/volume
    // (src/side-panel.ts, sempre visível) para que este menu não fique
    // por baixo dele.
    const sidePanelWidth = getSidePanelWidth(innerWidth, innerHeight);
    const availableWidth = innerWidth - sidePanelWidth;

    startContainer.style.left = '0px';
    startContainer.style.top = '0px';
    startContainer.style.width = `${availableWidth}px`;
    startContainer.style.height = `${innerHeight}px`;
    startContainer.style.display = 'block';

    startDiv.style.display = 'flex';

    if (landscape) {
        const rect = startDiv.getBoundingClientRect();
        startDiv.style.left = `${(availableWidth - rect.width) / 2}px`
        startDiv.style.top = `${(innerHeight - rect.height) / 2}px`;
    } else {
        startDiv.style.transform = 'rotate(-90deg)';
        const rect = startDiv.getBoundingClientRect();
        startDiv.style.left = `${(availableWidth - rect.height) / 2}px`
        startDiv.style.top = `${(innerHeight - rect.width) / 2}px`;
    }
}
