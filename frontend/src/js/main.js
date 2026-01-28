import { GridStack } from 'gridstack';

/* ------------------ GAME STATE ------------------ */

const gameState = {
    phase: 1,
    lanes: {
        yes: [],
        maybe: [],
        no: []
    },
    top4: [],
    number1: null
};

/* ------------------ DOM READY ------------------ */

document.addEventListener('DOMContentLoaded', () => {
    document
        .getElementById('continueBtn')
        .addEventListener('click', handleContinue);
});

/* ------------------ UPDATE BTN ------------------ */

function handleContinue() {
    if (gameState.phase === 1) {
        goToPhase2();
    } else if (gameState.phase === 2) {
        goToPhase3();
    } else if (gameState.phase === 3) {
        console.log('Game complete!');
        // future: show results screen
    }
}

/* ------------------ LOAD CARDS ------------------ */

async function loadCards(setName) {
    const res = await fetch('/json/cards.json');
    if (!res.ok) throw new Error('Failed to load cards.json');
    const data = await res.json();
    return data.cards[setName] || [];
}

/* ------------------ GRIDS ------------------ */

const yesGrid = GridStack.init({
    column: 4,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true
}, '.yes-grid');

const maybeGrid = GridStack.init({
    column: 4,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true
}, '.maybe-grid');

const noGrid = GridStack.init({
    column: 4,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true
}, '.no-grid');

/* ------------------ EVENTS ------------------ */

yesGrid.on('added removed', updatePhase1State);
maybeGrid.on('added removed', updatePhase1State);
noGrid.on('added removed', updatePhase1State);

/* ------------------ RENDER CARDS ------------------ */

function renderCardsInGrid(cards) {
    const yesContainer = document.querySelector('.yes-grid');

    cards.forEach(card => {
        const el = document.createElement('div');
        el.classList.add('grid-stack-item');
        el.dataset.id = card.id;

        const content = document.createElement('div');
        content.classList.add('grid-stack-item-content');
        content.innerHTML = `
            <div class="title">${card.title}</div>
            <div class="description">
                ${card.description.replace(/\n/g, '<br>')}
            </div>
            <div class="copyright">
                ©2026 Divergent Thinking. All rights reserved.
            </div>
        `;

        el.appendChild(content);
        yesContainer.appendChild(el);

        yesGrid.makeWidget(el, {
            w: 1,
            h: 1,
            autoPosition: true
        });
    });
}

/* ------------------ PHASE 1 ------------------ */

function updatePhase1State() {
    gameState.lanes.yes = yesGrid.engine.nodes.map(n => n.el.dataset.id);
    gameState.lanes.maybe = maybeGrid.engine.nodes.map(n => n.el.dataset.id);
    gameState.lanes.no = noGrid.engine.nodes.map(n => n.el.dataset.id);

    validatePhase1();
}

function validatePhase1() {
    const continueBtn = document.getElementById('continueBtn');
    continueBtn.disabled = gameState.lanes.yes.length < 4;
}

/* ------------------ PHASE 2 ------------------ */

function goToPhase2() {
    console.log('➡ Phase 2');

    gameState.phase = 2;
    gameState.top4 = [];

    maybeGrid.removeAll();
    noGrid.removeAll();

    const maybeContainer = document.getElementById('maybe');
    const noContainer = document.getElementById('no');
    const yesContainer = document.querySelector('.yes-grid'); 
    const yesLabel = document.getElementById('yes-label');
    const yesLane = document.getElementById('yes');
    if (maybeContainer) maybeContainer.style.display = 'none';
    if (noContainer) noContainer.style.display = 'none';
    if (yesContainer) yesContainer.style.borderRadius = '8px'; 
    if (yesLabel) yesLabel.style.borderRadius = '8px 0 0 8px';
    if (yesLane) yesLane.style.borderRadius = '8px 0 0 8px';

    yesGrid.engine.nodes.forEach(n => {
        n.x = null;
        n.y = null;
    });
    yesGrid.compact();

    const instructions = document.getElementById('instructions');
    if (instructions) {
        instructions.textContent = 'Select your top 4 cards';
    }

    yesGrid.engine.nodes.forEach(n => {
        const content = n.el.querySelector('.grid-stack-item-content');
        if (!content) return;

        content.onclick = () => toggleSelectionPhase2(n.el);
    });

    const continueBtn = document.getElementById('continueBtn');
    continueBtn.disabled = true;
}

/* ------------------ PHASE 2 SELECTION ------------------ */

function toggleSelectionPhase2(cardEl) {
    const cardId = cardEl.dataset.id;

    if (gameState.top4.includes(cardId)) {
        gameState.top4 = gameState.top4.filter(id => id !== cardId);
        cardEl.classList.remove('selected');
    } else {
        if (gameState.top4.length >= 4) return;
        gameState.top4.push(cardId);
        cardEl.classList.add('selected');
    }

    const continueBtn = document.getElementById('continueBtn');
    if (gameState.top4.length === 4) {
        continueBtn.disabled = false;
    } else {
        continueBtn.disabled = true;
    }
}

/* ------------------ PHASE 3 ------------------ */

function goToPhase3() {
    console.log('➡ Phase 3');

    gameState.phase = 3;
    gameState.number1 = null;

    // Remove all cards EXCEPT top 4
    yesGrid.engine.nodes.forEach(n => {
        if (!gameState.top4.includes(n.el.dataset.id)) {
            yesGrid.removeWidget(n.el);
        }
    });

    // Re-layout
    yesGrid.engine.nodes.forEach(n => {
        n.x = null;
        n.y = null;
    });
    yesGrid.compact();

    // Update instructions
    const instructions = document.getElementById('instructions');
    if (instructions) instructions.textContent = 'Pick your #1 card';

    // Reset selection visuals + handlers
    yesGrid.engine.nodes.forEach(n => {
        const el = n.el;
        const content = el.querySelector('.grid-stack-item-content');

        // 🔥 Clear phase 2 visuals
        el.classList.remove('selected');

        // 🔥 Remove old click handlers by cloning
        const fresh = content.cloneNode(true);
        content.replaceWith(fresh);

        // 🔥 Add Phase 3 click handler
        fresh.addEventListener('click', () => selectNumber1(el));
    });

    updateContinuePhase3();
}

/* ------------------ #1 SELECTION ------------------ */

function selectNumber1(cardEl) {
    const cardId = cardEl.dataset.id;

    // Deselect previous #1
    yesGrid.engine.nodes.forEach(n => {
        n.el.classList.remove('selected');
    });

    // Select new #1
    cardEl.classList.add('selected');
    gameState.number1 = cardId;

    console.log('🏆 Number 1:', cardId);

    updateContinuePhase3();
}

function updateContinuePhase3() {
    const continueBtn = document.getElementById('continueBtn');
    continueBtn.disabled = !gameState.number1;
}

/* ------------------ INIT ------------------ */

(async () => {
    const cards = await loadCards('motivation');
    renderCardsInGrid(cards);
})();
