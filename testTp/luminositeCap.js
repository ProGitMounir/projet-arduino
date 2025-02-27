const { Board, Led, Sensor } = require("johnny-five");

const board = new Board();

board.on("ready", () => {
  console.log("✅ Arduino connecté !");

  // LED sur la broche 9 (PWM pour variation de luminosité)
  const led = new Led(13);

  // Capteur de luminosité branché sur A0
  const lightSensor = new Sensor({
    pin: "A0",
    freq: 250, // Lire les valeurs toutes les 250ms
  });

  // Seuil de luminosité pour allumer la LED (valeur entre 0 et 1023)
  const threshold = 200; // Ajuste ce seuil en fonction de la luminosité ambiante

  lightSensor.on("data", function () {
    const brightness = this.value; // La valeur du capteur varie entre 0 (obscurité) et ~1023 (lumière forte)

    if (brightness < threshold) {
      // Si la luminosité est au-dessus du seuil, allumer la LED
      led.on();
      console.log(`💡 Luminosité élevée (${brightness}), LED allumée.`);
    } else {
      // Si la luminosité est en dessous du seuil, éteindre la LED
      led.off();
      console.log(`💡 Luminosité faible (${brightness}), LED éteinte.`);
    }
  });

  /*lightSensor.on("data", function () {
    // La valeur du capteur varie entre 0 (obscurité) et ~1023 (lumière forte)
    let brightness = this.value;

    // Normaliser la valeur entre 0 et 255 (pour le PWM de la LED)
    let ledBrightness = Math.floor((brightness / 1023) * 255);

    // Appliquer la luminosité sur la LED
    led.brightness(ledBrightness);

    console.log(
      `💡 Luminosité captée : ${brightness} | LED : ${ledBrightness}`
    );
  });*/
});
