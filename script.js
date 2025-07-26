const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;

canvas.height = ROWS * BLOCK_SIZE;
canvas.width = (COLS + 6) * BLOCK_SIZE;

const mino = [
  // Iミノ
  [
    [0,0,0,0],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0]
  ],
  // Oミノ
  [
    [1,1],
    [1,1]
  ],
  // Tミノ 
  [
    [0,1,0],
    [1,1,1],
    [0,0,0]
  ],
  // Sミノ
  [
    [0,1,1],
    [1,1,0],
    [0,0,0]
  ],
  // Zミノ
  [
    [1,1,0],
    [0,1,1],
    [0,0,0]
  ],
  // Jミノ
  [
    [1,0,0],
    [1,1,1],
    [0,0,0]
  ],
  // Lミノ
  [
    [0,0,1],
    [1,1,1],
    [0,0,0]
  ]
];


const COLORS = ['cyan','yellow','purple','green','red','blue','orange'];

// Iミノ用キック
const SRS_KICKS_I = [
  [[0,0], [-2,0], [1,0], [-2,1], [1,-2]],   // 0→R
  [[0,0], [-1,0], [2,0], [-1,-2], [2,1]],  // R→2
  [[0,0], [2,0], [-1,0], [2,-1], [-1,2]],  // 2→L
  [[0,0], [1,0], [-2,0], [1,2], [-2,-1]]   // L→0
];

// T,S,Z,J,Lミノ用キック
const SRS_KICKS_OTHERS = [
  [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],   // 0→R
  [[0,0], [1,0], [1,-1], [0,2], [1,2]],       // R→2
  [[0,0], [1,0], [1,1], [0,-2], [1,-2]],      // 2→L
  [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]]     // L→0
];

let currentMinoIndex = 0;  
let currentRotation = 0;   


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
  const N = shape.length;
  let newShape = Array.from({length: N}, () => Array(N).fill(0));
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      newShape[x][N - 1 - y] = shape[y][x];
    }
  }
  return newShape;
}

function rotateCCW(shape) {
  const N = shape.length;
  let newShape = Array.from({length: N}, () => Array(N).fill(0));
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      newShape[N - 1 - x][y] = shape[y][x];
    }
  }
  return newShape;
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

let isCleared = false; 

function checkClear() {
  if (score >= 4000) { //4000
    clearInterval(gameInterval);
    document.getElementById('message2').style.display = "flex"; 
    isCleared = true;
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
  if (GameOver) return;
  if (isCleared) return;
  let kicks = null;
  if (currentMinoIndex === 0) kicks = SRS_KICKS_I;
  else if (currentMinoIndex !== 1) kicks = SRS_KICKS_OTHERS;  // Oは回転なし

  if (e.key === 'z') {  // 左回転
    if (kicks) {
      const result = SRSRotate(current, currentX, currentY, rotateCCW, kicks[currentRotation]);
      if (result.success) {
        current = result.shape;
        currentX = result.x;
        currentY = result.y;
        currentRotation = (currentRotation + 3) % 4;  // 左回転は -1 mod 4
      }
    }
  }

  if (e.code === 'ArrowUp') {  // 右回転
    if (kicks) {
      const result = SRSRotate(current, currentX, currentY, rotate, kicks[currentRotation]);
      if (result.success) {
        current = result.shape;
        currentX = result.x;
        currentY = result.y;
        currentRotation = (currentRotation + 1) % 4;
        console.log(1)
      }
    }
  }

  if (e.key === 'ArrowLeft' && !collision(currentX - 1, currentY, current)) currentX--;
  if (e.key === 'ArrowRight' && !collision(currentX + 1, currentY, current)) currentX++;
  if (e.key === 'ArrowDown') drop();
  if (e.key === 'Shift') hold();
  if (e.code === 'Space') hardDrop();

  draw();
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
  if (minoQueue.length === 0) refillQueue();
  currentMinoIndex = minoQueue.shift();
  current = mino[currentMinoIndex];
  currentColor = COLORS[currentMinoIndex];
  currentX = 3;
  currentY = 0;
  currentRotation = 0; 
  holdUsed = false;

  if (collision(currentX, currentY, current)) {
    GameOver = true;
    draw();
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
    ctx.fillText("停止中", (COLS * BLOCK_SIZE) /2, (ROWS * BLOCK_SIZE) /2);
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

