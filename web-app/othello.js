/*jslint browser */
/*linted*/
/**
 * @fileoverview
 * This module models the game state and provides functions to
 * transition between valid game states and takes information from them.
 * @see {@link https://en.wikipedia.org/wiki/Reversi}
 * @namespace Othello
 * @author Kyara Surtani
 * @version 2025/26
 */

/**
 * A Board is an 8x8 grid of cells, each containing a token or "".
 * @memberof Othello
 * @typedef {Othello.Token_or_empty[][]} Board
 */

/**
 * A token is a coloured disc placed by a player on the board.
 * @memberof Othello
 * @typedef {("red" | "blue")} Token
 */

/**
 * Either a token or an empty cell.
 * @memberof Othello
 * @typedef {(Othello.Token | "")} Token_or_empty
 */

/**
 * A direction vector to move across the board.
 * Expressed as a [rowDelta, colDelta] pair.
 * @memberof Othello
 * @typedef {number[]} Direction
 */

/**
 * The complete state of an Othello game at a point in time.
 * @memberof Othello
 * @typedef {Object} GameState
 * @property {Othello.Board} board - The current 8x8 board layout.
 * @property {string} currentPlayer - The player whose turn it is.
 * @property {Object} inventory - Remaining pieces per player.
 * @property {number} inventory.blue - Remaining blue pieces.
 * @property {number} inventory.red - Remaining red pieces.
 * @property {string} status - Current game status.
 * One of "Active", "Passed", or "GameOver".
 */

/**
 * The next player and game status after a move has been applied.
 * @memberof Othello
 * @typedef {Object} NextStatus
 * @property {string} currentPlayer - The player whose turn is next.
 * @property {string} status - The resulting game status.
 */

/**
 * The piece counts for each player on the board.
 * @memberof Othello
 * @typedef {Object} Scores
 * @property {number} blue - Number of blue pieces on the board.
 * @property {number} red - Number of red pieces on the board.
 */

const createEmptyBoard = function () {
    return new Array(8).fill(null).map(function () {
        return new Array(8).fill("");
    });
};

const isInsideBoard = function (row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
};

const isLineBlocked = function (tile) {
    return tile === undefined || tile === "";
};

const isOpponentPiece = function (tile, playerColor) {
    return tile !== "" && tile !== playerColor;
};

const isPlayerPiece = function (tile, playerColor) {
    return tile === playerColor;
};

/**
 * All 8 directional vectors of possible movement across the board.
 * Each entry is a [rowDelta, colDelta] pair representing one direction.
 * @memberof Othello
 * @constant {Othello.Direction[]}
 */
const DIRECTIONS = Object.freeze([
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1]
]);

/**
 * Creates a new Othello game with the standard starting configuration.
 * Red and Blue each begin with 2 pieces crossed in the centre.
 * Red always takes the first turn.
 * @memberof Othello
 * @function
 * @returns {Othello.GameState} The initial frozen game state.
 * @example
 * const state = Othello.initializeGame();
 * // state.currentPlayer === "red"
 * // state.status === "Active"
 */
const initializeGame = function () {
    const board = createEmptyBoard();

    board[3][3] = "red";
    board[3][4] = "blue";
    board[4][3] = "blue";
    board[4][4] = "red";

    return Object.freeze({
        board,
        currentPlayer: "red",
        inventory: {blue: 30, red: 30},
        status: "Active"
    });
};

/**
 * Traces a straight line from a starting position in a given direction,
 * collecting all cell values up to the board edge.
 * @memberof Othello
 * @function
 * @param {Othello.Board} board - The current board layout.
 * @param {number[]} start - The starting coordinate as [row, col].
 * @param {Othello.Direction} direction - The [rowDelta, colDelta] to walk.
 * @returns {Othello.Token_or_empty[]} Ordered cell values along the line.
 * @example
 * const line = Othello.getLine(board, [3, 3], [0, 1]);
 * // Returns all values rightward from [3,4] to the board edge.
 */
const getLine = function (board, start, direction) {
    const [startRow, startCol] = start;
    const [deltaRow, deltaCol] = direction;

    const walk = function (currentRow, currentCol, lineAcc) {
        const nextRow = currentRow + deltaRow;
        const nextCol = currentCol + deltaCol;

        if (!isInsideBoard(nextRow, nextCol)) {
            return lineAcc;
        }

        const nextCell = board[nextRow][nextCol];
        return walk(nextRow, nextCol, [...lineAcc, nextCell]);
    };

    return walk(startRow, startCol, []);
};

