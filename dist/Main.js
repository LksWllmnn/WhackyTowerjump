"use strict";
var PrimaAbgabeLW;
(function (PrimaAbgabeLW) {
    var fc = FudgeCore;
    let graph;
    let allPlatforms;
    let allStopper;
    let viewport;
    let cmpCamera;
    let thirdPerson = true;
    let cIsPressed = false;
    let kIsPressed = false;
    let cmpAvatar;
    let headMovement;
    let avatar;
    let avatarJumpForce = 0;
    let avatarJumpForceUp = true;
    let avatarLives;
    let ray;
    let farCamera;
    let transFarCamera;
    let iTriggerActivator;
    let mtxFarCam;
    PrimaAbgabeLW.isOnPLatform = false;
    let platformArray = new Array(10);
    let forward;
    window.addEventListener("load", startInteractiveViewport);
    window.addEventListener("keyup", hndlJump);
    let restartButton = document.getElementById("restart");
    if (restartButton) {
        restartButton.addEventListener("click", restartGame);
    }
    async function startInteractiveViewport() {
        await fc.Project.loadResourcesFromHTML();
        let jsonGraph = fc.Project.resources["Graph|2021-05-19T16:31:42.747Z|51435"];
        graph = jsonGraph;
        console.log(graph);
        loadBaseData();
    }
    async function loadBaseData() {
        console.log("hi");
        let baseJson = await fetch("../lvl/rootData.json");
        console.log(baseJson.text());
        hndlLoaded();
    }
    function hndlLoaded() {
        fc.Physics.settings.debugDraw = true;
        PrimaAbgabeLW.gameState.score = 0;
        loadAllButtons();
        console.log("hi2");
        let canvas = document.querySelector("canvas");
        cmpAvatar = new fc.ComponentRigidbody(1, fc.PHYSICS_TYPE.DYNAMIC, fc.COLLIDER_TYPE.CAPSULE, fc.PHYSICS_GROUP.GROUP_2);
        viewport = new FudgeCore.Viewport();
        cmpCamera = new FudgeCore.ComponentCamera();
        allPlatforms = new fc.Node("All Platforms");
        allStopper = new fc.Node("AllStopper");
        farCamera = new fc.Node("FarCamera");
        transFarCamera = new fc.ComponentTransform();
        mtxFarCam = new fc.Vector3(-20, 15, -20);
        avatar = new fc.Node("Avatar");
        settingUpAvatar();
        graph.addChild(allPlatforms);
        graph.addChild(allStopper);
        transFarCamera.mtxLocal.translateY(15);
        transFarCamera.mtxLocal.translateX(-30);
        transFarCamera.mtxLocal.translateZ(-30);
        transFarCamera.mtxLocal.rotateY(45);
        transFarCamera.mtxLocal.rotateX(35);
        transFarCamera.mtxLocal.rotateZ(0);
        farCamera.addComponent(transFarCamera);
        farCamera.addComponent(cmpCamera);
        graph.addChild(farCamera);
        avatarLives = 3;
        PrimaAbgabeLW.gameState.lives = avatarLives;
        iTriggerActivator = 0;
        PrimaAbgabeLW.triggerOn = false;
        PrimaAbgabeLW.createNewPlatform = false;
        createRigidbodys();
        createPlatform();
        viewport.initialize("InteractiveViewport", graph, cmpCamera, canvas);
        PrimaAbgabeLW.Hud.start();
        fc.Physics.adjustTransforms(graph, true);
        fc.Loop.start(fc.LOOP_MODE.TIME_REAL, 30);
        fc.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, renderAFrame);
        fc.AudioManager.default.listenTo(graph);
        fc.AudioManager.default.listenWith(headMovement.getComponent(ƒ.ComponentAudioListener));
    }
    function loadAllButtons() {
        let restartButton = document.getElementById("restart");
        if (restartButton) {
            restartButton.addEventListener("click", restartGame);
        }
    }
    function renderAFrame() {
        if (graph == null) {
            startInteractiveViewport();
            return;
        }
        fc.Physics.world.simulate(fc.Loop.timeFrameReal / 1000);
        if (iTriggerActivator > 15) {
            PrimaAbgabeLW.triggerOn = true;
        }
        else {
            iTriggerActivator++;
        }
        computeFarCamHight();
        listenForKeys();
        viewport.draw();
        fc.Physics.settings.debugDraw = true;
    }
    function listenForKeys() {
        let _offset = 100 * fc.Loop.timeFrameReal / 1000;
        forward = avatar.mtxWorld.getZ();
        ray = fc.Physics.raycast(avatar.mtxWorld.translation, new fc.Vector3(0, -1, 0), 1);
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.A]) && ray.hit) {
            cmpAvatar.rotateBody(new fc.Vector3(0, 2, 0));
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.D]) && ray.hit) {
            cmpAvatar.rotateBody(new fc.Vector3(0, -2, 0));
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.W]) && ray.hit) {
            cmpAvatar.setVelocity(fc.Vector3.SCALE(forward, _offset));
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.S]) && ray.hit) {
            cmpAvatar.setVelocity(fc.Vector3.SCALE(forward, -_offset));
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.E])) {
            headMovement.mtxLocal.rotateX(-2);
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.R])) {
            headMovement.mtxLocal.rotateX(2);
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.SPACE]) && ray.hit) {
            computeJumpForce();
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.C]) && !cIsPressed) {
            hndlCameraPerspective();
            cIsPressed = true;
        }
        if (!fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.C]) && cIsPressed) {
            cIsPressed = false;
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.K]) && !kIsPressed) {
            callGetPlatformUp(0);
            kIsPressed = true;
        }
        if (!fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.K]) && kIsPressed) {
            kIsPressed = false;
        }
    }
    function createRigidbodys() {
        let lvl = graph.getChildrenByName("lvl")[0];
        for (let lvlElement of lvl.getChildren()) {
            let cmpRigidbody = new fc.ComponentRigidbody(0, fc.PHYSICS_TYPE.STATIC, fc.COLLIDER_TYPE.CUBE);
            lvlElement.addComponent(cmpRigidbody);
            if (lvlElement.name == "ground") {
                let triggerInteraction = new ƒ.Node("TriggerInteraction");
                lvlElement.appendChild(triggerInteraction);
                triggerInteraction.addComponent(new ƒ.ComponentRigidbody(0, ƒ.PHYSICS_TYPE.KINEMATIC, ƒ.COLLIDER_TYPE.CUBE, ƒ.PHYSICS_GROUP.TRIGGER));
                triggerInteraction.addComponent(new ƒ.ComponentTransform());
                triggerInteraction.mtxLocal.scaleX(0.95);
                triggerInteraction.mtxLocal.scaleZ(0.95);
                triggerInteraction.mtxLocal.translateY(0.3);
                triggerInteraction.getComponent(ƒ.ComponentRigidbody).addEventListener("TriggerEnteredCollision" /* TRIGGER_ENTER */, hndGroundTrigger);
            }
        }
    }
    function hndGroundTrigger(_event) {
        if (_event.cmpRigidbody.getContainer() == null) {
            return;
        }
        if (_event.cmpRigidbody.getContainer().name == "Avatar" && PrimaAbgabeLW.isOnPLatform) {
            PrimaAbgabeLW.isOnPLatform = false;
            avatarLives--;
            PrimaAbgabeLW.gameState.lives = avatarLives;
            getPlattformDown();
        }
        if (avatarLives == 0) {
            console.log("you loose");
            restartGame();
        }
    }
    function computeFarCamHight() {
        mtxFarCam.y = avatar.mtxWorld.translation.y + 15;
        transFarCamera.mtxLocal.translation = mtxFarCam;
    }
    function restartGame() {
        avatar.removeComponent(avatar.getComponent(fc.ComponentRigidbody));
        let lvl = graph.getChildrenByName("lvl")[0];
        for (let lvlElement of lvl.getChildren()) {
            if (lvlElement.name == "ground") {
                lvlElement.getChild(0).removeComponent(lvlElement.getChild(0).getComponent(fc.ComponentRigidbody));
            }
            lvlElement.removeComponent(lvlElement.getComponent(fc.ComponentRigidbody));
        }
        for (let i = 0; i < allPlatforms.getChildren().length; i++) {
            let platform = allPlatforms.getChild(i);
            platform.getChild(0).removeComponent(platform.getChild(0).getComponent(fc.ComponentRigidbody));
            platform.removeComponent(platform.getComponent(fc.ComponentRigidbody));
            //aconsole.log(platform);
        }
        for (let i = 0; i < allStopper.getChildren().length; i++) {
            let stopper = allStopper.getChild(i);
            stopper.removeComponent(stopper.getComponent(fc.ComponentRigidbody));
        }
        graph.removeAllChildren();
        graph = null;
    }
    /*
    AVATAR
    */
    function settingUpAvatar() {
        let ears = new fc.ComponentAudioListener();
        headMovement = new fc.Node("Head");
        let cmpTransHead = new fc.ComponentTransform();
        cmpTransHead.mtxLocal.translateY(0.5);
        cmpTransHead.mtxLocal.translateZ(0);
        let avatarBody = new fc.Node("AvatarBody");
        let avatarFeet = new fc.Node("AvatarFeet");
        let nose = new fc.Node("AvatarFarView");
        let avatarMeshHead = new fc.MeshSphere("AvatarMesh", 6, 6);
        let cmpAvatarMeshHead = new fc.ComponentMesh(avatarMeshHead);
        let avatarMeshBody = new fc.MeshCube("AvatarMeshBody");
        let cmpAvatarMeshBody = new fc.ComponentMesh(avatarMeshBody);
        cmpAvatarMeshBody.mtxPivot.scaleX(0.75);
        cmpAvatarMeshBody.mtxPivot.scaleZ(0.75);
        let cmpAvatarMeshFeet = new fc.ComponentMesh(avatarMeshHead);
        cmpAvatarMeshFeet.mtxPivot.translateY(-0.5);
        let cmpNoseMesh = new fc.ComponentMesh(avatarMeshBody);
        cmpNoseMesh.mtxPivot.scaleY(0.3);
        cmpNoseMesh.mtxPivot.scaleX(0.2);
        cmpNoseMesh.mtxPivot.scaleZ(1);
        cmpNoseMesh.mtxPivot.translateZ(0.2);
        let avatarMat = new fc.Material("AvatarMaterial", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("RED")));
        let cmpAvatarMat = new fc.ComponentMaterial(avatarMat);
        let cmpAvatarMatBody = new fc.ComponentMaterial(avatarMat);
        let cmpAvatarMatFeet = new fc.ComponentMaterial(avatarMat);
        let cmpNoseMat = new fc.ComponentMaterial(avatarMat);
        //cmpAvatar = new fc.ComponentRigidbody(1, fc.PHYSICS_TYPE.DYNAMIC, fc.COLLIDER_TYPE.CAPSULE, fc.PHYSICS_GROUP.GROUP_2);
        cmpAvatar.restitution = 0.5;
        cmpAvatar.rotationInfluenceFactor = fc.Vector3.ZERO();
        cmpAvatar.friction = 1;
        cmpCamera.mtxPivot.translateY(1);
        cmpCamera.mtxPivot.translateZ(-5);
        avatar.addComponent(new fc.ComponentTransform(fc.Matrix4x4.TRANSLATION(fc.Vector3.Y(5))));
        avatarBody.addComponent(cmpAvatarMeshBody);
        avatarBody.addComponent(cmpAvatarMatBody);
        avatarFeet.addComponent(cmpAvatarMeshFeet);
        avatarFeet.addComponent(cmpAvatarMatFeet);
        nose.addComponent(cmpNoseMesh);
        nose.addComponent(cmpNoseMat);
        avatar.addComponent(cmpAvatar);
        headMovement.addComponent(cmpAvatarMeshHead);
        headMovement.addComponent(cmpAvatarMat);
        headMovement.addComponent(cmpTransHead);
        headMovement.addComponent(ears);
        headMovement.appendChild(nose);
        //avatarFarView.addComponent(cmpCamera);
        avatar.appendChild(headMovement);
        avatar.appendChild(avatarBody);
        avatar.appendChild(avatarFeet);
        graph.appendChild(avatar);
    }
    function computeJumpForce() {
        if (avatarJumpForceUp) {
            avatarJumpForce = avatarJumpForce + 2;
            if (avatarJumpForce > 100)
                avatarJumpForceUp = false;
        }
        else if (!avatarJumpForceUp) {
            avatarJumpForce = avatarJumpForce - 2;
            if (avatarJumpForce <= 0)
                avatarJumpForceUp = true;
        }
        PrimaAbgabeLW.gameState.jumpStrength = avatarJumpForce;
        //console.log(avatarJumpForce);
    }
    function hndlJump(_event) {
        if (_event.code == "Space") {
            let jumpVector = new fc.Vector3(headMovement.mtxWorld.getZ().x * avatarJumpForce * 5, headMovement.mtxWorld.getZ().y + 1 * avatarJumpForce * 5, headMovement.mtxWorld.getZ().z * avatarJumpForce * 5);
            cmpAvatar.applyForce(jumpVector);
            avatarJumpForce = 0;
            PrimaAbgabeLW.gameState.jumpStrength = avatarJumpForce;
        }
    }
    function hndlCameraPerspective() {
        console.log(thirdPerson);
        if (thirdPerson) {
            thirdPerson = false;
            headMovement.addComponent(cmpCamera);
        }
        else if (!thirdPerson) {
            thirdPerson = true;
            farCamera.addComponent(cmpCamera);
        }
    }
    /*
    PLATFORMS
    */
    function getPlattformDown() {
        //console.log("!!! PLaforms down");
        for (let i = 1; i < allPlatforms.getChildren().length; i++) {
            let platformDown = allPlatforms.getChild(i);
            if (platformDown.up) {
                platformDown.mtxLocal.translateY(-30 * platformDown.number);
                for (let i = 0; i < allStopper.getChildren().length; i++) {
                    let stopper = allStopper.getChild(i);
                    if (stopper.platformNumber == platformDown.number)
                        stopper.mtxLocal.translateY(-10 * platformDown.number);
                }
                platformDown.activePlatform = false;
                platformDown.up = false;
            }
            //console.log(platformDown.number + " : " + "platform up: " + platformDown.up + " : " + platformDown.mtxLocal.translation.y);
        }
        let newActive = allPlatforms.getChild(0);
        newActive.activePlatform = true;
    }
    function callGetPlatformUp(_oldIndex) {
        if (_oldIndex + 1 < platformArray.length) {
            getPlatformUp(allPlatforms.getChild(_oldIndex + 1));
        }
        else {
            alert("You Won!!");
            restartGame();
        }
    }
    PrimaAbgabeLW.callGetPlatformUp = callGetPlatformUp;
    function createPlatform() {
        let platformCoordinates;
        let platformPos;
        for (let i = 0; i < platformArray.length; i++) {
            if (i == 0) {
                platformCoordinates = new fc.Vector3(7, 1, 7);
                platformPos = PrimaAbgabeLW.PlatPos.rt;
            }
            else {
                platformPos = computenextPlatformPosition(platformArray[i - 1]);
                platformCoordinates = computeNextPlatformCoordinates(platformPos, platformArray[i - 1].mtxLocal.translation.y - 30);
            }
            if (i == platformArray.length - 1) {
                platformArray[i] = new PrimaAbgabeLW.Platform("platform" + i, platformCoordinates, new fc.Vector3(5, 1, 5), false, i, platformPos, false, true);
            }
            else {
                platformArray[i] = new PrimaAbgabeLW.Platform("platform" + i, platformCoordinates, new fc.Vector3(5, 1, 5), false, i, platformPos, false, false);
            }
            if (i == 0) {
                platformArray[i].activePlatform = true;
                platformArray[i].up = true;
            }
            allPlatforms.addChild(platformArray[i]);
            createStopper(platformArray[i].position, platformArray[i].mtxLocal.translation, platformArray[i].number);
            /*if (i == platformArray.length - 1) {
                //console.log("hi");
                platformPos = computenextPlatformPosition(platformArray[i]);
                platformCoordinates = computeNextPlatformCoordinates(platformPos, platformArray[i].mtxLocal.translation.y - 30 );
                let aim: Aim = new Aim("platform" + i + 1, platformCoordinates, new fc.Vector3(5, 1, 5), false, i + 1, platformPos, false);
                allPlatforms.addChild(aim);
                createStopper(aim.position, aim.mtxLocal.translation, aim.number);
            }*/
        }
    }
    function getPlatformUp(_platform) {
        _platform.mtxLocal.translateY(30 * _platform.number);
        _platform.activePlatform = true;
        _platform.up = true;
        //console.log(_platform.number + " : " + "platform up: " + _platform.up + " : " + _platform.mtxLocal.translation.y);
        for (let i = 0; i < allStopper.getChildren().length; i++) {
            let stopper = allStopper.getChild(i);
            if (stopper.platformNumber == _platform.number)
                stopper.mtxLocal.translateY(10 * _platform.number);
        }
    }
    PrimaAbgabeLW.getPlatformUp = getPlatformUp;
    function computeNextPlatformCoordinates(_newPos, _lastPlatAltitude) {
        let nextPlatformCoordinates;
        let ranYPos = fc.Random.default.getRangeFloored(2, 3);
        switch (_newPos) {
            case PrimaAbgabeLW.PlatPos.lt:
                nextPlatformCoordinates = new fc.Vector3(-7, _lastPlatAltitude + ranYPos, 7);
                break;
            case PrimaAbgabeLW.PlatPos.mt:
                nextPlatformCoordinates = new fc.Vector3(0, _lastPlatAltitude + ranYPos, 7);
                break;
            case PrimaAbgabeLW.PlatPos.rt:
                nextPlatformCoordinates = new fc.Vector3(7, _lastPlatAltitude + ranYPos, 7);
                break;
            case PrimaAbgabeLW.PlatPos.lm:
                nextPlatformCoordinates = new fc.Vector3(-7, _lastPlatAltitude + ranYPos, 0);
                break;
            case PrimaAbgabeLW.PlatPos.rm:
                nextPlatformCoordinates = new fc.Vector3(7, _lastPlatAltitude + ranYPos, 0);
                break;
            case PrimaAbgabeLW.PlatPos.lb:
                nextPlatformCoordinates = new fc.Vector3(-7, _lastPlatAltitude + ranYPos, -7);
                break;
            case PrimaAbgabeLW.PlatPos.mb:
                nextPlatformCoordinates = new fc.Vector3(0, _lastPlatAltitude + ranYPos, -7);
                break;
            case PrimaAbgabeLW.PlatPos.rb:
                nextPlatformCoordinates = new fc.Vector3(7, _lastPlatAltitude + ranYPos, -7);
                break;
        }
        return nextPlatformCoordinates;
    }
    function computenextPlatformPosition(_lastPlatform) {
        let nextPlatformPosition;
        let ranNextPos = fc.Random.default.getRangeFloored(0, 4);
        let nextArray;
        switch (_lastPlatform.position) {
            case PrimaAbgabeLW.PlatPos.lt:
                nextArray = [PrimaAbgabeLW.PlatPos.rt, PrimaAbgabeLW.PlatPos.mt, PrimaAbgabeLW.PlatPos.lm, PrimaAbgabeLW.PlatPos.lb];
                nextPlatformPosition = nextArray[ranNextPos];
                break;
            case PrimaAbgabeLW.PlatPos.mt:
                nextArray = [PrimaAbgabeLW.PlatPos.rt, PrimaAbgabeLW.PlatPos.rm, PrimaAbgabeLW.PlatPos.lt, PrimaAbgabeLW.PlatPos.lm];
                nextPlatformPosition = nextArray[ranNextPos];
                break;
            case PrimaAbgabeLW.PlatPos.rt:
                nextArray = [PrimaAbgabeLW.PlatPos.rb, PrimaAbgabeLW.PlatPos.mt, PrimaAbgabeLW.PlatPos.rm, PrimaAbgabeLW.PlatPos.lt];
                nextPlatformPosition = nextArray[ranNextPos];
                break;
            case PrimaAbgabeLW.PlatPos.lm:
                nextArray = [PrimaAbgabeLW.PlatPos.mt, PrimaAbgabeLW.PlatPos.mb, PrimaAbgabeLW.PlatPos.lt, PrimaAbgabeLW.PlatPos.lb];
                nextPlatformPosition = nextArray[ranNextPos];
                break;
            case PrimaAbgabeLW.PlatPos.rm:
                nextArray = [PrimaAbgabeLW.PlatPos.rt, PrimaAbgabeLW.PlatPos.mt, PrimaAbgabeLW.PlatPos.rb, PrimaAbgabeLW.PlatPos.mb];
                nextPlatformPosition = nextArray[ranNextPos];
                break;
            case PrimaAbgabeLW.PlatPos.lb:
                nextArray = [PrimaAbgabeLW.PlatPos.rb, PrimaAbgabeLW.PlatPos.mb, PrimaAbgabeLW.PlatPos.lm, PrimaAbgabeLW.PlatPos.lt];
                nextPlatformPosition = nextArray[ranNextPos];
                break;
            case PrimaAbgabeLW.PlatPos.mb:
                nextArray = [PrimaAbgabeLW.PlatPos.rb, PrimaAbgabeLW.PlatPos.rm, PrimaAbgabeLW.PlatPos.lm, PrimaAbgabeLW.PlatPos.lb];
                nextPlatformPosition = nextArray[ranNextPos];
                break;
            case PrimaAbgabeLW.PlatPos.rb:
                nextArray = [PrimaAbgabeLW.PlatPos.rt, PrimaAbgabeLW.PlatPos.rm, PrimaAbgabeLW.PlatPos.mb, PrimaAbgabeLW.PlatPos.lb];
                nextPlatformPosition = nextArray[ranNextPos];
                break;
        }
        return nextPlatformPosition;
    }
    function createStopper(_newPos, _coordinates, _plattformNumber) {
        let newStopper;
        let newStopper2;
        let secondStopper = false;
        switch (_newPos) {
            case PrimaAbgabeLW.PlatPos.lb:
                newStopper = new PrimaAbgabeLW.Stopper("Stopper", new fc.Vector3(_coordinates.x, _coordinates.y + 1.5, _coordinates.z - 2), new fc.Vector3(5, 3, 1), true, _plattformNumber); //rb
                newStopper2 = new PrimaAbgabeLW.Stopper("Stopper", new fc.Vector3(_coordinates.x - 2, _coordinates.y + 1.5, _coordinates.z), new fc.Vector3(1, 3, 5), true, _plattformNumber);
                secondStopper = true;
                break;
            case PrimaAbgabeLW.PlatPos.lm:
                newStopper = new PrimaAbgabeLW.Stopper("Stopper", new fc.Vector3(_coordinates.x - 2, _coordinates.y + 1.5, _coordinates.z), new fc.Vector3(1, 3, 5), true, _plattformNumber); //rm
                break;
            case PrimaAbgabeLW.PlatPos.lt:
                newStopper = new PrimaAbgabeLW.Stopper("Stopper", new fc.Vector3(_coordinates.x, _coordinates.y + 1.5, _coordinates.z + 2), new fc.Vector3(5, 3, 1), true, _plattformNumber); //rt
                newStopper2 = new PrimaAbgabeLW.Stopper("Stopper", new fc.Vector3(_coordinates.x - 2, _coordinates.y + 1.5, _coordinates.z), new fc.Vector3(1, 3, 5), true, _plattformNumber);
                secondStopper = true;
                break;
            case PrimaAbgabeLW.PlatPos.mt:
                newStopper = new PrimaAbgabeLW.Stopper("Stopper", new fc.Vector3(_coordinates.x, _coordinates.y + 1.5, _coordinates.z + 2), new fc.Vector3(5, 3, 1), true, _plattformNumber); // mt
                break;
            case PrimaAbgabeLW.PlatPos.mb:
                newStopper = new PrimaAbgabeLW.Stopper("Stopper", new fc.Vector3(_coordinates.x, _coordinates.y + 1.5, _coordinates.z - 2), new fc.Vector3(5, 3, 1), true, _plattformNumber); //mb
                break;
            case PrimaAbgabeLW.PlatPos.rb:
                newStopper = new PrimaAbgabeLW.Stopper("Stopper", new fc.Vector3(_coordinates.x + 2, _coordinates.y + 1.5, _coordinates.z), new fc.Vector3(1, 3, 5), true, _plattformNumber); //lb
                newStopper2 = new PrimaAbgabeLW.Stopper("Stopper", new fc.Vector3(_coordinates.x, _coordinates.y + 1.5, _coordinates.z - 2), new fc.Vector3(5, 3, 1), true, _plattformNumber);
                secondStopper = true;
                break;
            case PrimaAbgabeLW.PlatPos.rm:
                newStopper = new PrimaAbgabeLW.Stopper("Stopper", new fc.Vector3(_coordinates.x + 2, _coordinates.y + 1.5, _coordinates.z), new fc.Vector3(1, 3, 5), true, _plattformNumber); //lm
                break;
            case PrimaAbgabeLW.PlatPos.rt:
                newStopper = new PrimaAbgabeLW.Stopper("Stopper", new fc.Vector3(_coordinates.x + 2, _coordinates.y + 1.5, _coordinates.z), new fc.Vector3(1, 3, 5), true, _plattformNumber); //lt
                newStopper2 = new PrimaAbgabeLW.Stopper("Stopper", new fc.Vector3(_coordinates.x, _coordinates.y + 1.5, _coordinates.z + 2), new fc.Vector3(5, 3, 1), true, _plattformNumber);
                secondStopper = true;
                break;
        }
        allStopper.addChild(newStopper);
        if (secondStopper) {
            allStopper.addChild(newStopper2);
        }
    }
})(PrimaAbgabeLW || (PrimaAbgabeLW = {}));
//# sourceMappingURL=Main.js.map