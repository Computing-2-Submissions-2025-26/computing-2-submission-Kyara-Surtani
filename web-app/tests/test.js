import {initializeGame,applyMove,getWinner,findAllValidMoves, getScores} from '../othello.js';
import R from "../ramda.js";

const display_board = (board) => "\n" + board.map(
    (row) => row.map(
        (cell) => (cell === '' ? '.' : cell[0])
    ).join(' ')
).join('\n');

const throw_if_invalid = function (state) {
    const board = state.board;

    if (
        !Array.isArray(board) ||
        board.length !== 8 ||
        !R.all((row) => Array.isArray(row) && row.length === 8, board)
    ) {
        throw new Error(
            "The board structure is not a valid 8x8 grid:" +
            display_board(board)
        );
    }

    const validTokens = ['red', 'blue', ''];
    const flattenedCells = R.flatten(board);
    if (!R.all((cell) => validTokens.includes(cell), flattenedCells)) {
        throw new Error(
            "The board contains invalid tokens:" +
            display_board(board)
        );
    }

    const countTokens = (color) => R.count(R.equals(color), flattenedCells);
    const redCount = countTokens('red');
    const blueCount = countTokens('blue');
    const total = redCount + blueCount;

    if (total > 64) {
        throw new Error(
            "The board contains more than 64 tokens:" +
            display_board(board)
        );
    }
};

describe("Initial Starting Configuration", function () {
    it("The initial board state must pass structural validations", function () {
        const initialState = initializeGame();
        throw_if_invalid(initialState);
    });

    it("The game must start with exactly 4 tokens in the center", function () {
        const initialState = initializeGame();
        const board = initialState.board;
        if (
            board[3][3] !== 'red' ||
            board[4][4] !== 'red' ||
            board[3][4] !== 'blue' ||
            board[4][3] !== 'blue'
        ) {
            throw new Error(
                "Initial layout does not match standard starting position:" +
                display_board(board)
            );
        }
    });

    it("Player Red must be assigned the opening turn", function () {
        const initialState = initializeGame();
        if (initialState.currentPlayer !== 'red') {
            throw new Error(
                "Expected opening player to be 'red', instead found: " +
                initialState.currentPlayer
            );
        }
    });

    it("The initial status must be Active", function () {
        const initialState = initializeGame();
        if (initialState.status !== 'Active') {
            throw new Error(
                "Expected initial status to be 'Active', instead found: " +
                initialState.status
            );
        }
    });

    it("The initial board must have exactly 2 red and 2 blue pieces", function () {
        const initialState = initializeGame();
        const scores = getScores(initialState.board);
        if (scores.red !== 2 || scores.blue !== 2) {
            throw new Error(
                "Expected 2 red and 2 blue pieces on the initial board, " +
                `instead got red: ${scores.red}, blue: ${scores.blue}`
            );
        }
    });
});

