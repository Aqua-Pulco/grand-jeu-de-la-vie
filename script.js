import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { riche, pauvre } from "./data.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// DOM Elements
const playerForm = document.getElementById("playerForm");
const wheelSection = document.getElementById("wheel-section");
const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spin-btn");
const resultSection = document.getElementById("result-section");
const resultTitle = document.getElementById("result-title");
const resultCategory = document.getElementById("result-category");
const resultAction = document.getElementById("result-action");
const resetBtn = document.getElementById("reset-btn");
const adminLink = document.getElementById("admin-link");
const adminForm = document.getElementById("admin-form");
const adminPasswordInput = document.getElementById("adminPassword");
const adminSubmitBtn = document.getElementById("admin-submit");
const adminInterface = document.getElementById("admin-interface");
const resetAllBtn = document.getElementById("reset-all-btn");
const resultsList = document.getElementById("resultats-list");
const resetPlayerBtn = document.getElementById("reset-player-btn");
const resetPlayerNameInput = document.getElementById("resetPlayerName");

// Globals
let tiragesDispo = { riche: [], pauvre: [] };
let tirageCount = { riche: {}, pauvre: {} };
const ADMIN_PASSWORD = "Brandebourg49";

// Initialize tirageCount with maximum values
Object.keys(riche).forEach(category => {
    tirageCount.riche[category] = 0;
});
Object.keys(pauvre).forEach(category => {
    tirageCount.pauvre[category] = 0;
});

// Reset tiragesDispo for a new cycle
function resetTirages(type) {
    tiragesDispo[type] = Object.keys(type === "riche" ? riche : pauvre).filter(category => {
        return tirageCount[type][category] < (type === "riche" ? riche : pauvre)[category].tirage_max;
    });
}

// Verify Password
function isPasswordCorrect(inputPassword) {
    return inputPassword === ADMIN_PASSWORD;
}

// Normalize Names
function normalizeName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

// Player Form Submission
playerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const firstName = document.getElementById("playerFirstName").value.trim();
    const lastName = document.getElementById("playerLastName").value.trim();
    if (!firstName || !lastName) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const playerFullName = normalizeName(`${firstName} ${lastName}`);
    const playerRef = ref(database, `players/${playerFullName}`);
    onValue(playerRef, (snapshot) => {
        if (snapshot.exists()) {
            alert("Vous avez déjà joué. Ainsi va la Vie ;)");
        } else {
            const timestamp = new Date().toISOString();
            set(playerRef, { played: true, timestamp });
            sessionStorage.setItem("playerName", playerFullName);
            playerForm.style.display = "none";
            wheelSection.style.display = "block";
        }
    }, { onlyOnce: true });
});

// Spin Wheel
spinBtn.addEventListener("click", () => {
    const playerName = sessionStorage.getItem("playerName");
    if (!playerName) return;

    const isRiche = Math.random() > 0.5;
    const type = isRiche ? "riche" : "pauvre";

    if (tiragesDispo[type].length === 0) {
        resetTirages(type);
        if (tiragesDispo[type].length === 0) {
            alert(`Toutes les catégories ${type} ont été tirées au maximum.`);
            return;
        }
    }

    const randomIndex = Math.floor(Math.random() * tiragesDispo[type].length);
    const chosenCategory = tiragesDispo[type].splice(randomIndex, 1)[0];
    const chosenData = (type === "riche" ? riche : pauvre)[chosenCategory];

    tirageCount[type][chosenCategory]++;

    const rotation = Math.floor(Math.random() * 360) + 3600;

    // Reset the wheel before starting the new spin
    wheel.style.transition = "none";
    wheel.style.transform = `rotate(0deg)`;

    // Add a slight delay before applying the new rotation
    setTimeout(() => {
        wheel.style.transition = "transform 4s ease-out";
        wheel.style.transform = `rotate(${rotation}deg)`;

        setTimeout(() => {
            const resultKey = push(ref(database, "results")).key;
            set(ref(database, `results/${resultKey}`), {
                player: playerName,
                type,
                category: chosenCategory,
                action: chosenData.action[0],
                timestamp: new Date().toISOString(),
            });

            wheelSection.style.display = "none";
            resultSection.style.display = "block";
            resultTitle.textContent = isRiche ? "Tu es Riche" : "Tu es Pauvre";
            resultCategory.textContent = chosenCategory;
            resultAction.innerHTML = `Mission :<br>${chosenData.action[0].replace(/\n/g, "<br>")}`;
        }, 4000); // Wait for the rotation to finish
    }, 100); // Small delay to reset the rotation
});

// Admin Access
adminLink.addEventListener("click", (e) => {
    e.preventDefault();
    adminForm.style.display = "block";
});

adminSubmitBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const password = adminPasswordInput.value.trim();
    if (isPasswordCorrect(password)) {
        adminForm.style.display = "none";
        adminInterface.style.display = "block";

        onValue(ref(database, "results"), (snapshot) => {
            resultsList.innerHTML = "";
            snapshot.forEach((childSnapshot) => {
                const result = childSnapshot.val();
                const li = document.createElement("li");
                li.textContent = `${result.player} - ${result.type} - ${result.category} (${new Date(result.timestamp).toLocaleString()})`;
                resultsList.appendChild(li);
            });
        });
    } else {
        alert("Mot de passe incorrect.");
    }
});

// Reset All Results
resetAllBtn.addEventListener("click", () => {
    remove(ref(database, "players"));
    remove(ref(database, "results"));
    alert("Toutes les données ont été réinitialisées.");
    resetTirages("riche");
    resetTirages("pauvre");
});

// Reset a specific player
resetPlayerBtn.addEventListener("click", () => {
    const playerName = normalizeName(resetPlayerNameInput.value.trim());
    if (!playerName) {
        alert("Veuillez entrer le nom complet du joueur.");
        return;
    }

    const playerRef = ref(database, `players/${playerName}`);
    const resultsRef = ref(database, "results");

    onValue(playerRef, (snapshot) => {
        if (snapshot.exists()) {
            remove(playerRef).then(() => {
                onValue(resultsRef, (resultsSnapshot) => {
                    resultsSnapshot.forEach((childSnapshot) => {
                        const result = childSnapshot.val();
                        if (result.player === playerName) {
                            remove(ref(database, `results/${childSnapshot.key}`));
                        }
                    });
                    alert(`Le joueur "${playerName}" a été réinitialisé.`);
                    resetPlayerNameInput.value = "";
                }, { onlyOnce: true });
            });
        } else {
            alert(`Le joueur "${playerName}" n'existe pas.`);
        }
    }, { onlyOnce: true });
});

// Reset to Main
resetBtn.addEventListener("click", () => {
    resultSection.style.display = "none";
    playerForm.style.display = "block";
});

// Initialize tirages on load
resetTirages("riche");
resetTirages("pauvre");
