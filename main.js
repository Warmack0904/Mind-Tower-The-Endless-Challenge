// Game State
let floor = 1;
let lives = 3;
let inventory = [];
let achievements = {
  floor10: false,
  sixDoorsInRow: 0,
  trapsDodged: 0,
  noDamageVictory: false,
};
let lastSafeDoors = []; // memory for floors (to handle memory door)
let consecutiveSafeDoors = 0;
let noDamageThisRun = true;

// DOM elements
const floorEl = document.getElementById('floor');
const livesEl = document.getElementById('lives');
const doorButtons = document.getElementById('door-buttons');
const log = document.getElementById('log');
const achievementEl = document.createElement('div');
achievementEl.style.marginTop = '10px';
achievementEl.style.color = '#0f0';
document.body.appendChild(achievementEl);

// Sound helper
function playSound(type) {
  if (!window.AudioContext) return;
  const ctx = new AudioContext();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g);
  g.connect(ctx.destination);
  if (type === 'trap') o.frequency.value = 200;
  else if (type === 'success') o.frequency.value = 600;
  else if (type === 'click') o.frequency.value = 400;
  else o.frequency.value = 300;
  o.start(0);
  g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
  o.stop(ctx.currentTime + 0.15);
}

// Utility to save/load
function saveGame() {
  const saveData = {
    floor, lives, inventory, achievements,
    lastSafeDoors, consecutiveSafeDoors, noDamageThisRun,
  };
  localStorage.setItem('mindTowerSave', JSON.stringify(saveData));
}

function loadGame() {
  const saveData = JSON.parse(localStorage.getItem('mindTowerSave'));
  if (!saveData) return false;
  floor = saveData.floor;
  lives = saveData.lives;
  inventory = saveData.inventory || [];
  achievements = saveData.achievements || achievements;
  lastSafeDoors = saveData.lastSafeDoors || [];
  consecutiveSafeDoors = saveData.consecutiveSafeDoors || 0;
  noDamageThisRun = saveData.noDamageThisRun !== undefined ? saveData.noDamageThisRun : true;
  return true;
}

function resetGame() {
  floor = 1;
  lives = 3;
  inventory = [];
  achievements = {
    floor10: false,
    sixDoorsInRow: 0,
    trapsDodged: 0,
    noDamageVictory: false,
  };
  lastSafeDoors = [];
  consecutiveSafeDoors = 0;
  noDamageThisRun = true;
  saveGame();
  updateUI();
  log.textContent = 'Game reset. Ready to climb!';
}

// Relic effects
function hasRelic(name) {
  return inventory.includes(name);
}

function useRelic(name) {
  if (!hasRelic(name)) return false;
  inventory = inventory.filter(r => r !== name);
  return true;
}

// Generate safe door (random 1-based index)
function generateSafeDoor(doorsCount) {
  return Math.floor(Math.random() * doorsCount) + 1;
}

// Achievements update
function checkAchievements() {
  if (floor >= 10 && !achievements.floor10) {
    achievements.floor10 = true;
    log.textContent += '\nAchievement unlocked: Reached Floor 10!';
  }
  if (consecutiveSafeDoors >= 6 && achievements.sixDoorsInRow < 6) {
    achievements.sixDoorsInRow = 6;
    log.textContent += '\nAchievement unlocked: 6 Doors Survived in a Row!';
  }
  if (achievements.trapsDodged >= 3) {
    log.textContent += '\nAchievement unlocked: Dodged 3 traps!';
  }
  if (floor > 10 && noDamageThisRun) {
    achievements.noDamageVictory = true;
    log.textContent += '\nAchievement unlocked: No Damage Victory!';
  }

  // Show achievements
  let achList = Object.entries(achievements).filter(([k,v]) => v);
  achievementEl.textContent = 'Achievements: ' + (achList.length ? achList.map(a => a[0]).join(', ') : 'None');
}

