/*jslint browser */

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

const isValidMove = function (board, coordinate, playerColor) {
    const [row, col] = coordinate;

    if (board[row][col] !== "") {
        return false;
    }

    const flips = calculateFlips(board, coordinate, playerColor);
    return flips.length > 0;
};

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

const getOpponent = function (playerColor) {
    if (playerColor === "red") {
        return "blue";
    }
    return "red";
};

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

    return Object.freeze({
        board: newBoard,
        inventory: newInventory,
        ...nextStatus
    });
};

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