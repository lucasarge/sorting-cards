import { GridStack } from 'gridstack';

/* ======================================================
   GAME STATE
====================================================== */

const gameState = {
    phase: 1,
    lanes: {
        yes: [],
        maybe: [],
        no: []
    },
    top4: [],
    number1: null,
    currentSet: 'motivation'
};

/* ======================================================
   DOM READY
====================================================== */

document.addEventListener('DOMContentLoaded', () => {
    document
        .getElementById('continueBtn')
        .addEventListener('click', handleContinue);
});

/* ======================================================
   CONTINUE BUTTON FLOW
====================================================== */

function handleContinue() {
    if (gameState.phase === 1) {
        goToPhase2();
    } 
    else if (gameState.phase === 2) {
        goToPhase3();
    } 
    else if (gameState.phase === 3) {
        console.log('Game complete!');
    } 
    else if (gameState.phase === 4) {
        // Load next card set or finish
        if (gameState.currentSet === 'strength') {
            console.log('COMPLETELY DONE FR FR');
            document.querySelector('.lanes').innerHTML = '';
        } else {
            fullSoftReset();
            startCardPhase('strength');
        }
    }
}

/* ======================================================
   CARD LOADING
====================================================== */

async function loadCards(setName) {
    const res = await fetch('/json/cards.json');
    if (!res.ok) throw new Error('Failed to load cards.json');

    const data = await res.json();
    return data.cards[setName] || [];
}

/* ======================================================
   START / RESTART A CARD SET (PHASE 1)
====================================================== */

async function startCardPhase(setName) {
    gameState.currentSet = setName;

    // Clear existing grids
    yesGrid.removeAll();
    maybeGrid.removeAll();
    noGrid.removeAll();

    const cards = await loadCards(setName);
    renderCardsInGrid(cards);

    // Reset state
    gameState.lanes = { yes: [], maybe: [], no: [] };
    gameState.top4 = [];
    gameState.number1 = null;
    gameState.phase = 1;

    // UI reset
    const continueBtn = document.getElementById('continueBtn');
    continueBtn.disabled = true;

    const instructions = document.getElementById('instructions');
    if (instructions) {
        instructions.textContent = 'Drag at least 4 cards into YES then press Continue';
    }
}

/* ======================================================
   SOFT RESET HELPERS (NO PAGE RELOAD)
====================================================== */

function resetGrids() {
    yesGrid.removeAll();
    maybeGrid.removeAll();
    noGrid.removeAll();

    yesGrid.enable();
    maybeGrid.enable();
    noGrid.enable();

    yesGrid.column(6);

    yesGrid.enableResize(false);
    maybeGrid.enableResize(false);
    noGrid.enableResize(false);

    yesGrid.compact();
    maybeGrid.compact();
    noGrid.compact();
}

function resetUI() {
    const instructions = document.getElementById('instructions');
    if (instructions) {
        instructions.textContent = 'Drag at least 4 cards into YES then press Continue.';
    }

    const continueBtn = document.getElementById('continueBtn');
    continueBtn.disabled = true;
    continueBtn.onclick = null;
}

function resetStyles() {
    // Reset lane containers
    ['yes', 'maybe', 'no'].forEach(id => {
        const lane = document.getElementById(id);
        if (lane) lane.style = '';
    });

    // Reset YES label
    const yesLabel = document.getElementById('yes-label');
    if (yesLabel) yesLabel.style = '';

    // Reset cards
    document.querySelectorAll('.grid-stack-item').forEach(card => {
        card.style = '';
        card.classList.remove('selected', 'placeholder');
    });

    // Reset grid background
    const yesGridEl = document.querySelector('.yes-grid');
    if (yesGridEl) {
        yesGridEl.style.backgroundImage = '';
        yesGridEl.style.backgroundColor = 'rgb(180, 255, 180)';
    }
}

function fullSoftReset() {
    resetGrids();
    resetStyles();
    resetUI();
}

/* ======================================================
   GRIDSTACK INITIALIZATION
====================================================== */

const gridOptions = {
    column: 6,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true,
    float: false
};

