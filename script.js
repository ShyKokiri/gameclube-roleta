const COLORS = ['#ff4d6d','#ffd166','#06d6a0','#4cc9f0','#9d4edd','#f77f00','#ef476f','#118ab2','#83c5be','#e76f51'];

let options = ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'];

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const optionsTextEl = document.getElementById('optionsText');
const spinBtn = document.getElementById('spinBtn');
const resultEl = document.getElementById('result');

let currentRotation = 0; // degrees, accumulated
let spinning = false;

// Transforma o texto do textarea em um array de opções.
// Aceita tanto "Item 1" puro quanto "- Item 1" (remove o "-" do começo da linha, se tiver).
function parseOptionsFromText(text) {
  return text
    .split('\n')                              // quebra por linha
    .map(line => line.replace(/^\s*[-*]\s*/, '').trim()) // tira "- " ou "* " do início, e espaços nas pontas
    .filter(line => line.length > 0);          // descarta linhas vazias
}

function syncOptionsFromTextarea() {
  const parsed = parseOptionsFromText(optionsTextEl.value);
  options = parsed.length > 0 ? parsed : options; // não deixa a roleta ficar sem nenhuma opção
  drawWheel();
}

optionsTextEl.addEventListener('input', syncOptionsFromTextarea);

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
  if (spinning) return;
  syncOptionsFromTextarea(); // garante que pega o texto mais recente antes de girar
  if (options.length < 2) {
    alert('A roleta precisa de pelo menos 2 opções.');
    return;
  }
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

  const extraSpins = 25 + secureRandomInt(15); // 25 a 39 voltas completas — mais giros pra preencher os 30s direito
  const finalRotation = currentRotation + extraSpins * 360 + ((targetAngle - (currentRotation % 360) + 360) % 360);

  canvas.style.transform = `rotate(${finalRotation}deg)`;
  currentRotation = finalRotation;

  setTimeout(() => {
    spinning = false;
    spinBtn.disabled = false;
    const winner = options[winnerIndex];
    resultEl.textContent = '🎉 ' + winner;
    resultEl.style.color = COLORS[winnerIndex % COLORS.length];
  }, 30200);
}

spinBtn.addEventListener('click', spin);

optionsTextEl.value = options.map(o => '- ' + o).join('\n');
syncOptionsFromTextarea();