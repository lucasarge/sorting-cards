import { GridStack } from 'gridstack';

/*
  _____  _                         ___  
 |  __ \| |                   _   / _ \ 
 | |__) | |__   __ _ ___  ___(_) | | | |
 |  ___/| '_ \ / _` / __|/ _ \   | | | |
 | |    | | | | (_| \__ \  __/_  | |_| |
 |_|    |_| |_|\__,_|___/\___(_)  \___/ 
                                        
*/ 

// VARIABLES

const gameState = {
    phase: 0    ,
    lanes: {
        yes: [],
        maybe: [],
        no: []
    },
    top4: [],
    number1: null,
    currentSet: null,
    allCards: [],
    cardQueue: [],
    currentCardIndex: 0
};

// DOM LOADED

document.addEventListener('DOMContentLoaded', () => {
    gameState.currentSet = window.location.pathname.slice(1)
    document
        .getElementById('continueBtn')
        ?.addEventListener('click', handleContinue);
    document
        .getElementById('seeAllBtn')
        ?.addEventListener('click', () => chooseMode('all'));
    document
        .getElementById('oneByOneBtn')
        ?.addEventListener('click', () => chooseMode('single'));
    document
        .getElementById('singleYesBtn')
        ?.addEventListener('click', () => handleSingleChoice('yes'));
    document
        .getElementById('singleNoBtn')
        ?.addEventListener('click', () => handleSingleChoice('no'));
    
    startCardPhase(gameState.currentSet);
});

// KEY FUNCTIONS

function handleContinue() {
    console.log(gameState.phase)
    if (gameState.phase === 1) {
        goToPhase2()
    } else if (gameState.phase === 2) {
        goToPhase3()
    } else if (gameState.phase === 3) {
        goToPhase4()
    }
}

async function loadCards(setName) {
    const res = await fetch('/json/cards.json');
    if (!res.ok) throw new Error('Failed to load cards.json');

    const data = await res.json();
    return data.cards[setName] || [];
}

async function startCardPhase(setName) {
    gameState.phase = 1;
    gameState.currentSet = setName;
    const cards = await loadCards(setName);
    gameState.allCards = cards;
    gameState.cardQueue = [...cards];
    gameState.currentCardIndex = 0;

    document.querySelector('.choose-mode').style.display = 'grid';
}

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

function enableCardSelection(targetArray, gridSelector, minSelect = 0, maxSelect = Infinity) {
    const gridEl = document.querySelector(gridSelector);
    const cards = gridEl.querySelectorAll('.grid-stack-item');

    cards.forEach(cardEl => {
        cardEl.addEventListener('click', () => {
            const cardId = cardEl.dataset.id;

            if (targetArray.includes(cardId)) {
                cardEl.classList.remove('selected');
                targetArray.splice(targetArray.indexOf(cardId), 1);
            } else {
                if (targetArray.length >= maxSelect) return;
                cardEl.classList.add('selected');
                targetArray.push(cardId);
            }

            const continueBtn = document.getElementById('continueBtn');

            if (targetArray.length >= minSelect && targetArray.length <= maxSelect) {
                continueBtn.disabled = false;
            } else {
                continueBtn.disabled = true;
            }
        });
    });
}

/*
  _____  _                        __ 
 |  __ \| |                   _  /_ |
 | |__) | |__   __ _ ___  ___(_)  | |
 |  ___/| '_ \ / _` / __|/ _ \    | |
 | |    | | | | (_| \__ \  __/_   | |
 |_|    |_| |_|\__,_|___/\___(_)  |_|
                                                                        
*/ 

// CHOOSE MODE

function chooseMode(mode) {
    const cards = gameState.cardQueue;
    if (!cards.length) return;

    document.querySelector('.choose-mode').style.display = 'none';
    document.getElementById('instructions').textContent =
        'Go through each card and decide if they resonate with you.';

    if (mode === 'all') {
        document.querySelector('.see-all').style.display = 'block';
        document.getElementById('continueBtn').style.display = 'block';
        renderAllCards(cards);
    }

    if (mode === 'single') {
        document.querySelector('.single-card').style.display = 'block';
        startSingleCardMode(cards);
    }
}

