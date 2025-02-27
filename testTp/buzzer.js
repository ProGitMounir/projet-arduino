const { Board, Led } = require("johnny-five");

const board = new Board();

board.on("ready", () => {
  console.log("✅ Arduino connecté !");

  const buzzer = new Led(9); // Utiliser Led pour le PWM sur D9

  function soundAlarm() {
    buzzer.pulse(100); // Fait un son d'alarme (500ms ON, 500ms OFF)
    console.log("🚨 Alarme activée !");

    setTimeout(() => {
      buzzer.stop().off(); // Arrête après 10 secondes
      console.log("🚨 Alarme arrêtée !");
    }, 300);
  }

  soundAlarm(); // Démarre l'alarme
});
