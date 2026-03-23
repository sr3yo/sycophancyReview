// Mahjong Solitaire Game Logic
//JS file for the Mahjong Solitaire game

const TILE_WIDTH = 80;
const TILE_HEIGHT = 105;
// Using simple, universally recognizable numbers and geometric shapes for 65+ demographic
const SYMBOLS = ['1', '2', '3', '★', '●', '▲', '■', '♥', '♦'];
// Unique colors for each symbol to make pairs visually distinct
const SYMBOL_COLORS = ['#e84393', '#27ae60', '#0984e3', '#d63031', '#2d3436', '#f39c12', '#e17055', '#8e44ad', '#d4af37'];

let board = [];
let selectedTile = null;
let tilesRemaining = 36; // 18 pairs
let isAnimating = false;

// DOM Elements
const gameBoard = document.getElementById('game-board');
const tilesCountDisplay = document.getElementById('tiles-count');
const restartBtn = document.getElementById('restart-btn');
const hintBtn = document.getElementById('hint-btn');
const howToPlayBtn = document.getElementById('how-to-play-btn');

const modal = document.getElementById('game-over-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalRestartBtn = document.getElementById('modal-restart-btn');

const instructionsModal = document.getElementById('instructions-modal');
const closeInstructionsBtn = document.getElementById('close-instructions-btn');

function initGame() {
    board = [];
    selectedTile = null;
    tilesRemaining = 36;
    gameBoard.innerHTML = '';
    tilesCountDisplay.textContent = tilesRemaining;
    modal.classList.add('hidden');

    generateLayout();
    assignSymbols();
    renderBoard();
    updateBlockedState();
    scaleBoard();
}

/**
 * Scales the entire .game-wrapper to fit the viewport.
 * Base reference: 1366x768 (standard laptop). At that size, scale = 1.0.
 * On larger screens, scales UP proportionally.
 * Never scales below 1.0 (laptop stays as minimum size).
 */
function scaleBoard() {
    const wrapper = document.getElementById('game-wrapper');
    if (!wrapper) return;

    // Base reference resolution (laptop)
    const baseWidth = 1366;
    const baseHeight = 768;

    const scaleX = window.innerWidth / baseWidth;
    const scaleY = window.innerHeight / baseHeight;
    const scale = Math.max(Math.min(scaleX, scaleY), 1.0);

    wrapper.style.transform = `scale(${scale})`;
}

/**
 * 36-tile layout designed for accessibility (large grids) in a pyramid/tree shape.
 * Layers (Z): 0 = bottom, 1 = middle, 2 = top
 */
function generateLayout() {
    // Total tiles: 36
    // We will build a pyramid from the bottom up.

    // Z=0 (Base layer) - 20 tiles arranged in a wide block or diamond
    // Let's do a block of 5 rows
    // Row 1: 2 tiles
    board.push(createTileObj(3, 1, 0)); board.push(createTileObj(4, 1, 0));
    // Row 2: 4 tiles
    for (let c = 2; c <= 5; c++) board.push(createTileObj(c, 2, 0));
    // Row 3: 6 tiles
    for (let c = 1; c <= 6; c++) board.push(createTileObj(c, 3, 0));
    // Row 4: 4 tiles
    for (let c = 2; c <= 5; c++) board.push(createTileObj(c, 4, 0));
    // Row 5: 4 tiles (forming a base)
    for (let c = 2; c <= 5; c++) board.push(createTileObj(c, 5, 0));
    // Total Z=0 = 2 + 4 + 6 + 4 + 4 = 20

    // Z=1 (Middle layer) - 12 tiles
    // Row 2: 2 tiles
    board.push(createTileObj(3, 2, 1)); board.push(createTileObj(4, 2, 1));
    // Row 3: 4 tiles
    for (let c = 2; c <= 5; c++) board.push(createTileObj(c, 3, 1));
    // Row 4: 4 tiles
    for (let c = 2; c <= 5; c++) board.push(createTileObj(c, 4, 1));
    // Row 5: 2 tiles
    board.push(createTileObj(3, 5, 1)); board.push(createTileObj(4, 5, 1));
    // Total Z=1 = 2 + 4 + 4 + 2 = 12

    // Z=2 (Top layer) - 4 tiles
    // Right in the center
    board.push(createTileObj(3.5, 3, 2));
    board.push(createTileObj(3.5, 4, 2));

    // Let's make it 4 to complete 36. 
    // The top ridge of the pyramid
    board.push(createTileObj(3.5, 2.5, 2));
    board.push(createTileObj(3.5, 4.5, 2));
    // Wait, the tree shape:
    // Actually let's just make sure it's 36
    // 20 + 12 + 4 = 36 tiles.
}

function createTileObj(gx, gy, gz) {
    return {
        id: Math.random().toString(36).substr(2, 9),
        gx: gx,
        gy: gy,
        gz: gz,
        symbol: '',
        color: '',
        element: null,
        active: true // whether it's still on the board
    };
}

function assignSymbols() {
    // Ensure we have 18 pairs of symbols. (36 tiles total)
    let symbolPool = [];
    for (let i = 0; i < 9; i++) {
        const tileData = { s: SYMBOLS[i], c: SYMBOL_COLORS[i] };
        // 4 copies each (2 pairs)
        symbolPool.push(tileData, tileData, tileData, tileData);
    }

    // Shuffle the pool
    for (let i = symbolPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbolPool[i], symbolPool[j]] = [symbolPool[j], symbolPool[i]];
    }

    // Assign to tiles
    for (let i = 0; i < board.length; i++) {
        board[i].symbol = symbolPool[i].s;
        board[i].color = symbolPool[i].c;
    }
}

