/*jslint browser */
/*import R from "./ramda.js";*/
import OthelloEngine from "./othello.js";

// Destructure the functions out from the frozen default engine object
const {
    initializeGame,
    applyMove,
    getScores,
    getWinner,
    findAllValidMoves
} = OthelloEngine;

/* 1. HTML Element Selectors */
const boardContainer = document.getElementById("game-board");
const redScoreEl = document.getElementById("red-score");
const blueScoreEl = document.getElementById("blue-score");
const playerTurnEl = document.querySelector(".current.player");

const redStackEl = document.querySelector(".red-stack");
const blueStackEl = document.querySelector(".blue-stack");
const restartBtn = document.querySelector(".restart");
const showMovesBtn = document.querySelector(".show-moves");

const modal = document.getElementById("game-over-modal");
const modalWinnerText = document.getElementById("winner-text");
const modalRedScore = document.getElementById("modal-red-score");
const modalBlueScore = document.getElementById("modal-blue-score");
const modalRestartBtn = document.getElementById("modal-restart-btn");

/* 2. Initial Game State*/
let gameState = initializeGame();

/* 3. Rendering Functions */
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

// Runs ONCE to create the 64 empty physical squares
function createBoardGrid() {
    boardContainer.innerHTML = ""; // Clear it once

    Array.from({length: 8}).forEach(function (ignore, row) {
        Array.from({length: 8}).forEach(function (ignore, col) {
            const square = document.createElement("div");
            square.classList.add("square");

            square.dataset.row = row;
            square.dataset.col = col;

            // ACCESSIBILITY: Adds element to natural keyboard tab flow
            square.tabIndex = 0;

            // ACCESSIBILITY: Identifies element as a button
            square.setAttribute("role", "button");

            const labelText = `Square Row ${row + 1}, Column ${col + 1}`;
            square.setAttribute("aria-label", labelText);

            boardContainer.appendChild(square);
        });
    });
}

// Runs EVERY TURN to sync visual layout with engine state
function updateBoard(state) {
    const board = state.board;
    boardContainer.dataset.currentPlayer = state.currentPlayer;

    // Always sweep out old move indicators before building the new turn view
    clearMoveHighlights();
    Array.from({length: 8}).forEach(function (ignore, row) {
        Array.from({length: 8}).forEach(function (ignore, col) {
            const selector = `.square[data-row="${row}"][data-col="${col}"]`;
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
            playerTurnEl.textContent = `Player ${colorStr} (Turn Passed!)`;
        } else {
            playerTurnEl.textContent = `Player ${colorStr}'s Turn`;
        }
    }

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

/* 4. Initial Setup Calls */
renderGridLines();
createBoardGrid();
updateBoard(gameState);
updateUI(gameState);

/* 5. Event Listeners & Loops */
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

restartBtn.addEventListener("click", function () {
    gameState = initializeGame();
    updateBoard(gameState);
    updateUI(gameState);
});

modalRestartBtn.addEventListener("click", function () {
    gameState = initializeGame();
    updateBoard(gameState);
    updateUI(gameState);
});

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
        const selector = `.square[data-row="${row}"][data-col="${col}"]`;
        const square = document.querySelector(selector);
        if (square) {
            square.classList.add("hint");

            const dot = document.createElement("div");
            dot.classList.add("hint-dot");
            square.appendChild(dot);
        }
    });
});

/* 6. Keyboard Accessibility Navigation Loop*/
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