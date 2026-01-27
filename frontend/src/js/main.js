import { GridStack } from 'gridstack';

async function loadCards(setName) {
    const res = await fetch('/json/cards.json');
    if (!res.ok) throw new Error('Failed to load cards.json');
    const data = await res.json();
    return data.cards[setName] || [];
}

function renderCardsInGrid(cards) {
    const grid = GridStack.init({
        disableResize: true, // allow resizing
        disableDrag: false,   // allow dragging
        cellHeight: 'auto',       // adjust card height
        float: true           // optional: allows more flexible placement
    });

    cards.forEach(card => {
        // Create the outer widget container
        const el = document.createElement('div');
        el.classList.add('grid-stack-item');

        // Create the content div
        const content = document.createElement('div');
        content.classList.add('grid-stack-item-content');
        content.innerHTML = `<strong>${card.title}</strong><br>${card.description.replace(/\n/g, '<br>')}`;

        // Append content to widget
        el.appendChild(content);

        // Add widget to Gridstack
        grid.makeWidget(el, {
            x: card.x || 0,
            y: card.y || 0,
            w: card.w || 2,
            h: card.h || 2,
            autoPosition: true
        });
    });
}

(async () => {
    const cards = await loadCards('motivation'); // choose 'strength' if you want
    renderCardsInGrid(cards);
})();
