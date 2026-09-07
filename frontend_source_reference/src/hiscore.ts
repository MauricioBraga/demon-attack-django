import { startInput, stopInput } from '@/input';
import { refreshLeaderboard } from '@/side-panel';

// Caminho relativo: funciona independentemente do domínio/porta em que o Django estiver servindo o jogo.
const API_BASE = '/api/scores/';
const TOP_N = 10;

interface ScoreEntry {
    id: number;
    name: string;
    score: number;
    level: number;
}

interface CheckResponse {
    qualifies: boolean;
    rank: number | null;
}

let overlayEl: HTMLDivElement | null = null;

/**
 * Deve ser chamada no exato momento em que uma partida termina (ver src/game/cannon.ts).
 * Consulta o backend para saber se a pontuação entra no Top 10 e, em caso positivo,
 * exibe o formulário para o jogador digitar seu nome.
 */
export async function onGameOver(score: number, level: number) {
    if (score <= 0) {
        return;
    }

    // Suspende a leitura de teclado/toque/gamepad enquanto aguardamos o servidor,
    // para que a animação de "game over" não seja interrompida por um resetGame()
    // prematuro (qualquer tecla é interpretada como "fire" pelo motor do jogo).
    stopInput();

    try {
        const response = await fetch(`${API_BASE}check/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score }),
        });

        if (!response.ok) {
            startInput();
            return;
        }

        const data = await response.json() as CheckResponse;
        if (data.qualifies && data.rank) {
            showNameEntry(score, level, data.rank);
        } else {
            startInput();
        }
    } catch (err) {
        console.error('Falha ao verificar recorde:', err);
        startInput();
    }
}

function showNameEntry(score: number, level: number, rank: number) {
    closeOverlay();

    overlayEl = document.createElement('div');
    overlayEl.id = 'hiscore-overlay';

    const modal = document.createElement('div');
    modal.id = 'hiscore-modal';

    const heading = document.createElement('h2');
    heading.textContent = 'Novo Recorde!';

    const rankParagraph = document.createElement('p');
    rankParagraph.innerHTML = `Você alcançou a <strong>${rank}ª posição</strong> no ranking com ` +
            `<strong>${score}</strong> pontos (nível ${level}).`;

    const promptParagraph = document.createElement('p');
    promptParagraph.textContent = 'Digite seu nome para entrar na lista de recordes:';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'hiscore-name-input';
    input.maxLength = 20;
    input.autocomplete = 'off';
    input.placeholder = 'Seu nome';

    const buttonsDiv = document.createElement('div');
    buttonsDiv.id = 'hiscore-modal-buttons';

    const submitButton = document.createElement('button');
    submitButton.id = 'hiscore-submit-button';
    submitButton.textContent = 'Salvar';

    const skipButton = document.createElement('button');
    skipButton.id = 'hiscore-skip-button';
    skipButton.className = 'secondary';
    skipButton.textContent = 'Agora não';

    const errorParagraph = document.createElement('p');
    errorParagraph.id = 'hiscore-error';
    errorParagraph.className = 'hiscore-error';

    buttonsDiv.append(submitButton, skipButton);
    modal.append(heading, rankParagraph, promptParagraph, input, buttonsDiv, errorParagraph);
    overlayEl.appendChild(modal);
    document.body.appendChild(overlayEl);

    input.focus();

    let submitting = false;

    async function submit() {
        if (submitting) {
            return;
        }
        const name = input.value.trim();
        if (!name) {
            errorParagraph.textContent = 'Digite um nome.';
            input.focus();
            return;
        }

        submitting = true;
        submitButton.disabled = true;
        errorParagraph.textContent = '';

        try {
            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, score, level }),
            });

            if (!response.ok) {
                const body = await response.json().catch(() => null);
                errorParagraph.textContent = body?.name?.[0] ?? 'Não foi possível salvar. Tente novamente.';
                submitting = false;
                submitButton.disabled = false;
                return;
            }

            closeOverlay();
            refreshLeaderboard();
            renderLeaderboard('leaderboard-div'); // landing page (index.html), se estiver aberta
        } catch {
            errorParagraph.textContent = 'Erro de conexão. Tente novamente.';
            submitting = false;
            submitButton.disabled = false;
        }
    }

    input.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            submit();
        }
    });
    // Impede que o motor do jogo (que escuta 'keyup' na window) interprete a digitação como "fire".
    input.addEventListener('keyup', e => e.stopPropagation());

    submitButton.addEventListener('click', submit);
    skipButton.addEventListener('click', () => closeOverlay());
}

function closeOverlay() {
    if (overlayEl) {
        overlayEl.remove();
        overlayEl = null;
    }
    startInput();
}

/**
 * Renderiza (ou atualiza) a tabela com os 10 maiores recordes dentro do elemento
 * com o id informado. Usada tanto na página inicial (index.html) quanto no
 * painel exibido na tela de opções (start.ts).
 */
export async function renderLeaderboard(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    try {
        const response = await fetch(API_BASE);
        if (!response.ok) {
            return;
        }
        const scores = await response.json() as ScoreEntry[];
        buildLeaderboardTable(container, scores);
    } catch (err) {
        console.error('Falha ao carregar recordes:', err);
    }
}

function buildLeaderboardTable(container: HTMLElement, scores: ScoreEntry[]) {
    container.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'leaderboard-title';
    title.textContent = 'Top 10 recordes';
    container.appendChild(title);

    const table = document.createElement('table');
    table.className = 'leaderboard-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['#', 'Nome', 'Pontos', 'Nível'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    if (scores.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'Nenhum recorde registrado ainda.';
        row.appendChild(cell);
        tbody.appendChild(row);
    } else {
        scores.slice(0, TOP_N).forEach((entry, index) => {
            const row = document.createElement('tr');

            const rankCell = document.createElement('td');
            rankCell.textContent = String(index + 1);

            const nameCell = document.createElement('td');
            nameCell.textContent = entry.name; // textContent: evita XSS via nome do jogador

            const scoreCell = document.createElement('td');
            scoreCell.textContent = String(entry.score);

            const levelCell = document.createElement('td');
            levelCell.textContent = String(entry.level);

            row.append(rankCell, nameCell, scoreCell, levelCell);
            tbody.appendChild(row);
        });
    }
    table.appendChild(tbody);
    container.appendChild(table);
}
