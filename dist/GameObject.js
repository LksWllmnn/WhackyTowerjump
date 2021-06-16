"use strict";
var PrimaAbgabeLW;
(function (PrimaAbgabeLW) {
    var fc = FudgeCore;
    class GameObject extends fc.Node {
        constructor(_name, _coordinates, _scale, _stopper) {
            super(_name);
            this.mesh = new fc.MeshCube("Quad");
            this.materialStopper = new fc.Material("GREEN", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("GREEN", 0.5)));
            this.materialNormal = new fc.Material("GREEN", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("White", 1)));
            this.scale = _scale;
            this.cmpObjTransform = new fc.ComponentTransform();
            this.addComponent(this.cmpObjTransform);
            this.mtxLocal.translateX(_coordinates.x);
            this.mtxLocal.translateY(_coordinates.y);
            this.mtxLocal.translateZ(_coordinates.z);
            this.mtxLocal.scaleX(_scale.x);
            this.mtxLocal.scaleY(_scale.y);
            this.mtxLocal.scaleZ(_scale.z);
            this.cmpRigidbody = new fc.ComponentRigidbody(0, fc.PHYSICS_TYPE.KINEMATIC, fc.COLLIDER_TYPE.CUBE);
            this.addComponent(this.cmpRigidbody);
            this.cmpMesh = new fc.ComponentMesh(this.mesh);
            this.addComponent(this.cmpMesh);
            if (_stopper) {
                this.addComponent(new fc.ComponentMaterial(this.materialStopper));
            }
            else {
                this.addComponent(new fc.ComponentMaterial(this.materialNormal));
            }
        }
    }
    PrimaAbgabeLW.GameObject = GameObject;
})(PrimaAbgabeLW || (PrimaAbgabeLW = {}));
//# sourceMappingURL=GameObject.js.map