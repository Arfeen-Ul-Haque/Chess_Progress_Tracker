// Data State
let currentUser = null;
let chart = null;

// 1. Authentication Logic
const auth = {
    toggle: () => {
        document.getElementById('login-form').classList.toggle('hidden');
        document.getElementById('signup-form').classList.toggle('hidden');
    },
    signup: () => {
        const u = document.getElementById('new-user').value;
        const p = document.getElementById('new-pass').value;
        if (!u || !p) return alert("Fill all fields");
        if (localStorage.getItem(u)) return alert("Username taken!");

        const userData = { password: p, history: [] };
        localStorage.setItem(u, JSON.stringify(userData));
        alert("Account created! Please login.");
        auth.toggle();
    },
    login: () => {
        const u = document.getElementById('user-input').value;
        const p = document.getElementById('pass-input').value;
        const stored = JSON.parse(localStorage.getItem(u));

        if (stored && stored.password === p) {
            currentUser = u;
            document.getElementById('auth-container').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            document.getElementById('display-name').innerText = u;
            stats.renderChart();
        } else {
            alert("Invalid credentials");
        }
    },
    logout: () => location.reload()
};

// 2. Rating & Stats Logic
const stats = {
    addRating: () => {
        const val = document.getElementById('rating-val').value;
        const type = document.getElementById('rating-type').value;
        const date = new Date().toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

        let data = JSON.parse(localStorage.getItem(currentUser));
        data.history.push({ date, val: parseInt(val), type });
        localStorage.setItem(currentUser, JSON.stringify(data));
        
        stats.renderChart();
    },
    renderChart: () => {
        const data = JSON.parse(localStorage.getItem(currentUser)).history;
        const ctx = document.getElementById('ratingChart').getContext('2d');
        
        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    label: 'Classical Rating',
                    data: data.map(d => d.val),
                    borderColor: '#38bdf8',
                    tension: 0.3
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};

// 3. FIDE Calculator (March 2024 Rules)
const calcs = {
    change: () => {
        const myR = parseFloat(document.getElementById('my-rating').value);
        const oppR = parseFloat(document.getElementById('opp-rating').value);
        const res = parseFloat(document.getElementById('match-res').value);
        
        // 2024 Rule: 400-point rule (difference capped at 400)
        let diff = oppR - myR;
        if (diff > 400) diff = 400;
        if (diff < -400) diff = -400;

        // Win Probability (E)
        const E = 1 / (1 + Math.pow(10, (diff * -1) / 400));
        
        // Assuming K=20 for standard calculation
        const change = 20 * (res - E);
        const newRating = myR + change;

        document.getElementById('calc-result').innerHTML = `
            <strong>Change:</strong> ${change > 0 ? '+' : ''}${change.toFixed(2)}<br>
            <strong>New Rating:</strong> ${Math.round(newRating)}
        `;
    }
};