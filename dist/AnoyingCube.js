"use strict";
var PrimaAbgabeLW;
(function (PrimaAbgabeLW) {
    var fc = FudgeCore;
    class AnnoyingCube extends fc.Node {
        constructor(_name, _pos, _hurt) {
            super(_name);
            this.mesh = new fc.MeshCube("AnnoyingCube");
            this.mat = new fc.Material("AnnoyingMaterial", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("Red")));
            this.mat2 = new fc.Material("AnnoyingMaterial2", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("Green")));
            this.cmpTrans = new fc.ComponentTransform();
            this.cmpTrans.mtxLocal.translateX(_pos.x);
            this.cmpTrans.mtxLocal.translateY(_pos.y - 1);
            this.cmpTrans.mtxLocal.translateZ(_pos.z);
            if (_hurt)
                this.cmpMat = new fc.ComponentMaterial(this.mat);
            else
                this.cmpMat = new fc.ComponentMaterial(this.mat2);
            this.cmpMesh = new fc.ComponentMesh(this.mesh);
            this.addComponent(this.cmpTrans);
            this.addComponent(this.cmpMesh);
            this.addComponent(this.cmpMat);
        }
    }
    PrimaAbgabeLW.AnnoyingCube = AnnoyingCube;
})(PrimaAbgabeLW || (PrimaAbgabeLW = {}));
//# sourceMappingURL=AnoyingCube.js.map