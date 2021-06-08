namespace PrimaAbgabeLW {
    import fc = FudgeCore;

    export class Stopper extends GameObject {
        public platformNumber: number;
        constructor(_name: string, _coordinates: fc.Vector3, _scale: fc.Vector3, _stopper: boolean, _platformNumber: number) {
            super(_name, _coordinates, _scale, _stopper);  
            this.platformNumber = _platformNumber;
        }
    }

    export class Platform extends GameObject {
        public number: number;
        public position: PlatPos;
        public nextPosition: PlatPos;
        public activePlatform: boolean;
        public up: boolean;
        public aim: boolean;

        constructor(_name: string, _coodrinates: fc.Vector3, _scale: fc.Vector3, _stopper: boolean, _number: number, _position: PlatPos, _up: boolean, _aim: boolean) {
            super(_name, _coodrinates, _scale, _stopper);
            this.number = _number;
            this.position = _position; 
            this.up = _up;
            this.aim = _aim;

            let triggerInteraction: ƒ.Node = new ƒ.Node("TriggerInteraction");
            this.appendChild(triggerInteraction);

            this.activePlatform = false;

            triggerInteraction.addComponent(new ƒ.ComponentRigidbody(0, ƒ.PHYSICS_TYPE.KINEMATIC, ƒ.COLLIDER_TYPE.CUBE, ƒ.PHYSICS_GROUP.TRIGGER));
            triggerInteraction.addComponent(new ƒ.ComponentTransform());
            triggerInteraction.mtxLocal.scaleX(0.90);
            triggerInteraction.mtxLocal.scaleZ(0.90);
            triggerInteraction.mtxLocal.translateY(0.1);
            triggerInteraction.getComponent(ƒ.ComponentRigidbody).addEventListener(ƒ.EVENT_PHYSICS.TRIGGER_ENTER, this.hndTrigger.bind(this));

            if (this.aim) {
                let materialAim: fc.Material = new fc.Material("Aim", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("YELLOW", 1)));
                this.getComponent(fc.ComponentMaterial).material = materialAim;
            }
        }

        hndTrigger(_event: fc.EventPhysics): void {
            if (_event.cmpRigidbody.getContainer() == null) {
                //console.log("touched with nothing");
                return;
            }

            if ( _event.cmpRigidbody.getContainer().name == "Avatar" && this.activePlatform  && triggerOn) {
                isOnPLatform = true;
                createNewPlatform = true;
                this.activePlatform = false;
                callGetPlatformUp(this.number);

                if (gameState.score < this.number + 1)
                    gameState.score = this.number + 1;
            } 
        }
    }
}