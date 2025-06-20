let floor = 1;
let lives = 3;

const floorEl = document.getElementById('floor');
const livesEl = document.getElementById('lives');
const doorButtons = document.getElementById('door-buttons');
const log = document.getElementById('log');

function updateUI() {
  floorEl.textContent = floor;
  livesEl.textContent = lives;
  doorButtons.innerHTML = '';
  log.innerHTML = '';

  let doors = Math.min(3 + Math.floor(floor / 2), 6); // 3 to 6 doors

  for (let i = 1; i <= doors; i++) {
    let btn = document.createElement('button');
    btn.textContent = `Door ${i}`;
    btn.onclick = () => handleChoice();
    doorButtons.appendChild(btn);
  }
}

function handleChoice() {
  const roll = Math.floor(Math.random() * 6) + 1;

  if (roll <= 2) {
    lives--;
    log.textContent = 'It was a trap! You lost a life.';
  } else if (roll <= 4) {
    log.textContent = 'The path loops. You stay on the same floor.';
  } else {
    floor++;
    log.textContent = 'Success! You ascend to the next floor.';
  }

  if (lives <= 0) {
    setTimeout(() => {
      alert('Game over! You reached Floor ' + floor);
      floor = 1;
      lives = 3;
      updateUI();
    }, 100);
  } else {
    updateUI();
  }
}

updateUI();