// ALL CARDS

const seeAllOptions = {
    column: 4,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true,
    float: false
};

const seeAllGrid = GridStack.init(seeAllOptions, '.see-all-grid');

function renderAllCards(cardQueue) {
    const seeAllGridEl = document.querySelector('.see-all-grid');
    seeAllGrid.disable();
    cardQueue.forEach(card => {
        addCardToGrid(seeAllGrid, seeAllGridEl, card);
    });
    enableCardSelection(gameState.lanes.yes, '.see-all-grid', 4, Infinity);
    document.getElementById('continueBtn').disabled = true;
}

// SINGLE CARD

const singleCardOptions = {
    column: 1,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true,
    float: false
}

const singleCardGrid = GridStack.init(singleCardOptions, '.single-card-grid');

function startSingleCardMode() {
    gameState.currentCardIndex = 0;
    renderCurrentSingleCard();
}

function renderCurrentSingleCard() {
    const gridEl = document.querySelector('.single-card-grid');
    singleCardGrid.disable()
    singleCardGrid.removeAll();

    const card = gameState.cardQueue[gameState.currentCardIndex];
    if (!card) {
        handleContinue();
        return;
    }

    addCardToGrid(singleCardGrid, gridEl, card);
}

function handleSingleChoice(choice) {
    const card = gameState.cardQueue[gameState.currentCardIndex];
    if (!card) return;

    if (choice === 'yes') {
        gameState.lanes.yes.push(card.id);
    }
    gameState.currentCardIndex++;

    if (gameState.currentCardIndex >= gameState.cardQueue.length) {
        if (gameState.lanes.yes.length < 4) {
            document.getElementById('instructions').textContent = 
            `Select atleast ${4-gameState.lanes.yes.length} more card(s) that resonate with you.`;
            gameState.cardQueue = gameState.cardQueue.filter(card => !gameState.lanes.yes.includes(card.id));
            gameState.currentCardIndex = 0;
            if (gameState.cardQueue.length > 0) {
                renderCurrentSingleCard();
            } else {
                handleContinue();
            }
            return;
        } else {
            handleContinue();
            return;
        }
    }

    renderCurrentSingleCard();
}

/*
  _____  _                        ___  
 |  __ \| |                   _  |__ \ 
 | |__) | |__   __ _ ___  ___(_)    ) |
 |  ___/| '_ \ / _` / __|/ _ \     /  / 
 | |    | | | | (_| \__ \  __/_   / /_ 
 |_|    |_| |_|\__,_|___/\___(_) |____|
                                                                          
*/

const topFourOptions = {
    column: 4,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true,
    float: false
};

const topFourGrid = GridStack.init(topFourOptions, '.top-four-grid');

function goToPhase2() {
    gameState.phase = 2;
    gameState.top4 = [];
    document.querySelector('.phase-1').style.display = 'none';
    document.getElementById('continueBtn').style.display = 'block';
    if (gameState.lanes.yes.length === 4) {
        gameState.top4 = gameState.lanes.yes;
        handleContinue()
        return;
    }
    document.querySelector('.phase-2').style.display = 'block';
    const topFourGridEl = document.querySelector('.top-four-grid');
    topFourGrid.disable();

    const yesCards = gameState.allCards.filter(card =>
        gameState.lanes.yes.map(id => String(id)).includes(String(card.id))
    );
    yesCards.forEach(card => addCardToGrid(topFourGrid, topFourGridEl, card));

    enableCardSelection(gameState.top4, '.top-four-grid', 4, 4);

    document.getElementById('continueBtn').disabled = true;
    document.getElementById('instructions').textContent = 'Select your top 4 cards from your YES cards.';
}

/*
  _____  _                        ____  
 |  __ \| |                   _  |___ \ 
 | |__) | |__   __ _ ___  ___(_)   __) |
 |  ___/| '_ \ / _` / __|/ _ \    |__ < 
 | |    | | | | (_| \__ \  __/_   ___) |
 |_|    |_| |_|\__,_|___/\___(_) |____/ 
                                        
*/

const topOneOptions = {
    column: 4,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true,
    float: false
};

const topOneGrid = GridStack.init(topOneOptions, '.top-one-grid');

