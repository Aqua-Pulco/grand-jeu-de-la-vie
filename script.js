
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import { riche, pauvre } from "./data.js";

// --- Configuration Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyDm6MO9b1ZVAK8k7kaacl9ABYS-9wmLoLA",
    authDomain: "grand-jeu-de-la-vie.firebaseapp.com",
    projectId: "grand-jeu-de-la-vie",
    storageBucket: "grand-jeu-de-la-vie.appspot.com",
    messagingSenderId: "210747258489",
    appId: "1:210747258489:web:c3a914e5bddf82a25346a8",
    databaseURL: "https://grand-jeu-de-la-vie-default-rtdb.europe-west1.firebasedatabase.app/"
};

// --- Initialisation Firebase ---
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- Variables DOM ---
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

// --- Variables Globales ---
let tiragesDispo = { riche: [], pauvre: [] };
let tirageCount = { riche: {}, pauvre: {} };
let tourCount = 0;
const ADMIN_HASHED_PASSWORD = "24f92d1e8d3adf7e9c22dbb4ad4d9ae4718ec97e541e7d07af01a019ac2a05b7"; // Hsh


// --- Initialisation des comptes ---
Object.keys(riche).forEach(category => (tirageCount.riche[category] = 0));
Object.keys(pauvre).forEach(category => (tirageCount.pauvre[category] = 0));

// --- Vérification du mot de passe admin ---
async function isPasswordCorrect(inputPassword) {
    const encoder = new TextEncoder();
    const data = encoder.encode(inputPassword);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedInput = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
    return hashedInput === "24f92d1e8d3adf7e9c22dbb4ad4d9ae4718ec97e541e7d07af01a019ac2a05b7";
}

// --- Normalisation des noms ---
function normalizeName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

// --- Réinitialisation des tirages disponibles ---
function resetTirages() {
    tiragesDispo.riche = Object.keys(riche).filter(category => tirageCount.riche[category] < riche[category].tirage_max);
    tiragesDispo.pauvre = Object.keys(pauvre).filter(category => tirageCount.pauvre[category] < pauvre[category].tirage_max);

    if (tiragesDispo.riche.length === 0 && tiragesDispo.pauvre.length === 0) {
        console.log("Toutes les catégories ont été tirées. Réinitialisation...");
        tourCount++;
        Object.keys(riche).forEach(category => (tirageCount.riche[category] = 0));
        Object.keys(pauvre).forEach(category => (tirageCount.pauvre[category] = 0));
        tiragesDispo.riche = Object.keys(riche);
        tiragesDispo.pauvre = Object.keys(pauvre);
    }
}

// --- Soumission du formulaire joueur ---
playerForm.addEventListener("submit", e => {
    e.preventDefault();
    const firstName = document.getElementById("playerFirstName").value.trim();
    const lastName = document.getElementById("playerLastName").value.trim();
    if (!firstName || !lastName) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    const playerFullName = normalizeName(`${firstName} ${lastName}`);
    const playerRef = ref(database, `players/${playerFullName}`);
    onValue(playerRef, snapshot => {
        if (snapshot.exists()) {
            alert("Vous ne pouvez pas rejouer. Ainsi va la vie ;)");
        } else {
            set(playerRef, { played: true, timestamp: new Date().toISOString() });
            sessionStorage.setItem("playerName", playerFullName);
            playerForm.style.display = "none";
            wheelSection.style.display = "block";
        }
    }, { onlyOnce: true });
});

// --- Fonction pour lancer la roue ---
spinBtn.addEventListener("click", () => {
    const playerName = sessionStorage.getItem("playerName");
    if (!playerName) return;

    const isRiche = Math.random() > 0.5;
    const type = isRiche ? "riche" : "pauvre";

    if (tiragesDispo[type].length === 0) {
        resetTirages();
        if (tiragesDispo[type].length === 0) {
            alert(`Toutes les catégories ${type} ont été tirées.`);
            return;
        }
    }

    const randomIndex = Math.floor(Math.random() * tiragesDispo[type].length);
    const chosenCategory = tiragesDispo[type].splice(randomIndex, 1)[0];
    const chosenData = (type === "riche" ? riche : pauvre)[chosenCategory];
    tirageCount[type][chosenCategory]++;

    const rotation = Math.floor(Math.random() * 360) + 3600;
    wheel.style.transition = "none";
    wheel.style.transform = `rotate(0deg)`;

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
        }, 4000);
    }, 100);
});

// --- Connexion admin ---
adminLink.addEventListener("click", e => {
    e.preventDefault();
    adminForm.style.display = "block";
});

adminSubmitBtn.addEventListener("click", e => {
    e.preventDefault();
    const password = adminPasswordInput.value.trim();
    if (isPasswordCorrect(password)) {
        adminForm.style.display = "none";
        adminInterface.style.display = "block";

        onValue(ref(database, "results"), snapshot => {
            resultsList.innerHTML = "";
            snapshot.forEach(childSnapshot => {
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

// --- Réinitialisation ---
resetAllBtn.addEventListener("click", () => {
    remove(ref(database, "players"));
    remove(ref(database, "results"));
    alert("Toutes les données ont été réinitialisées.");
    resetTirages();
});

resetPlayerBtn.addEventListener("click", async () => {
    const playerName = normalizeName(resetPlayerNameInput.value.trim());
    if (!playerName) {
        alert("Entrez le nom complet.");
        return;
    }

    const playerRef = ref(database, `players/${playerName}`);
    const resultsRef = ref(database, "results");

    try {
        // Vérifie si le joueur existe
        const playerSnapshot = await new Promise(resolve => onValue(playerRef, resolve, { onlyOnce: true }));

        if (!playerSnapshot.exists()) {
            alert(`Joueur "${playerName}" introuvable.`);
            return;
        }

        // Supprime les données du joueur
        await remove(playerRef);

        // Supprime les résultats liés au joueur
        const resultsSnapshot = await new Promise(resolve => onValue(resultsRef, resolve, { onlyOnce: true }));
        resultsSnapshot.forEach(childSnapshot => {
            const result = childSnapshot.val();
            if (result.player === playerName) {
                remove(ref(database, `results/${childSnapshot.key}`));
            }
        });

        alert(`Joueur "${playerName}" réinitialisé avec succès.`);
        resetPlayerNameInput.value = ""; // Réinitialise le champ de saisie
    } catch (error) {
        console.error("Erreur lors de la réinitialisation :", error);
        alert("Une erreur est survenue lors de la réinitialisation.");
    }
});

// --- Réinitialisation vers l'accueil ---
resetBtn.addEventListener("click", () => {
    resultSection.style.display = "none";
    playerForm.style.display = "block";
});

// --- Initialisation ---
resetTirages();
