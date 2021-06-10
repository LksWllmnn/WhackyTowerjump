namespace PrimaAbgabeLW {
    import fc = FudgeCore;

    export class Distractor extends fc.Node {

        public platformNumber: number;

        private mesh: fc.MeshSphere = new fc.MeshSphere();
        private material: fc.Material = new fc.Material("DistractorMaterial", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("Red")));

        private cmpTrans: fc.ComponentTransform = new fc.ComponentTransform();
        private cmpMesh: fc.ComponentMesh = new fc.ComponentMesh(this.mesh);
        private cmpAvatarMat: fc.ComponentMaterial = new fc.ComponentMaterial(this.material);
        private cmpRigid: fc.ComponentRigidbody = new fc.ComponentRigidbody(0, fc.PHYSICS_TYPE.KINEMATIC, fc.COLLIDER_TYPE.SPHERE);
        private cmpBounce: ComponentBounce = new ComponentBounce(this.cmpRigid);

        constructor(_name: string, _platformNumber: number) {
            super(_name);
            this.platformNumber = _platformNumber;
            this.addComponent(this.cmpTrans);
            this.addComponent(this.cmpMesh);
            this.addComponent(this.cmpAvatarMat);
            this.addComponent(this.cmpRigid);
            this.addComponent(this.cmpBounce);
        }
    }
}