describe("Valid Move and State Transitions", function () {
    it(
        `Given a running Othello game,
When the active player places a piece on a valid square,
Then the square is filled with the player's colour,
And all sandwiched opponent pieces are flipped,
And the turn passes to the opposing player.`,
        function () {
            const stateBeforeMove = initializeGame();
            const stateAfterMove = applyMove(stateBeforeMove, [2, 4]);

            throw_if_invalid(stateAfterMove);

            if (stateAfterMove.board[2][4] !== 'red') {
                throw new Error(
                    "Target square did not receive the placement token."
                );
            }
            if (stateAfterMove.board[3][4] !== 'red') {
                throw new Error(
                    "Sandwiched piece at [3,4] failed to flip to 'red':" +
                    display_board(stateAfterMove.board)
                );
            }
            if (stateAfterMove.currentPlayer !== 'blue') {
                throw new Error(
                    "Turn did not pass to player 'blue' after move."
                );
            }
        }
    );

    it(
        `Given a valid move is made,
Then the total number of pieces on the board must increase by exactly one.`,
        function () {
            const stateBefore = initializeGame();
            const scoresBefore = getScores(stateBefore.board);
            const totalBefore = scoresBefore.red + scoresBefore.blue;

            const stateAfter = applyMove(stateBefore, [2, 4]);
            const scoresAfter = getScores(stateAfter.board);
            const totalAfter = scoresAfter.red + scoresAfter.blue;

            if (totalAfter !== totalBefore + 1) {
                throw new Error(
                    "Total piece count should increase by exactly 1 after a move. " +
                    `Before: ${totalBefore}, After: ${totalAfter}`
                );
            }
        }
    );

    it(
        `Given an active player's turn,
When targeting an illegal square with no captures,
Then the move is rejected,
And the original state object is returned unchanged.`,
        function () {
            const state = initializeGame();
            const invalidStateChange = applyMove(state, [0, 0]);

            if (invalidStateChange !== state) {
                throw new Error(
                    "Illegal move did not return the original state object."
                );
            }
        }
    );

    it(
        `Given an active player's turn,
When targeting an already occupied square,
Then the move is rejected,
And the original state object is returned unchanged.`,
        function () {
            const state = initializeGame();
            const invalidStateChange = applyMove(state, [3, 3]);

            if (invalidStateChange !== state) {
                throw new Error(
                    "Move onto occupied square did not return original state."
                );
            }
        }
    );

    it(
        `Given a valid move is made,
Then the resulting board state must be immutable.`,
        function () {
            const state = initializeGame();
            const stateAfter = applyMove(state, [2, 4]);

            try {
                stateAfter.currentPlayer = 'red';
            } catch (ignore) {
                return;
            }

            if (stateAfter.currentPlayer !== 'blue') {
                throw new Error(
                    "Game state is not immutable — property was mutated."
                );
            }
        }
    );
});

describe("Endgame Terminal Conditions", function () {
    it(
        `Given a completely filled board,
Then getWinner returns the player with the most pieces.`,
        function () {
            const fullBoard = [
                ['red',  'red',  'red',  'red',  'red',  'red',  'red',  'red'],
                ['blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue'],
                ['red',  'red',  'red',  'red',  'red',  'red',  'red',  'red'],
                ['red',  'red',  'red',  'red',  'red',  'red',  'red',  'red'],
                ['red',  'red',  'red',  'red',  'red',  'red',  'red',  'red'],
                ['red',  'red',  'red',  'red',  'red',  'red',  'red',  'red'],
                ['red',  'red',  'red',  'red',  'red',  'red',  'red',  'red'],
                ['red',  'red',  'red',  'red',  'red',  'red',  'red',  'red']
            ];

            const winner = getWinner(fullBoard);
            if (winner !== 'red') {
                throw new Error(
                    "Expected winner to be 'red', instead got: " + winner
                );
            }
        }
    );

    it(
        `Given a board where neither player has any legal moves,
Then findAllValidMoves must return empty arrays for both players,
Even if the board still contains empty squares.`,
        function () {
            // All empty squares are surrounded by red on all sides
            // so blue cannot sandwich anything and red has nothing to sandwich
            const blockedBoard = [
                ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
                ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
                ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
                ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
                ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
                ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
                ['red', 'red', 'red', 'red', 'red', 'red', 'red', 'red'],
                ['red', 'red', 'red', 'red', 'red', 'red', '',    ''   ]
            ];

            const redMoves = findAllValidMoves(blockedBoard, 'red');
            const blueMoves = findAllValidMoves(blockedBoard, 'blue');

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
        `Given a board where pieces are equal,
Then getWinner must return 'draw'.`,
        function () {
            const drawBoard = [
                ['red',  'red',  'red',  'red',  'blue', 'blue', 'blue', 'blue'],
                ['red',  'red',  'red',  'red',  'blue', 'blue', 'blue', 'blue'],
                ['red',  'red',  'red',  'red',  'blue', 'blue', 'blue', 'blue'],
                ['red',  'red',  'red',  'red',  'blue', 'blue', 'blue', 'blue'],
                ['red',  'red',  'red',  'red',  'blue', 'blue', 'blue', 'blue'],
                ['red',  'red',  'red',  'red',  'blue', 'blue', 'blue', 'blue'],
                ['red',  'red',  'red',  'red',  'blue', 'blue', 'blue', 'blue'],
                ['red',  'red',  'red',  'red',  'blue', 'blue', 'blue', 'blue']
            ];

            const winner = getWinner(drawBoard);
            if (winner !== 'draw') {
                throw new Error(
                    "Expected 'draw' for equal piece counts, instead got: " +
                    winner
                );
            }
        }
    );
});