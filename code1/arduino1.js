const { Board, Led, Sensor, Button } = require("johnny-five");

// Configuration MQTT
const mqtt = require("mqtt");
const mqttServient = mqtt.connect("mqtt://localhost/mqttServient");

mqttServient.on("connect", () => {
  console.log("mqttServient connecté au broker MQTT");
  // Abonnement aux topics
  mqttServient.subscribe("Active_button", (err) => {
    if (!err) console.log("Abonné au bouton");
  });
  mqttServient.subscribe("code_correct", (err) => {
    if (!err) console.log("Abonné au code_correct");
  });
  mqttServient.subscribe("code_incorrect", (err) => {
    if (!err) console.log("Abonné au code_incorrect");
  });
});

// Configuration Express et Socket.IO
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Définir les constantes
const LED_PIN = 13;
const LED_RED_PIN = 3;
const LED_GREEN_PIN = 2;
const LED_YELLOW_PIN = 4;
const LIGHT_SENSOR_PIN = "A0";
const BUTTON_PIN_1 = "A1";
const BUTTON_PIN_2 = "A3"; // Nouveau bouton sur A3
const LIGHT_THRESHOLD = 200;
const CODE_ENTRY_TIME = 10000; // 10 secondes
const BUZZER_PIN = 9;
const CORRECT_CODE = "1212"; // Code à valider

const board = new Board();

// Variables d'état
let led, ledRed, ledGreen, ledYellow, lightSensor, button1, button2, buzzer;
let enteredCode = "";
let isCodeBeingEntered = false;
let isLightLow = false;

// Démarrer le serveur Express
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
  button1 = new Button(BUTTON_PIN_1);
  button2 = new Button(BUTTON_PIN_2); // Initialisation du nouveau bouton
  buzzer = new Led(BUZZER_PIN);

  // Allumer la LED rouge dès le lancement
  ledRed.on();

  // Gestion des événements du bouton 1 avec debounce
  let lastPressTime1 = 0;
  const DEBOUNCE_TIME = 200; // 200 ms

  // Scénario
  mqttServient.on("message", (topic, message) => {
    if (topic === "Active_button") {
      /* *** Activation des boutons *** */
      console.log("Active bouton :", message.toString());
      button1.on("press", () => {
        const now = Date.now();
        if (now - lastPressTime1 > DEBOUNCE_TIME && isCodeBeingEntered) {
          lastPressTime1 = now;
          enteredCode += "1";
          console.log(`Appui 1, code actuel: ${enteredCode}`);
          io.emit("buttonPress", enteredCode);
          mqttServient.publish("code_entered", enteredCode);
          mqttServient.publish("bouton_appuyer", "bouton 1 appuyé");
        }
      });

      // Gestion des événements du bouton 2 avec debounce
      let lastPressTime2 = 0;

      button2.on("press", () => {
        const now = Date.now();
        if (now - lastPressTime2 > DEBOUNCE_TIME && isCodeBeingEntered) {
          lastPressTime2 = now;
          enteredCode += "2";
          console.log(`Appui 2, code actuel: ${enteredCode}`);
          io.emit("buttonPress", enteredCode);
          mqttServient.publish("code_entered", enteredCode);
          mqttServient.publish("bouton_appuyer", "bouton 2 appuyé");
        }
      });

      // Gestion du capteur de luminosité
      lightSensor.on("data", function () {
        const brightness = this.value;
        io.emit("lightData", brightness);

        if (brightness < LIGHT_THRESHOLD) {
          if (!isLightLow && !isCodeBeingEntered) {
            isLightLow = true;
            mqttServient.publish("detection", "capteur_caché");
            startCodeEntry();
          }
        } else {
          if (isLightLow) {
            isLightLow = false;
          }
        }
      });

      // Fonction pour démarrer la saisie du code
      function startCodeEntry() {
        if (isCodeBeingEntered) return;
        ledYellow.blink(500);
        ledRed.stop().off();

        isCodeBeingEntered = true;
        enteredCode = "";
        console.log("⏳ Vous avez 10 secondes pour entrer le code.");
      }
      /* *** ********************** *** */

      // Traitement de l'activation du bouton
      if (topic === "code_correct") {
        console.log("Scénario code correct:", message.toString());
        const timer = setTimeout(() => {
          console.log("✅ Code correct !");
          led.on();
          ledGreen.on();
          ledRed.stop().off();
          ledYellow.stop().off();
          io.emit("codeResult", { success: true, message: "Code correct !" });
          buzzer.on();
          setTimeout(() => {
            resetState();
          }, 5000);
        }, CODE_ENTRY_TIME);
      }
      if (topic === "code_incorrect") {
        //console.log("Scénario code incorrect :", message.toString());
        const timer = setTimeout(() => {
          console.log("❌ Code incorrect !");
          triggerAlarm();
          io.emit("codeResult", {
            success: false,
            message: "Code incorrect !",
          });
          setTimeout(() => {
            resetState();
          }, 5000);
        }, CODE_ENTRY_TIME);
      }
    }
  });

  // Gestion de l'alarme
  function triggerAlarm() {
    led.blink(500);
    ledRed.blink(100);
  }

  // Fonction pour réinitialiser l'état
  function resetState() {
    isLightLow = false;
    enteredCode = "";
    isCodeBeingEntered = false;
    led.stop().off();
    ledRed.on();
    ledGreen.off();
    ledYellow.stop().off();
    ledRed.stop();
    buzzer.stop().off();
    io.emit("ledState", led.isOn);
  }
});