/**
 * Analyses a line of cells to find which opponent pieces would be
 * captured by placing a piece at the start of the line.
 * A valid capture requires opponent pieces sandwiched between the
 * new piece and an existing friendly piece with no gaps.
 * @memberof Othello
 * @function
 * @param {Othello.Token_or_empty[]} line - Cells along one direction.
 * @param {Othello.Token} playerColor - The active player's colour.
 * @returns {number[]} Indices in the line of pieces that would flip.
 * Returns an empty array if no valid capture exists.
 * @example
 * // line = ["blue", "blue", "red"], playerColor = "red"
 * // Returns [0, 1] — both blue pieces would be captured.
 */
const checkLineCapture = function (line, playerColor) {
    const scan = function (index, accFlips) {
        const currentTile = line[index];

        if (isLineBlocked(currentTile)) {
            return [];
        }
        if (isPlayerPiece(currentTile, playerColor)) {
            return accFlips;
        }
        if (isOpponentPiece(currentTile, playerColor)) {
            return scan(index + 1, [...accFlips, index]);
        }
        return [];
    };

    return scan(0, []);
};

/**
 * Calculates all opponent pieces that would be flipped by placing
 * a piece at the given coordinate. Checks all 8 directions.
 * @memberof Othello
 * @function
 * @param {Othello.Board} board - The current board layout.
 * @param {number[]} start - The target coordinate as [row, col].
 * @param {Othello.Token} playerColor - The active player's colour.
 * @returns {number[][]} All coordinates that would flip as [row, col].
 * @example
 * const flips = Othello.calculateFlips(board, [3, 2], "red");
 * // Returns [[3, 3]] if blue is at [3,3] and red is at [3,4].
 */
const calculateFlips = function (board, start, playerColor) {
    const [startRow, startCol] = start;

    return DIRECTIONS.reduce(function (allFlips, direction) {
        const [deltaRow, deltaCol] = direction;
        const line = getLine(board, start, direction);
        const captureIndices = checkLineCapture(line, playerColor);
        const absoluteCoordinates = captureIndices.map(function (index) {
            const stepMultiplier = index + 1;
            return [
                startRow + (deltaRow * stepMultiplier),
                startCol + (deltaCol * stepMultiplier)
            ];
        });

        return [...allFlips, ...absoluteCoordinates];
    }, []);
};

/**
 * Determines whether placing a piece at a coordinate is a legal move.
 * A move is legal if the target cell is empty and results in at least
 * one opponent piece being captured.
 * @memberof Othello
 * @function
 * @param {Othello.Board} board - The current board layout.
 * @param {number[]} coordinate - The target cell as [row, col].
 * @param {Othello.Token} playerColor - The active player's colour.
 * @returns {boolean} True if the move is legal, false otherwise.
 * @example
 * Othello.isValidMove(board, [3, 2], "red"); // true or false
 */
const isValidMove = function (board, coordinate, playerColor) {
    const [row, col] = coordinate;

    if (board[row][col] !== "") {
        return false;
    }

    const flips = calculateFlips(board, coordinate, playerColor);
    return flips.length > 0;
};

/**
 * Returns all legal moves available to a player on the current board.
 * @memberof Othello
 * @function
 * @param {Othello.Board} board - The current board layout.
 * @param {Othello.Token} playerColor - The player to find moves for.
 * @returns {number[][]} Legal move coordinates as [row, col] pairs.
 * Returns an empty array if the player has no legal moves.
 * @example
 * const moves = Othello.findAllValidMoves(board, "red");
 * // e.g. [[2, 4], [3, 5], [4, 2], [5, 3]]
 */
const findAllValidMoves = function (board, playerColor) {
    const validMoves = [];

    Array.from({length: 8}, function (ignore, r) {
        Array.from({length: 8}, function (ignore, c) {
            if (isValidMove(board, [r, c], playerColor)) {
                validMoves.push([r, c]);
            }
        });
    });

    return validMoves;
};

