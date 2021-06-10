"use strict";
var PrimaAbgabeLW;
(function (PrimaAbgabeLW) {
    var fc = FudgeCore;
    class Avatar extends fc.Node {
        constructor(_name) {
            super(_name);
            this.headMovement = new fc.Node("Head");
            this.cmpAvatar = new fc.ComponentRigidbody(1, fc.PHYSICS_TYPE.DYNAMIC, fc.COLLIDER_TYPE.CAPSULE, fc.PHYSICS_GROUP.GROUP_2);
            this.lives = 3;
            this.isParalyzed = false;
            this.avatarMat = new fc.Material("AvatarMaterial", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("Green")));
            this.ears = new fc.ComponentAudioListener();
            this.cmpTransHead = new fc.ComponentTransform();
            this.avatarBody = new fc.Node("AvatarBody");
            this.avatarFeet = new fc.Node("AvatarFeet");
            this.nose = new fc.Node("AvatarFarView");
            this.avatarMeshHead = new fc.MeshSphere("AvatarMesh", 6, 6);
            this.cmpAvatarMeshHead = new fc.ComponentMesh(this.avatarMeshHead);
            this.avatarMeshBody = new fc.MeshCube("AvatarMeshBody");
            this.cmpAvatarMeshBody = new fc.ComponentMesh(this.avatarMeshBody);
            this.cmpAvatarMeshFeet = new fc.ComponentMesh(this.avatarMeshHead);
            this.cmpNoseMesh = new fc.ComponentMesh(this.avatarMeshBody);
            this.cmpAvatarMat = new fc.ComponentMaterial(this.avatarMat);
            this.cmpAvatarMatBody = new fc.ComponentMaterial(this.avatarMat);
            this.cmpAvatarMatFeet = new fc.ComponentMaterial(this.avatarMat);
            this.cmpNoseMat = new fc.ComponentMaterial(this.avatarMat);
            this.jumpForce = 0;
            this.jumpForceUp = false;
            this.cmpTransHead.mtxLocal.translateY(0.5);
            this.cmpTransHead.mtxLocal.translateZ(0);
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
            PrimaAbgabeLW.cmpCamera.mtxPivot.translateY(1);
            PrimaAbgabeLW.cmpCamera.mtxPivot.translateZ(-5);
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
        computeJumpForce() {
            if (this.jumpForceUp) {
                this.jumpForce = this.jumpForce + 2;
                if (this.jumpForce > 100)
                    this.jumpForceUp = false;
            }
            else if (!this.jumpForceUp) {
                this.jumpForce = this.jumpForce - 2;
                if (this.jumpForce <= 0)
                    this.jumpForceUp = true;
            }
            PrimaAbgabeLW.gameState.jumpStrength = this.jumpForce;
        }
        hndlJump(_event) {
            if (_event.code == "Space") {
                let jumpVector = new fc.Vector3(this.headMovement.mtxWorld.getZ().x * this.jumpForce * 5, this.headMovement.mtxWorld.getZ().y + 1 * this.jumpForce * 5, this.headMovement.mtxWorld.getZ().z * this.jumpForce * 5);
                this.cmpAvatar.applyForce(jumpVector);
                this.jumpForce = 0;
                PrimaAbgabeLW.gameState.jumpStrength = this.jumpForce;
            }
        }
        recover() {
            fc.Time.game.setTimer(500, 1, this.isRecovered.bind(this));
        }
        isRecovered() {
            this.isParalyzed = false;
        }
    }
    PrimaAbgabeLW.Avatar = Avatar;
})(PrimaAbgabeLW || (PrimaAbgabeLW = {}));
//# sourceMappingURL=Avatar.js.map