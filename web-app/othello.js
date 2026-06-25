/*jslint browser */
/**
 * @fileoverview Game module representing the core logic and state transitions of Othello.
 * All functions are pure and do not mutate global state.
 */

/**
 * Creates an empty 8x8 Othello game board representation.
 * @private
 * @returns {string[][]} An 8x8 grid array containing empty spaces.
 */
const createEmptyBoard = () => 
    Array(8)
    .fill(null)
    .map(() => Array(8).fill(''));

/**
 * Initializes a new game of Othello with standard rules and starting configuration.
 * Sets the central four starting pieces (2 Red, 2 Blue) and establishes the initial active player.
 * @returns {Object} The pristine initial game state object.
 * @returns {string[][]} return.board - An 8x8 matrix tracking piece color configurations.
 * @returns {string} return.currentPlayer - The identifier of the player whose turn it is ('red' or 'blue').
 * @returns {string} return.status - Current operational state of the match ('Active', 'Passed', 'GameOver').
 */
export function initializeGame() {
    const board = createEmptyBoard();
    
    // Set up standard Othello starting configuration in the center
    board[3][3] = 'red';
    board[3][4] = 'blue';
    board[4][3] = 'blue';
    board[4][4] = 'red';

    return Object.freeze({
        board,
        currentPlayer: 'red',
        status: 'Active',
        inventory: { red: 30, blue: 30 }
    });
}


/**
 * Determines if a given coordinate pair sits inside the valid 8x8 boundaries.
 * @param {number} row - The grid row index.
 * @param {number} col - The grid column index.
 * @returns {boolean} True if the coordinate is within bounds, false otherwise.
 */
const isInsideBoard = (row, col) => row >= 0 && row < 8 && col >= 0 && col < 8;

/**
 * Traces a straight line across the board from a starting point along a direction vector.
 * Collects all encountered piece data up to the edge of the board.
 */
export function getLine(board, start, direction) {
    const [startRow, startCol] = start;
    const [deltaRow, deltaCol] = direction;

    const walk = (currentRow, currentCol, lineAcc) => {
        const nextRow = currentRow + deltaRow;
        const nextCol = currentCol + deltaCol;

        // Clean low-level validation sub-call
        if (!isInsideBoard(nextRow, nextCol)) {
            return lineAcc;
        }

        return walk(nextRow, nextCol, [...lineAcc, board[nextRow][nextCol]]);
    };

    return walk(startRow, startCol, []);
}

// Low-level Rule Predicates (Single Responsibility)
const isLineBlocked = (tile) => tile === undefined || tile === '';
const isPlayerPiece = (tile, playerColor) => tile === playerColor;
const isOpponentPiece = (tile, playerColor) => tile !== '' && tile !== playerColor;

/**
 * Analyzes a single line array of pieces to see if it qualifies for an Othello capture.
 */
export function checkLineCapture(line, playerColor) {
    // Recursive loop orchestrator
    const scan = (index, accFlips) => {
        const currentTile = line[index];

        // Rule 1: If we hit a boundary or an empty space, the sandwich fails
        if (isLineBlocked(currentTile)) {
            return [];
        }

        // Rule 2: If we hit our own color, the sandwich is successfully completed!
        if (isPlayerPiece(currentTile, playerColor)) {
            return accFlips;
        }

        // Rule 3: If we hit an opponent piece, track its index and keep scanning forward
        if (isOpponentPiece(currentTile, playerColor)) {
            return scan(index + 1, [...accFlips, index]);
        }

        return [];
    };

    return scan(0, []);
}

// A static array of all 8 possible directions on a 2D grid:
// [rowDelta, colDelta]
const DIRECTIONS = [
    [-1,  0], // Up
    [ 1,  0], // Down
    [ 0, -1], // Left
    [ 0,  1], // Right
    [-1, -1], // Top-Left Diagonal
    [-1,  1], // Top-Right Diagonal
    [ 1, -1], // Bottom-Left Diagonal
    [ 1,  1]  // Bottom-Right Diagonal
];

/**
 * Checks all 8 directions from a target position to compile a complete list
 * of all opponent piece coordinates that would be captured by a move.
 * * @param {string[][]} board - The current 8x8 game board layout.
 * @param {number[]} start - The target move location as [row, col].
 * @param {string} playerColor - The active player color ('red' or 'blue').
 * @returns {number[][]} A flat list of all captured coordinates, e.g. [[r1, c1], [r2, c2]].
 */
