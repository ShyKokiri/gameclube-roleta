const COLORS = ['#ff4d6d','#ffd166','#06d6a0','#4cc9f0','#9d4edd','#f77f00','#ef476f','#118ab2','#83c5be','#e76f51'];

let options = ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'];

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const optionsListEl = document.getElementById('optionsList');
const spinBtn = document.getElementById('spinBtn');
const resultEl = document.getElementById('result');
const removeOnResultEl = document.getElementById('removeOnResult');

let currentRotation = 0; // degrees, accumulated
let spinning = false;

function renderOptionsList() {
  optionsListEl.innerHTML = '';
  options.forEach((opt, i) => {
    const row = document.createElement('div');
    row.className = 'option-row';

    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.background = COLORS[i % COLORS.length];

    const input = document.createElement('input');
    input.type = 'text';
    input.value = opt;
    input.addEventListener('input', (e) => {
      options[i] = e.target.value;
      drawWheel();
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'removeBtn';
    removeBtn.textContent = '✕';
    removeBtn.title = 'remover';
    removeBtn.addEventListener('click', () => {
      if (options.length <= 2) {
        alert('A roleta precisa de pelo menos 2 opções.');
        return;
      }
      options.splice(i, 1);
      renderOptionsList();
      drawWheel();
    });

    row.appendChild(swatch);
    row.appendChild(input);
    row.appendChild(removeBtn);
    optionsListEl.appendChild(row);
  });
}

document.getElementById('addOptionBtn').addEventListener('click', () => {
  options.push('Nova opção');
  renderOptionsList();
  drawWheel();
});

function drawWheel() {
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 6;
  const sliceAngle = (2 * Math.PI) / options.length;

  ctx.clearRect(0, 0, size, size);

  options.forEach((label, i) => {
    const startAngle = i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = '#14161c';
    ctx.lineWidth = 3;
    ctx.stroke();

    // texto
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#14161c';
    ctx.font = 'bold 22px Segoe UI, sans-serif';
    const label2 = label.length > 18 ? label.slice(0, 16) + '…' : label;
    ctx.fillText(label2 || '?', radius - 20, 8);
    ctx.restore();
  });
}

// --- Aleatoriedade forte usando a Web Crypto API ---
function secureRandom() {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / (0xFFFFFFFF + 1); // float em [0, 1)
}

function secureRandomInt(maxExclusive) {
  // rejeita valores fora do range múltiplo de max, pra evitar viés (modulo bias)
  const range = maxExclusive;
  const maxUint32 = 0xFFFFFFFF;
  const limit = maxUint32 - (maxUint32 % range);
  const buf = new Uint32Array(1);
  let val;
  do {
    crypto.getRandomValues(buf);
    val = buf[0];
  } while (val >= limit);
  return val % range;
}

function spin() {
  if (spinning || options.length < 2) return;
  spinning = true;
  spinBtn.disabled = true;
  resultEl.textContent = '';

  const sliceAngleDeg = 360 / options.length;

  // escolhe o índice vencedor de forma criptograficamente aleatória
  const winnerIndex = secureRandomInt(options.length);

  // ângulo aleatório dentro da fatia vencedora (evita cair sempre no meio)
  const offsetInSlice = secureRandom() * (sliceAngleDeg * 0.8) + (sliceAngleDeg * 0.1);

  // o ponteiro fica fixo no topo (12h). Mas as fatias são desenhadas a partir
  // do ângulo 0 do canvas, que é "leste" (3h) — por isso somamos 270° (= -90°)
  // pra converter a posição da fatia (relativa ao leste) pra relativa ao topo.
  const drawAngle = winnerIndex * sliceAngleDeg + offsetInSlice;
  const targetAngle = ((270 - drawAngle) % 360 + 360) % 360;

  const extraSpins = 6 + secureRandomInt(4); // 6 a 9 voltas completas, também aleatório
  const finalRotation = currentRotation + extraSpins * 360 + ((targetAngle - (currentRotation % 360) + 360) % 360);

  canvas.style.transform = `rotate(${finalRotation}deg)`;
  currentRotation = finalRotation;

  setTimeout(() => {
    spinning = false;
    spinBtn.disabled = false;
    const winner = options[winnerIndex];
    resultEl.textContent = '🎉 ' + winner;

    if (removeOnResultEl.checked && options.length > 2) {
      options.splice(winnerIndex, 1);
      renderOptionsList();
      drawWheel();
    }
  }, 5600);
}

spinBtn.addEventListener('click', spin);

renderOptionsList();
drawWheel();