namespace PrimaAbgabeLW {
    import fc = FudgeCore;

    export class ComponentBounce extends ƒ.ComponentScript {
        public rbComponent: fc.ComponentRigidbody;

        constructor(_rbComponent: fc.ComponentRigidbody) {
            super();
            
            this.rbComponent = _rbComponent;
            this.rbComponent.addEventListener(ƒ.EVENT_PHYSICS.COLLISION_ENTER, this.hndCollision);

        }

        private hndCollision = (_event: fc.EventPointer): void => {
            
            let collisionPoint: fc.Vector3 = this.rbComponent.collisions[0].getPosition();

            let collisionThing: fc.Node = this.rbComponent.collisions[0].getContainer();
            let collisionThingRB: fc.ComponentRigidbody = collisionThing.getComponent(fc.ComponentRigidbody);

            let impulseVector: fc.Vector3 = new fc.Vector3(collisionPoint.x - this.rbComponent.getPosition().x , collisionPoint.y - this.rbComponent.getPosition().y, collisionPoint.z - this.rbComponent.getPosition().z);
            let normImpulseVector: fc.Vector3 = fc.Vector3.NORMALIZATION(impulseVector);

            collisionThingRB.applyLinearImpulse(new fc.Vector3(normImpulseVector.x * 10, normImpulseVector.y * 10, normImpulseVector.z * 10));
          }

    }

}