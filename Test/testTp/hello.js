const { Board, Led } = require("johnny-five");

// Initialise la connexion à l'Arduino
const board = new Board();

board.on("ready", () => {
  console.log("✅ Arduino connecté !");

  // Allume la LED sur la broche 13
  const led = new Led(13);
  led.blink(500); // Clignote toutes les 500ms

  console.log("💡 LED clignotante");
});