// Create relic drop
function generateRelic() {
  const relics = ['Phoenix Feather', 'Vision Lens', 'Time Stone'];
  return relics[Math.floor(Math.random() * relics.length)];
}

function updateUI() {
  floorEl.textContent = floor;
  livesEl.textContent = lives;
  doorButtons.innerHTML = '';
  log.textContent = '';

  let doors = Math.min(3 + Math.floor(floor / 2), 6); // 3 to 6 doors

  // Generate safe door logic
  let safeDoor;
  // Memory door logic (floor 5+)
  if (floor >= 5 && lastSafeDoors.length >= 2) {
    // Memory door must be the same as 2 floors ago safe door
    safeDoor = lastSafeDoors[lastSafeDoors.length - 2];
    log.textContent = 'Memory Door present! Recall the safe door from 2 floors ago.';
  } else {
    safeDoor = generateSafeDoor(doors);
  }

  lastSafeDoors.push(safeDoor);

  for (let i = 1; i <= doors; i++) {
    let btn = document.createElement('button');
    btn.textContent = `Door ${i}`;
    btn.onclick = () => handleChoice(i, safeDoor);
    doorButtons.appendChild(btn);
  }

  checkAchievements();
  saveGame();
}

function handleChoice(chosenDoor, safeDoor) {
  playSound('click');

  if (chosenDoor === safeDoor) {
    // Safe door chosen
    consecutiveSafeDoors++;
    log.textContent = 'Safe door! You advance to the next floor.';
    playSound('success');
    floor++;
    noDamageThisRun = noDamageThisRun && true;
  } else {
    // Trap or special event check
    consecutiveSafeDoors = 0;
    // Trap chance with Vision Lens relic reduces trap chance
    let trapChance = hasRelic('Vision Lens') ? 0.25 : 0.5;

    if (Math.random() < trapChance) {
      // Trap hits
      playSound('trap');
      // Phoenix Feather saves one fatal hit
      if (lives === 1 && hasRelic('Phoenix Feather')) {
        useRelic('Phoenix Feather');
        log.textContent = 'Trap triggered! Your Phoenix Feather saves you from death!';
      } else {
        lives--;
        noDamageThisRun = false;
        log.textContent = 'Trap triggered! You lose a life.';
      }
      achievements.trapsDodged = (achievements.trapsDodged || 0) + 1;
    } else {
      // Loop floor
      log.textContent = 'Trap avoided! You stay on the same floor.';
      achievements.trapsDodged = (achievements.trapsDodged || 0) + 1;
    }
  }

  // Bonus room chance after floor 3
  if (floor > 3 && Math.random() < 0.15) {
    // Give relic
    let relic = generateRelic();
    inventory.push(relic);
    log.textContent += ` Bonus Room! You found a relic: ${relic}`;
  }

  // Mini-boss chance every 5 floors
  if (floor % 5 === 0) {
    log.textContent += '\nMini-boss challenge! Guess a number between 1 and 3 to survive.';
    let guess = prompt('Mini-boss! Enter a number (1-3):');
    if (guess !== null) {
      guess = parseInt(guess);
      let correct = Math.floor(Math.random() * 3) + 1;
      if (guess === correct) {
        log.textContent += '\nYou defeated the mini-boss!';
        playSound('success');
      } else {
        log.textContent += '\nYou failed! Lose one life.';
        playSound('trap');
        lives--;
        noDamageThisRun = false;
      }
    }
  }

  if (lives <= 0) {
    setTimeout(() => {
      alert('Game over! You reached Floor ' + floor);
      resetGame();
    }, 100);
    return;
  }

  updateUI();
}

// Load game or start new
if (!loadGame()) {
  resetGame();
} else {
  updateUI();
}

// Add reset button
const resetBtn = document.createElement('button');
resetBtn.textContent = 'Reset Game';
resetBtn.style.marginTop = '15px';
resetBtn.onclick = () => {
  if (confirm('Are you sure you want to reset your progress?')) resetGame();
};
document.body.appendChild(resetBtn);
