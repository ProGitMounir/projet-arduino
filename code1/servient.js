// Configuration MQTT
const mqtt = require("mqtt");
const servient = mqtt.connect("mqtt://localhost/servient");
const mqttClient = mqtt.connect("mqtt://localhost/webserver");

servient.on("connect", () => {
  console.log("Servient connecté au broker MQTT");

  // Abonnement aux topics
  servient.subscribe("detection", (err) => {
    if (!err) console.log("Abonné à detection");
  });
  servient.subscribe("code_entered", (err) => {
    if (!err) console.log("Abonné à code_entered");
  });
  servient.subscribe("porte", (err) => {
    if (!err) console.log("Abonné à l'ouverture de porte");
  });

  servient.subscribe("alarm", (err) => {
    if (!err) console.log("Abonné à l'alarme");
  });
});

servient.on("message", (topic, message) => {
  if (topic === "detection") {
    console.log("Détection :", message.toString());
    servient.publish("Active_button", "Activation du bouton");
  } else if (topic === "code_entered") {
    console.log("Code entré reçu :", message.toString());
    // Vérifier si le code a une longueur de 4 caractères
    if (message.toString().length === 4) {
      console.log(
        "Code valide (4 caractères), envoi au Webserver pour validation"
      );
      mqttClient.publish("code_to_validate", message.toString());
    } /* else {
      console.log("Code invalide (longueur != 4), ignoré");
    }*/
  } else if (topic === "porte") {
    console.log("Ouverture de la porte :", message.toString());
    servient.publish("code_correct", "Ouvrir la porte");
  } else if (topic === "alarm") {
    console.log("Code incorrect, la porte reste fermée");
    servient.publish("code_incorrect", "Activation de l'alarme");
  }
});