function renderBoard() {
    // Base offsets to center on the board
    const offsetX = 80;
    const offsetY = 10;

    board.forEach(tile => {
        const el = document.createElement('div');
        el.className = 'tile';
        el.textContent = tile.symbol;
        el.style.color = tile.color;
        el.dataset.id = tile.id;
        el.dataset.z = tile.gz;

        // Calculate absolute position
        // Each grid unit represents TILE_WIDTH / TILE_HEIGHT + spacing
        const left = offsetX + tile.gx * TILE_WIDTH;
        const top = offsetY + tile.gy * TILE_HEIGHT - (tile.gz * 5); // Shift up slightly for depth

        el.style.left = `${left}px`;
        el.style.top = `${top}px`;

        // Z-index implies visual stacking
        el.style.zIndex = tile.gz * 10;

        el.addEventListener('click', () => handleTileClick(tile));

        tile.element = el;
        gameBoard.appendChild(el);
    });
}

function showFloatingText(tile, text, type) {
    const textEl = document.createElement('div');
    textEl.className = `floating-text ${type}`;
    textEl.textContent = text;

    // Position it securely on top of the tile
    const left = parseFloat(tile.element.style.left);
    const top = parseFloat(tile.element.style.top);

    textEl.style.left = `${left + TILE_WIDTH / 2}px`;
    textEl.style.top = `${top - 20}px`;

    gameBoard.appendChild(textEl);

    // Remove after animation
    setTimeout(() => {
        textEl.remove();
    }, 1200);
}

function handleMatch(tile1, tile2) {
    isAnimating = true;
    tile1.element.classList.add('match-success');
    tile2.element.classList.add('match-success');

    showFloatingText(tile1, "Match!", "success");
    showFloatingText(tile2, "Match!", "success");

    tile1.active = false;
    tile2.active = false;
    selectedTile = null;

    setTimeout(() => {
        removeTiles(tile1, tile2);
        isAnimating = false;
    }, 800);
}

function handleMismatch(tile1, tile2) {
    isAnimating = true;

    // Show both as selected momentarily to see what was clicked
    tile2.element.classList.add('selected');

    tile1.element.classList.add('match-fail');
    tile2.element.classList.add('match-fail');

    showFloatingText(tile1, "Not a match!", "fail");
    showFloatingText(tile2, "Not a match!", "fail");

    setTimeout(() => {
        tile1.element.classList.remove('match-fail', 'selected');
        tile2.element.classList.remove('match-fail', 'selected');
        selectedTile = null;
        isAnimating = false;
    }, 1000);
}

function handleTileClick(tile) {
    if (!tile.active || isAnimating) return;

    // Clear any existing hints when interacting with the board
    board.forEach(t => t.element.classList.remove('hint'));

    if (isBlocked(tile)) {
        tile.element.classList.add('error');
        setTimeout(() => tile.element.classList.remove('error'), 200);
        return;
    }

    if (selectedTile === tile) {
        deselectTile();
        return;
    }

    if (selectedTile) {
        if (selectedTile.symbol === tile.symbol) {
            handleMatch(selectedTile, tile);
        } else {
            handleMismatch(selectedTile, tile);
        }
    } else {
        selectTile(tile);
    }
}

