"use strict";
var PrimaAbgabeLW;
(function (PrimaAbgabeLW) {
    var fc = FudgeCore;
    let GamePhase;
    (function (GamePhase) {
        GamePhase[GamePhase["Option"] = 0] = "Option";
        GamePhase[GamePhase["Running"] = 1] = "Running";
        GamePhase[GamePhase["Won"] = 2] = "Won";
        GamePhase[GamePhase["Lost"] = 3] = "Lost";
    })(GamePhase || (GamePhase = {}));
    let activePhase;
    let graph;
    let allPlatforms;
    let allStopper;
    let allDistractors;
    let allAnnoyingCubes;
    let disturberProb;
    let viewport;
    let thirdPerson;
    let cIsPressed;
    let cmpAvatar;
    let ray;
    let farEars;
    let farCamera;
    let transFarCamera;
    let iTriggerActivator;
    let mtxFarCam;
    let platformArray;
    let forward;
    let distractorAudio;
    let jumpAudio;
    let cmpBackgroundAudio;
    let difficulty;
    window.addEventListener("load", startInteractiveViewport);
    window.addEventListener("keyup", hndlJump);
    async function startInteractiveViewport() {
        await fc.Project.loadResourcesFromHTML();
        let jsonGraph = fc.Project.resources["Graph|2021-05-19T16:31:42.747Z|51435"];
        graph = jsonGraph;
        //console.log(graph);
        loadBaseData();
    }
    async function loadBaseData() {
        let baseJson = await fetch("../lvl/rootData.json");
        let baseData = await baseJson.json();
        let platformValue = document.getElementById("plattformCount");
        if (platformValue) {
            platformValue.value = "" + baseData["platformArray"];
        }
        disturberProb = baseData["disturberProb"];
        difficulty = baseData["difficulty"];
        cIsPressed = false;
        thirdPerson = true;
        PrimaAbgabeLW.createNewPlatform = false;
        iTriggerActivator = 0;
        PrimaAbgabeLW.isOnPLatform = false;
        //let disturberProbability: HTMLInputElement = <HTMLInputElement>document.getElementById("plattformCount");
        //if (platformValue) {
        //    disturberProbability.value = "" + baseData["disturberProb"];
        //}
        PrimaAbgabeLW.gameState.score = 0;
        PrimaAbgabeLW.triggerOn = false;
        PrimaAbgabeLW.audioIsRunning = false;
        if (localStorage.getItem("whackyHighScore") != null) {
            PrimaAbgabeLW.gameState.highscore = +localStorage.getItem("whackyHighScore");
        }
        else {
            localStorage.setItem("whackyHighScore", "" + 0);
            PrimaAbgabeLW.gameState.highscore = 0;
        }
        distractorAudio = new fc.Audio("../lvl/audio/Peng.mp3");
        jumpAudio = new fc.Audio("../lvl/audio/gotShot.mp3");
        hndlLoaded();
    }
    function hndlLoaded() {
        if (localStorage.getItem("whackyHighScore") == null) {
            localStorage.setItem("whackyHighScore", "0");
        }
        loadAllButtons();
        let canvas = document.querySelector("canvas");
        viewport = new FudgeCore.Viewport();
        PrimaAbgabeLW.cmpCamera = new FudgeCore.ComponentCamera();
        allPlatforms = new fc.Node("All Platforms");
        allStopper = new fc.Node("AllStopper");
        allDistractors = new fc.Node("All Distractors");
        allAnnoyingCubes = new fc.Node("All annoying Cubes");
        farEars = new fc.ComponentAudioListener();
        farCamera = new fc.Node("FarCamera");
        transFarCamera = new fc.ComponentTransform();
        mtxFarCam = new fc.Vector3(-20, 15, -20);
        PrimaAbgabeLW.avatar = new PrimaAbgabeLW.Avatar("Avatar");
        graph.addChild(PrimaAbgabeLW.avatar);
        cmpAvatar = PrimaAbgabeLW.avatar.getComponent(fc.ComponentRigidbody);
        PrimaAbgabeLW.avatar.addComponent(componentAudioJump());
        graph.addChild(allPlatforms);
        graph.addChild(allStopper);
        graph.addChild(allDistractors);
        graph.addChild(allAnnoyingCubes);
        transFarCamera.mtxLocal.translateY(15);
        transFarCamera.mtxLocal.translateX(-30);
        transFarCamera.mtxLocal.translateZ(-30);
        transFarCamera.mtxLocal.rotateY(45);
        transFarCamera.mtxLocal.rotateX(30);
        farCamera.addComponent(transFarCamera);
        farCamera.addComponent(PrimaAbgabeLW.cmpCamera);
        graph.addChild(farCamera);
        PrimaAbgabeLW.gameState.lives = PrimaAbgabeLW.avatar.lives;
        createPlatform();
        createRigidbodys();
        let backgroundAudio = new fc.Audio("../lvl/audio/Feels - Patrick Patrikios.mp3");
        cmpBackgroundAudio = createAudioComponentBackground(backgroundAudio);
        let distractor = new PrimaAbgabeLW.Distractor("Distractor", -1);
        distractor.mtxLocal.translateX(1);
        distractor.mtxLocal.translateY(1);
        allDistractors.appendChild(distractor);
        viewport.initialize("InteractiveViewport", graph, PrimaAbgabeLW.cmpCamera, canvas);
        PrimaAbgabeLW.Hud.start();
        fc.Physics.adjustTransforms(graph, true);
        fc.Loop.start(fc.LOOP_MODE.TIME_REAL, 30);
        fc.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, renderAFrame);
        fc.AudioManager.default.listenTo(graph);
        fc.AudioManager.default.listenWith(farEars);
    }
    function loadAllButtons() {
        let restartButton = document.getElementById("restart");
        if (restartButton) {
            restartButton.addEventListener("click", restartGame);
        }
        let pauseButton = document.getElementById("optionsButton");
        if (pauseButton) {
            pauseButton.addEventListener("click", hndlPauseReturn);
        }
        let startButton = document.getElementById("start");
        if (startButton) {
            startButton.addEventListener("click", hndlStart);
        }
        let returnButton = document.getElementById("return");
        if (returnButton) {
            returnButton.addEventListener("click", hndlReturn);
        }
    }
    function renderAFrame() {
        //fc.Physics.settings.debugDraw = true;
        fc.Physics.world.simulate(fc.Loop.timeFrameReal / 1000);
        if (iTriggerActivator > 15) {
            PrimaAbgabeLW.triggerOn = true;
        }
        else {
            iTriggerActivator++;
        }
        computeFarCamHight();
        ??.AudioManager.default.update();
        viewport.draw();
        switch (activePhase) {
            case GamePhase.Option:
                return;
                break;
            case GamePhase.Won:
                return;
                break;
            case GamePhase.Lost:
                activePhase = GamePhase.Option;
                hndlOptionsStart();
                break;
            case GamePhase.Running:
                break;
            default:
                activePhase = GamePhase.Option;
                hndlOptionsStart();
                break;
        }
        listenForKeys();
    }
    function listenForKeys() {
        let _offset = 100 * fc.Loop.timeFrameReal / 1000;
        forward = PrimaAbgabeLW.avatar.mtxWorld.getZ();
        try {
            ray = fc.Physics.raycast(PrimaAbgabeLW.avatar.mtxWorld.translation, new fc.Vector3(0, -1, 0), 1);
        }
        catch {
            console.log("no ray right now");
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.A]) && ray.hit && !PrimaAbgabeLW.avatar.isParalyzed) {
            cmpAvatar.rotateBody(new fc.Vector3(0, 2, 0));
            if (!PrimaAbgabeLW.audioIsRunning)
                soundOn();
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.D]) && ray.hit && !PrimaAbgabeLW.avatar.isParalyzed) {
            cmpAvatar.rotateBody(new fc.Vector3(0, -2, 0));
            if (!PrimaAbgabeLW.audioIsRunning)
                soundOn();
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.W]) && ray.hit && !PrimaAbgabeLW.avatar.isParalyzed) {
            cmpAvatar.setVelocity(fc.Vector3.SCALE(forward, _offset));
            if (!PrimaAbgabeLW.audioIsRunning)
                soundOn();
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.S]) && ray.hit && !PrimaAbgabeLW.avatar.isParalyzed) {
            cmpAvatar.setVelocity(fc.Vector3.SCALE(forward, -_offset));
            if (!PrimaAbgabeLW.audioIsRunning)
                soundOn();
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.E]) && !PrimaAbgabeLW.avatar.isParalyzed) {
            PrimaAbgabeLW.avatar.headMovement.mtxLocal.rotateX(-2);
            if (!PrimaAbgabeLW.audioIsRunning)
                soundOn();
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.R]) && !PrimaAbgabeLW.avatar.isParalyzed) {
            PrimaAbgabeLW.avatar.headMovement.mtxLocal.rotateX(2);
            if (!PrimaAbgabeLW.audioIsRunning)
                soundOn();
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.SPACE]) && ray.hit && !PrimaAbgabeLW.avatar.isParalyzed) {
            PrimaAbgabeLW.avatar.computeJumpForce();
            if (!PrimaAbgabeLW.audioIsRunning)
                soundOn();
        }
        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.C]) && !cIsPressed) {
            hndlCameraPerspective();
            cIsPressed = true;
            if (!PrimaAbgabeLW.audioIsRunning)
                soundOn();
        }
        if (!fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.C]) && cIsPressed) {
            cIsPressed = false;
            if (!PrimaAbgabeLW.audioIsRunning)
                soundOn();
        }
        /*if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.K]) && !kIsPressed) {
            callGetPlatformUp(0);
            kIsPressed = true;
            if (!audioIsRunning)
                soundOn();
        }
        if (!fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.K]) && kIsPressed) {
            kIsPressed = false;
            if (!audioIsRunning)
                soundOn();
        } */
    }
    function createRigidbodys() {
        let lvl = graph.getChildrenByName("lvl")[0];
        for (let lvlElement of lvl.getChildren()) {
            let cmpRigidbody = new fc.ComponentRigidbody(0, fc.PHYSICS_TYPE.STATIC, fc.COLLIDER_TYPE.CUBE);
            lvlElement.addComponent(cmpRigidbody);
            if (lvlElement.name == "ground") {
                let triggerInteraction = new ??.Node("TriggerInteraction");
                lvlElement.appendChild(triggerInteraction);
                triggerInteraction.addComponent(new ??.ComponentRigidbody(0, ??.PHYSICS_TYPE.KINEMATIC, ??.COLLIDER_TYPE.CUBE, ??.PHYSICS_GROUP.TRIGGER));
                triggerInteraction.addComponent(new ??.ComponentTransform());
                triggerInteraction.mtxLocal.scaleX(0.95);
                triggerInteraction.mtxLocal.scaleZ(0.95);
                triggerInteraction.mtxLocal.translateY(0.3);
                triggerInteraction.getComponent(??.ComponentRigidbody).addEventListener("TriggerEnteredCollision" /* TRIGGER_ENTER */, hndGroundTrigger);
            }
        }
    }
    function hndGroundTrigger(_event) {
        if (_event.cmpRigidbody.getContainer() == null) {
            return;
        }
        if (_event.cmpRigidbody.getContainer().name == "Avatar" && !PrimaAbgabeLW.isOnPLatform) {
            let annoyingCube = new PrimaAbgabeLW.AnnoyingCube("Annoying", new fc.Vector3(PrimaAbgabeLW.avatar.mtxWorld.translation.x, PrimaAbgabeLW.avatar.mtxWorld.translation.y, PrimaAbgabeLW.avatar.mtxWorld.translation.z), false);
            allAnnoyingCubes.addChild(annoyingCube);
        }
        if (_event.cmpRigidbody.getContainer().name == "Avatar" && PrimaAbgabeLW.isOnPLatform) {
            PrimaAbgabeLW.isOnPLatform = false;
            PrimaAbgabeLW.avatar.lives--;
            PrimaAbgabeLW.gameState.lives = PrimaAbgabeLW.avatar.lives;
            getPlattformDown();
            let annoyingCube = new PrimaAbgabeLW.AnnoyingCube("Annoying", new fc.Vector3(PrimaAbgabeLW.avatar.mtxWorld.translation.x, PrimaAbgabeLW.avatar.mtxWorld.translation.y, PrimaAbgabeLW.avatar.mtxWorld.translation.z), true);
            allAnnoyingCubes.addChild(annoyingCube);
        }
        if (PrimaAbgabeLW.avatar.lives == 0) {
            activePhase = GamePhase.Lost;
            alert("you loose");
            restartGame();
        }
    }
    function computeFarCamHight() {
        mtxFarCam.y = PrimaAbgabeLW.avatar.mtxWorld.translation.y + 15;
        transFarCamera.mtxLocal.translation = mtxFarCam;
    }
    function restartGame() {
        if (PrimaAbgabeLW.gameState.score > +localStorage.getItem("whackyHighScore")) {
            localStorage.setItem("whackyHighScore", "" + PrimaAbgabeLW.gameState.score);
        }
        clearAll();
        activePhase = GamePhase.Lost;
    }
    function clearAll() {
        PrimaAbgabeLW.avatar.removeComponent(PrimaAbgabeLW.avatar.getComponent(fc.ComponentRigidbody));
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
        }
        for (let i = 0; i < allStopper.getChildren().length; i++) {
            let stopper = allStopper.getChild(i);
            stopper.removeComponent(stopper.getComponent(fc.ComponentRigidbody));
        }
        for (let i = 0; i < allDistractors.getChildren().length; i++) {
            let distractor = allDistractors.getChild(i);
            distractor.removeComponent(distractor.getComponent(fc.ComponentRigidbody));
        }
        graph.removeAllChildren();
        graph = null;
    }
    function hndlJump(_event) {
        PrimaAbgabeLW.avatar.hndlJump(_event);
    }
    function hndlCameraPerspective() {
        if (thirdPerson) {
            thirdPerson = false;
            PrimaAbgabeLW.avatar.headMovement.addComponent(PrimaAbgabeLW.cmpCamera);
            fc.AudioManager.default.listenWith(PrimaAbgabeLW.avatar.headMovement.getComponent(??.ComponentAudioListener));
            PrimaAbgabeLW.avatar.headMovement.addComponent(cmpBackgroundAudio);
        }
        else if (!thirdPerson) {
            thirdPerson = true;
            farCamera.addComponent(PrimaAbgabeLW.cmpCamera);
            fc.AudioManager.default.listenWith(farEars);
            farCamera.addComponent(cmpBackgroundAudio);
        }
    }
    /*
    PLATFORMS
    */
    function getPlattformDown() {
        for (let i = 1; i < allPlatforms.getChildren().length; i++) {
            let platformDown = allPlatforms.getChild(i);
            if (platformDown.up) {
                platformDown.mtxLocal.translateY(-30 * platformDown.number);
                for (let i = 0; i < allStopper.getChildren().length; i++) {
                    let stopper = allStopper.getChild(i);
                    if (stopper.platformNumber == platformDown.number)
                        stopper.mtxLocal.translateY(-10 * platformDown.number);
                }
                for (let i = 0; i < allDistractors.getChildren().length; i++) {
                    let distractor = allDistractors.getChild(i);
                    if (distractor.platformNumber == platformDown.number)
                        distractor.mtxLocal.translateY(-30 * platformDown.number);
                }
                platformDown.activePlatform = false;
                platformDown.up = false;
            }
        }
        let newActive = allPlatforms.getChild(0);
        newActive.activePlatform = true;
    }
    function callGetPlatformUp(_oldIndex) {
        if (_oldIndex + 1 < platformArray.length) {
            getPlatformUp(allPlatforms.getChild(_oldIndex + 1));
        }
        else {
            activePhase = GamePhase.Won;
            alert("You Won!!");
            restartGame();
        }
    }
    PrimaAbgabeLW.callGetPlatformUp = callGetPlatformUp;
    function createPlatform() {
        try {
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
                let ranDistractor = fc.Random.default.getRangeFloored(0, 5);
                if (ranDistractor < disturberProb) {
                    let distractor = new PrimaAbgabeLW.Distractor("Distractor " + i, i);
                    allDistractors.addChild(distractor);
                    distractor.mtxLocal.translateX(platformArray[i].mtxLocal.translation.x);
                    distractor.mtxLocal.translateZ(platformArray[i].mtxLocal.translation.z);
                    distractor.mtxLocal.translateY(platformArray[i].mtxLocal.translation.y + 1);
                }
            }
        }
        catch {
            console.log("no platforms yet");
        }
    }
    function getPlatformUp(_platform) {
        _platform.mtxLocal.translateY(30 * _platform.number);
        _platform.activePlatform = true;
        _platform.up = true;
        for (let i = 0; i < allStopper.getChildren().length; i++) {
            let stopper = allStopper.getChild(i);
            if (stopper.platformNumber == _platform.number)
                stopper.mtxLocal.translateY(10 * _platform.number);
        }
        for (let i = 0; i < allDistractors.getChildren().length; i++) {
            let distractor = allDistractors.getChild(i);
            if (distractor.platformNumber == _platform.number)
                distractor.mtxLocal.translateY(30 * _platform.number);
        }
    }
    PrimaAbgabeLW.getPlatformUp = getPlatformUp;
    function computeNextPlatformCoordinates(_newPos, _lastPlatAltitude) {
        let nextPlatformCoordinates;
        let ranYPos;
        switch (difficulty) {
            case "easy":
                ranYPos = fc.Random.default.getRangeFloored(1, 3);
                break;
            case "medium":
                ranYPos = fc.Random.default.getRangeFloored(1, 4);
                break;
            case "hard":
                ranYPos = fc.Random.default.getRangeFloored(2, 6);
                break;
        }
        //console.log(ranYPos);
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
    function soundOn() {
        farCamera.addComponent(cmpBackgroundAudio);
        for (let distractor of allDistractors.getChildren()) {
            distractor.addComponent(componentAudioDistractor());
        }
        farCamera.addComponent(farEars);
        PrimaAbgabeLW.audioIsRunning = true;
    }
    function createAudioComponentBackground(_backgroundAudio) {
        let cmpAudio;
        cmpAudio = new fc.ComponentAudio(_backgroundAudio, true);
        cmpAudio.volume = 0.5;
        cmpAudio.play(true);
        return cmpAudio;
    }
    function componentAudioDistractor() {
        let cmpAudio;
        cmpAudio = new fc.ComponentAudio(distractorAudio, false);
        return cmpAudio;
    }
    function componentAudioJump() {
        let cmpAudio;
        cmpAudio = new fc.ComponentAudio(jumpAudio, false);
        return cmpAudio;
    }
    function hndlOptionsStart() {
        let options = document.getElementById("options");
        if (options) {
            options.style.display = "block";
        }
        let start = document.getElementById("start");
        if (start) {
            start.style.display = "block";
        }
        let returnButton = document.getElementById("return");
        if (returnButton) {
            returnButton.style.display = "none";
        }
        let labelProb = document.getElementById("disturberProbabilityLabel");
        if (labelProb) {
            labelProb.style.display = "block";
        }
        let inputProb = document.getElementById("disturberProbability");
        if (inputProb) {
            inputProb.style.display = "block";
        }
        let labelNumb = document.getElementById("plattformCountLabel");
        if (labelNumb) {
            labelNumb.style.display = "block";
        }
        let inputnumb = document.getElementById("plattformCount");
        if (inputnumb) {
            inputnumb.style.display = "block";
        }
        //console.log("options Start");
    }
    function hndlPauseReturn() {
        let options = document.getElementById("options");
        if (options) {
            options.style.display = "block";
        }
        let restart = document.getElementById("return");
        if (restart) {
            restart.style.display = "block";
        }
        let start = document.getElementById("start");
        if (start) {
            start.style.display = "none";
        }
        let labelProb = document.getElementById("disturberProbabilityLabel");
        if (labelProb) {
            labelProb.style.display = "none";
        }
        let inputProb = document.getElementById("disturberProbability");
        if (inputProb) {
            inputProb.style.display = "none";
        }
        let labelNumb = document.getElementById("plattformCountLabel");
        if (labelNumb) {
            labelNumb.style.display = "none";
        }
        let inputnumb = document.getElementById("plattformCount");
        if (inputnumb) {
            inputnumb.style.display = "none";
        }
        activePhase = GamePhase.Option;
        //console.log("options Return");
    }
    function hndlStart() {
        let options = document.getElementById("options");
        let start = document.getElementById("start");
        if (options) {
            options.style.display = "none";
        }
        if (start) {
            start.style.display = "none";
        }
        let platformValue = document.getElementById("plattformCount");
        if (platformValue) {
            //console.log(platformValue.value);
        }
        let disturberProbability = document.getElementById("disturberProbability");
        if (disturberProbability) {
            //console.log(disturberProbability.value);
        }
        activePhase = GamePhase.Running;
        try {
            clearAll();
        }
        catch {
            console.log("graph seams to be clean");
        }
        platformArray = new Array(+platformValue.value);
        //disturberProb = +disturberProbability.value;
        startInteractiveViewport();
    }
    function hndlReturn() {
        let options = document.getElementById("options");
        let returnButton = document.getElementById("return");
        if (options) {
            options.style.display = "none";
        }
        if (returnButton) {
            returnButton.style.display = "none";
        }
        activePhase = GamePhase.Running;
    }
})(PrimaAbgabeLW || (PrimaAbgabeLW = {}));
//# sourceMappingURL=Main.js.map