const { Board, Led, Sensor, Button } = require("johnny-five");

const board = new Board();

board.on("ready", () => {
  console.log("✅ Arduino connecté !");

  // LED sur la broche 9
  const led = new Led(13);

  // Capteur de luminosité sur la broche A0
  const lightSensor = new Sensor({
    pin: "A0",
    freq: 250, // Lire les valeurs toutes les 250ms
  });

  // Bouton sur la broche A1
  const button = new Button("A1");

  // Seuil pour capteur de luminosité
  const lightThreshold = 200; // Ajuste ce seuil si nécessaire

  let codeEntered = 0; // Compteur pour appuis de bouton
  let isCodeBeingEntered = false; // Flag pour savoir si le code est en cours d'entrée
  let timer; // Timer pour limiter le temps de saisie du code
  let isLightLow = false; // Flag pour vérifier si la lumière est basse

  // Fonction pour gérer l'appui du bouton
  function onButtonPress() {
    if (isLightLow) {
      codeEntered++;
      console.log(`Appui ${codeEntered}`);
    }
  }

  // Fonction pour démarrer le processus
  function startCodeEntry() {
    if (isCodeBeingEntered) return; // Si le code est déjà en train d'être entré, on ne recommence pas

    codeEntered = 0;
    isCodeBeingEntered = true; // On commence à saisir le code
    console.log("⏳ Vous avez 10 secondes pour entrer le code.");

    // Commencer à écouter les appuis du bouton
    button.on("press", onButtonPress);

    // Démarre un compte à rebours de 10 secondes
    timer = setTimeout(() => {
      // Si le code est correct, on allume la LED
      if (codeEntered === 3) {
        console.log("✅ Code correct !");
        led.on(); // Allumer la LED
      } else {
        console.log("❌ Code incorrect !");
        led.blink(500); // Faire clignoter la LED toutes les 500ms
      }

      // Réinitialisation pour attendre une nouvelle tentative
      isLightLow = false;
      codeEntered = 0;
      isCodeBeingEntered = false;
      button.removeListener("press", onButtonPress); // Arrêter d'écouter les appuis du bouton
      led.off(); // Éteindre la LED à la fin du processus
    }, 5000); // 10 secondes
  }

  // Vérifie la luminosité
  lightSensor.on("data", function () {
    const brightness = this.value;
    if (brightness < lightThreshold) {
      // Si la lumière est faible, démarrer le processus de code
      if (!isLightLow && !isCodeBeingEntered) {
        isLightLow = true;
        startCodeEntry();
      }
    } else {
      // Si la lumière est suffisante, réinitialiser et éteindre la LED
      isLightLow = false;
      clearTimeout(timer);
      codeEntered = 0;
      isCodeBeingEntered = false;
      button.removeListener("press", onButtonPress); // Enlever l'écoute des appuis du bouton
      led.off(); // Éteindre la LED
    }
  });
});
