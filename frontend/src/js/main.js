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
    column: 6,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true,
    float: false
}, '.yes-grid');

const maybeGrid = GridStack.init({
    column: 6,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true,
    float: false
}, '.maybe-grid');

const noGrid = GridStack.init({
    column: 6,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true,
    float: false
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
    if (yesLane) yesLane.style.borderRadius = '8px';

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

    continueBtn.disabled = gameState.number1 == null;

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
    if (gameState.phase !== 3) return;
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

/* ----------------- FINAL PHASE -----------------*/

function goToFinalPhase() {
    console.log('🏁 Final Phase');
    gameState.phase = 4;

    const instructions = document.getElementById('instructions');
    if (instructions) instructions.textContent = 'Summary of Motivation Drivers:';

    // Hide other UI elements
    const yesLabel = document.getElementById('yes-label');
    const yesLane = document.getElementById('yes');
    const yesGridEl = document.querySelector('.yes-grid')
    if (yesLabel) yesLabel.style.display = 'none';
    if (yesLane) yesLane.style.display = 'block';
    if (yesGridEl) {
        yesGridEl.style.backgroundImage = "url('/images/background.png')";
        yesGridEl.style.backgroundSize = 'cover';
        yesGridEl.style.backgroundPosition = 'center';
        yesGridEl.style.backgroundRepeat = 'no-repeat';
        yesGridEl.style.width = '100%';
        yesGridEl.style.height = window.innerHeight * 0.88 + 'px';
        yesGridEl.style.position = 'relative';
    }



    document.body.classList.add('final-phase');

    yesGrid.disable();
    layoutCardsByCorner(yesGridEl);
}

function layoutCardsByCorner(container) {
    if (!container) return;

    const cards = container.querySelectorAll('.grid-stack-item');
    const padding = 20;
    const cardWidth = 150;
    const cardHeight = 170;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // corner origin points
    const corners = {
        tl: { x: padding, y: padding, cols: 2, rows: 2 },
        tr: { x: containerWidth - padding, y: padding, cols: 2, rows: 2 },
        bl: { x: padding, y: containerHeight - padding, cols: 2, rows: 2 },
        br: { x: containerWidth - padding, y: containerHeight - padding, cols: 2, rows: 2 }
    };

    // track how many cards are in each corner
    const cornerCounts = { tl: 0, tr: 0, bl: 0, br: 0 };

    cards.forEach(el => {
        let corner = 'tl';
        if (el.dataset.tl === 'true') corner = 'tl';
        else if (el.dataset.tr === 'true') corner = 'tr';
        else if (el.dataset.bl === 'true') corner = 'bl';
        else if (el.dataset.br === 'true') corner = 'br';

        const count = cornerCounts[corner];

        // calculate row & col in the small subgrid (2x2)
        const row = Math.floor(count / corners[corner].cols);
        const col = count % corners[corner].cols;

        let posX, posY;

        switch (corner) {
            case 'tl':
                posX = corners[corner].x + col * (cardWidth + 1000);
                posY = corners[corner].y + row * (cardHeight + 300);
                break;
            case 'tr':
                posX = corners[corner].x - cardWidth - col * (cardWidth + 1000);
                posY = corners[corner].y + row * (cardHeight + 300);
                break;
            case 'bl':
                posX = corners[corner].x + col * (cardWidth + 1000);
                posY = corners[corner].y - cardHeight - row * (cardHeight + 300);
                break;
            case 'br':
                posX = corners[corner].x - cardWidth - col * (cardWidth + 1000);
                posY = corners[corner].y - cardHeight - row * (cardHeight + 300);
                break;
        }

        el.style.position = 'absolute';
        el.style.left = posX + 'px';
        el.style.top = posY + 'px';

        cornerCounts[corner]++;
    });
}




/* ------------------ INIT ------------------ */

(async () => {
    const cards = await loadCards('motivation');
    renderCardsInGrid(cards);
})();
