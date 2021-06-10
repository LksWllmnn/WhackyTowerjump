"use strict";
var PrimaAbgabeLW;
(function (PrimaAbgabeLW) {
    var fu = FudgeUserInterface;
    var fc = FudgeCore;
    class GameState extends fc.Mutable {
        constructor() {
            super(...arguments);
            this.score = 0;
            this.jumpStrength = 0;
            this.lives = 0;
        }
        reduceMutator(_mutator) { }
    }
    PrimaAbgabeLW.gameState = new GameState();
    class Hud {
        static start() {
            let domHud = document.querySelector("div");
            Hud.controller = new fu.Controller(PrimaAbgabeLW.gameState, domHud);
            Hud.controller.updateUserInterface();
        }
    }
    PrimaAbgabeLW.Hud = Hud;
})(PrimaAbgabeLW || (PrimaAbgabeLW = {}));
//# sourceMappingURL=Hud.js.map