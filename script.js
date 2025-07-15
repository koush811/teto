const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;

canvas.height = ROWS * BLOCK_SIZE;
canvas.width = (COLS + 6) * BLOCK_SIZE;
//ミノ
const mino = [
  [[1,1,1,1]], // I
  [[1,1],[1,1]], // O
  [[0,1,0],[1,1,1]], // T
  [[1,1,0],[0,1,1]], // S
  [[0,1,1],[1,1,0]], // Z
  [[1,0,0],[1,1,1]], // J
  [[0,0,1],[1,1,1]]  // L
];
const COLORS = ['cyan','yellow','purple','green','red','blue','orange'];

let board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
let current, currentX, currentY, currentColor;

function newTetromino() {
  const idx = Math.floor(Math.random() * TETROMINOS.length);
  current = mino[idx];
  currentColor = COLORS[idx];
  currentX = 3;
  currentY = 0;
}

function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE-1, BLOCK_SIZE-1);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ステージ
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) drawBlock(x, y, board[y][x]);
    }
  }
  // 今のミノ
  for (let y = 0; y < current.length; y++) {
    for (let x = 0; x < current[y].length; x++) {
      if (current[y][x]) drawBlock(currentX + x, currentY + y, currentColor);
    }
  }

  drawHold();

}

function collision(nx, ny, shape) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        let px = nx + x, py = ny + y;
        if (px < 0 || px >= COLS || py >= ROWS || (py >= 0 && board[py][px])) return true;
      }
    }
  }
  return false;
}

function merge() {
  for (let y = 0; y < current.length; y++) {
    for (let x = 0; x < current[y].length; x++) {
      if (current[y][x]) board[currentY + y][currentX + x] = currentColor;
    }
  }
}

function rotate(shape) {
  return shape[0].map((_,i) => shape.map(row => row[i])).reverse();
}

function clearLines() {
  board = board.filter(row => row.some(cell => !cell));
  while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
}

function drop() {
  if (!collision(currentX, currentY + 1, current)) {
    currentY++;
  } else {
    merge();
    clearLines();
    newTetromino();
    if (collision(currentX, currentY, current)) {
      board = Array.from({length: ROWS}, () => Array(COLS).fill(0)); 
    }
  }
  draw();
}

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' && !collision(currentX - 1, currentY, current)) currentX--;
  if (e.key === 'ArrowRight' && !collision(currentX + 1, currentY, current)) currentX++;
  if (e.key === 'ArrowDown') drop();
  if (e.key === 'ArrowUp') {
    let r = rotate(current);
    if (!collision(currentX, currentY, r)) current = r;
  }
  if (e.key === 'Shift') hold(); // ← Shiftキーでホールド
  draw();
});

function gameLoop() {
  drop();
  setTimeout(gameLoop, 500);
}

let gameInterval = null;
const dropSpeed = 100;

function startGame() {
  if (gameInterval) clearInterval(gameInterval);
  board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
  holdMino = null;         
  holdColor = null;        
  holdUsed = false;
  newTetromino();
  draw();
  GameOver = false;
  gameInterval = setInterval(drop, dropSpeed);
}

document.getElementById('resetbtn').addEventListener('click', startGame);

let GameOver = false;

function newTetromino() {
  const idx = Math.floor(Math.random() * mino.length);
  current = mino[idx];
  currentColor = COLORS[idx];
  currentX = 3;
  currentY = 0;
  holdUsed = false; // ← ここを追加

  if (collision(currentX, currentY, current)) {
    GameOver = true;
    clearInterval(gameInterval);
    draw();
    setTimeout(() => {
      ctx.font = "bold 32px sans-serif";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    }, 50);
  }
}

let holdMino = null;
let holdColor = null;
let holdUsed = false;

function hold() {
 if (holdUsed) return;

 if (holdMino === null) {
  holdMino = current;
  holdColor = currentColor;
  newTetromino();
 } else {
  let tempMino = current;
  let tempColor = currentColor;
  current = holdMino;
  currentColor = holdColor;
  holdMino = tempMino;
  holdColor = tempColor;
  currentX = 3;
  currentY = 0;

  if (collision(currentX, currentY, current)) {
   GameOver = true;
   clearInterval(gameInterval);
   draw();
   setTimeout(() => {
   ctx.font = "bold 32px sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
   }, 50);
   return;
  }
 }

 holdUsed = true;
 draw();
}

function drawHold() {
  ctx.strokeStyle = 'white';
  ctx.strokeRect((COLS + 1) * BLOCK_SIZE, BLOCK_SIZE, 4 * BLOCK_SIZE, 4 * BLOCK_SIZE);
  if (!holdMino) return;
  for (let y = 0; y < holdMino.length; y++) {
  for (let x = 0; x < holdMino[y].length; x++) {
   if (holdMino[y][x]) {
    drawBlock(x + COLS + 1, y + 1, holdColor); // 右側に描画
   }
  }
 }
}

newTetromino();
draw();
gameLoop();
drawHold();

