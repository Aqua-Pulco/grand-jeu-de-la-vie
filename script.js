// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDm6MO9b1ZVAK8k7kaacl9ABYS-9wmLoLA",
    authDomain: "grand-jeu-de-la-vie.firebaseapp.com",
    projectId: "grand-jeu-de-la-vie",
    storageBucket: "grand-jeu-de-la-vie.appspot.com",
    messagingSenderId: "210747258489",
    appId: "1:210747258489:web:c3a914e5bddf82a25346a8",
    databaseURL: "https://grand-jeu-de-la-vie-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase and Realtime Database
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

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
const resetBtn = document.getElementById('reset-btn');
const adminLink = document.getElementById('admin-link');
const adminInterface = document.getElementById('admin-interface');
const resetAllBtn = document.getElementById('reset-all-btn');
const resultsList = document.getElementById('resultats-list');

// --- Variables globales ---
let tirages = { ...riche, ...pauvre }; // Compteur pour chaque catégorie
let currentRound = 1;
let tiragesDispo = { riche: Object.keys(riche), pauvre: Object.keys(pauvre) }; // Catégories disponibles

// --- Fonction pour normaliser les noms ---
function normalizeName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
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

    // Vérifier si le joueur est déjà enregistré dans la base de données
    const playerRef = ref(database, `players/${playerFullName}`);
    onValue(playerRef, (snapshot) => {
        if (snapshot.exists()) {
            alert("Vous avez déjà joué. Ainsi va la Vie ;)");
        } else {
            const timestamp = new Date().toISOString();
            set(playerRef, { played: true, timestamp });
            sessionStorage.setItem('playerName', playerFullName);
            playerForm.style.display = 'none';
            wheelSection.style.display = 'block';
        }
    }, { onlyOnce: true });
});

// --- Fonction pour tirer une catégorie aléatoire unique ---
function getUniqueCategory(group, type) {
    if (tiragesDispo[type].length === 0) {
        tiragesDispo[type] = Object.keys(group);
        currentRound++;
    }

    const randomIndex = Math.floor(Math.random() * tiragesDispo[type].length);
    const chosenCategory = tiragesDispo[type][randomIndex];

    tiragesDispo[type].splice(randomIndex, 1); // Retirer la catégorie tirée pour garantir unicité

    return chosenCategory;
}

// --- Fonction pour afficher les résultats après le tirage ---
function displayResult(isRiche, category, data) {
    wheelSection.style.display = 'none';
    resultSection.style.display = 'block';

    resultTitle.textContent = isRiche ? 'Tu es Riche' : "Tu es Pauvre";
    resultCategory.textContent = category;
    resultAction.innerHTML = `Mission : ${data.action[0].replace(/\n/g, '<br>')}`; // Gérer les retours à la ligne
}

// --- Fonction pour tourner la roue ---
spinBtn.addEventListener('click', () => {
    if (isSpinning) return;

    const playerName = sessionStorage.getItem('playerName');
    if (!playerName) return;

    const isRiche = Math.random() > 0.5;
    const group = isRiche ? riche : pauvre;
    const chosenCategory = getUniqueCategory(group, isRiche ? "riche" : "pauvre");
    const chosenData = group[chosenCategory];

    const playerResult = {
        player: playerName,
        type: isRiche ? "riche" : "pauvre",
        category: chosenCategory,
        action: chosenData.action[0],
        timestamp: new Date().toISOString()
    };

    // Sauvegarder les résultats
    const resultKey = push(ref(database, `results`)).key;
    set(ref(database, `results/${resultKey}`), playerResult);

    // Animation
    const rotationAmount = 3600 + Math.floor(Math.random() * 360);
    wheel.style.transition = 'transform 4s';
    wheel.style.transform = `rotate(${rotationAmount}deg)`;
    isSpinning = true;

    setTimeout(() => {
        isSpinning = false;
        wheel.style.transform = `rotate(${rotationAmount % 360}deg)`;
        displayResult(isRiche, chosenCategory, chosenData);
    }, 4000);
});

// --- Interface admin : Afficher les résultats ---
adminLink.addEventListener('click', (e) => {
    e.preventDefault();
    adminInterface.style.display = 'block';
    onValue(ref(database, 'results'), (snapshot) => {
        resultsList.innerHTML = '';
        snapshot.forEach((childSnapshot) => {
            const result = childSnapshot.val();
            const listItem = document.createElement('li');
            listItem.textContent = `${result.player} - ${result.type} - ${result.category} (tiré le ${new Date(result.timestamp).toLocaleString()})`;
            resultsList.appendChild(listItem);
        });
    });
});

// --- Réinitialiser toutes les données ---
resetAllBtn.addEventListener('click', () => {
    remove(ref(database, 'players'));
    remove(ref(database, 'results'));
    alert('Toutes les données ont été réinitialisées.');
});

// --- Revenir à l'accueil ---
resetBtn.addEventListener('click', () => {
    resultSection.style.display = 'none';
    playerForm.style.display = 'block';
});