const yesGrid   = GridStack.init(gridOptions, '.yes-grid');
const maybeGrid = GridStack.init(gridOptions, '.maybe-grid');
const noGrid    = GridStack.init(gridOptions, '.no-grid');

/* ======================================================
   GRID EVENTS (PHASE 1 TRACKING)
====================================================== */

yesGrid.on('added removed', updatePhase1State);
maybeGrid.on('added removed', updatePhase1State);
noGrid.on('added removed', updatePhase1State);

/* ======================================================
   CARD RENDERING
====================================================== */

function addCardToGrid(grid, container, card) {
    const el = document.createElement('div');
    el.classList.add('grid-stack-item');
    el.dataset.id = card.id;
    el.dataset.corner = card.corner;

    const content = document.createElement('div');
    content.classList.add('grid-stack-item-content');
    content.innerHTML = `
        <div class="title">${card.title}</div>
        <div class="description">${card.description.replace(/\n/g, '<br>')}</div>
        <div class="copyright">
            ©2026 Divergent Thinking. All rights reserved.
        </div>
    `;

    el.appendChild(content);
    container.appendChild(el);

    grid.makeWidget(el, {
        w: 1,
        h: 1,
        autoPosition: true,
        resizeHandles: []
    });
}

function renderCardsInGrid(cards) {
    const yesContainer   = document.querySelector('.yes-grid');
    const maybeContainer = document.querySelector('.maybe-grid');
    const noContainer    = document.querySelector('.no-grid');

    cards.forEach((card, index) => {
        if (index % 3 === 0) {
            addCardToGrid(noGrid, noContainer, card);
        } 
        else if (index % 3 === 1) {
            addCardToGrid(maybeGrid, maybeContainer, card);
        } 
        else {
            addCardToGrid(yesGrid, yesContainer, card);
        }
    });
}

/* ======================================================
   PHASE 1 — SORTING
====================================================== */

function updatePhase1State() {
    gameState.lanes.yes   = yesGrid.engine.nodes.map(n => n.el.dataset.id);
    gameState.lanes.maybe = maybeGrid.engine.nodes.map(n => n.el.dataset.id);
    gameState.lanes.no    = noGrid.engine.nodes.map(n => n.el.dataset.id);

    validatePhase1();
}

function validatePhase1() {
    const continueBtn = document.getElementById('continueBtn');
    continueBtn.disabled = gameState.lanes.yes.length < 4;
}

/* ======================================================
   PHASE 2 — TOP 4 SELECTION
====================================================== */

function goToPhase2() {
    console.log('➡ Phase 2');

    gameState.phase = 2;
    gameState.top4 = [];

    maybeGrid.removeAll();
    noGrid.removeAll();

    const maybeContainer = document.getElementById('maybe');
    const noContainer    = document.getElementById('no');
    const yesContainer   = document.querySelector('.yes-grid');
    const yesLabel       = document.getElementById('yes-label');
    const yesLane        = document.getElementById('yes');

    if (maybeContainer) maybeContainer.style.display = 'none';
    if (noContainer)    noContainer.style.display = 'none';
    if (yesContainer)   yesContainer.style.borderRadius = '8px';
    if (yesLabel)       yesLabel.style.borderRadius = '8px 0 0 8px';
    if (yesLane)        yesLane.style.borderRadius = '8px';

    yesGrid.engine.nodes.forEach(n => {
        n.x = null;
        n.y = null;
    });
    yesGrid.compact();

    const instructions = document.getElementById('instructions');
    if (instructions) instructions.textContent = 'Select your top 4 cards';

    yesGrid.engine.nodes.forEach(n => {
        const content = n.el.querySelector('.grid-stack-item-content');
        if (content) content.onclick = () => toggleSelectionPhase2(n.el);
    });

    document.getElementById('continueBtn').disabled = true;
}

/* ======================================================
   PHASE 2 — SELECTION HANDLER
====================================================== */

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

    document.getElementById('continueBtn').disabled =
        gameState.top4.length !== 4;
}

/* ======================================================
   PHASE 3 — PICK #1
====================================================== */

