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
  client.subscribe("porteStatusResponse", (err) => {
    if (!err) console.log("Abonné à status de la porte");
  });
  client.subscribe("alarmStatusResponse", (err) => {
    if (!err) console.log("Abonné à status de l'alarme");
  });
});

client.on("message", (topic, message) => {
  if (topic === "code_to_validate") {
    console.log("Code à valider reçu :", message.toString());
    // Valider le code
    validateCode(message.toString());
  } else if (topic === "porteStatusResponse") {
    let etatPorte = message.toString();
    console.log("État de la porte reçu :", etatPorte);

    if (etatPorte === "ouverte") {
      console.log("La porte est ouverte.");
      io.emit("doorStatus", "open");
    } else if (etatPorte === "fermée") {
      console.log("La porte est fermée.");
      // Effectuer une action si besoin
      io.emit("doorStatus", "closed");
    }
  } else if (topic === "alarmStatusResponse") {
    let etatAlarme = message.toString();
    console.log("🚨 État de l'alarme reçu :", etatAlarme);

    if (etatAlarme === "activée") {
      console.log("L'alarme est activée.");
      io.emit("alarmStatus", "active");
    } else if (etatAlarme === "désactivée") {
      console.log("L'alarme est désactivée.");
      io.emit("alarmStatus", "inactive");
    }
  }
});

function validateCode(enteredCode) {
  let userFound = false;
  for (const user of users) {
    if (user.code === enteredCode) {
      console.log(`Code correct pour ${user.username}`);
      mqttServient.publish("porte", "code_correct");
      userFound = true;
      io.emit("doorStatus", "open"); // Mettre à jour l'état de la porte
      break;
    }
  }
  if (!userFound) {
    console.log("Code incorrect");
    mqttServient.publish("alarm", "code_incorrect");
    io.emit("doorStatus", "closed"); // Mettre à jour l'état de la porte
  }
}

// Dans la section Socket.IO, après io = socketIo(server);
io.on("connection", (socket) => {
  console.log("Un client est connecté");

  // Écouter les commandes de porte
  socket.on("doorCommand", (command) => {
    console.log("Commande reçue :", command);

    if (command === "open") {
      // Ouvrir la porte
      mqttServient.publish("porteOpen", "open");
      io.emit("doorStatus", "open"); // Mettre à jour l'état de la porte
    } else if (command === "close") {
      // Fermer la porte
      mqttServient.publish("porteClose", "close");
      io.emit("doorStatus", "closed"); // Mettre à jour l'état de la porte
    }
  });

  // Écouter les commandes de l'alarme
  socket.on("alarmCommand", (command) => {
    console.log("Commande alarme reçue :", command);

    if (command === "activate") {
      // Activer l'alarme
      mqttServient.publish("alarmActivate", "activate");
      io.emit("alarmStatus", "active"); // Mettre à jour l'état de l'alarme
    } else if (command === "deactivate") {
      // Désactiver l'alarme
      mqttServient.publish("alarmDeactivate", "deactivate");
      io.emit("alarmStatus", "inactive"); // Mettre à jour l'état de l'alarme
    }
  });
});

// Servir les fichiers statiques
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Démarrer le serveur
server.listen(3001, () => {
  console.log("Webserver démarré sur http://localhost:3001");
});
