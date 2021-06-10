"use strict";
var PrimaAbgabeLW;
(function (PrimaAbgabeLW) {
    var fc = FudgeCore;
    class ComponentBounce extends ƒ.ComponentScript {
        constructor(_rbComponent) {
            super();
            this.hndCollision = (_event) => {
                let collisionPoint = this.rbComponent.collisions[0].getPosition();
                let collisionThing = this.rbComponent.collisions[0].getContainer();
                let collisionThingRB = collisionThing.getComponent(fc.ComponentRigidbody);
                let impulseVector = new fc.Vector3(collisionPoint.x - this.rbComponent.getPosition().x, collisionPoint.y - this.rbComponent.getPosition().y, collisionPoint.z - this.rbComponent.getPosition().z);
                let normImpulseVector = fc.Vector3.NORMALIZATION(impulseVector);
                collisionThingRB.applyLinearImpulse(new fc.Vector3(normImpulseVector.x * 10, normImpulseVector.y * 10, normImpulseVector.z * 10));
            };
            this.rbComponent = _rbComponent;
            this.rbComponent.addEventListener("ColliderEnteredCollision" /* COLLISION_ENTER */, this.hndCollision);
        }
    }
    PrimaAbgabeLW.ComponentBounce = ComponentBounce;
})(PrimaAbgabeLW || (PrimaAbgabeLW = {}));
//# sourceMappingURL=bounceComponentScript.js.map