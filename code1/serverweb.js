const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuration MQTT
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost/webserver");
const mqttServient = mqtt.connect("mqtt://localhost/servient");

// Liste des utilisateurs (à remplacer par une base de données ou un autre stockage persistant)
const users = [
  { username: "Ilyass Barkouk", code: "1212" },
  { username: "Mounir Iya", code: "2121" },
  // Ajoutez d'autres utilisateurs ici
];

client.on("connect", () => {
  console.log("Webserver connecté au broker MQTT");
  // Abonnement aux topics
  client.subscribe("code_to_validate", (err) => {
    if (!err) console.log("Abonné à code_to_validate");
  });
});

client.on("message", (topic, message) => {
  if (topic === "code_to_validate") {
    console.log("Code à valider reçu :", message.toString());
    // Valider le code
    validateCode(message.toString());
  }
});

function validateCode(enteredCode) {
  let userFound = false;
  for (const user of users) {
    if (user.code === enteredCode) {
      console.log(`Code correct pour ${user.username}`);
      mqttServient.publish("porte", "code_correct");
      userFound = true;
      break;
    }
  }
  if (!userFound) {
    console.log("Code incorrect");
    mqttServient.publish("alarm", "code_incorrect");
  }
}

// Servir les fichiers statiques
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Démarrer le serveur
server.listen(3001, () => {
  console.log("Webserver démarré sur http://localhost:3001");
});
