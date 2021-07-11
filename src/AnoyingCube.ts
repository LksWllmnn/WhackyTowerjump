namespace PrimaAbgabeLW {
    import fc = FudgeCore;

    export class AnnoyingCube extends fc.Node {
        public cmpTrans: fc.ComponentTransform;
        public mesh: fc.Mesh = new fc.MeshCube("AnnoyingCube");
        public mat: fc.Material = new fc.Material("AnnoyingMaterial", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("Red")));
        public mat2: fc.Material = new fc.Material("AnnoyingMaterial2", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("Green")));
        public cmpMesh: fc.ComponentMesh;
        public cmpMat: fc.ComponentMaterial;

        constructor(_name: string, _pos: fc.Vector3, _hurt: boolean) {
            super(_name);
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
}