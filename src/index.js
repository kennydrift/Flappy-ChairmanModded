const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let backgroundImg = new Image();
let characterImg = new Image();
let topPipeImg = new Image();
let bottomPipeImg = new Image();
let gameOverImg = new Image(); 
gameOverImg.src = "assets/ui/game_over.png";

const hitSound = new Audio("assets/audio/hit.mp3");
hitSound.preload = "auto";
hitSound.volume = 0.8;
let bgMusic;

let bird = { x: 0, y: 0, width: 0, height: 0, gravity: 0, lift: 0, velocity: 0 };
let pipes = [];
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let frame = 0;
let gameInterval;
let isGameOver = false;
let showHitboxes = true;

// Special Ability Variables
let abilityCooldown = 0; 
const COOLDOWN_MAX = 500; 

// Game Difficulty Variables
let pipeGap = 0.4; 
let pipeSpeed = 3; 
let pipeInterval = 180;

// Mod Variables
let isInvincible = false;
let isReverseMode = false; 

function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  bird.width = canvas.width * 0.06;
  bird.height = bird.width;
  bird.x = canvas.width * 0.15;
  bird.gravity = 0.5 * (canvas.height/600);
  bird.lift = -9.25 * (canvas.height/600);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.addEventListener("keydown", function(event) {
  if (event.code === "Tab" || event.key === "Tab") { 
    event.preventDefault(); 
    toggleCheatMenu(); 
  }

  if (event.code === "Space" || event.key === " ") { event.preventDefault(); flap(); }
  if (event.code === "KeyF" || event.key === "f") { showHitboxes = !showHitboxes; }
  if (event.code === "KeyJ" || event.key === "j") { useAbility(); } 
});

canvas.addEventListener("click", flap);

function startGame(){
  const character = document.getElementById("character").value;
  characterImg.src = "assets/characters/" + character;

  if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }
  bgMusic = new Audio();
  bgMusic.loop = true;
  bgMusic.preload = "auto";
  bgMusic.volume = 0.5;

  const currentMusic = document.getElementById("modMusic").value;
  if (currentMusic.startsWith("blob:")) {
    bgMusic.src = currentMusic;
  } else if (currentMusic !== "upload") {
    bgMusic.src = "assets/audio/" + currentMusic;
  } else {
    bgMusic.src = "assets/audio/Music.mp3"; 
  }

  const currentBg = document.getElementById("modBackground").value;
  if (currentBg.startsWith("blob:")) {
    backgroundImg.src = currentBg;
  } else if (currentBg !== "upload") {
    backgroundImg.src = "assets/backgrounds/" + currentBg;
  } else {
    backgroundImg.src = "assets/backgrounds/Background.png"; 
  }

  topPipeImg.src = "assets/pipes/tube2.png";
  bottomPipeImg.src = "assets/pipes/tube.png";

  const difficulty = document.getElementById("difficulty").value;
  if(difficulty === "normal") { pipeGap = 0.45; pipeSpeed = 20; pipeInterval = 50; }
  if(difficulty === "hard") { pipeGap = 0.35; pipeSpeed = 28; pipeInterval = 50; }
  if(difficulty === "extreme") { pipeGap = 0.4; pipeSpeed = 35; pipeInterval = 45; }
  if(difficulty === "impossible") { pipeGap = 0.4; pipeSpeed = 25; pipeInterval = 10; }

  const modSpeedInput = document.getElementById("modSpeed");
  if(modSpeedInput) modSpeedInput.value = pipeSpeed;

  document.getElementById("menu").style.display = "none";
  document.getElementById("charPreviewBox").style.display = "none";

  resetGame();
  bgMusic.play();
  gameInterval = setInterval(update, 20);
}

document.getElementById("playAgainBtn").addEventListener("click", ()=>{
  document.getElementById("playAgainBtn").style.display = "none";
  document.getElementById("menu").style.display = "flex";
  document.getElementById("charPreviewBox").style.display = "block";
});

function resetGame(){
  bird.y = isReverseMode ? canvas.height * 0.75 : canvas.height * 0.25;
  bird.velocity = 0;
  pipes = [];
  score = 0;
  frame = 0;
  abilityCooldown = 0; 
  isGameOver = false;
}

function flap(){
  if(!isGameOver){
    if (isReverseMode) {
      bird.velocity = Math.abs(bird.lift);
    } else {
      bird.velocity = bird.lift;
    }
  }
}

