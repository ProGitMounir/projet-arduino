const { Board, Servo } = require("johnny-five");

const board = new Board();

board.on("ready", () => {
  console.log("✅ Arduino connecté !");

  const servo = new Servo({
    pin: "A2", // Assurez-vous que c'est bien le bon port
    startAt: 0, // Position initiale (porte fermée)
  });

  console.log("🟢 Test de la porte...");

  // Ouvrir la porte après 2 secondes
  setTimeout(() => {
    console.log("🔓 Ouverture de la porte...");
    servo.to(90); // Position d'ouverture
  }, 2000);

  // Fermer la porte après 5 secondes
  setTimeout(() => {
    console.log("🔒 Fermeture de la porte...");
    servo.to(0); // Position de fermeture
  }, 7000);
});
