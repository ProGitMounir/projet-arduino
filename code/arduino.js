const { Board, Led, Sensor, Button } = require("johnny-five");
const mqtt = require("mqtt");

// Configuration MQTT
const mqttClient = mqtt.connect("mqtt://localhost");

// Configuration Express et Socket.IO (comme dans ton code actuel)
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Définir les constantes (comme dans ton code actuel)
const LED_PIN = 13;
const LED_RED_PIN = 3;
const LED_GREEN_PIN = 2;
const LED_YELLOW_PIN = 4;
const LIGHT_SENSOR_PIN = "A0";
const BUTTON_PIN = "A1";
const LIGHT_THRESHOLD = 200;
const CODE_ENTRY_TIME = 10000;
const BUZZER_PIN = 9;

const board = new Board();

// Variables d'état (comme dans ton code actuel)
let led, ledRed, ledGreen, ledYellow, lightSensor, button, buzzer;
let codeEntered = 0;
let isCodeBeingEntered = false;
let isLightLow = false;

// Démarrer le serveur Express (comme dans ton code actuel)
app.use(express.static("public"));
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
  ledRed = new Led(LED_RED_PIN);
  ledGreen = new Led(LED_GREEN_PIN);
  ledYellow = new Led(LED_YELLOW_PIN);
  lightSensor = new Sensor({ pin: LIGHT_SENSOR_PIN, freq: 250 });
  button = new Button(BUTTON_PIN);
  buzzer = new Led(BUZZER_PIN);

  // Allumer la LED rouge dès le lancement
  ledRed.on();

  // Gestion des événements du bouton
  button.on("press", () => {
    if (isLightLow) {
      codeEntered++;
      console.log(`Appui ${codeEntered}`);
      io.emit("buttonPress", codeEntered);
      mqttClient.publish("code_entered", codeEntered.toString()); // Publier sur MQTT
    }
  });

  // Gestion du capteur de luminosité
  lightSensor.on("data", function () {
    const brightness = this.value;
    io.emit("lightData", brightness);

    if (brightness < LIGHT_THRESHOLD) {
      if (!isLightLow && !isCodeBeingEntered) {
        isLightLow = true;
        mqttClient.publish("detection", "capteur_caché"); // Publier sur MQTT
        startCodeEntry();
      }
    } else {
      if (isLightLow) {
        isLightLow = false;
        mqttClient.publish("detection", "capteur_exposé"); // Publier sur MQTT
      }
    }
  });

  // Gestion de l'alarme
  function triggerAlarm() {
    mqttClient.publish("alarm", "code_incorrect"); // Publier sur MQTT
    led.blink(500); // Faire clignoter la LED principale
    ledRed.blink(100); // Faire clignoter rapidement la LED rouge
    buzzer.pulse(500); // Joue le son d'alarme pour 500ms
  }

  // Fonction pour démarrer la saisie du code
  function startCodeEntry() {
    if (isCodeBeingEntered) return;
    ledYellow.blink(500);
    ledRed.stop().off();

    codeEntered = 0;
    isCodeBeingEntered = true;
    console.log("⏳ Vous avez 10 secondes pour entrer le code.");

    const timer = setTimeout(() => {
      if (codeEntered === 3) {
        console.log("✅ Code correct !");
        led.on();
        ledGreen.on(); // Allumer la LED verte
        ledRed.stop().off();
        ledYellow.stop().off();
        io.emit("codeResult", { success: true, message: "Code correct !" });
      } else {
        console.log("❌ Code incorrect !");
        triggerAlarm(); // Déclencher l'alarme
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
    ledYellow.stop().off();
    buzzer.stop().off(); // Éteindre le buzzer
    io.emit("ledState", led.isOn); // Mettre à jour l'état de la LED
  }
});
