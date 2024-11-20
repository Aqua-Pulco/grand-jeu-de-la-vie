import { riche, pauvre } from './data.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// --- Configuration Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyDm6MO9b1ZVAK8k7kaacl9ABYS-9wmLoLA",
    authDomain: "grand-jeu-de-la-vie.firebaseapp.com",
    databaseURL: "https://grand-jeu-de-la-vie-default-rtdb.firebaseio.com",
    projectId: "grand-jeu-de-la-vie",
    storageBucket: "grand-jeu-de-la-vie.firebasestorage.app",
    messagingSenderId: "210747258489",
    appId: "1:210747258489:web:c3a914e5bddf82a25346a8"
};

// --- Initialiser Firebase ---
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

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
let tirages = {};
let currentRound = 1;

// --- Fonction pour normaliser les noms ---
function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

// --- Initialisation des tirages pour chaque catégorie ---
Object.keys(riche).forEach((key) => {
    tirages[key] = 0;
});
Object.keys(pauvre).forEach((key) => {
    tirages[key] = 0;
});

// --- Ajouter un joueur dans la base Firebase ---
function addPlayerToFirebase(playerFullName) {
    const playersRef = ref(database, 'players');
    const playerData = {
        name: playerFullName,
        timestamp: new Date().toISOString(),
    };
    push(playersRef, playerData);
}

// --- Ajouter un résultat dans la base Firebase ---
function addResultToFirebase(result) {
    const resultsRef = ref(database, 'results');
    push(resultsRef, result);
}

// --- Mettre à jour les résultats dans l'interface admin ---
function updateAdminResults() {
    const resultsRef = ref(database, 'results');
    onValue(resultsRef, (snapshot) => {
        resultsList.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const result = childSnapshot.val();
            const listItem = document.createElement('li');
            listItem.textContent = `Joueur: ${result.player} - ${result.type} - ${result.category}`;
            resultsList.appendChild(listItem);
        });
    });
}

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

    // Vérification dans Firebase
    const playersRef = ref(database, 'players');
    onValue(playersRef, (snapshot) => {
        const players = snapshot.val() || {};
        const alreadyPlayed = Object.values(players).some((player) => player.name === playerFullName);

        if (alreadyPlayed) {
            alert("Vous avez déjà joué, vous ne pouvez pas rejouer, ainsi va la Vie ;)");
        } else {
            addPlayerToFirebase(playerFullName);
            sessionStorage.setItem('playerName', playerFullName);
            playerForm.style.display = 'none';
            wheelSection.style.display = 'block';
        }
    }, { onlyOnce: true });
});

// --- Fonction pour tirer une catégorie aléatoire ---
function getAvailableCategory(group) {
    const availableCategories = Object.keys(group).filter(
        (key) => tirages[key] < currentRound
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

    const result = {
        player: playerName,
        type: isRiche ? "riche" : "pauvre",
        category: chosenCategory,
        action: chosenData.action[0],
    };

    addResultToFirebase(result);

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

// --- Initialisation de l'interface admin ---
updateAdminResults();