/**
 * Returns the opposing player's colour.
 * @memberof Othello
 * @function
 * @param {Othello.Token} playerColor - The current player's colour.
 * @returns {Othello.Token} The opposing player's colour.
 * @example
 * Othello.getOpponent("red"); // "blue"
 * Othello.getOpponent("blue"); // "red"
 */
const getOpponent = function (playerColor) {
    if (playerColor === "red") {
        return "blue";
    }
    return "red";
};

/**
 * Determines which player goes next and the resulting game status
 * after a move has been applied to the board.
 * If the opponent has legal moves, they go next with status "Active".
 * If only the current player has moves, status becomes "Passed".
 * If neither player has moves, status becomes "GameOver".
 * @memberof Othello
 * @function
 * @param {Othello.Board} board - The board after a move was applied.
 * @param {Othello.Token} currentPlayer - The player who just moved.
 * @returns {Othello.NextStatus} The next player and game status.
 */
const getNextGameStatus = function (board, currentPlayer) {
    const opponent = getOpponent(currentPlayer);

    const opponentMoves = findAllValidMoves(board, opponent);
    if (opponentMoves.length > 0) {
        return {currentPlayer: opponent, status: "Active"};
    }

    const currentPlayerMoves = findAllValidMoves(board, currentPlayer);
    if (currentPlayerMoves.length > 0) {
        return {currentPlayer, status: "Passed"};
    }

    return {currentPlayer, status: "GameOver"};
};

/**
 * Applies a move to the game state and returns the resulting new state.
 * Places the current player's piece at the given coordinate and flips
 * all captured opponent pieces.
 * If the move is illegal, the original state is returned unchanged.
 * @memberof Othello
 * @function
 * @param {Othello.GameState} gameState - The current game state.
 * @param {number[]} coordinate - The target cell as [row, col].
 * @returns {Othello.GameState} The new frozen game state after the move,
 * or the original state if the move was illegal.
 * @example
 * const next = Othello.applyMove(state, [2, 4]);
 * // next.currentPlayer === "blue" if the move was legal.
 * // next === state if the move was illegal.
 */
const applyMove = function (gameState, coordinate) {
    const {board, currentPlayer, inventory} = gameState;

    if (!isValidMove(board, coordinate, currentPlayer)) {
        return gameState;
    }

    const flips = calculateFlips(board, coordinate, currentPlayer);

    const newBoard = board.map(function (row) {
        return [...row];
    });

    newBoard[coordinate[0]][coordinate[1]] = currentPlayer;
    flips.forEach(function ([r, c]) {
        newBoard[r][c] = currentPlayer;
    });

    const newInventory = {
        blue: inventory.blue,
        red: inventory.red
    };

    newInventory[currentPlayer] = inventory[currentPlayer] - 1;

    const nextStatus = getNextGameStatus(newBoard, currentPlayer);

    return Object.freeze(Object.assign({}, nextStatus, {
        board: newBoard,
        inventory: newInventory
    }));
};

/**
 * Counts how many pieces each player currently has on the board.
 * @memberof Othello
 * @function
 * @param {Othello.Board} board - The board to count pieces on.
 * @returns {Othello.Scores} The piece count for each player.
 * @example
 * const scores = Othello.getScores(board);
 * // e.g. { blue: 30, red: 34 }
 */
const getScores = function (board) {
    return board.flat().reduce(function (scores, cell) {
        if (cell === "red") {
            scores.red += 1;
        }
        if (cell === "blue") {
            scores.blue += 1;
        }
        return scores;
    }, {blue: 0, red: 0});
};

/**
 * Determines the winner of a completed game based on piece counts.
 * The player with the most pieces on the board wins.
 * Returns "draw" if both players have equal piece counts.
 * @memberof Othello
 * @function
 * @param {Othello.Board} board - The final board to evaluate.
 * @returns {(Othello.Token | "draw")} The winning player's colour,
 * or "draw" if piece counts are equal.
 * @example
 * Othello.getWinner(board); // "red", "blue", or "draw"
 */
const getWinner = function (board) {
    const {blue, red} = getScores(board);

    if (red > blue) {
        return "red";
    }
    if (blue > red) {
        return "blue";
    }
    return "draw";
};

export default Object.freeze({
    applyMove,
    calculateFlips,
    checkLineCapture,
    findAllValidMoves,
    getLine,
    getNextGameStatus,
    getOpponent,
    getScores,
    getWinner,
    initializeGame,
    isValidMove
});