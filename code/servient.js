const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://localhost");

client.on("connect", () => {
  console.log("Servient connecté au broker MQTT");
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
  } else if (topic === "code_entered") {
    console.log("Code entré :", message.toString());
  } else if (topic === "alarm") {
    console.log("Alarme déclenchée :", message.toString());
  } else if (topic === "bouton_appuyer") {
    console.log("Bouton appuyé :", message.toString());
  }
});
