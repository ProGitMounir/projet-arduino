const { Board, Led, Sensor, Button, Servo } = require("johnny-five");

// Configuration MQTT
const mqtt = require("mqtt");
const mqttServient = mqtt.connect("mqtt://localhost/mqttServient");

mqttServient.on("connect", () => {
  console.log("mqttServient connecté au broker MQTT");
  // Abonnement aux topics
  mqttServient.subscribe("Active_button", (err) => {
    if (err) console.error("Erreur d'abonnement à Active_button :", err);
    else console.log("Abonné au bouton");
  });
  mqttServient.subscribe("code_correct", (err) => {
    if (err) console.error("Erreur d'abonnement à code_correct :", err);
    else console.log("Abonné au code_correct");
  });
  mqttServient.subscribe("code_incorrect", (err) => {
    if (err) console.error("Erreur d'abonnement à code_incorrect :", err);
    else console.log("Abonné au code_incorrect");
  });
  mqttServient.subscribe("porteClose", (err) => {
    if (!err) console.log("Abonné à la fermeture de porte");
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
const SERVO_PIN = "A2";
const BUTTON_PIN_2 = "A3"; // Nouveau bouton sur A3
const LIGHT_THRESHOLD = 200;
const CODE_ENTRY_TIME = 1000; // 10 secondes
const BUZZER_PIN = 9;

const board = new Board();

// Variables d'état
let led, ledRed, ledGreen, ledYellow, lightSensor, button1, button2, buzzer;
let enteredCode = "";
let servo;
let isCodeBeingEntered = false;
let isLightLow = false;
let codeEntryTimer = null;

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

  servo = new Servo({
    pin: SERVO_PIN,
    startAt: 0, // Position initiale (porte fermée)
  });

  // Gestion des événements du bouton 1 avec debounce
  let lastPressTime1 = 0;
  const DEBOUNCE_TIME = 200; // 200 ms

  // Gestion des événements du bouton 2 avec debounce
  let lastPressTime2 = 0;

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
  // Scénario
  mqttServient.on("message", (topic, message) => {
    if (topic === "Active_button") {
      console.log("Active bouton :", message.toString());

      // Gestion des événements du bouton 1
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

      // Gestion des événements du bouton 2
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
    } else if (topic === "code_correct") {
      console.log("Scénario code correct:", message.toString());
      if (codeEntryTimer) clearTimeout(codeEntryTimer); // Annuler le timer existant
      codeEntryTimer = setTimeout(() => {
        console.log("✅ Code correct !");
        led.on();
        ledGreen.on();
        ledRed.stop().off();
        ledYellow.stop().off();
        console.log("✅ Servo activé, porte ouverte !");
        servo.to(90);
        let a = "ouverte"; // Définir l'état de la porte comme "ouverte"
        mqttServient.publish("porteStatus", a);
        io.emit("codeResult", { success: true, message: "Code correct !" });
        buzzer.on();
        setTimeout(() => {
          servo.to(0);
          a = "fermée"; // Mettre à jour l'état de la porte
          mqttServient.publish("porteStatus", a);
          resetState();
        }, 5000);
      }, CODE_ENTRY_TIME);
    } else if (topic === "code_incorrect") {
      console.log("Scénario code incorrect :", message.toString());
      if (codeEntryTimer) clearTimeout(codeEntryTimer); // Annuler le timer existant
      codeEntryTimer = setTimeout(() => {
        console.log("❌ Code incorrect !");
        triggerAlarm();
        mqttServient.publish("alarmStatus", "activée");
        io.emit("codeResult", {
          success: false,
          message: "Code incorrect !",
        });
        setTimeout(() => {
          resetState();
          mqttServient.publish("alarmStatus", "désactivée");
        }, 5000);
      }, CODE_ENTRY_TIME);
    } else if (topic === "alarm_activate") {
      console.log("🚨 Activation de l'alarme :", message.toString());

      // Publier l'état de l'alarme comme "activée"
      mqttServient.publish("alarmStatus", "activée");

      codeEntryTimer = setTimeout(() => {
        triggerAlarm();
        setTimeout(() => {
          resetState();
        }, 5000);
      }, CODE_ENTRY_TIME);
    } else if (topic === "alarm_deactivate") {
      console.log("🚨 Désactivation de l'alarme :", message.toString());

      //buzzer.stop().off();

      // Publier l'état de l'alarme comme "désactivée"
      mqttServient.publish("alarmStatus", "désactivée");
    } else if (topic === "porteOuvert") {
      console.log("Scénario code correct:", message.toString());
      if (codeEntryTimer) clearTimeout(codeEntryTimer); // Annuler le timer existant
      codeEntryTimer = setTimeout(() => {
        console.log("✅ Code correct !");
        led.on();
        ledGreen.on();
        ledRed.stop().off();
        ledYellow.stop().off();
        console.log("✅ Servo activé, porte ouverte !");
        servo.to(90);
        let a = "ouverte"; // Définir l'état de la porte comme "ouverte"
        mqttServient.publish("porteStatus", a);
        io.emit("codeResult", { success: true, message: "Code correct !" });
        buzzer.on();
        setTimeout(() => {
          servo.to(0);
          a = "fermée"; // Mettre à jour l'état de la porte
          mqttServient.publish("porteStatus", a);
          resetState();
        }, 5000);
      }, CODE_ENTRY_TIME);
    } else if (topic === "porteClose") {
      console.log("Fermeture de la porte :", message.toString());
      servo.to(0); // Fermer la porte (position 0)
      let a = "fermée"; // Mettre à jour l'état de la porte
      mqttServient.publish("porteStatus", a);
      io.emit("doorStatus", "closed"); // Mettre à jour l'état de la porte dans l'application web
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

  // Gestion de l'alarme
  function triggerAlarm() {
    led.blink(500);
    ledRed.blink(100);
    ledYellow.stop().off();
    buzzer.pulse(500);
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
