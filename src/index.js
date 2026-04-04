const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let backgroundImg = new Image();
let characterImg = new Image();
let topPipeImg = new Image();
let bottomPipeImg = new Image();
let gameOverImg = new Image(); gameOverImg.src = "assets/ui/game_over.png";

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
const COOLDOWN_MAX = 500; // 500 frames at 20ms per frame = 10 seconds

let pipeGap = 0.4; 
let pipeSpeed = 3; 
let pipeInterval = 180;

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
  if (event.code === "Space") { event.preventDefault(); flap(); }
  if (event.code === "KeyF") { showHitboxes = !showHitboxes; }
  if (event.code === "KeyJ") { useAbility(); } // Trigger ability
});
canvas.addEventListener("click", flap);

function startGame(){
  const character = document.getElementById("character").value;
  characterImg.src = "assets/characters/" + character;

  if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }

  bgMusic = new Audio("assets/audio/Music.mp3");
  bgMusic.loop = true;
  bgMusic.preload = "auto";
  bgMusic.volume = 0.5;
  backgroundImg.src = "assets/backgrounds/Background.png";
  topPipeImg.src = "assets/pipes/tube2.png";
  bottomPipeImg.src = "assets/pipes/tube.png";

  const difficulty = document.getElementById("difficulty").value;
  if(difficulty === "normal") { pipeGap = 0.45; pipeSpeed = 20; pipeInterval = 50; }
  if(difficulty === "hard") { pipeGap = 0.35; pipeSpeed = 28; pipeInterval = 50; }
  if(difficulty === "extreme") { pipeGap = 0.4; pipeSpeed = 35; pipeInterval = 45; }
  if(difficulty === "impossible") { pipeGap = 0.4; pipeSpeed = 25; pipeInterval = 10; }

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
  bird.y = canvas.height * 0.25;
  bird.velocity = 0;
  pipes = [];
  score = 0;
  frame = 0;
  abilityCooldown = 0; // Reset cooldown on new game
  isGameOver = false;
}

function flap(){
  if(!isGameOver){
    bird.velocity = bird.lift;
  }
}

function useAbility() {
  if (isGameOver) return;
  const character = document.getElementById("character").value;

  // Check if character is Trump and cooldown is at 0
  if (character === "Trump.png" && abilityCooldown <= 0) {
    pipes = []; // Blows up all pipes currently on screen
    abilityCooldown = COOLDOWN_MAX; // Reset the timer
  }
}

function drawBird(){ 
  ctx.drawImage(characterImg, bird.x, bird.y, bird.width, bird.height); 
  
  if(showHitboxes){
    ctx.strokeStyle = "green"; ctx.lineWidth = 2;
    ctx.strokeRect(bird.x, bird.y, bird.width, bird.height);
  }

  // Draw Cooldown Timer above the character's head
  if (abilityCooldown > 0 && document.getElementById("character").value === "Trump.png") {
    ctx.fillStyle = "red";
    ctx.font = "bold 24px 'Poppins', sans-serif";
    ctx.textAlign = "center";
    
    // Convert remaining frames back to seconds (50 frames per second)
    let secondsLeft = Math.ceil(abilityCooldown / 50); 
    
    // Draw the number above the bird's head
    ctx.fillText(secondsLeft, bird.x + (bird.width / 2), bird.y - 15);
    ctx.textAlign = "start"; // Reset text alignment so score draws correctly
  }
}

function drawPipes(){ 
  pipes.forEach(pipe => {
    ctx.drawImage(topPipeImg, pipe.x, 0, pipe.width, pipe.top);
    ctx.drawImage(bottomPipeImg, pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);

    // Tint upcoming 10th pipe yellow
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
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  if(!isGameOver){
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Decrease the cooldown timer if it's active
    if (abilityCooldown > 0) {
      abilityCooldown--;
    }

    if(bird.y + bird.height > canvas.height || bird.y < -25){
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
  if(isGameOver) return;
  isGameOver = true;
  clearInterval(gameInterval);
  bgMusic.pause();
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