function useAbility() {
  if (isGameOver) return;
  const character = document.getElementById("character").value;

  if (character === "Trump.png" && abilityCooldown <= 0) {
    pipes = []; 
    abilityCooldown = COOLDOWN_MAX; 
  }
}

function drawBird(){ 
  // Flip the character upside down if Reverse Mode is active
  if (isReverseMode) {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.scale(1, -1);
    ctx.drawImage(characterImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
    ctx.restore();
  } else {
    ctx.drawImage(characterImg, bird.x, bird.y, bird.width, bird.height); 
  }
  
  if(showHitboxes){
    ctx.strokeStyle = "green"; ctx.lineWidth = 2;
    ctx.strokeRect(bird.x, bird.y, bird.width, bird.height);
  }

  if (abilityCooldown > 0 && document.getElementById("character").value === "Trump.png") {
    ctx.fillStyle = "red";
    ctx.font = "bold 24px 'Poppins', sans-serif";
    ctx.textAlign = "center";
    let secondsLeft = Math.ceil(abilityCooldown / 50); 
    ctx.fillText(secondsLeft, bird.x + (bird.width / 2), bird.y - 15);
    ctx.textAlign = "start"; 
  }
}

function drawPipes(){ 
  pipes.forEach(pipe => {
    ctx.drawImage(topPipeImg, pipe.x, 0, pipe.width, pipe.top);
    ctx.drawImage(bottomPipeImg, pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);

    if((score + 1) % 10 === 0 && !pipe.scored){
      ctx.fillStyle = "rgba(255, 255, 0, 0.4)";
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
      ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);
    }

    if(showHitboxes){
      ctx.strokeStyle = "blue"; ctx.lineWidth = 2;
      ctx.strokeRect(pipe.x, 0, pipe.width, pipe.top); 
      ctx.strokeRect(pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);
    }
  });
}

function drawScore(){
  const isRoaring = document.getElementById("character").value === "Roaring.png";
  ctx.fillStyle = isRoaring ? "white" : "black";
  ctx.font = `${Math.floor(canvas.width * 0.05)}px sans-serif`;
  ctx.fillText("Score: " + score, 10, canvas.height * 0.15);
  ctx.font = `${Math.floor(canvas.width * 0.035)}px sans-serif`;
  ctx.fillText("High Score: " + highScore, 10, canvas.height * 0.15 + 40);
}

function update(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Flip the background upside down if Reverse Mode is active
  if (isReverseMode) {
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  } else {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  }

  if(!isGameOver){
    
    if (isReverseMode) {
      bird.velocity -= Math.abs(bird.gravity); 
    } else {
      bird.velocity += bird.gravity; 
    }
    
    bird.y += bird.velocity;

    if (isInvincible) {
      if (bird.y + bird.height > canvas.height) {
        bird.y = canvas.height - bird.height;
        bird.velocity = isReverseMode ? -Math.abs(bird.lift) : bird.lift; 
      }
      if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = isReverseMode ? Math.abs(bird.lift) : 0;
      }
    }

    if(abilityCooldown > 0) {
      abilityCooldown--;
    }

    if(!isInvincible && (bird.y + bird.height > canvas.height || bird.y < -25)){
      triggerGameOver();
    }

    if(frame % pipeInterval === 0){
      let topHeight = Math.random() * (canvas.height - pipeGap*canvas.height - 100) + 50;
      pipes.push({ x: canvas.width, width: canvas.width * 0.12, top: topHeight, bottom: canvas.height - topHeight - pipeGap*canvas.height, scored: false });
    }

    pipes.forEach(pipe => {
      pipe.x -= pipeSpeed;
      if(bird.x < pipe.x + pipe.width && bird.x + bird.width > pipe.x){
        if(bird.y < pipe.top || bird.y + bird.height > canvas.height - pipe.bottom){
          triggerGameOver();
        }
      }
      if(!pipe.scored && bird.x > pipe.x + pipe.width){
        score++;
        pipe.scored = true;

        if(score % 10 === 0){
          pipeSpeed += 0.5;
          const modSpeedInput = document.getElementById("modSpeed");
          if(modSpeedInput) modSpeedInput.value = pipeSpeed;
        }
      }
    });

    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
  }

  drawPipes();
  drawBird();
  drawScore();

  if(isGameOver){
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    const imgWidth = canvas.width * 0.6;
    const imgHeight = imgWidth * (gameOverImg.height / gameOverImg.width || 0.5);
    ctx.drawImage(gameOverImg, (canvas.width - imgWidth)/2, canvas.height*0.3 - imgHeight/2, imgWidth, imgHeight);

    ctx.fillStyle = "white";
    ctx.font = `${Math.floor(canvas.width*0.05)}px sans-serif`;
    ctx.fillText("Final Score: " + score, canvas.width*0.25, canvas.height*0.75);

    document.getElementById("playAgainBtn").style.display = "block";
  }

  frame++;
}

