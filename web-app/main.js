/*jslint browser Proper One!!! */

/*linted
 * main.js
 * Handles all DOM interaction, rendering, and user input for Othello.
 * All game logic is delegated to the Othello engine module.
 */

import OthelloEngine from "./othello.js";

/* Pull the functions we need out of the engine. */
const {
    applyMove,
    findAllValidMoves,
    getScores,
    getWinner,
    initializeGame
} = OthelloEngine;

/* 1. HTML Element Selectors */

/* The main grid container where squares are rendered. */
const boardContainer = document.getElementById("game-board");

/* Score display elements for each player. */
const redScoreEl = document.getElementById("red-score");
const blueScoreEl = document.getElementById("blue-score");

/* Shows whose turn it currently is above the board. */
const playerTurnEl = document.querySelector(".current.player");

/* Decorative disc stack bars shown in each player panel. */
const redStackEl = document.querySelector(".red-stack");
const blueStackEl = document.querySelector(".blue-stack");

/* Restart button in the header. */
const restartBtn = document.querySelector(".restart");

/* Button that highlights all valid moves for the current player. */
const showMovesBtn = document.querySelector(".show-moves");

/* Game over modal and its inner elements. */
const modal = document.getElementById("game-over-modal");
const modalWinnerText = document.getElementById("winner-text");
const modalRedScore = document.getElementById("modal-red-score");
const modalBlueScore = document.getElementById("modal-blue-score");
const modalRestartBtn = document.getElementById("modal-restart-btn");

/* 2. Game State*/

/* The live game state. Replaced with a new object after each valid move. */
let gameState = initializeGame();

/* 3. Rendering Functions */

/* Draws 9 vertical and 9 horizontal lines behind the board to form
   the visual 8x8 grid. Called once on page load. */
function renderGridLines() {
    const container = document.getElementById("grid-container");
    const board = document.getElementById("game-board");
    Array.from({length: 9}, function (ignore, i) {
        const lineV = document.createElement("div");
        lineV.classList.add("line-v");
        lineV.style.left = `calc(${i * 12.5}% - 1px)`;
        const lineH = document.createElement("div");
        lineH.classList.add("line-h");
        lineH.style.top = `calc(${i * 12.5}% - 1px)`;
        container.insertBefore(lineV, board);
        container.insertBefore(lineH, board);
    });
}

/* Removes all valid move hint dots and styling from the board. */
function clearMoveHighlights() {
    const highlightedSquares = document.querySelectorAll(".square.hint");
    highlightedSquares.forEach(function (square) {
        square.classList.remove("hint");
        const dot = square.querySelector(".hint-dot");
        if (dot) {
            square.removeChild(dot);
        }
    });
}

/* Creates the 64 clickable squares in the DOM.
   Each square gets ARIA labels and keyboard tab access.
   Called once on page load. */
function createBoardGrid() {
    boardContainer.innerHTML = "";

    Array.from({length: 8}).forEach(function (ignore, row) {
        Array.from({length: 8}).forEach(function (ignore, col) {
            const square = document.createElement("div");
            square.classList.add("square");

            square.dataset.row = row;
            square.dataset.col = col;

            square.tabIndex = 0;
            square.setAttribute("role", "button");

            const labelText = (
                `Square Row ${row + 1}, Column ${col + 1}`
            );
            square.setAttribute("aria-label", labelText);

            boardContainer.appendChild(square);
        });
    });
}

/* Syncs the visual board with the engine state.
   Adds, removes, or animates disc elements to match the board array.
   Called after every valid move. */
function updateBoard(state) {
    const board = state.board;
    boardContainer.dataset.currentPlayer = state.currentPlayer;

    clearMoveHighlights();
    Array.from({length: 8}).forEach(function (ignore, row) {
        Array.from({length: 8}).forEach(function (ignore, col) {
            const selector = (
                `.square[data-row="${row}"][data-col="${col}"]`
            );
            let square = document.querySelector(selector);
            let cellValue = board[row][col];
            let disc = square.querySelector(".disc");

            if (cellValue !== "") {
                if (!disc) {
                    disc = document.createElement("div");
                    disc.classList.add("disc", cellValue);
                    square.appendChild(disc);
                } else if (!disc.classList.contains(cellValue)) {
                    disc.classList.remove("red", "blue");
                    disc.classList.add(cellValue);
                    disc.classList.add("flip-anim");
                    setTimeout(function () {
                        disc.classList.remove("flip-anim");
                    }, 400);
                }
            } else if (disc) {
                square.removeChild(disc);
            }
        });
    });
}

/* Updates scores, turn indicator, disc stacks, and the game over modal.
   Shows the modal with the winner if the game has ended.
   Displays a turn passed message if the current player has no moves. */