function selectTile(tile) {
    selectedTile = tile;
    tile.element.classList.add('selected');
}

function deselectTile() {
    if (selectedTile) {
        selectedTile.element.classList.remove('selected');
        selectedTile = null;
    }
}

function removeTiles(tile1, tile2) {
    // we already set active to false in handleMatch

    // Animate removal
    tile1.element.style.opacity = '0';
    tile2.element.style.opacity = '0';
    tile1.element.style.pointerEvents = 'none';
    tile2.element.style.pointerEvents = 'none';

    setTimeout(() => {
        tile1.element.remove();
        tile2.element.remove();
    }, 300);

    tilesRemaining -= 2;
    tilesCountDisplay.textContent = tilesRemaining;

    updateBlockedState();
    checkGameState();
}

/**
 * Standard Mahjong Solitaire Rule:
 * A tile is free if it has NO tile directly above it, AND it is free on at least 
 * one of its left or right sides.
 */
function isBlocked(tile) {
    let hasLeft = false;
    let hasRight = false;
    let hasTop = false;

    // A block tolerance delta for overlapping
    const delta = 0.5;

    for (let i = 0; i < board.length; i++) {
        const other = board[i];
        if (!other.active || other.id === tile.id) continue;

        // Check Top Layer interaction
        if (other.gz > tile.gz) {
            // If the other tile overlaps the current tile significantly
            const overlapX = Math.abs(other.gx - tile.gx) < 1.0;
            const overlapY = Math.abs(other.gy - tile.gy) < 1.0;
            if (overlapX && overlapY) {
                hasTop = true;
                break; // One tile top is enough to block
            }
        }

        // Check Same Layer interaction (Left/Right)
        if (other.gz === tile.gz) {
            const overlapY = Math.abs(other.gy - tile.gy) < delta;
            if (overlapY) {
                // Is it perfectly to the left?
                if (other.gx < tile.gx && (tile.gx - other.gx) < 1.2) hasLeft = true;
                // Is it perfectly to the right?
                if (other.gx > tile.gx && (other.gx - tile.gx) < 1.2) hasRight = true;
            }
        }
    }

    // Blocked if it has a top tile, OR (it is blocked on BOTH left and right sides)
    return hasTop || (hasLeft && hasRight);
}

function updateBlockedState() {
    let freePairs = new Map();

    board.forEach(tile => {
        if (!tile.active) return;

        if (isBlocked(tile)) {
            tile.element.classList.add('blocked');
        } else {
            tile.element.classList.remove('blocked');

            // Track available pairs to check for game over
            if (!freePairs.has(tile.symbol)) {
                freePairs.set(tile.symbol, 0);
            }
            freePairs.set(tile.symbol, freePairs.get(tile.symbol) + 1);
        }
    });

    // Return true if there are available moves
    return Array.from(freePairs.values()).some(count => count >= 2);
}

function checkGameState() {
    if (tilesRemaining === 0) {
        showModal('MAGNIFICENT YOU WON!', 'You have cleared the board and found balance.');
        return;
    }

    const hasMoves = updateBlockedState();
    if (!hasMoves) {
        showModal('GAME OVER!', 'No more valid moves remain. The path is blocked.');
    }
}

function showModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.remove('hidden');
}

function showHint() {
    if (isAnimating) return;

    // Clear any existing hints
    board.forEach(t => t.element.classList.remove('hint'));

    // Find all currently active and unblocked tiles
    const freeTiles = board.filter(t => t.active && !t.element.classList.contains('blocked'));

    // Find a matching pair
    for (let i = 0; i < freeTiles.length; i++) {
        for (let j = i + 1; j < freeTiles.length; j++) {
            if (freeTiles[i].symbol === freeTiles[j].symbol) {
                // Found a match!
                const t1 = freeTiles[i].element;
                const t2 = freeTiles[j].element;

                t1.classList.add('hint');
                t2.classList.add('hint');

                return; // Stop after finding one hint
            }
        }
    }
}

// Event Listeners
restartBtn.addEventListener('click', initGame);
hintBtn.addEventListener('click', showHint);
modalRestartBtn.addEventListener('click', initGame);

howToPlayBtn.addEventListener('click', () => {
    instructionsModal.classList.remove('hidden');
});

closeInstructionsBtn.addEventListener('click', () => {
    instructionsModal.classList.add('hidden');
});

window.addEventListener('resize', scaleBoard);

// Start game
initGame();
