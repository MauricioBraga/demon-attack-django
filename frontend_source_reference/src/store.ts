import { isTouchOnlyDevice } from './input';

export const LOCAL_STORAGE_KEY = 'demon-attack-store';

export class Store {
    highScore = 0;
    
    volume = 10;

    autofire = isTouchOnlyDevice();
    tracer = false;
    fast = false;
}

export let store: Store;

export function saveStore() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
}

export function loadStore() {
    if (store) {
        return;
    }

    store = new Store();

    const str = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (str) {
        try {
            const parsed = JSON.parse(str);
            // Copia só os campos que ainda existem em Store — descarta de
            // vez qualquer campo de uma partida em andamento salvo por uma
            // versão anterior (score/level/bunkers/spawnedDemons/
            // cannonExploded), já que o jogo nunca mais deve retomar uma
            // sessão anterior.
            if (typeof parsed.highScore === 'number') {
                store.highScore = parsed.highScore;
            }
            if (typeof parsed.volume === 'number') {
                store.volume = parsed.volume;
            }
            if (typeof parsed.autofire === 'boolean') {
                store.autofire = parsed.autofire;
            }
            if (typeof parsed.tracer === 'boolean') {
                store.tracer = parsed.tracer;
            }
            if (typeof parsed.fast === 'boolean') {
                store.fast = parsed.fast;
            }
        } catch {
            // Mantém o Store recém-criado com os valores padrão.
        }
    }
}