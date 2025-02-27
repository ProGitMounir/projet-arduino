const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost");

// Liste des utilisateurs (à remplacer par une base de données ou un autre stockage persistant)
const users = [
  { username: "utilisateur1", code: "1212" },
  { username: "utilisateur2", code: "2121" },
  // Ajoutez d'autres utilisateurs ici
];

client.on("connect", () => {
  console.log("Webserver connecté au broker MQTT");
  client.subscribe("detection", (err) => {
    if (!err) console.log("Abonné à detection");
  });
  client.subscribe("code_entered", (err) => {
    if (!err) console.log("Abonné à code_entered");
  });
  client.subscribe("alarm", (err) => {
    if (!err) console.log("Abonné à alarm");
  });
  client.subscribe("bouton_appuyer", (err) => {
    if (!err) console.log("Abonné à bouton_appuyer");
  });
});

client.on("message", (topic, message) => {
  if (topic === "detection") {
    console.log("Détection :", message.toString());
    // Mettre à jour l'interface web (par exemple, via Socket.IO)
  } else if (topic === "code_entered") {
    console.log("Code entré :", message.toString());
    // Mettre à jour l'interface web
    if (message.toString().length === 4) {
      validateCode(message.toString());
    }
  } else if (topic === "alarm") {
    console.log("Alarme déclenchée :", message.toString());
    // Mettre à jour l'interface web
  } /*else if (topic === "bouton_appuyer") {
    console.log("Bouton appuyé :", message.toString());
    // Mettre à jour l'interface web
  }*/
});

function validateCode(enteredCode) {
  let userFound = false;
  for (const user of users) {
    if (user.code === enteredCode) {
      console.log(`Code correct pour ${user.username}`);
      client.publish("alarm", "code_correct");
      userFound = true;
      break;
    }
  }
  if (!userFound) {
    console.log("Code incorrect");
    client.publish("alarm", "code_incorrect");
  }
}

// Ajoutez ici votre code pour l'interface web (par exemple, avec Express et Socket.IO)