function goToPhase3() {
    console.log('➡ Phase 3');

    gameState.phase = 3;
    gameState.number1 = null;

    yesGrid.engine.nodes.forEach(n => {
        if (!gameState.top4.includes(n.el.dataset.id)) {
            yesGrid.removeWidget(n.el);
        }
    });

    yesGrid.engine.nodes.forEach(n => {
        n.x = null;
        n.y = null;
    });
    yesGrid.compact();

    const instructions = document.getElementById('instructions');
    if (instructions) instructions.textContent = 'Pick your #1 card';

    yesGrid.engine.nodes.forEach(n => {
        const el = n.el;
        const content = el.querySelector('.grid-stack-item-content');

        el.classList.remove('selected');

        const fresh = content.cloneNode(true);
        content.replaceWith(fresh);

        fresh.addEventListener('click', () => selectNumber1(el));
    });
}

/* ======================================================
   #1 SELECTION
====================================================== */

function selectNumber1(cardEl) {
    if (gameState.phase !== 3) return;

    document.querySelectorAll('.grid-stack-item')
        .forEach(el => el.classList.remove('selected'));

    cardEl.classList.add('selected');
    gameState.number1 = cardEl.dataset.id;

    const continueBtn = document.getElementById('continueBtn');
    continueBtn.disabled = false;
    continueBtn.onclick = goToFinalPhase;
}

/* ======================================================
   FINAL PHASE — SUMMARY GRID
====================================================== */

function goToFinalPhase() {
    console.log('🏁 Final Phase');
    gameState.phase = 4;

    const instructions = document.getElementById('instructions');
    if (instructions) instructions.textContent = 'Summary of Motivation Drivers:';

    const yesLabel = document.getElementById('yes-label');
    const yesLane  = document.getElementById('yes');
    const yesGridEl = document.querySelector('.yes-grid');

    if (yesLabel) yesLabel.style.display = 'none';
    if (yesLane)  yesLane.style.display = 'block';

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
    layoutCardsByCorner(yesGrid);
}

/* ======================================================
   CORNER-BASED 4x4 LAYOUT
====================================================== */

function layoutCardsByCorner(grid) {
    if (!grid) return;

    grid.column(4);
    grid.compact();

    const cornerMap = { tl: [], tr: [], bl: [], br: [] };

    grid.engine.nodes.forEach(n => {
        const corner = n.el.dataset.corner || 'tl';
        cornerMap[corner].push(n.el);
    });

    const cornerCounts = { tl: 0, tr: 0, bl: 0, br: 0 };

    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {

            let corner;
            if (x < 2 && y < 2) corner = 'tl';
            else if (x >= 2 && y < 2) corner = 'tr';
            else if (x < 2 && y >= 2) corner = 'bl';
            else corner = 'br';

            const realCards = cornerMap[corner];
            let cardToPlace;

            if (cornerCounts[corner] < realCards.length) {
                cardToPlace = realCards[cornerCounts[corner]];
            } else {
                cardToPlace = document.createElement('div');
                cardToPlace.classList.add('grid-stack-item', 'placeholder');

                const content = document.createElement('div');
                content.classList.add('grid-stack-item-content');
                content.style.visibility = 'hidden';

                cardToPlace.appendChild(content);
                grid.makeWidget(cardToPlace, { x, y, w: 1, h: 1, resizeHandles: [] });
            }

            let finalX = x;
            let finalY = y;

            switch (corner) {
                case 'tr': finalX = 3 - (x % 2); break;
                case 'bl': finalY = 3 - (y % 2); break;
                case 'br':
                    finalX = 3 - (x % 2);
                    finalY = 3 - (y % 2);
                    break;
            }

            grid.update(cardToPlace, { x: finalX, y: finalY, w: 1, h: 1 });
            cornerCounts[corner]++;
        }
    }

    grid.disable();
    grid.compact();
}

/* ======================================================
   INITIAL LOAD
====================================================== */

(async () => {
    const cards = await loadCards(gameState.currentSet);
    renderCardsInGrid(cards);
})();
