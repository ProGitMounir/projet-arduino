const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const arduino = require("./arduino");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir le Thing Description
app.get("/td", (req, res) => {
  res.sendFile(__dirname + "/td.json");
});

// Servir l'interface utilisateur
app.use(express.static("public"));

// API pour contrôler la LED
app.post("/toggleLed", (req, res) => {
  const state = req.body.state; // true pour allumer, false pour éteindre
  arduino.toggleLed(state);
  res.sendStatus(200);
});

// Communication en temps réel avec Socket.IO
io.on("connection", (socket) => {
  console.log("Un client est connecté");

  // Envoyer la luminosité en temps réel
  arduino.arduinoEvents.on("brightness", (value) => {
    socket.emit("brightness", value);
  });

  // Envoyer les appuis sur le bouton
  arduino.arduinoEvents.on("buttonPress", () => {
    socket.emit("buttonPress");
  });
});

server.listen(3000, () => {
  console.log("Serveur démarré sur http://localhost:3000");
});
