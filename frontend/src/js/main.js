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
    number1: null,
    currentSet: 'motivation'
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
    el.dataset.corner = card.corner;  

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
    layoutCardsByCorner(yesGrid);
}

// function layoutCardsByCorner(container) {
//     if (!container) return;

//     let bl = [], br = [], tl = [], tr = [];

//     const cards = Array.from(container.querySelectorAll('.grid-stack-item'));
//     cards.forEach(card => {
//         const corner = card.dataset.corner;
//         if (corner === "bl") bl.push(card);
//         else if (corner === "br") br.push(card);
//         else if (corner === "tl") tl.push(card);
//         else if (corner === "tr") tr.push(card);
//     });

//     console.log({ tl, tr, bl, br }); // check arrays
//     if(tl>=2 && tr>=2) {

//     }
// }

function layoutCardsByCorner(grid) {
    if (!grid) return;

    grid.column(4);
    grid.compact();

    const cornerMap = { tl: [], tr: [], bl: [], br: [] };
    grid.engine.nodes.forEach(n => {
        const el = n.el;
        const corner = el.dataset.corner || 'tl';
        cornerMap[corner].push(el);
    });

    const cornerCounts = { tl: 0, tr: 0, bl: 0, br: 0 };

    // Loop through all 16 cells
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            // Determine quadrant
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
                // Placeholder
                cardToPlace = document.createElement('div');
                cardToPlace.classList.add('grid-stack-item', 'placeholder');
                const content = document.createElement('div');
                content.classList.add('grid-stack-item-content');
                content.style.visibility = 'hidden';
                cardToPlace.appendChild(content);
                grid.addWidget(cardToPlace, { x, y, w: 1, h: 1 });
            }

            // Adjust x/y to hug the corner
            let finalX = x;
            let finalY = y;

            switch (corner) {
                case 'tl': break; // top-left quadrant stays as-is
                case 'tr': finalX = 3 - (x % 2); break; // top-right: push to right
                case 'bl': finalY = 3 - (y % 2); break; // bottom-left: push to bottom
                case 'br': finalX = 3 - (x % 2); finalY = 3 - (y % 2); break; // bottom-right: bottom right
            }

            grid.update(cardToPlace, { x: finalX, y: finalY, w: 1, h: 1 });
            cornerCounts[corner]++;
        }
    }

    grid.disable();
    grid.compact();
}




// function layoutCardsByCorner(container) {
//     if (!container) return;

//     const cards = Array.from(container.querySelectorAll('.grid-stack-item'));

//     const containerWidth = container.clientWidth;
//     const containerHeight = container.clientHeight;

//     const subCols = 2; // 2x2 subgrid per corner
//     const subRows = 2;

//     const cardWidth = 150;
//     const cardHeight = 170;
//     const padding = 20; // distance from corner edges
//     const spacingX = 20; // horizontal spacing between cards
//     const spacingY = 20; // vertical spacing between cards

//     // Define origin points for each corner
//     const corners = {
//         tl: { x: padding, y: padding },
//         tr: { x: containerWidth - padding - cardWidth * subCols - spacingX, y: padding },
//         bl: { x: padding, y: containerHeight - padding - cardHeight * subRows - spacingY },
//         br: { x: containerWidth - padding - cardWidth * subCols - spacingX, y: containerHeight - padding - cardHeight * subRows - spacingY }
//     };

//     // Track how many cards per corner
//     const cornerCounts = { tl: 0, tr: 0, bl: 0, br: 0 };

//     cards.forEach(el => {
//         let corner = 'tl';
//         if (el.dataset.tl === 'true') corner = 'tl';
//         else if (el.dataset.tr === 'true') corner = 'tr';
//         else if (el.dataset.bl === 'true') corner = 'bl';
//         else if (el.dataset.br === 'true') corner = 'br';

//         const count = cornerCounts[corner];
//         const row = Math.floor(count / subCols);
//         const col = count % subCols;

//         const origin = corners[corner];
//         const posX = origin.x + col * (cardWidth + spacingX);
//         const posY = origin.y + row * (cardHeight + spacingY);

//         el.style.position = 'absolute';
//         el.style.left = posX + 'px';
//         el.style.top = posY + 'px';
//         el.style.width = cardWidth + 'px';
//         el.style.height = cardHeight + 'px';

//         cornerCounts[corner]++;
//     });
// }






/* ------------------ INIT ------------------ */

(async () => {
    const cards = await loadCards(gameState.currentSet);
    renderCardsInGrid(cards);
})();
