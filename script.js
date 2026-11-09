// Mock Database for auto-fetching
const aadhaarDatabase = {
    "123456789012": { name: "Rahul Kumar", age: 25, mobile: "+91 9876543210", address: "123 MG Road, Mumbai, MH" },
    "987654321098": { name: "Priya Sharma", age: 17, mobile: "+91 8765432109", address: "45 Park Street, Kolkata, WB" }, 
    "111122223333": { name: "Amit Patel", age: 42, mobile: "+91 7654321098", address: "88 Ring Road, Delhi" },
};

let fetchedName = "";
let fetchedAge = 0;
let fetchedAadhaar = "";
let fetchedMobile = "";
let fetchedAddress = "";

// Initialize Database in LocalStorage
const defaultParties = [
    { id: 'p1', name: 'Eagle Party', symbol: '🦅', votes: 0 },
    { id: 'p2', name: 'Tiger Party', symbol: '🐅', votes: 0 },
    { id: 'p3', name: 'Lotus Party', symbol: '🪷', votes: 0 }
];

if (!localStorage.getItem('voters')) localStorage.setItem('voters', JSON.stringify([]));
if (!localStorage.getItem('parties')) localStorage.setItem('parties', JSON.stringify(defaultParties));
if (!localStorage.getItem('duplicateAttempts')) localStorage.setItem('duplicateAttempts', '0');

let currentVoter = null;

// Navigation
function navigate(pageId) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    document.querySelectorAll('form').forEach(f => f.reset());
    document.querySelectorAll('.error, #signup-msg').forEach(el => el.textContent = '');

    if (pageId === 'voter-signup-page') resetSignup();
    if (pageId === 'admin-dashboard') renderAdminDashboard();
    if (pageId === 'voting-page') renderBallot();
}

function logout() {
    currentVoter = null;
    navigate('landing-page');
}

// Fetch Logic with Duplication Check
function fetchAadhaarDetails(e) {
    e.preventDefault();
    const aadhaarNumber = document.getElementById('reg-aadhaar').value.trim();
    const errorEl = document.getElementById('aadhaar-error');
    
    const voters = JSON.parse(localStorage.getItem('voters'));
    const isAlreadyRegistered = voters.some(v => v.aadhaar === aadhaarNumber);

    if (isAlreadyRegistered) {
        errorEl.textContent = 'Identity already registered in the system.';
        return;
    }
    
    if (aadhaarDatabase[aadhaarNumber]) {
        errorEl.textContent = '';
        fetchedName = aadhaarDatabase[aadhaarNumber].name;
        fetchedAge = aadhaarDatabase[aadhaarNumber].age;
        fetchedMobile = aadhaarDatabase[aadhaarNumber].mobile;
        fetchedAddress = aadhaarDatabase[aadhaarNumber].address;
        fetchedAadhaar = aadhaarNumber; 

        document.getElementById('confirm-name').textContent = fetchedName;
        document.getElementById('confirm-age').textContent = fetchedAge;
        document.getElementById('confirm-mobile').textContent = fetchedMobile;
        document.getElementById('confirm-address').textContent = fetchedAddress;
        
        document.getElementById('aadhaar-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'flex';
    } else {
        errorEl.textContent = 'Identity record not found.';
    }
}

// Registration
function handleSignup(e) {
    e.preventDefault();
    const msgElement = document.getElementById('signup-msg');

    if (fetchedAge < 18) {
        msgElement.className = 'error';
        msgElement.textContent = 'Must be 18+ to participate in elections.';
        return;
    }

    const voters = JSON.parse(localStorage.getItem('voters'));
    const voterId = generateVoterId();
    
    voters.push({
        name: fetchedName,
        age: fetchedAge,
        voterId: voterId,
        hasVoted: false,
        votedFor: '-',
        aadhaar: fetchedAadhaar 
    });

    localStorage.setItem('voters', JSON.stringify(voters));
    
    msgElement.className = 'success-msg';
    msgElement.innerHTML = `Success! Your Voter ID is: <br><b style="font-size: 24px; color: #fff;">${voterId}</b><br>Please save this code to login.`;
    
    const successBtn = document.querySelector('#signup-form .btn.success');
    if (successBtn) successBtn.style.display = 'none';
}

function resetSignup() {
    document.getElementById('aadhaar-form').reset();
    document.getElementById('aadhaar-form').style.display = 'flex';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('signup-msg').textContent = '';
    document.getElementById('aadhaar-error').textContent = '';
    const successBtn = document.querySelector('#signup-form .btn.success');
    if (successBtn) successBtn.style.display = 'block';
}

function generateVoterId() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let id = '';
    for(let i=0; i<3; i++) id += letters.charAt(Math.floor(Math.random() * letters.length));
    for(let i=0; i<3; i++) id += numbers.charAt(Math.floor(Math.random() * numbers.length));
    return id;
}

