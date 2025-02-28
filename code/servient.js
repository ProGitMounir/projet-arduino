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

  servient.subscribe("porteStatus", (err) => {
    if (!err) console.log("Abonné au status porte");
  });
  servient.subscribe("porteOpen", (err) => {
    if (!err) console.log("Abonné à l'ouverture de porte");
  });
  servient.subscribe("porteClose", (err) => {
    if (!err) console.log("Abonné à la fermeture de porte");
  });
  servient.subscribe("alarmStatus", (err) => {
    if (!err) console.log("Abonné au status alarme");
  });
  servient.subscribe("alarmActivate", (err) => {
    if (!err) console.log("Abonné à l'activation d'alarme");
  });
  servient.subscribe("alarmDeactivate", (err) => {
    if (!err) console.log("Abonné à la desactivation d'alarme");
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
  } else if (topic === "porteStatus") {
    let etatPorte = message.toString();
    console.log("État de la porte reçu :", etatPorte);

    if (etatPorte === "ouverte") {
      console.log("La porte est ouverte.");
      // Effectuer une action si besoin
    } else if (etatPorte === "fermée") {
      console.log("La porte est fermée.");
      // Effectuer une action si besoin
    }

    mqttClient.publish("porteStatusResponse", etatPorte);
  } else if (topic === "porteOpen") {
    console.log("Ouverture de la porte cote client :", message.toString());
    servient.publish("code_correct", "Ouvrir la porte client");
  } else if (topic === "porteClose") {
    console.log("Fermeture de la porte cote client:", message.toString());
    servient.publish("porteClose", "Fermer la porte");
  } else if (topic === "alarmStatus") {
    let etatAlarme = message.toString();
    console.log("🚨 État de l'alarme reçu :", etatAlarme);

    if (etatAlarme === "activée") {
      console.log("L'alarme est activée.");
      // Effectuer une action si besoin (ex: allumer un voyant d'alarme)
    } else if (etatAlarme === "désactivée") {
      console.log("L'alarme est désactivée.");
      // Effectuer une action si besoin (ex: éteindre un voyant d'alarme)
    }

    // Publier la réponse avec l'état actuel de l'alarme
    mqttClient.publish("alarmStatusResponse", etatAlarme);
  } else if (topic === "alarmActivate") {
    console.log("Activation d'alarme cote client :", message.toString());
    servient.publish("alarm_activate", "Active alarme");
  } else if (topic === "alarmDeactivate") {
    console.log("Deactivation d'alarme cote client:", message.toString());
    servient.publish("alarm_deactivate", "Deactive alarme");
  }
});
