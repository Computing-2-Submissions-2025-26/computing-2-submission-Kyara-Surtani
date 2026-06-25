/*jslint browser */
/*linted*/
import Othello from "../othello.js";
import R from "../ramda.js";

const {
    applyMove,
    findAllValidMoves,
    getScores,
    getWinner,
    initializeGame
} = Othello;
/* 1.game set-up */
/**
 * Returns a string representation of a board.
 * Empty cells are shown as dots, tokens as their first character.
 */
const display_board = function (board) {
    return "\n" + board.map(function (row) {
        return row.map(function (cell) {
            return (
                cell === ""
                ? "."
                : cell[0]
            );
        }).join(" ");
    }).join("\n");
};


const throw_if_invalid = function (state) {
    const board = state.board;

    if (
        !Array.isArray(board) ||
        board.length !== 8 ||
        !R.all(function (row) {
            return Array.isArray(row) && row.length === 8;
        }, board)
    ) {
        throw new Error(
            "The board structure is not a valid 8x8 grid:" +
            display_board(board)
        );
    }

    const validTokens = ["red", "blue", ""];
    const flattenedCells = R.flatten(board);
    if (!R.all(function (cell) {
        return validTokens.includes(cell);
    }, flattenedCells)) {
        throw new Error(
            "The board contains invalid tokens:" +
            display_board(board)
        );
    }

    const countTokens = function (color) {
        return R.count(R.equals(color), flattenedCells);
    };
    const redCount = countTokens("red");
    const blueCount = countTokens("blue");
    const total = redCount + blueCount;

    if (total > 64) {
        throw new Error(
            "The board contains more than 64 tokens:" +
            display_board(board)
        );
    }
};

/**
 * Expands a compressed matrix of single-letter tokens into
 * Othello board string values. Maps "r" to "red", "b" to "blue",
 * and "e" to "".
 */
const expandBoard = function (matrix) {
    const tokenMap = {"b": "blue", "e": "", "r": "red"};
    return matrix.map(function (row) {
        return row.map(function (cell) {
            return tokenMap[cell];
        });
    });
};

