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
  drawNext();
  drawHold();

  if (GameOver) {
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
  document.getElementById('score').textContent = "スコア：" + score;
}


function rotateByCenter(shape, cx, cy, isCCW = false) {
    const N = shape.length;
    let newShape = Array.from({length: N}, () => Array(N).fill(0));
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            if (!shape[y][x]) continue;
            // 中心補正: Iミノだけ Math.floor, 他は Math.round
            let dx = x - cx;
            let dy = y - cy;
            let rx, ry;
            if (!isCCW) {
                rx = dy;
                ry = -dx;
            } else {
                rx = -dy;
                ry = dx;
            }
            let nx, ny;
            if (N === 4) { // Iミノ
                nx = Math.floor(cx + rx + 0.01);
                ny = Math.floor(cy + ry + 0.01);
            } else {
                nx = Math.round(cx + rx);
                ny = Math.round(cy + ry);
            }
            if (ny >= 0 && ny < N && nx >= 0 && nx < N) {
                newShape[ny][nx] = shape[y][x];
            }
        }
    }
    return newShape;
}

function rotate(shape, minoIndex) {
  if (minoIndex === 0) return rotateByCenter(shape, 1.5, 1.5, false); // Iミノ
  if (minoIndex === 1) return shape.map(row => row.slice()); // Oミノ（回転なし）
  return rotateByCenter(shape, 1, 1, false); // 他
}

function rotateCCW(shape, minoIndex) {
  if (minoIndex === 0) return rotateByCenter(shape, 1.5, 1.5, true);
  if (minoIndex === 1) return shape.map(row => row.slice());
  return rotateByCenter(shape, 1, 1, true);
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
    document.getElementById('score').textContent = "スコア：" + score;
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
    const result = SRSRotate(
      current, currentX, currentY,
      shape => rotateCCW(shape, currentMinoIndex), kicks[currentRotation]
    );
    if (result.success) {
      current = result.shape;
      currentX = result.x;
      currentY = result.y;
      currentRotation = (currentRotation + 3) % 4;
    }
  }
}

if (e.code === 'ArrowUp') {  // 右回転
  if (kicks) {
    const result = SRSRotate(
      current, currentX, currentY,
      shape => rotate(shape, currentMinoIndex), kicks[currentRotation]
    );
    if (result.success) {
      current = result.shape;
      currentX = result.x;
      currentY = result.y;
      currentRotation = (currentRotation + 1) % 4;
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
let dropSpeed = 400;

document.getElementById('dropspeed').addEventListener('input', function(){
  dropSpeed = Number(this.value) || 400;
});

function startGame() {
  board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
  holdMino = null;
  holdColor = null;
  holdMinoIndex = null;
  holdUsed = false;
  holdRotation = 0;
  GameOver = false;
  minoQueue = [];
  newTetromino();
  draw();
  isPaused = false;
  score = 0;
  document.getElementById('score').textContent = "スコア： " + score; 
  if (gameInterval) {
    clearInterval(gameInterval);
  }
  gameInterval = setInterval(gameLoop, dropSpeed); 
  document.getElementById('message').style.display = "none";
  document.getElementById('message2').style.display = "none";
  stopGame();
  isCleared = false;
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
    
    if (minoQueue.length === 0) {
      refillQueue();
    }
    currentMinoIndex = minoQueue.shift();
    current = mino[currentMinoIndex];
    currentColor = COLORS[currentMinoIndex];
    currentX = 3;
    currentY = 0;
    currentRotation = 0;
    holdUsed = false;
    
    if (minoQueue.length === 0) {
      refillQueue();
    }
    nextMinoIndex = minoQueue[0]; 
    nextMinoShape = mino[nextMinoIndex];
    nextMinoColor = COLORS[nextMinoIndex];

    if (collision(currentX, currentY, current)) {
        GameOver = true;
        draw();
      }
    }


function nextmino(){
   
}

let holdMino = null;
let holdColor = null;
let holdUsed = false;

let holdRotation = 0; // ホールド時の回転状態も保存する変数を用意

let holdMinoIndex = null; // ホールドしたミノの種類番号も保存

function hold() {
  if (holdUsed) return;
  if (holdMino === null) {
    holdMino = current;
    holdColor = currentColor;
    holdMinoIndex = currentMinoIndex;    
    holdRotation = currentRotation;
    newTetromino();
  } else {
    let tempMino = current;
    let tempColor = currentColor;
    let tempRotation = currentRotation;
    let tempMinoIndex = currentMinoIndex;  

    current = holdMino;
    currentColor = holdColor;
    currentMinoIndex = holdMinoIndex;          
    currentRotation = holdRotation;

    holdMino = tempMino;
    holdColor = tempColor;
    holdRotation = tempRotation;
    holdMinoIndex = tempMinoIndex;          

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
  if (holdMinoIndex === null) return;  

  const holdShape = mino[holdMinoIndex];              
  const holdColorLocal = COLORS[holdMinoIndex];

  for (let y = 0; y < holdShape.length; y++) {
    for (let x = 0; x < holdShape[y].length; x++) {
     if (holdShape[y][x]) {
       drawBlock(x + COLS + 1, y + 1, holdColorLocal);
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

let nextMinoIndex = null;
let nextMinoShape = null;
let nextMinoColor = null;

function drawNext() {///
  const offsetX = (COLS + 1) * BLOCK_SIZE;
  const offsetY = BLOCK_SIZE + 8 * BLOCK_SIZE + 10; 
  ctx.strokeRect(offsetX, offsetY, 4 * BLOCK_SIZE, 4 * BLOCK_SIZE);
  ctx.strokeStyle = 'white';
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = 'white';
  ctx.textAlign = "center";
  ctx.fillText('NEXT', offsetX + 2 * BLOCK_SIZE, offsetY - 5);

  if (!nextMinoShape) return;

  for (let y = 0; y < nextMinoShape.length; y++) {
    for (let x = 0; x < nextMinoShape[y].length; x++) {
      if (nextMinoShape[y][x]) {
        ctx.fillStyle = nextMinoColor;
        ctx.fillRect(offsetX + x * BLOCK_SIZE, offsetY + y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
        
      }
      
    }
  }
}



startGame();

