"use strict";
var PrimaAbgabeLW;
(function (PrimaAbgabeLW) {
    var fc = FudgeCore;
    class Stopper extends PrimaAbgabeLW.GameObject {
        constructor(_name, _coordinates, _scale, _stopper, _platformNumber) {
            super(_name, _coordinates, _scale, _stopper);
            this.platformNumber = _platformNumber;
        }
    }
    PrimaAbgabeLW.Stopper = Stopper;
    class Platform extends PrimaAbgabeLW.GameObject {
        constructor(_name, _coodrinates, _scale, _stopper, _number, _position, _up, _aim) {
            super(_name, _coodrinates, _scale, _stopper);
            this.number = _number;
            this.position = _position;
            this.up = _up;
            this.aim = _aim;
            let triggerInteraction = new ƒ.Node("TriggerInteraction");
            this.appendChild(triggerInteraction);
            this.activePlatform = false;
            triggerInteraction.addComponent(new ƒ.ComponentRigidbody(0, ƒ.PHYSICS_TYPE.KINEMATIC, ƒ.COLLIDER_TYPE.CUBE, ƒ.PHYSICS_GROUP.TRIGGER));
            triggerInteraction.addComponent(new ƒ.ComponentTransform());
            triggerInteraction.mtxLocal.scaleX(0.90);
            triggerInteraction.mtxLocal.scaleZ(0.90);
            triggerInteraction.mtxLocal.translateY(0.1);
            triggerInteraction.getComponent(ƒ.ComponentRigidbody).addEventListener("TriggerEnteredCollision" /* TRIGGER_ENTER */, this.hndTrigger.bind(this));
            if (this.aim) {
                let materialAim = new fc.Material("Aim", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("YELLOW", 1)));
                this.getComponent(fc.ComponentMaterial).material = materialAim;
            }
        }
        hndTrigger(_event) {
            if (_event.cmpRigidbody.getContainer() == null) {
                return;
            }
            if (_event.cmpRigidbody.getContainer().name == "Avatar" && this.activePlatform && PrimaAbgabeLW.triggerOn) {
                PrimaAbgabeLW.isOnPLatform = true;
                PrimaAbgabeLW.createNewPlatform = true;
                this.activePlatform = false;
                PrimaAbgabeLW.callGetPlatformUp(this.number);
                if (PrimaAbgabeLW.gameState.score < this.number + 1)
                    PrimaAbgabeLW.gameState.score = this.number + 1;
            }
        }
    }
    PrimaAbgabeLW.Platform = Platform;
})(PrimaAbgabeLW || (PrimaAbgabeLW = {}));
//# sourceMappingURL=Platform.js.map