export function calculateFlips(board, start, playerColor) {
    const [startRow, startCol] = start;

    // We take our 8 directions and reduce them down to a single flat list of coordinates
    return DIRECTIONS.reduce((allFlips, direction) => {
        const [deltaRow, deltaCol] = direction;
        
        // 1. Get the text array of pieces sitting down this specific directional ray
        const line = getLine(board, start, direction);
        
        // 2. Pass that line to the sandwich rule checker to get matching indices
        const captureIndices = checkLineCapture(line, playerColor);
        
        // 3. Convert those abstract line indices back into actual grid coordinates [row, col]
        const absoluteCoordinates = captureIndices.map(index => {
            // The 1st captured index is (index + 1) steps away from our starting point
            const stepMultiplier = index + 1; 
            return [
                startRow + (deltaRow * stepMultiplier),
                startCol + (deltaCol * stepMultiplier)
            ];
        });

        // Combine the coordinates found in this direction with the ones found in previous directions
        return [...allFlips, ...absoluteCoordinates];
    }, []);
}


/**
 * Checks if placing a piece at a specific coordinate is a legal move.
 * @param {string[][]} board - The current 8x8 game board layout.
 * @param {number[]} coordinate - The target square as [row, col].
 * @param {string} playerColor - The color of the active player.
 * @returns {boolean} True if the move is legal, false otherwise.
 */
export function isValidMove(board, coordinate, playerColor) {
    const [row, col] = coordinate;

    // Rule 1: The square must be completely empty
    if (board[row][col] !== '') {
        return false;
    }

    // Rule 2: The move must result in at least one flipped piece
    const flips = calculateFlips(board, coordinate, playerColor);
    return flips.length > 0;
}

/**
 * Scans the entire board to compile a list of all legal moves for a player.
 * @param {string[][]} board - The current 8x8 game board layout.
 * @param {string} playerColor - The color of the active player.
 * @returns {number[][]} An array of coordinate pairs where the player can legally move.
 */
export function findAllValidMoves(board, playerColor) {
    const validMoves = [];

    // Loop through every single one of the 64 squares on the board
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (isValidMove(board, [r, c], playerColor)) {
                validMoves.push([r, c]);
            }
        }
    }

    return validMoves;
}

export function getOpponent(playerColor) {

    if (playerColor === 'red') {
        return 'blue';
    } else {
        return 'red';
    }

}

export function getNextGameStatus(board, currentPlayer) {
    const opponent = getOpponent(currentPlayer);

    const opponentMoves = findAllValidMoves(board, opponent);
    if (opponentMoves.length > 0) {
        return { currentPlayer: opponent, status: 'Active' };
    }

    const currentPlayerMoves = findAllValidMoves(board, currentPlayer);
    if (currentPlayerMoves.length > 0) {
        return { currentPlayer, status: 'Passed' };
    }

    return { currentPlayer, status: 'GameOver' };
}

export function applyMove(gameState, coordinate) {
    const { board, currentPlayer,inventory } = gameState;

    if (!isValidMove(board, coordinate, currentPlayer)) {
        return gameState;
    }

    const flips = calculateFlips(board, coordinate, currentPlayer);

    const newBoard = board.map(row => [...row]);
    newBoard[coordinate[0]][coordinate[1]] = currentPlayer;
    flips.forEach(([r, c]) => { newBoard[r][c] = currentPlayer; });

    const newInventory = { 
        ...inventory, 
        [currentPlayer]: inventory[currentPlayer] - 1 
    };



    return Object.freeze({ board: newBoard, inventory: newInventory, ...getNextGameStatus(newBoard, currentPlayer) });
}


export function getScores(board) {
    return board.flat().reduce((scores, cell) => {
        if (cell === 'red')  scores.red++;
        if (cell === 'blue') scores.blue++;
        return scores;
    }, { red: 0, blue: 0 });
}

export function getWinner(board) {
    const { red, blue } = getScores(board);

    if (red > blue) return 'red';
    if (blue > red) return 'blue';
    return 'draw';
}