function updateUI(state) {
    const scores = getScores(state.board);
    redScoreEl.textContent = scores.red;
    blueScoreEl.textContent = scores.blue;

    if (state.status === "GameOver") {
        const winner = getWinner(state.board);

        if (winner === "draw") {
            modalWinnerText.textContent = "It's a Draw!";
        } else {
            let winColor = (
                winner === "red"
                ? "Red"
                : "Blue"
            );
            modalWinnerText.textContent = `${winColor} Wins!`;
        }

        modalRedScore.textContent = scores.red;
        modalBlueScore.textContent = scores.blue;
        modal.classList.remove("hidden");
        playerTurnEl.textContent = "Game Over";
    } else {
        modal.classList.add("hidden");

        let colorStr = (
            state.currentPlayer === "red"
            ? "Red"
            : "Blue"
        );
        if (state.status === "Passed") {
            playerTurnEl.textContent = (
                `Player ${colorStr} (Turn Passed!)`
            );
        } else {
            playerTurnEl.textContent = `Player ${colorStr}'s Turn`;
        }
    }

    /* Rebuild the disc stack bars to reflect remaining inventory. */
    redStackEl.innerHTML = "";
    blueStackEl.innerHTML = "";

    Array.from({length: state.inventory.red}).forEach(function () {
        let bar = document.createElement("div");
        redStackEl.appendChild(bar);
    });

    Array.from({length: state.inventory.blue}).forEach(function () {
        let bar = document.createElement("div");
        blueStackEl.appendChild(bar);
    });
}

/* 4. Initial Setup*/

renderGridLines();
createBoardGrid();
updateBoard(gameState);
updateUI(gameState);

/* 5. Event Listeners */

/* Handles clicking a square on the board.
   Attempts to apply the move at that position.
   Updates the board and UI if the move was legal. */
boardContainer.addEventListener("click", function (event) {
    if (gameState.status === "GameOver") {
        return;
    }

    const square = event.target.closest(".square");
    if (!square) {
        return;
    }

    const row = parseInt(square.dataset.row, 10);
    const col = parseInt(square.dataset.col, 10);

    const newState = applyMove(gameState, [row, col]);
    if (newState === gameState) {
        return;
    }

    gameState = newState;
    updateBoard(gameState);
    updateUI(gameState);
});

/* Resets the game when the header restart button is clicked. */
restartBtn.addEventListener("click", function () {
    gameState = initializeGame();
    updateBoard(gameState);
    updateUI(gameState);
});

/* Resets the game when the modal restart button is clicked
   after a game over screen is shown. */
modalRestartBtn.addEventListener("click", function () {
    gameState = initializeGame();
    updateBoard(gameState);
    updateUI(gameState);
});

/* Highlights all squares the current player can legally move to.
   Places a dot inside each valid square.*/
showMovesBtn.addEventListener("click", function () {
    if (gameState.status === "GameOver") {
        return;
    }

    clearMoveHighlights();

    const validMoves = findAllValidMoves(
        gameState.board,
        gameState.currentPlayer
    );

    validMoves.forEach(function ([row, col]) {
        const selector = (
            `.square[data-row="${row}"][data-col="${col}"]`
        );
        const square = document.querySelector(selector);
        if (square) {
            square.classList.add("hint");
            const dot = document.createElement("div");
            dot.classList.add("hint-dot");
            square.appendChild(dot);
        }
    });
});

/* 6. Keyboard Accessibility*/

/* Allows keyboard navigation across the board.
   Arrow keys move focus between squares.
   Enter or Space places a piece on the focused square. */
boardContainer.addEventListener("keydown", function (event) {
    if (gameState.status === "GameOver") {
        return;
    }

    const currentSquare = event.target.closest(".square");
    if (!currentSquare) {
        return;
    }

    let row = parseInt(currentSquare.dataset.row, 10);
    let col = parseInt(currentSquare.dataset.col, 10);
    let targetSquare = null;
    let sel;
    let newState;

    switch (event.key) {
    case "ArrowUp":
        if (row > 0) {
            sel = `.square[data-row="${row - 1}"][data-col="${col}"]`;
            targetSquare = document.querySelector(sel);
        }
        event.preventDefault();
        break;
    case "ArrowDown":
        if (row < 7) {
            sel = `.square[data-row="${row + 1}"][data-col="${col}"]`;
            targetSquare = document.querySelector(sel);
        }
        event.preventDefault();
        break;
    case "ArrowLeft":
        if (col > 0) {
            sel = `.square[data-row="${row}"][data-col="${col - 1}"]`;
            targetSquare = document.querySelector(sel);
        }
        event.preventDefault();
        break;
    case "ArrowRight":
        if (col < 7) {
            sel = `.square[data-row="${row}"][data-col="${col + 1}"]`;
            targetSquare = document.querySelector(sel);
        }
        event.preventDefault();
        break;
    case "Enter":
    case " ":
        event.preventDefault();
        newState = applyMove(gameState, [row, col]);
        if (newState !== gameState) {
            gameState = newState;
            updateBoard(gameState);
            updateUI(gameState);
            setTimeout(function () {
                currentSquare.focus();
            }, 50);
        }
        break;
    default:
        return;
    }

    if (targetSquare) {
        targetSquare.focus();
    }
});