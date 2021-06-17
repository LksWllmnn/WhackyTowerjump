namespace PrimaAbgabeLW {
    import fc = FudgeCore;

    export class Avatar extends fc.Node {
        public headMovement: fc.Node = new fc.Node("Head");
        public cmpAvatar: fc.ComponentRigidbody = new fc.ComponentRigidbody(1, fc.PHYSICS_TYPE.DYNAMIC, fc.COLLIDER_TYPE.CAPSULE, fc.PHYSICS_GROUP.GROUP_2);
        public lives: number = 3;
        public isParalyzed: boolean = false;
        
        private avatarMat: fc.Material = new fc.Material("AvatarMaterial", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("Green")));
        private ears: fc.ComponentAudioListener = new fc.ComponentAudioListener();
        private cmpTransHead: fc.ComponentTransform = new fc.ComponentTransform();
        private avatarBody: fc.Node = new fc.Node("AvatarBody");
        private avatarFeet: fc.Node = new fc.Node("AvatarFeet");
        private nose: fc.Node = new fc.Node("Nose");
        private avatarMeshHead: fc.Mesh = new fc.MeshSphere("AvatarMesh", 6, 6);
        private cmpAvatarMeshHead: fc.ComponentMesh = new fc.ComponentMesh(this.avatarMeshHead);
        private avatarMeshBody: fc.Mesh = new fc.MeshCube("AvatarMeshBody");
        private cmpAvatarMeshBody: fc.ComponentMesh = new fc.ComponentMesh(this.avatarMeshBody);
        private cmpAvatarMeshFeet: fc.ComponentMesh = new fc.ComponentMesh(this.avatarMeshHead);
        private cmpNoseMesh: fc.ComponentMesh = new fc.ComponentMesh(this.avatarMeshBody);
        private cmpAvatarMat: fc.ComponentMaterial = new fc.ComponentMaterial(this.avatarMat);
        private cmpAvatarMatBody: fc.ComponentMaterial = new fc.ComponentMaterial(this.avatarMat);
        private cmpAvatarMatFeet: fc.ComponentMaterial = new fc.ComponentMaterial(this.avatarMat);
        private cmpNoseMat: fc.ComponentMaterial = new fc.ComponentMaterial(this.avatarMat);
        
        private jumpForce: number = 0;
        private jumpForceUp: boolean = false;
        
        
        constructor(_name: string) {
            super(_name);
            this.cmpTransHead.mtxLocal.translateY(0.5);
            
            this.cmpAvatarMeshBody.mtxPivot.scaleX(0.75);
            this.cmpAvatarMeshBody.mtxPivot.scaleZ(0.75);
            
            this.cmpAvatarMeshFeet.mtxPivot.translateY(-0.5);
            
            this.cmpNoseMesh.mtxPivot.scaleY(0.3);
            this.cmpNoseMesh.mtxPivot.scaleX(0.2);
            this.cmpNoseMesh.mtxPivot.scaleZ(1);
            this.cmpNoseMesh.mtxPivot.translateZ(0.2);

            this.cmpAvatar.restitution = 0.5;
            this.cmpAvatar.rotationInfluenceFactor = fc.Vector3.ZERO();
            this.cmpAvatar.friction = 1;

            cmpCamera.mtxPivot.translateY(0);
            cmpCamera.mtxPivot.translateZ(0);

            this.addComponent(new fc.ComponentTransform(fc.Matrix4x4.TRANSLATION(fc.Vector3.Y(5))));

            this.avatarBody.addComponent(this.cmpAvatarMeshBody);
            this.avatarBody.addComponent(this.cmpAvatarMatBody);
            this.avatarFeet.addComponent(this.cmpAvatarMeshFeet);
            this.avatarFeet.addComponent(this.cmpAvatarMatFeet);

            this.nose.addComponent(this.cmpNoseMesh);
            this.nose.addComponent(this.cmpNoseMat);

            this.addComponent(this.cmpAvatar);

            this.headMovement.addComponent(this.cmpAvatarMeshHead);
            this.headMovement.addComponent(this.cmpAvatarMat);
            this.headMovement.addComponent(this.cmpTransHead);
            this.headMovement.addComponent(this.ears);
            this.headMovement.appendChild(this.nose);

            this.appendChild(this.headMovement);
            this.appendChild(this.avatarBody);
            this.appendChild(this.avatarFeet);
        }

        public computeJumpForce(): void {
            if (this.jumpForceUp) {
                this.jumpForce = this.jumpForce + 2;
                if (this.jumpForce > 100)
                    this.jumpForceUp = false;
            } else if (!this.jumpForceUp) {
                this.jumpForce = this.jumpForce - 2;
                if (this.jumpForce <= 0)
                    this.jumpForceUp = true;
            }
            gameState.jumpStrength = this.jumpForce;
        }
    
        public hndlJump(_event: KeyboardEvent): void {
            if (_event.code == "Space") {
                let jumpVector: fc.Vector3 = new fc.Vector3(this.headMovement.mtxWorld.getZ().x * this.jumpForce * 5, this.headMovement.mtxWorld.getZ().y + 1 * this.jumpForce * 5, this.headMovement.mtxWorld.getZ().z * this.jumpForce * 5);
                this.cmpAvatar.applyForce(jumpVector);
                this.jumpForce = 0;
                gameState.jumpStrength = this.jumpForce;
                if (audioIsRunning) {
                    this.getComponent(fc.ComponentAudio).play(true);
                }
            } 
        }

        public recover(): void {
            fc.Time.game.setTimer(500, 1, this.isRecovered.bind(this));
        }

        private isRecovered(): void {
            this.isParalyzed = false;
        }

    } 
}