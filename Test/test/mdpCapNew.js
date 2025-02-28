const { Board, Led, Sensor, Button } = require("johnny-five");
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

// Configuration Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Définir les constantes
const LED_PIN = 13;
const LIGHT_SENSOR_PIN = "A0";
const BUTTON_PIN = "A1";
const LIGHT_THRESHOLD = 200;
const CODE_ENTRY_TIME = 10000; // 10 secondes

const board = new Board();

// Variables d'état
let led = null;
let lightSensor = null;
let button = null;
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
  lightSensor = new Sensor({ pin: LIGHT_SENSOR_PIN, freq: 250 });
  button = new Button(BUTTON_PIN);

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
    } else {
      if (isLightLow || isCodeBeingEntered) {
        console.log(
          "⚠️ Le capteur de luminosité n'est pas caché ou la lumière est trop forte !"
        );
      }
      resetState();
      clearTimeout(timer);
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

  codeEntered = 0;
  isCodeBeingEntered = true;
  console.log("⏳ Vous avez 10 secondes pour entrer le code.");

  timer = setTimeout(() => {
    if (codeEntered === 3) {
      console.log("✅ Code correct !");
      led.on();
      io.emit("codeResult", { success: true, message: "Code correct !" });
    } else {
      console.log("❌ Code incorrect !");
      led.blink(500);
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
  led.stop().off();
  io.emit("ledState", led.isOn); // Mettre à jour l'état de la LED
}
