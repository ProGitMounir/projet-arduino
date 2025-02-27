const { Board, Led, Sensor, Button } = require("johnny-five");
const EventEmitter = require("events");

const board = new Board();
const arduinoEvents = new EventEmitter();

let led, lightSensor, button;

board.on("ready", () => {
  console.log("✅ Arduino connecté !");

  led = new Led(13);
  lightSensor = new Sensor({ pin: "A0", freq: 250 });
  button = new Button("A1");

  // Émettre la luminosité
  lightSensor.on("data", function () {
    arduinoEvents.emit("brightness", this.value);
  });

  // Émettre les appuis sur le bouton
  button.on("press", () => {
    arduinoEvents.emit("buttonPress");
  });
});

// Exporter les fonctions pour contrôler la LED
module.exports = {
  toggleLed: (state) => {
    if (state) {
      led.on();
    } else {
      led.off();
    }
  },
  arduinoEvents,
};