function goToPhase3() {
    document.querySelector('.phase-2').style.display = 'none';
    document.querySelector('.phase-3').style.display = 'block';
    
    const topOneGridEl = document.querySelector('.top-one-grid')
    topOneGrid.disable();
    gameState.phase = 3;
    gameState.number1 = [];
    
    const topFourCards = gameState.allCards.filter(card =>
        gameState.top4.map(id => String(id)).includes(String(card.id))
    );
    topFourCards.forEach(card => addCardToGrid(topOneGrid, topOneGridEl, card));

    enableCardSelection(gameState.number1, '.top-one-grid', 1, 1);

    document.getElementById('continueBtn').disabled = true;
    document.getElementById('instructions').textContent = 'Select your number 1 card.';
}

/*
  _____  _                        _  _   
 |  __ \| |                   _  | || |  
 | |__) | |__   __ _ ___  ___(_) | || |_ 
 |  ___/| '_ \ / _` / __|/ _ \   |__   _|
 | |    | | | | (_| \__ \  __/_     | |  
 |_|    |_| |_|\__,_|___/\___(_)    |_|  
                                         
*/

const summaryOptions = {
    column: 4,
    cellHeight: 170,
    margin: 10,
    disableResize: true,
    acceptWidgets: true,
    float: false,
    margin: 10
};

const summaryGrid = GridStack.init(summaryOptions, '.summary-grid');

function goToPhase4() {
    gameState.phase = 4;
    document.querySelector('.phase-3').style.display = 'none';
    document.querySelector('.phase-4').style.display = 'block';
    document.getElementById('instructions').textContent = `Summary of ${gameState.currentSet} cards:`;
    const summaryGridEl = document.querySelector('.summary-grid');
    summaryGrid.disable()

    const summaryCards = gameState.allCards.filter(card =>
        gameState.top4.map(id => String(id)).includes(String(card.id))
    );
    summaryCards.forEach(card => addCardToGrid(summaryGrid, summaryGridEl, card));

    layoutCardsByCorner(summaryGrid);
}

function layoutCardsByCorner(grid) {
    if (!grid) return;

    const favId = String(gameState.number1[0]);

    const FAR = {
        tl: [0, 0],
        tr: [3, 0],
        bl: [0, 3],
        br: [3, 3]
    };

    const INNER = {
        tl: [[1,1],[0,1],[1,0]],
        tr: [[2,1],[3,1],[2,0]],
        bl: [[1,2],[0,2],[1,3]],
        br: [[2,2],[3,2],[2,3]]
    };

    const cards = grid.engine.nodes.map(n => n.el);

    grid.removeAll(true);
    grid.column(4);

    const byCorner = { tl: [], tr: [], bl: [], br: [] };
    cards.forEach(el => {
        const corner = el.dataset.corner || 'tl';
        byCorner[corner].push(el);
    });

    Object.keys(byCorner).forEach(corner => {
        const group = byCorner[corner];

        const fav = group.find(el => String(el.dataset.id) === favId);
        const rest = group.filter(el => el !== fav);

        const [fx, fy] = FAR[corner];
        if (fav) {
            fav.classList.add('selected');

            grid.makeWidget(fav, {
                x: fx, y: fy, w: 1, h: 1,
                autoPosition: false,
                resizeHandles: []
            });
        } else {
            addPlaceholder(grid, fx, fy);
        }

        INNER[corner].forEach(([x, y], i) => {
            const el = rest[i];
            if (el) {
                grid.makeWidget(el, {
                    x, y, w: 1, h: 1,
                    autoPosition: false,
                    resizeHandles: []
                });
            } else {
                addPlaceholder(grid, x, y);
            }
        });
    });

    grid.compact();
}

function addPlaceholder(grid, x, y) {
    const ph = document.createElement('div');
    ph.classList.add('grid-stack-item', 'placeholder');

    const content = document.createElement('div');
    content.classList.add('grid-stack-item-content');
    content.style.visibility = 'hidden';

    ph.appendChild(content);

    grid.makeWidget(ph, {
        x, y, w: 1, h: 1,
        autoPosition: false,
        resizeHandles: []
    });
}
