const { Board, Led, Sensor, Button } = require("johnny-five");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

// Configuration Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Définir les constantes
const LED_PIN = 13; // LED principale
const LED_RED_PIN = 3; // LED rouge
const LED_GREEN_PIN = 2; // LED verte
const LIGHT_SENSOR_PIN = "A0";
const BUTTON_PIN = "A1";
const LIGHT_THRESHOLD = 200;
const CODE_ENTRY_TIME = 10000; // 10 secondes
const BUZZER_PIN = 9; // Pin pour le buzzer

const board = new Board();

// Variables d'état
let led = null;
let ledRed = null; // LED rouge
let ledGreen = null; // LED verte
let lightSensor = null;
let button = null;
let buzzer = null; // Buzzer
let codeEntered = 0;
let isCodeBeingEntered = false;
let timer;
let isLightLow = false;

// Démarrer le serveur Express
app.use(express.static("public")); // Dossier pour les fichiers statiques (HTML, CSS, JS)
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

server.listen(3000, () => {
  console.log("Serveur Express démarré sur http://localhost:3000");
});

// Initialisation de l'Arduino
board.on("ready", () => {
  console.log("✅ Arduino connecté !");

  led = new Led(LED_PIN);
  ledRed = new Led(LED_RED_PIN); // Initialiser la LED rouge
  ledGreen = new Led(LED_GREEN_PIN); // Initialiser la LED verte
  lightSensor = new Sensor({ pin: LIGHT_SENSOR_PIN, freq: 250 });
  button = new Button(BUTTON_PIN);
  buzzer = new Led(BUZZER_PIN); // Utiliser Led pour contrôler le buzzer

  // Allumer la LED rouge dès le lancement
  ledRed.on();

  // Gestion des événements du bouton
  button.on("press", () => {
    if (isLightLow) {
      codeEntered++;
      console.log(`Appui ${codeEntered}`);
      io.emit("buttonPress", codeEntered); // Envoyer l'état à l'interface web
    }
  });

  // Gestion du capteur de luminosité
  lightSensor.on("data", function () {
    const brightness = this.value;
    io.emit("lightData", brightness); // Envoyer la luminosité à l'interface web

    if (brightness < LIGHT_THRESHOLD) {
      if (!isLightLow && !isCodeBeingEntered) {
        isLightLow = true;
        startCodeEntry();
      }
    }
  });

  // Gestion des connexions Socket.IO
  io.on("connection", (socket) => {
    console.log("Un client est connecté");

    // Envoyer l'état initial de la LED
    socket.emit("ledState", led.isOn);

    // Gérer les commandes de l'interface web
    socket.on("toggleLed", (state) => {
      if (state) {
        led.on();
      } else {
        led.off();
      }
      io.emit("ledState", led.isOn); // Mettre à jour tous les clients
    });
  });
});

// Fonction pour démarrer la saisie du code
function startCodeEntry() {
  if (isCodeBeingEntered) return;
  ledRed.blink(500);
  codeEntered = 0;
  isCodeBeingEntered = true;
  console.log("⏳ Vous avez 10 secondes pour entrer le code.");

  timer = setTimeout(() => {
    if (codeEntered === 3) {
      console.log("✅ Code correct !");
      led.on();
      ledGreen.on(); // Allumer la LED verte
      ledRed.stop().off();
      io.emit("codeResult", { success: true, message: "Code correct !" });
    } else {
      console.log("❌ Code incorrect !");
      led.blink(500); // Faire clignoter la LED principale
      ledRed.blink(100); // Faire clignoter rapidement la LED rouge
      //buzzer.pulse(500); // Joue le son d'alarme pour 500ms
      io.emit("codeResult", { success: false, message: "Code incorrect !" });
    }

    setTimeout(() => {
      resetState();
    }, 5000);
  }, CODE_ENTRY_TIME);
}

// Fonction pour réinitialiser l'état
function resetState() {
  isLightLow = false;
  codeEntered = 0;
  isCodeBeingEntered = false;
  led.stop().off(); // Éteindre la LED principale
  ledRed.on(); // Réallumer la LED rouge
  ledGreen.off(); // Éteindre la LED verte
  buzzer.stop().off(); // Éteindre le buzzer
  io.emit("ledState", led.isOn); // Mettre à jour l'état de la LED
}
