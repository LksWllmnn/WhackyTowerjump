namespace PrimaAbgabeLW {
    import fc = FudgeCore;

    export class GameObject extends fc.Node {
        public cmpObjTransform: fc.ComponentTransform;
        public cmpRigidbody: fc.ComponentRigidbody;

        protected coodrinates: fc.Vector3;
        protected scale: fc.Vector3;
        
        protected mesh: fc.Mesh = new fc.MeshCube("Quad");
        protected materialStopper: fc.Material = new fc.Material("GREEN", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("GREEN", 0.1)));
        protected materialNormal: fc.Material = new fc.Material("GREEN", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("White", 0.9)));
        protected cmpMesh: fc.ComponentMesh;

        constructor(_name: string, _coordinates: fc.Vector3, _scale: fc.Vector3, _stopper: boolean) {
            super(_name);

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
            } else {
                this.addComponent(new fc.ComponentMaterial(this.materialNormal));
            }
            
        }

    }

}