function triggerGameOver(){
  if (isInvincible) return; 

  if(isGameOver) return;
  isGameOver = true;
  clearInterval(gameInterval);
  if (bgMusic) bgMusic.pause();
  hitSound.currentTime = 0;
  hitSound.play();
  if(score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
}

document.getElementById("character").addEventListener("change", (e)=>{
  document.getElementById("charPreview").src = "assets/characters/" + e.target.value;
});

// --- CHEAT MENU LOGIC ---
function toggleCheatMenu() {
  const cheatMenu = document.getElementById("cheatMenu");
  
  if (!cheatMenu) {
    return;
  }

  if (window.getComputedStyle(cheatMenu).display === "none") {
    cheatMenu.style.display = "flex";
  } else {
    cheatMenu.style.display = "none";
  }
}

// Dragging Logic
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

document.addEventListener("mousedown", (e) => {
  const cheatHeader = document.getElementById("cheatMenuHeader");
  if (e.target === cheatHeader) {
    isDragging = true;
    const cheatMenu = document.getElementById("cheatMenu");
    const rect = cheatMenu.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  }
});

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const cheatMenu = document.getElementById("cheatMenu");
  cheatMenu.style.left = `${e.clientX - offsetX}px`;
  cheatMenu.style.top = `${e.clientY - offsetY}px`;
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

// --- MOD MENU FUNCTIONALITY ---
function resetHighScore() {
  highScore = 0;
  localStorage.setItem("highScore", 0);
  const hsInput = document.getElementById("modHighScore");
  if (hsInput) hsInput.value = ""; 
}

function updateSpeed(val) {
  if (val === "") return; 
  pipeSpeed = parseFloat(val);
}

function toggleInvincibility(checked) {
  isInvincible = checked;
}

function toggleReverseMode(checked) {
  isReverseMode = checked;
}

function setCustomHighScore(val) {
  let newScore = parseInt(val);
  if (!isNaN(newScore)) {
    highScore = newScore;
    localStorage.setItem("highScore", newScore);
  }
}

// Background Mod Logic
function changeBackground(bgValue) {
  if (bgValue === "upload") {
    document.getElementById("bgUploader").click();
    return;
  }
  if (bgValue.startsWith("blob:")) {
    backgroundImg.src = bgValue;
  } else {
    backgroundImg.src = "assets/backgrounds/" + bgValue;
  }
}

function handleBackgroundUpload(event) {
  const file = event.target.files[0];
  if (!file) return; 

  const url = URL.createObjectURL(file);
  backgroundImg.src = url;
  
  const select = document.getElementById("modBackground");
  const newOption = document.createElement("option");
  newOption.value = url;
  newOption.text = file.name; 
  
  const uploadOpt = Array.from(select.options).find(opt => opt.value === 'upload');
  select.insertBefore(newOption, uploadOpt);
  
  select.value = url;
  event.target.value = ""; 
}

// Music Mod Logic
function changeMusic(musicValue) {
  if (musicValue === "upload") {
    document.getElementById("musicUploader").click();
    return;
  }
  
  if (bgMusic && !bgMusic.paused) {
    if (musicValue.startsWith("blob:")) {
      bgMusic.src = musicValue;
    } else {
      bgMusic.src = "assets/audio/" + musicValue;
    }
    bgMusic.play();
  }
}

function handleMusicUpload(event) {
  const file = event.target.files[0];
  if (!file) return; 

  const url = URL.createObjectURL(file);
  
  const select = document.getElementById("modMusic");
  const newOption = document.createElement("option");
  newOption.value = url;
  newOption.text = file.name; 
  
  const uploadOpt = Array.from(select.options).find(opt => opt.value === 'upload');
  select.insertBefore(newOption, uploadOpt);
  
  select.value = url;
  
  if (bgMusic && !bgMusic.paused) {
    bgMusic.src = url;
    bgMusic.play();
  }
  
  event.target.value = ""; 
}