describe("Initial Starting Configuration", function () {
    it("An initial board state must pass structural validations", function () {
        const initialState = initializeGame();
        throw_if_invalid(initialState);
    });

    it("Initial board must have 4 tokens crossed in the center", function () {
        const initialState = initializeGame();
        const board = initialState.board;
        if (
            board[3][3] !== "red" ||
            board[4][4] !== "red" ||
            board[3][4] !== "blue" ||
            board[4][3] !== "blue"
        ) {
            throw new Error(
                "Initial layout does not match standard starting position:" +
                display_board(board)
            );
        }
    });

    it("An initial board must assign red the opening turn", function () {
        const initialState = initializeGame();
        if (initialState.currentPlayer !== "red") {
            throw new Error(
                "Expected opening player to be red, instead found: " +
                initialState.currentPlayer
            );
        }
    });

    it("An initial board must have status Active", function () {
        const initialState = initializeGame();
        if (initialState.status !== "Active") {
            throw new Error(
                "Expected initial status to be Active, instead found: " +
                initialState.status
            );
        }
    });

    it("An initial board must have 2 red and 2 blue pieces", function () {
        const initialState = initializeGame();
        const scores = getScores(initialState.board);
        if (scores.red !== 2 || scores.blue !== 2) {
            throw new Error(
                "Expected 2 red and 2 blue pieces on initial board, " +
                "instead got red: " + scores.red +
                ", blue: " + scores.blue
            );
        }
    });
});
/* 2.Placing and flipping tokens */
describe("Valid Move and State Transitions", function () {
    it(
        "Given a running game, " +
        "when a valid move is made, " +
        "then the placed square is filled, " +
        "sandwiched pieces are flipped, " +
        "and the turn passes to the opponent.",
        function () {
            const stateBeforeMove = initializeGame();
            const stateAfterMove = applyMove(stateBeforeMove, [2, 4]);

            throw_if_invalid(stateAfterMove);

            if (stateAfterMove.board[2][4] !== "red") {
                throw new Error(
                    "Target square did not receive the placement token."
                );
            }
            if (stateAfterMove.board[3][4] !== "red") {
                throw new Error(
                    "Sandwiched piece at [3,4] failed to flip to red:" +
                    display_board(stateAfterMove.board)
                );
            }
            if (stateAfterMove.currentPlayer !== "blue") {
                throw new Error(
                    "Turn did not pass to player blue after move."
                );
            }
        }
    );

    it(
        "Given a valid move is made, " +
        "then the total piece count must increase by exactly one.",
        function () {
            const stateBefore = initializeGame();
            const scoresBefore = getScores(stateBefore.board);
            const totalBefore = scoresBefore.red + scoresBefore.blue;

            const stateAfter = applyMove(stateBefore, [2, 4]);
            const scoresAfter = getScores(stateAfter.board);
            const totalAfter = scoresAfter.red + scoresAfter.blue;

            if (totalAfter !== totalBefore + 1) {
                throw new Error(
                    "Total piece count should increase by 1 after a move. " +
                    "Before: " + totalBefore + ", After: " + totalAfter
                );
            }
        }
    );

    it(
        "Given an illegal empty square with no captures, " +
        "when a move is attempted, " +
        "then the original state object is returned unchanged.",
        function () {
            const state = initializeGame();
            const unchanged = applyMove(state, [0, 0]);

            if (unchanged !== state) {
                throw new Error(
                    "Illegal move did not return original state object."
                );
            }
        }
    );

    it(
        "Given an occupied square, " +
        "when a move is attempted, " +
        "then the original state object is returned unchanged.",
        function () {
            const state = initializeGame();
            const unchanged = applyMove(state, [3, 3]);

            if (unchanged !== state) {
                throw new Error(
                    "Move onto occupied square did not return original state."
                );
            }
        }
    );

    it(
        "Given a valid move is made, " +
        "then the resulting game state must be immutable.",
        function () {
            const state = initializeGame();
            const stateAfter = applyMove(state, [2, 4]);

            try {
                stateAfter.currentPlayer = "red";
            } catch (ignore) {
                return;
            }

            if (stateAfter.currentPlayer !== "blue") {
                throw new Error(
                    "Game state is not immutable — property was mutated."
                );
            }
        }
    );
});
/* 3. End game conditions*/
describe("Endgame Terminal Conditions", function () {
    it(
        "Given a completely filled board, " +
        "then getWinner returns the player with the most pieces.",
        function () {
            const fullBoard = expandBoard([
                ["r", "r", "r", "r", "r", "r", "r", "r"],
                ["b", "b", "b", "b", "b", "b", "b", "b"],
                ["r", "r", "r", "r", "r", "r", "r", "r"],
                ["r", "r", "r", "r", "r", "r", "r", "r"],
                ["r", "r", "r", "r", "r", "r", "r", "r"],
                ["r", "r", "r", "r", "r", "r", "r", "r"],
                ["r", "r", "r", "r", "r", "r", "r", "r"],
                ["r", "r", "r", "r", "r", "r", "r", "r"]
            ]);

            const winner = getWinner(fullBoard);
            if (winner !== "red") {
                throw new Error(
                    "Expected winner to be red, instead got: " + winner
                );
            }
        }
    );

    it(
        "Given a board where neither player has legal moves, " +
        "then valid move lists must be empty for both players, " +
        "even when empty squares remain on the board.",
        function () {
            const blockedBoard = expandBoard([
                ["r", "r", "r", "r", "r", "r", "r", "r"],
                ["r", "r", "r", "r", "r", "r", "r", "r"],
                ["r", "r", "r", "r", "r", "r", "r", "r"],
                ["r", "r", "r", "r", "r", "r", "r", "r"],
                ["r", "r", "r", "r", "r", "r", "r", "r"],
                ["r", "r", "r", "r", "r", "r", "r", "r"],
                ["r", "r", "r", "r", "r", "r", "r", "r"],
                ["r", "r", "r", "r", "r", "r", "e", "e"]
            ]);

            const redMoves = findAllValidMoves(blockedBoard, "red");
            const blueMoves = findAllValidMoves(blockedBoard, "blue");

            if (redMoves.length !== 0) {
                throw new Error(
                    "Expected no legal moves for red, instead found: " +
                    JSON.stringify(redMoves)
                );
            }

            if (blueMoves.length !== 0) {
                throw new Error(
                    "Expected no legal moves for blue, instead found: " +
                    JSON.stringify(blueMoves)
                );
            }
        }
    );

    it(
        "Given a board with equal pieces for both players, " +
        "then getWinner must return draw.",
        function () {
            const drawBoard = expandBoard([
                ["r", "r", "r", "r", "b", "b", "b", "b"],
                ["r", "r", "r", "r", "b", "b", "b", "b"],
                ["r", "r", "r", "r", "b", "b", "b", "b"],
                ["r", "r", "r", "r", "b", "b", "b", "b"],
                ["r", "r", "r", "r", "b", "b", "b", "b"],
                ["r", "r", "r", "r", "b", "b", "b", "b"],
                ["r", "r", "r", "r", "b", "b", "b", "b"],
                ["r", "r", "r", "r", "b", "b", "b", "b"]
            ]);

            const winner = getWinner(drawBoard);
            if (winner !== "draw") {
                throw new Error(
                    "Expected draw for equal piece counts, instead got: " +
                    winner
                );
            }
        }
    );
});