// Sign In
function handleSignin(e) {
    e.preventDefault();
    const voterId = document.getElementById('login-voter-id').value.trim().toUpperCase();
    const voters = JSON.parse(localStorage.getItem('voters'));
    const errorEl = document.getElementById('signin-error');
    const voter = voters.find(v => v.voterId === voterId);

    if (!voter) {
        errorEl.textContent = 'Invalid ID. Access Denied.';
        return;
    }

    if (voter.hasVoted) {
        let duplicates = parseInt(localStorage.getItem('duplicateAttempts'));
        localStorage.setItem('duplicateAttempts', (duplicates + 1).toString());
        errorEl.textContent = 'Vote already recorded. Multiple attempts flagged.';
        return;
    }

    currentVoter = voter;
    document.getElementById('current-voter-name').textContent = voter.name;
    navigate('voting-page');
}

// Ballot
function renderBallot() {
    const parties = JSON.parse(localStorage.getItem('parties'));
    const ballot = document.getElementById('ballot');
    ballot.innerHTML = '';

    parties.forEach(party => {
        const label = document.createElement('label');
        label.className = 'party-option';
        label.innerHTML = `
            <input type="radio" name="partySelection" value="${party.name}" required>
            <span class="party-symbol">${party.symbol}</span>
            <span class="party-name">${party.name}</span>
        `;
        ballot.appendChild(label);
    });
}

function handleVote(e) {
    e.preventDefault();
    const selectedParty = document.querySelector('input[name="partySelection"]:checked').value;
    
    let voters = JSON.parse(localStorage.getItem('voters'));
    let voterIndex = voters.findIndex(v => v.voterId === currentVoter.voterId);
    voters[voterIndex].hasVoted = true;
    voters[voterIndex].votedFor = selectedParty;
    localStorage.setItem('voters', JSON.stringify(voters));

    let parties = JSON.parse(localStorage.getItem('parties'));
    let partyIndex = parties.findIndex(p => p.name === selectedParty);
    parties[partyIndex].votes += 1;
    localStorage.setItem('parties', JSON.stringify(parties));

    navigate('thank-you-page');
}

// Admin
function handleAdminLogin(e) {
    e.preventDefault();
    const user = document.getElementById('admin-username').value;
    const pass = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('admin-error');

    if (user === 'admin' && pass === 'admin123') {
        navigate('admin-dashboard');
    } else {
        errorEl.textContent = 'Authentication Failed.';
    }
}

function renderAdminDashboard() {
    const voters = JSON.parse(localStorage.getItem('voters'));
    const parties = JSON.parse(localStorage.getItem('parties'));
    const duplicates = localStorage.getItem('duplicateAttempts');

    const totalVotesCast = voters.filter(v => v.hasVoted).length;
    document.getElementById('total-votes').textContent = totalVotesCast;
    document.getElementById('duplicate-votes').textContent = duplicates;

    const partyStatsContainer = document.getElementById('party-stats');
    partyStatsContainer.innerHTML = '';
    parties.forEach(party => {
        const div = document.createElement('div');
        div.className = 'party-stat';
        div.innerHTML = `<strong>${party.symbol} ${party.name}</strong><span>${party.votes}</span>`;
        partyStatsContainer.appendChild(div);
    });

    const tbody = document.getElementById('voter-table-body');
    tbody.innerHTML = '';
    voters.forEach(voter => {
        const tr = document.createElement('tr');
        const statusClass = voter.hasVoted ? 'status-voted' : 'status-pending';
        const statusText = voter.hasVoted ? 'Voted' : 'Pending';
        
        tr.innerHTML = `
            <td><strong>${voter.name}</strong></td>
            <td>${voter.voterId}</td>
            <td>${voter.age}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${voter.votedFor}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterVoters() {
    const input = document.getElementById('search-voter').value.toUpperCase();
    const table = document.getElementById('voter-table');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) { 
        const tdName = tr[i].getElementsByTagName('td')[0];
        const tdId = tr[i].getElementsByTagName('td')[1];
        
        if (tdName || tdId) {
            const nameValue = tdName.textContent || tdName.innerText;
            const idValue = tdId.textContent || tdId.innerText;
            
            if (nameValue.toUpperCase().indexOf(input) > -1 || idValue.toUpperCase().indexOf(input) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }       
    }
}