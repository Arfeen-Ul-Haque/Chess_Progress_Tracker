// Global State Tracking
let currentUser = null;
let chart = null;
let currentFilter = 'Classical';

// 1. Authentication Engine
const auth = {
    toggle: () => {
        document.getElementById('login-form').classList.toggle('hidden');
        document.getElementById('signup-form').classList.toggle('hidden');
    },
    signup: () => {
        const u = document.getElementById('new-user').value.trim();
        const p = document.getElementById('new-pass').value;
        if (!u || !p) return alert("Please fill out all setup fields.");
        if (localStorage.getItem(u)) return alert("This username is already taken!");

        // Structure user state architecture
        const userData = { password: p, history: [], matches: [] };
        localStorage.setItem(u, JSON.stringify(userData));
        alert("Account unlocked successfully! You can log in now.");
        auth.toggle();
    },
    login: () => {
        const u = document.getElementById('user-input').value.trim();
        const p = document.getElementById('pass-input').value;
        const stored = JSON.parse(localStorage.getItem(u));

        if (stored && stored.password === p) {
            currentUser = u;
            document.getElementById('auth-container').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
            document.getElementById('display-name').innerText = u;
            
            // Render UI views
            stats.renderChart(currentFilter);
            matches.renderTable();
        } else {
            alert("Incorrect profile credentials. Try again.");
        }
    },
    logout: () => location.reload()
};

// 2. Performance Tracking & Graph Filters
const stats = {
    addRating: () => {
        const val = parseInt(document.getElementById('rating-val').value);
        const type = document.getElementById('rating-type').value;
        const date = new Date().toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

        if (!val || isNaN(val)) return alert("Please specify a valid rating number.");

        let data = JSON.parse(localStorage.getItem(currentUser));
        data.history.push({ date, val, type });
        localStorage.setItem(currentUser, JSON.stringify(data));
        
        currentFilter = type; // Auto-shift view to updated category
        stats.renderChart(currentFilter);
    },
    renderChart: (filterType) => {
        currentFilter = filterType;
        const userData = JSON.parse(localStorage.getItem(currentUser));
        
        // Filter history based on selected mode
        const filteredData = userData.history.filter(item => item.type === filterType);
        
        const ctx = document.getElementById('ratingChart').getContext('2d');
        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: filteredData.map(d => d.date),
                datasets: [{
                    label: `${filterType} Progress Tracker`,
                    data: filteredData.map(d => d.val),
                    borderColor: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.25
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: {
                    y: { grid: { color: '#1e293b' }, ticks: { color: '#64748b' } },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                }
            }
        });
    }
};

// 3. Official FIDE March 2024 Calculators
const calcs = {
    change: () => {
        const myR = parseFloat(document.getElementById('my-rating').value);
        const oppR = parseFloat(document.getElementById('opp-rating').value);
        const res = parseFloat(document.getElementById('match-res').value);
        
        if (isNaN(myR) || isNaN(oppR)) return alert("Input both rating variables.");

        // Official FIDE March 2024 Regulation Update: The 400-Point Rule rule limits maximum difference
        let diff = oppR - myR;
        if (diff > 400) diff = 400;
        if (diff < -400) diff = -400;

        // Mathematical Win Expectancy Formula (E)
        const E = 1 / (1 + Math.pow(10, (diff * -1) / 400));
        
        // Using average baseline development coefficient (K = 20)
        const ratingChange = 20 * (res - E);
        const newRating = myR + ratingChange;

        document.getElementById('calc-result').innerHTML = `
            <strong>Expectancy Score (E):</strong> ${E.toFixed(3)}<br>
            <strong>Rating Delta:</strong> ${ratingChange >= 0 ? '+' : ''}${ratingChange.toFixed(1)}<br>
            <strong>New Rating Estimate:</strong> ${Math.round(newRating)}
        `;
    },
    initialRating: () => {
        const avgOpp = parseFloat(document.getElementById('avg-opp-rating').value);
        const points = parseFloat(document.getElementById('total-points').value);
        const games = parseInt(document.getElementById('total-games').value);

        if (isNaN(avgOpp) || isNaN(points) || !games) return alert("Please insert complete data.");
        if (games < 5) return alert("FIDE rules dictate a minimum sample size of 5 registered games for initial calculation.");

        const scorePercentage = points / games;
        let initialRating = 0;

        // FIDE Initial Performance Table Logic 
        if (scorePercentage === 0.5) {
            initialRating = avgOpp;
        } else if (scorePercentage > 0.5) {
            initialRating = avgOpp + (scorePercentage - 0.5) * 850;
        } else {
            // Processing lower brackets using modern performance expectations
            const dp = (0.5 - scorePercentage) * 850;
            initialRating = avgOpp - dp;
        }

        document.getElementById('initial-result').innerHTML = `
            <strong>Score Ratio:</strong> ${(scorePercentage * 100).toFixed(0)}%<br>
            <strong>Estimated Initial Rating:</strong> ${Math.round(initialRating)}
        `;
    }
};

// 4. Tournament Ledger Management
const matches = {
    addMatch: () => {
        const tourn = document.getElementById('log-tournament').value.trim() || "Casual Match";
        const opp = document.getElementById('log-opponent').value.trim() || "Unknown";
        const oppR = document.getElementById('log-opp-rating').value || "N/A";
        const color = document.getElementById('log-color').value;
        const res = document.getElementById('log-result').value;

        let userData = JSON.parse(localStorage.getItem(currentUser));
        userData.matches.unshift({ tourn, opp, oppR, color, res }); // Push newest to top
        localStorage.setItem(currentUser, JSON.stringify(userData));

        matches.renderTable();
    },
    renderTable: () => {
        const userData = JSON.parse(localStorage.getItem(currentUser));
        const targetBody = document.getElementById('match-history-rows');
        targetBody.innerHTML = ""; // Wipe current template entries

        if(!userData.matches || userData.matches.length === 0) {
            targetBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;">No logged tournaments on file yet.</td></tr>`;
            return;
        }

        userData.matches.forEach(m => {
            const tr = document.createElement('tr');
            
            // Color tag the outcomes to make scanning seamless
            let resultStyle = "";
            if(m.res === "1-0" && m.color === "White") resultStyle = "color: #22c55e; font-weight:bold;";
            else if(m.res === "0-1" && m.color === "Black") resultStyle = "color: #22c55e; font-weight:bold;";
            else if(m.res === "1/2-1/2") resultStyle = "color: #64748b;";
            else resultStyle = "color: #ef4444;";

            tr.innerHTML = `
                <td><strong>${m.tourn}</strong></td>
                <td>${m.opp}</td>
                <td>${m.oppR}</td>
                <td>${m.color}</td>
                <td style="${resultStyle}">${m.res}</td>
            `;
            targetBody.appendChild(tr);
        });
    }
};