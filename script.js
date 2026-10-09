// Inicializar Ícones Lucide
lucide.createIcons();

// --- 1. CANVAS BACKGROUND DE PARTÍCULAS ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 2 + 1,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5
}));

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00f3ff';
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';

    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 120) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    });
    requestAnimationFrame(animateParticles);
}
animateParticles();

// --- 2. CALCULADORA DE JUROS COMPOSTOS ---
let financeChart;

function calculateFinance() {
    const P = parseFloat(document.getElementById('initial').value) || 0;
    const PMT = parseFloat(document.getElementById('monthly').value) || 0;
    const annualRate = parseFloat(document.getElementById('rate').value) || 0;
    const years = parseInt(document.getElementById('years').value) || 0;

    const monthlyRate = (annualRate / 100) / 12;
    const totalMonths = years * 12;

    let labels = [];
    let investedData = [];
    let totalData = [];

    let currentTotal = P;
    let currentInvested = P;

    for (let m = 1; m <= totalMonths; m++) {
        currentTotal = currentTotal * (1 + monthlyRate) + PMT;
        currentInvested += PMT;

        if (m % 12 === 0 || m === totalMonths) {
            labels.push(`Ano ${m / 12}`);
            investedData.push(currentInvested.toFixed(2));
            totalData.push(currentTotal.toFixed(2));
        }
    }

    const totalInterest = currentTotal - currentInvested;

    document.getElementById('total-invested').innerText = `R$ ${currentInvested.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('total-interest').innerText = `R$ ${totalInterest.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;

    // Atualizar Gráfico Chart.js
    const ctxChart = document.getElementById('financeChart').getContext('2d');
    if (financeChart) financeChart.destroy();

    financeChart = new Chart(ctxChart, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Montante Total (R$)',
                    data: totalData,
                    borderColor: '#00f3ff',
                    backgroundColor: 'rgba(0, 243, 255, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Total Aportado (R$)',
                    data: investedData,
                    borderColor: '#9d4edd',
                    borderDash: [5, 5],
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#e2e8f0' } }
            },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}

// --- 3. MATRIZ 50/30/20 ---
let budgetChart;

function calculateBudget() {
    const total = parseFloat(document.getElementById('total-income').value) || 0;

    const v50 = total * 0.50;
    const v30 = total * 0.30;
    const v20 = total * 0.20;

    document.getElementById('val-50').innerText = `R$ ${v50.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('val-30').innerText = `R$ ${v30.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('val-20').innerText = `R$ ${v20.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;

    const ctxChart = document.getElementById('budgetChart').getContext('2d');
    if (budgetChart) budgetChart.destroy();

    budgetChart = new Chart(ctxChart, {
        type: 'doughnut',
        data: {
            labels: ['50% Necessidades', '30% Desejos', '20% Objetivos'],
            datasets: [{
                data: [v50, v30, v20],
                backgroundColor: ['#00f3ff', '#9d4edd', '#00ff87'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#e2e8f0' }, position: 'bottom' }
            }
        }
    });
}

// --- 4. MATRIZ DE DECISÃO ---
let objectives = [];

function addObjective(e) {
    e.preventDefault();

    const name = document.getElementById('obj-name').value;
    const impact = parseFloat(document.getElementById('obj-impact').value);
    const prob = parseFloat(document.getElementById('obj-prob').value);
    const cost = parseFloat(document.getElementById('obj-cost').value);

    // Score = (Impacto * Probabilidade) / Custo
    const score = ((impact * prob) / cost).toFixed(2);

    objectives.push({ name, impact, prob, cost, score });
    objectives.sort((a, b) => b.score - a.score);

    renderTable();
    document.getElementById('matrix-form').reset();
}

function deleteObjective(index) {
    objectives.splice(index, 1);
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('matrix-tbody');
    tbody.innerHTML = '';

    objectives.forEach((obj, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${obj.name}</strong></td>
            <td>${obj.impact}/10</td>
            <td>${obj.prob}/10</td>
            <td>${obj.cost}/10</td>
            <td><span class="score-badge">${obj.score}</span></td>
            <td>
                <button class="btn-del" onclick="deleteObjective(${idx})">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

// Inicialização de Cálculos ao Carregar a Página
window.onload = () => {
    calculateFinance();
    calculateBudget();
};