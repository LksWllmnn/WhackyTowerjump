namespace PrimaAbgabeLW {
    import fu = FudgeUserInterface;
    import fc = FudgeCore;

    class GameState extends fc.Mutable {
        public score: number = 0;
        public jumpStrength: number = 0;
        public lives: number = 0;
        protected reduceMutator(_mutator: fc.Mutator): void {/* */ }
    }

    export let gameState: GameState = new GameState();

    export class Hud {
        private static controller: fu.Controller;
    
        public static start(): void {
            console.log("hi aus der hud");
            let domHud: HTMLDivElement = document.querySelector("div");
            Hud.controller = new fu.Controller(gameState, domHud);
            Hud.controller.updateUserInterface();
        }
    }
}