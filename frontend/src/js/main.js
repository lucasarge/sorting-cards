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
    column: 5,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true
}, '.yes-grid');

const maybeGrid = GridStack.init({
    column: 5,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true
}, '.maybe-grid');

const noGrid = GridStack.init({
    column: 5,
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

function addCardToGrid(grid, container, card) {
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
    container.appendChild(el);

    grid.makeWidget(el, {
        w: 1,
        h: 1,
        autoPosition: true
    });
}

function renderCardsInGrid(cards) {
    const yesContainer = document.querySelector('.yes-grid');
    const maybeContainer = document.querySelector('.maybe-grid');
    const noContainer = document.querySelector('.no-grid');

    cards.forEach((card, index) => {
        if (index % 3 === 0) {
            addCardToGrid(noGrid, noContainer, card);
        } else if (index % 3 === 1) {
            addCardToGrid(maybeGrid, maybeContainer, card);
        } else {
            addCardToGrid(yesGrid, yesContainer, card);
        }
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
}

/* ------------------ #1 SELECTION ------------------ */

function selectNumber1(cardEl) {
    // Clear previous selection
    document.querySelectorAll('.grid-stack-item')
        .forEach(el => el.classList.remove('selected'));

    // Select new #1
    cardEl.classList.add('selected');
    gameState.number1 = cardEl.dataset.id;

    const continueBtn = document.getElementById('continueBtn');
    continueBtn.disabled = false;

    // 🔥 THIS IS THE IMPORTANT PART
    continueBtn.onclick = goToFinalPhase;
}

/* ----------------- PHASE 3 -----------------*/

function goToFinalPhase() {
    console.log('🏁 Final Phase');

    gameState.phase = 4;

    // 🔥 Clear the entire page body
    document.body.innerHTML = '';

    // 🖼️ Create final container
    const finalContainer = document.createElement('div');
    finalContainer.id = 'final-screen';
    finalContainer.style.cssText = `
        width: 100vw;
        height: 100vh;
        background-image: url('/images/final-bg.jpg');
        background-size: cover;
        background-position: center;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 20px;
        padding: 40px;
        box-sizing: border-box;
    `;

    // 🎴 Render top 4 cards
    gameState.top4.forEach(cardId => {
        const original = document.querySelector(
            `.grid-stack-item[data-id="\${cardId}"]`
        );

        if (!original) return;

        const clone = original.cloneNode(true);
        clone.classList.remove('selected');

        // ⭐ Highlight the #1 card
        if (cardId === gameState.number1) {
            clone.style.border = '4px solid gold';
            clone.style.boxShadow = '0 0 20px gold';
        }

        finalContainer.appendChild(clone);
    });

    document.body.appendChild(finalContainer);
}

/* ------------------ INIT ------------------ */

(async () => {
    const cards = await loadCards('motivation');
    renderCardsInGrid(cards);
})();
