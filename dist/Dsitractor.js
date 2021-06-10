"use strict";
var PrimaAbgabeLW;
(function (PrimaAbgabeLW) {
    var fc = FudgeCore;
    class Distractor extends fc.Node {
        constructor(_name, _platformNumber) {
            super(_name);
            this.mesh = new fc.MeshSphere();
            this.material = new fc.Material("DistractorMaterial", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("Red")));
            this.cmpTrans = new fc.ComponentTransform();
            this.cmpMesh = new fc.ComponentMesh(this.mesh);
            this.cmpAvatarMat = new fc.ComponentMaterial(this.material);
            this.cmpRigid = new fc.ComponentRigidbody(0, fc.PHYSICS_TYPE.KINEMATIC, fc.COLLIDER_TYPE.SPHERE);
            this.cmpBounce = new PrimaAbgabeLW.ComponentBounce(this.cmpRigid);
            this.platformNumber = _platformNumber;
            this.addComponent(this.cmpTrans);
            this.addComponent(this.cmpMesh);
            this.addComponent(this.cmpAvatarMat);
            this.addComponent(this.cmpRigid);
            this.addComponent(this.cmpBounce);
        }
    }
    PrimaAbgabeLW.Distractor = Distractor;
})(PrimaAbgabeLW || (PrimaAbgabeLW = {}));
//# sourceMappingURL=Dsitractor.js.map