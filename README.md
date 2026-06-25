[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/H6lPFq0J)
# Computing 2 Coursework Submission.
**CID**: [02614721]

Othello rules: 
- Othello is played on a 8x8 grid, each player starts the game with 32 tokens that are reversible 
- The starting conditions are always the same, with alternating red and blue disks in the center 4 cells and with the red player making the first move
- Players must place their piece on an empty square adjacent to an opponent's piece. The placement must trap at least one opponent piece in a continuous line between your new piece and an existing piece of your color.
- Any opponent pieces caught inside this "sandwich" are immediately flipped to your color.
- The game ends when neither player has any legal moves left, this either happens when the board is full or both players can't out flank each other 
- The player at the end of the game with the most tokens wins 

AI declaration: The core game logic, functional architecture, and overall code structure were independently planned and defined. All graphical assets and UI layouts were originally designed from scratch using Figma. Google Gemini and Claude were used to assists in syntax troubleshooting,  implementation of pre-defined functions, and refining the CSS styling and animations of the design.

This is the submission template for your Computing 2 Applications coursework submission.

## Checklist
### Install dependencies locally
This template relies on a a few packages from the Node Package Manager, npm.
To install them run the following commands in the terminal.
```properties
npm install
```
These won't be uploaded to your repository because of the `.gitignore`.
I'll run the same commands when I download your repos.

### Game Module – API
*You will produce an API specification, i.e. a list of function names and their signatures, for a Javascript module that represents the state of your game and the operations you can perform on it that advances the game or provides information.*

- [ ] Include a `.js ` module file in `/web-app` containing the API using `jsdoc`.
- [ ] Update `/jsdoc.json` to point to this module in `.source.include` (line 7)
- [ ] Compile jsdoc using the run configuration `Generate Docs`
- [ ] Check the generated docs have compiled correctly.

### Game Module – Implementation
*You will implement, in Javascript, the module you specified above. Such that your game can be simulated in code, e.g. in the debug console.*

- [ ] The file above should be fully implemented.

### Unit Tests – Specification
*For the Game module API you have produced, write a set of unit tests descriptions that specify the expected behaviour of one aspect of your API, e.g. you might pick the win condition, or how the state changes when a move is made.*

- [ ] Write unit test definitions in `/web-app/tests`.
- [ ] Check the headings appear in the Testing sidebar.

### Unit Tests – Implementation
*Implement in code the unit tests specified above.*

- [ ] Implement the tests above.

### Web Application
*Produce a web application that allows a user to interface with your game module.*

- Implement in `/web-app`
  - [ ] `index.html`
  - [ ] `default.css`
  - [ ] `main.js`
  - [ ] Any other files you need to include.

### Finally
- [ ] Push to GitHub.
- [ ] Sync the changes.
- [ ] Check submission on GitHub website.
