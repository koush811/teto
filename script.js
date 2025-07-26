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

const SRS_KICKS = [
  [0, 0],   
  [-1, 0],  
  [-1, 1],  
  [0, -2], 
  [-1, -2]  
];

let board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
let current, currentX, currentY, currentColor;


function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE-1, BLOCK_SIZE-1);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) drawBlock(x, y, board[y][x]);
    }
  }
  for (let y = 0; y < current.length; y++) {
    for (let x = 0; x < current[y].length; x++) {
      if (current[y][x]) drawBlock(currentX + x, currentY + y, currentColor);
    }
  }
  ctx.strokeStyle = 'rgba(126, 126, 126, 1)'; 
  ctx.lineWidth = .7;

  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * BLOCK_SIZE, 0);
    ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
    ctx.stroke();
  }

  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * BLOCK_SIZE);
    ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
    ctx.stroke();
  }
  drawHold();

  if (GameOver) {
    ctx.fillText("GAME OVER", (COLS * BLOCK_SIZE) / 2, (ROWS * BLOCK_SIZE) / 2);
    document.getElementById('message').style.display = "flex";
    draw();
  }
}

//衝突
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

//SRS
function SRSRotate(shape, x, y, rotateFunc, kicks) {
  const rotated = rotateFunc(shape);
  for (let i = 0; i < kicks.length; i++) {
    const [dx, dy] = kicks[i];
    if (!collision(x + dx, y + dy, rotated)) {
      return { success: true, shape: rotated, x: x + dx, y: y + dy };
    }
  }
  return { success: false, shape, x, y };
}

function merge() {
  for (let y = 0; y < current.length; y++) {
    for (let x = 0; x < current[y].length; x++) {
      if (current[y][x]) board[currentY + y][currentX + x] = currentColor;
    }
  }
  score += 10;
  document.getElementById('score').textContent = score;
}

function rotate(shape) {
  return shape[0].map((_,i) => shape.map(row => row[i])).reverse();
}

function rotateCCW(shape) {
  return shape[0].map((_, i) => shape.map(row => row[row.length - 1 - i]));
}

function clearLines() {
  let linesCleared = 0;

  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== 0)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      y++; 
    }
  }
  if (linesCleared > 0) {
    score += linesCleared * 100; 
    document.getElementById('score').textContent = score;
    checkClear(); 
  }
}

function checkClear() {
  if (score >= 4000) {
    clearInterval(gameInterval);
    document.getElementById('message2').style.display = "flex"; 
  }
}//クリア条件

let isLocking = false; 

function drop() {
 if (!collision(currentX, currentY + 1, current)) {
  currentY++;
  isLocking = false; 
 } else {
  if (!isLocking) {
    isLocking = true;
  setTimeout(() => {
      if (collision(currentX, currentY + 1, current)) {
        merge();
        clearLines();
        newTetromino();
      if (collision(currentX, currentY, current)) {
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        }
      }
      isLocking = false; 
      draw();
      }, 1000); //1000
    }
  }
  draw(); 
}

function hardDrop() {
  while (!collision(currentX, currentY + 1, current)) {
    currentY++;
  }
  merge(); 
  clearLines(); 
  newTetromino(); 
  draw(); 
  isLocking = false; 
}



document.addEventListener('keydown', e => {
  if (isPaused) return; 
  if (e.key === 'ArrowLeft' && !collision(currentX - 1, currentY, current)) currentX--;
  if (e.key === 'ArrowRight' && !collision(currentX + 1, currentY, current)) currentX++;
  if (e.code === 'ArrowDown') drop();                
  if (e.key === 'z') {//左
  const result = SRSRotate(current, currentX, currentY, rotateCCW, SRS_KICKS);
    if (result.success) {
      current = result.shape;
      currentX = result.x;
      currentY = result.y;
    }
  }
  if (e.key === 'ArrowUp') {//右
    const result = SRSRotate(current, currentX, currentY, rotate, SRS_KICKS);
    if (result.success) {
      current = result.shape;
      currentX = result.x;
      currentY = result.y;
    }
  }
  if (e.key === 'Shift') hold();
  draw();
  if (e.code === 'Space') {
    hardDrop();
  }
});

function gameLoop() {
  if (!GameOver && !isPaused) {
    drop();
  }
}

let gameInterval = null;
const dropSpeed = 400; //速度 400

function startGame() {
  board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
  holdMino = null;
  holdColor = null;
  holdUsed = false;
  GameOver = false;
  minoQueue = [];
  newTetromino();
  draw();
  isPaused = false;
  score = 0;
  document.getElementById('score').textContent = "スコア: " + score; 
  if (gameInterval) {
  clearInterval(gameInterval);
  }
  gameInterval = setInterval(gameLoop, dropSpeed); 
  document.getElementById('message').style.display = "none";
  document.getElementById('message2').style.display = "none";
  stopGame();
}

document.getElementById('resetbtn').addEventListener('click', startGame);

let GameOver = false;

let minoQueue = [];

let score = 0;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); 
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function refillQueue() {
  const bag = shuffle([...Array(mino.length).keys()]); 
  minoQueue.push(...bag); 
}


function newTetromino() {

  if(minoQueue.length === 0){
    refillQueue();
  }
  const idx = minoQueue.shift();
  current = mino[idx];
  currentColor = COLORS[idx];
  currentX = 3;
  currentY = 0;
  holdUsed = false; 

  if (collision(currentX, currentY, current)) {
    GameOver = true;
    draw();
  }
}
score
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
      drawHold();
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
    drawBlock(x + COLS + 1, y + 1, holdColor); 
   }
  }
 }
}

let isPaused = false;

function stopGame(){
  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
    isPaused = true;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);
    ctx.fillStyle = "white";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("停止中", (COLS * BLOCK_SIZE) / 2, (ROWS * BLOCK_SIZE) / 2);
    ctx.restore();
  }
}

function restartGame(){
  if (!gameInterval && isPaused && !GameOver) {
    gameInterval = setInterval(gameLoop, dropSpeed);
    isPaused = false;
    draw();
  };
}

function gameLoop() {
  if (!GameOver && !isPaused) { 
    drop();
  }
}

document.getElementById('stopbtn').addEventListener('click' ,stopGame);
document.getElementById('startbtn').addEventListener('click' ,restartGame);


startGame();

