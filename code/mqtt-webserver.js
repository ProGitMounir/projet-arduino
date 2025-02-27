const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost");

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
});

client.on("message", (topic, message) => {
  if (topic === "detection") {
    console.log("Détection :", message.toString());
    // Mettre à jour l'interface web
  } else if (topic === "code_entered") {
    console.log("Code entré :", message.toString());
    // Mettre à jour l'interface web
  } else if (topic === "alarm") {
    console.log("Alarme déclenchée :", message.toString());
    // Mettre à jour l'interface web
  }
});
