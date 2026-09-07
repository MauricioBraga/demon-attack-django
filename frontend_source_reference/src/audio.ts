import { JSZipObject } from "jszip";

const audioContext = new AudioContext();
audioContext.onstatechange = () => {
    if (audioContext.state === 'suspended') {
        stopAll();
    }
};

let resumePromise: Promise<void> | null = null;

function resume(): Promise<void> {
    if (!resumePromise) {
        resumePromise = audioContext.resume();
        resumePromise.then(() => resumePromise = null).catch(() => resumePromise = null);
    }
    return resumePromise;
}

let suspendPromise: Promise<void> | null = null;

function suspend(): Promise<void> {
    if (!suspendPromise) {
        suspendPromise = audioContext.suspend();
        suspendPromise.then(() => suspendPromise = null).catch(() => suspendPromise = null);
    }
    return suspendPromise;
}

let docVisible = true;

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        docVisible = true;
        if (audioContext.state === 'suspended') {
            resume();
        }
    } else if (document.visibilityState === 'hidden') {
        docVisible = false;
        stopAll();
        if (audioContext.state === 'running') {
            suspend();
        }
    }
});

const masterGain = audioContext.createGain();
masterGain.connect(audioContext.destination);
masterGain.gain.value = 0.1;

const promises: Promise<Map<string, AudioBuffer>>[] = [];

const audioBuffers = new Map<string, AudioBuffer>();

const activeSources = new Map<string, AudioBufferSourceNode>();

// Efeitos "exclusivos": ao começar a tocar um deles, todo e qualquer outro
// som ativo é interrompido, e nenhum outro som (nem um novo, nem um que já
// estava tocando) consegue soar até ele terminar sozinho, do início ao fim.
const EXCLUSIVE_SFX = new Set<string>(['sfx/awards-bunker.mp3']);

let exclusiveName: string | null = null;

export function setVolume(volume: number) {
    if (audioContext.state === 'suspended') {
        if (docVisible) {
            resume().then(() => setVolume(volume));
        }
        return;
    }
    masterGain.gain.value = volume / 100;
}

export function decodeAudioData(name: string, obj: JSZipObject) {
    promises.push(obj.async('arraybuffer')
        .then(data => audioContext.decodeAudioData(data))
        .then(buffer => audioBuffers.set(name, buffer)));
}

export async function waitForDecodes() {
    return Promise.all(promises).then(() => promises.length = 0);
}

export function play(name: string, loop = false) {
    if (audioContext.state === 'suspended') {
        if (docVisible) {
            resume().then(() => play(name, loop));
        }
        return;
    }

    if (exclusiveName !== null && name !== exclusiveName) {
        // Um efeito exclusivo está tocando: nenhum outro som pode começar
        // (nem interrompê-lo) até ele terminar por conta própria.
        return;
    }

    if (EXCLUSIVE_SFX.has(name)) {
        stopAll();
        exclusiveName = name;
    }

    if (loop) {
        if (activeSources.has(name)) {
            return;
        }
    } else {
        stop(name);
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffers.get(name) as AudioBuffer;
    source.connect(masterGain);
    source.loop = loop;

    activeSources.set(name, source);
    source.onended = () => {
        activeSources.delete(name);
        if (name === exclusiveName) {
            exclusiveName = null;
        }
    };

    source.start();
}

export function stop(name: string) {
    const source = activeSources.get(name);
    if (source) {
        activeSources.delete(name);
        source.stop();
    }
}

export function stopAll() {
    for (const source of activeSources.values()) {
        source.stop();
    }
    activeSources.clear();
}