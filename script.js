import { riche, pauvre } from './data.js';

// --- Sélection des éléments DOM ---
const playerForm = document.getElementById('playerForm');
const wheelSection = document.getElementById('wheel-section');
const wheel = document.getElementById('wheel');
let isSpinning = false;
const spinBtn = document.getElementById('spin-btn');
const resultSection = document.getElementById('result-section');
const resultTitle = document.getElementById('result-title');
const resultCategory = document.getElementById('result-category');
const resultAction = document.getElementById('result-action');
const resultImage = document.getElementById('result-image');
const resetBtn = document.getElementById('reset-btn');
const adminLink = document.getElementById('admin-link');
const adminForm = document.getElementById('admin-form');
const adminInterface = document.getElementById('admin-interface');
const resetPlayerBtn = document.getElementById('reset-player-btn');
const playerToResetInput = document.getElementById('playerToReset');
const resetAllBtn = document.getElementById('reset-all-btn');
const resultsList = document.getElementById('resultats-list');
const resultExtraText = document.getElementById('result-extra-text');

// --- Variables globales ---
let allResults = [];
let playersPlayed = [];
let tirages = {};
let currentRound = 1;

// --- Fonction pour normaliser les noms ---
function normalizeName(name) {
    return name
        .toLowerCase() // Convertir tout en minuscules
        .replace(/[^a-z0-9]/g, '') // Supprimer tout sauf les lettres et chiffres
        .trim(); // Supprimer les espaces autour
}

// --- Initialisation des tirages pour chaque catégorie ---
Object.keys(riche).forEach((key) => {
    tirages[key] = 0;
});
Object.keys(pauvre).forEach((key) => {
    tirages[key] = 0;
});

// --- Formulaire joueur ---
playerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = document.getElementById('playerFirstName').value.trim();
    const lastName = document.getElementById('playerLastName').value.trim();

    if (!firstName || !lastName) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const playerFullName = normalizeName(`${firstName} ${lastName}`);

    // Vérification dans le localStorage
    const playedPlayers = JSON.parse(localStorage.getItem('playedPlayers')) || [];
    if (playedPlayers.includes(playerFullName)) {
        alert("Vous avez déjà joué. Vous ne pouvez pas rejouer.");
        return;
    }

    // Ajouter au localStorage
    playedPlayers.push(playerFullName);
    localStorage.setItem('playedPlayers', JSON.stringify(playedPlayers));

    playersPlayed.push(playerFullName); // Ajouter à la session actuelle
    sessionStorage.setItem('playerName', playerFullName);
    playerForm.style.display = 'none';
    wheelSection.style.display = 'block';
});

// --- Fonction pour tirer une catégorie aléatoire ---
function getAvailableCategory(group) {
    const availableCategories = Object.keys(group).filter(
        (key) => tirages[key] < currentRound // Filtrer par le round actuel
    );

    if (availableCategories.length === 0) {
        if (currentRound < 3) {
            currentRound++;
            return getAvailableCategory(group);
        } else {
            alert(`Toutes les catégories ${group === riche ? "riches" : "pauvres"} ont atteint le tirage maximum.`);
            return null;
        }
    }

    const randomIndex = Math.floor(Math.random() * availableCategories.length);
    return availableCategories[randomIndex];
}

// --- Fonction pour faire tourner la roue ---
spinBtn.addEventListener('click', () => {
    if (isSpinning) return;

    const playerName = sessionStorage.getItem('playerName');
    if (!playerName) return;

    const isRiche = Math.random() > 0.5;
    const group = isRiche ? riche : pauvre;
    const chosenCategory = getAvailableCategory(group);

    if (!chosenCategory) return;

    tirages[chosenCategory]++;
    const chosenData = group[chosenCategory];

    allResults.push({
        player: playerName,
        type: isRiche ? "riche" : "pauvre",
        category: chosenCategory,
        action: chosenData.action[0],
    });

    // --- Animation de la roue ---
    const rotationAmount = 3600 + Math.floor(Math.random() * 360);
    wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.83, 0.67)';
    wheel.style.transform = `rotate(${rotationAmount}deg)`;
    isSpinning = true;

    setTimeout(() => {
        isSpinning = false;
        wheel.style.transition = 'none';
        wheel.style.transform = `rotate(${rotationAmount % 360}deg)`;
        displayResult(isRiche, chosenCategory, chosenData);
    }, 4000);
});

// --- Fonction pour afficher le résultat ---
function displayResult(isRiche, category, data) {
    wheelSection.style.display = 'none';
    resultSection.style.display = 'block';

    const mainTitle = document.getElementById('main-title');
    if (mainTitle) {
        mainTitle.textContent = isRiche ? 'Tu es Riche' : "Tu es Pauvre";
    }

    resultTitle.textContent = 'Et...';
    resultCategory.textContent = `${category}`;
    resultAction.innerHTML = `Ta mission, si tu l'acceptes :<br>${data.action[0].replace(/\n/g, '<br>')}`;

    if (data.image) {
        resultImage.src = data.image;
        resultImage.style.display = 'block';
    } else {
        resultImage.style.display = 'none';
    }
}

// --- Bouton pour revenir à l'accueil ---
resetBtn.addEventListener('click', () => {
    const mainTitle = document.getElementById('main-title');
    if (mainTitle) {
        mainTitle.textContent = 'Bienvenue au Grand Jeu de la Vie';
    }

    resultSection.style.display = 'none';
    playerForm.style.display = 'block';
    sessionStorage.clear();
});

// --- Lien pour accéder à la section admin ---
adminLink.addEventListener('click', (e) => {
    e.preventDefault();
    adminForm.style.display = 'block';
});

// --- Formulaire de connexion admin ---
adminForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value.trim();

    if (password === 'Brandebourg49') {
        adminForm.style.display = 'none';
        adminInterface.style.display = 'block';
        displayResults();
    } else {
        alert('Mot de passe incorrect. Veuillez réessayer.');
    }
});

// --- Fonction pour afficher les résultats dans l'interface admin ---
function displayResults() {
    resultsList.innerHTML = '';
    allResults.forEach((result, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Tirage ${index + 1}: ${result.player} - ${result.type} - ${result.category}`;
        resultsList.appendChild(listItem);
    });
}

// --- Bouton pour réinitialiser un joueur spécifique ---
resetPlayerBtn.addEventListener('click', () => {
    const playerToReset = playerToResetInput.value.trim();

    if (!playerToReset) {
        alert("Veuillez entrer le nom complet du joueur.");
        return;
    }

    const normalizedPlayerToReset = normalizeName(playerToReset);

    const playedPlayers = JSON.parse(localStorage.getItem('playedPlayers')) || [];
    const playerIndex = playedPlayers.indexOf(normalizedPlayerToReset);

    if (playerIndex !== -1) {
        playedPlayers.splice(playerIndex, 1);
        localStorage.setItem('playedPlayers', JSON.stringify(playedPlayers));

        playersPlayed.splice(playersPlayed.indexOf(normalizedPlayerToReset), 1);
        alert(`${playerToReset} peut rejouer.`);
    } else {
        alert("Ce joueur n'existe pas ou n'a pas encore joué.");
    }
});

// --- Bouton pour réinitialiser tous les joueurs ---
resetAllBtn.addEventListener('click', () => {
    allResults = [];
    playersPlayed = [];
    Object.keys(tirages).forEach((key) => (tirages[key] = 0));
    currentRound = 1;
    localStorage.removeItem('playedPlayers');
    alert('Toutes les données ont été réinitialisées.');
    displayResults();
});
