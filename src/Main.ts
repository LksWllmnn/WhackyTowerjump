namespace PrimaAbgabeLW {
    import fc = FudgeCore;

    interface BaseData {
        thirdPerson: true;
        cIsPressed: boolean;
        kIsPressed: boolean;
        isOnPLatform: boolean;
        platformArray: number;
        disturberProb: number;
        iTriggerActivator: number;
        triggerOn: boolean;
        createNewPlatform: boolean;
        score: number;
        audioIsRunning: boolean;
    }

    enum GamePhase {
        Option,
        Running,
        Won,
        Lost
    }

    let activePhase: GamePhase;
    
    let graph: fc.Graph;
    let allPlatforms: fc.Node; 
    let allStopper: fc.Node; 
    let allDistractors: fc.Node;

    let disturberProb: number;
    
    let viewport: fc.Viewport;
    export let cmpCamera: fc.ComponentCamera;

    let thirdPerson: boolean;
    let cIsPressed: boolean;
    //let kIsPressed: boolean;

    let cmpAvatar: fc.ComponentRigidbody; 
    export let avatar: Avatar;

    let ray: fc.RayHitInfo;

    let farEars: fc.ComponentAudioListener;
    let farCamera: fc.Node; 
    let transFarCamera: fc.ComponentTransform; 

    let iTriggerActivator: number;
    export let triggerOn: boolean;
    export let createNewPlatform: boolean;

    let mtxFarCam: fc.Vector3;

    export let isOnPLatform: boolean;

    let platformArray: Platform[];

    let forward: fc.Vector3;

    export let audioIsRunning: boolean;
    let distractorAudio: fc.Audio;
    let jumpAudio: fc.Audio;
    let cmpBackgroundAudio: fc.ComponentAudio;

    window.addEventListener("load", startInteractiveViewport);

    window.addEventListener("keyup", hndlJump);


    async function startInteractiveViewport(): Promise <void> {
        await fc.Project.loadResourcesFromHTML();
        let jsonGraph: fc.SerializableResource = fc.Project.resources["Graph|2021-05-19T16:31:42.747Z|51435"];
        graph = <fc.Graph>jsonGraph;
        //console.log(graph);
        loadBaseData();
    }

    async function loadBaseData(): Promise<void> {
        let baseJson: Response = await fetch("../lvl/rootData.json");
        let baseData: BaseData = await baseJson.json();
        cIsPressed = baseData["cIsPressed"];
        createNewPlatform = baseData["createNewPlatform"];
        iTriggerActivator = baseData["iTriggerActivator"];
        isOnPLatform = baseData["isOnPLatform"];
        //kIsPressed = baseData["kIsPressed"];

        let platformValue: HTMLInputElement = <HTMLInputElement>document.getElementById("plattformCount");
        if (platformValue) {
            platformValue.value = "" + baseData["platformArray"];
        }

        let disturberProbability: HTMLInputElement = <HTMLInputElement>document.getElementById("plattformCount");
        if (platformValue) {
            disturberProbability.value = "" + baseData["disturberProb"];
        }

        gameState.score = baseData["score"];
        thirdPerson = baseData["thirdPerson"];
        triggerOn = baseData["triggerOn"];
        audioIsRunning = baseData["audioIsRunning"];

        if (localStorage.getItem("whackyHighScore") != null) {
            gameState.highscore = +localStorage.getItem("whackyHighScore");
        } else {
            localStorage.setItem("whackyHighScore", "" + 0);
            gameState.highscore = 0;
        }
        
        distractorAudio = new fc.Audio("../lvl/audio/Peng.mp3");
        jumpAudio = new fc.Audio("../lvl/audio/gotShot.mp3");

        hndlLoaded();
    }

    function hndlLoaded(): void {
        if (localStorage.getItem("whackyHighScore") == null) {
            localStorage.setItem("whackyHighScore", "0");
        }

        loadAllButtons();

        let canvas: HTMLCanvasElement = document.querySelector("canvas");

        viewport = new FudgeCore.Viewport();
        cmpCamera = new FudgeCore.ComponentCamera();
        
        allPlatforms = new fc.Node("All Platforms");
        allStopper = new fc.Node("AllStopper");
        allDistractors = new fc.Node("All Distractors");

        farEars = new fc.ComponentAudioListener();
        farCamera = new fc.Node("FarCamera");
        transFarCamera = new fc.ComponentTransform();
        mtxFarCam = new fc.Vector3(-20, 15, -20);

        avatar = new Avatar("Avatar");
        graph.addChild(avatar);
        cmpAvatar = avatar.getComponent(fc.ComponentRigidbody);
        avatar.addComponent(componentAudioJump());

        graph.addChild(allPlatforms);
        graph.addChild(allStopper);
        graph.addChild(allDistractors);
        
        transFarCamera.mtxLocal.translateY(15);
        transFarCamera.mtxLocal.translateX(-30);
        transFarCamera.mtxLocal.translateZ(-30);
        transFarCamera.mtxLocal.rotateY(45);
        transFarCamera.mtxLocal.rotateX(30);

        farCamera.addComponent(transFarCamera);
        
        farCamera.addComponent(cmpCamera);
        graph.addChild(farCamera);

        gameState.lives = avatar.lives;

        createPlatform();
        createRigidbodys();
        
        let backgroundAudio: fc.Audio = new fc.Audio("../lvl/audio/Feels - Patrick Patrikios.mp3");
        cmpBackgroundAudio = createAudioComponentBackground(backgroundAudio);

        let distractor: Distractor = new Distractor("Distractor", -1);
        distractor.mtxLocal.translateX(1);
        distractor.mtxLocal.translateY(1);
        allDistractors.appendChild(distractor);

        viewport.initialize("InteractiveViewport", graph, cmpCamera, canvas);

        console.log(graph);

        Hud.start();
       
        fc.Physics.adjustTransforms(graph, true);

        fc.Loop.start(fc.LOOP_MODE.TIME_REAL, 30);
        fc.Loop.addEventListener(fc.EVENT.LOOP_FRAME, renderAFrame);

        fc.AudioManager.default.listenTo(graph);
        fc.AudioManager.default.listenWith(farEars);
    }

    function loadAllButtons(): void {
        let restartButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("restart");
        if (restartButton) {
            restartButton.addEventListener("click", restartGame);
        }
        let pauseButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("optionsButton");
        if (pauseButton) {
            pauseButton.addEventListener("click", hndlPauseReturn);
        }

        let startButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("start");
        if (startButton) {
            startButton.addEventListener("click", hndlStart);
        }

        let returnButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("return");
        if (returnButton) {
            returnButton.addEventListener("click", hndlReturn);
        }
    }

    function renderAFrame(): void {
        fc.Physics.world.simulate(fc.Loop.timeFrameReal / 1000);
        //console.log(activePhase);
        if (iTriggerActivator > 15) {
            triggerOn = true;
        } else {
            iTriggerActivator++;
        }   
        
        computeFarCamHight();
        
        ƒ.AudioManager.default.update();
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

    function listenForKeys(): void {
        let _offset: number = 100 * fc.Loop.timeFrameReal / 1000;

        forward = avatar.mtxWorld.getZ();

        try {
            ray = fc.Physics.raycast(avatar.mtxWorld.translation, new fc.Vector3(0, -1, 0), 1);
        } catch {
            console.log("no ray right now");
        }
        

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.A]) && ray.hit && !avatar.isParalyzed) {
            
            cmpAvatar.rotateBody(new fc.Vector3(0, 2, 0));
            if (!audioIsRunning)
                soundOn();
        }

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.D]) && ray.hit && !avatar.isParalyzed) {       
            cmpAvatar.rotateBody(new fc.Vector3(0, -2, 0));
            if (!audioIsRunning)
                soundOn();
        }

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.W ]) && ray.hit && !avatar.isParalyzed) {
            cmpAvatar.setVelocity(fc.Vector3.SCALE(forward, _offset));
            if (!audioIsRunning)
                soundOn();
        }

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.S]) && ray.hit && !avatar.isParalyzed) {
            cmpAvatar.setVelocity(fc.Vector3.SCALE(forward, -_offset));
            if (!audioIsRunning)
                soundOn();
        }

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.E]) && !avatar.isParalyzed) {
            avatar.headMovement.mtxLocal.rotateX(-2);
            if (!audioIsRunning)
                soundOn();
        }

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.R]) && !avatar.isParalyzed) {
            avatar.headMovement.mtxLocal.rotateX(2);
            if (!audioIsRunning)
                soundOn();
        }

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.SPACE]) && ray.hit && !avatar.isParalyzed) {
            avatar.computeJumpForce();
            if (!audioIsRunning)
                soundOn();
        }

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.C]) && !cIsPressed) {
            hndlCameraPerspective();
            cIsPressed = true;
            if (!audioIsRunning)
                soundOn();
        }
        if (!fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.C]) && cIsPressed) {
            cIsPressed = false;
            if (!audioIsRunning)
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

    function createRigidbodys(): void {
        let lvl: fc.Node = graph.getChildrenByName("lvl")[0];
        for (let lvlElement of lvl.getChildren()) {
            let cmpRigidbody: fc.ComponentRigidbody = new fc.ComponentRigidbody(0, fc.PHYSICS_TYPE.STATIC, fc.COLLIDER_TYPE.CUBE);
            lvlElement.addComponent(cmpRigidbody);

            if (lvlElement.name == "ground") {
                let triggerInteraction: ƒ.Node = new ƒ.Node("TriggerInteraction");
                lvlElement.appendChild(triggerInteraction);
                triggerInteraction.addComponent(new ƒ.ComponentRigidbody(0, ƒ.PHYSICS_TYPE.KINEMATIC, ƒ.COLLIDER_TYPE.CUBE, ƒ.PHYSICS_GROUP.TRIGGER));
                triggerInteraction.addComponent(new ƒ.ComponentTransform());
                triggerInteraction.mtxLocal.scaleX(0.95);
                triggerInteraction.mtxLocal.scaleZ(0.95);
                triggerInteraction.mtxLocal.translateY(0.3);
                triggerInteraction.getComponent(ƒ.ComponentRigidbody).addEventListener(ƒ.EVENT_PHYSICS.TRIGGER_ENTER, hndGroundTrigger);
            }
        }
    }

    function hndGroundTrigger(_event: fc.EventPhysics): void {
        if (_event.cmpRigidbody.getContainer() == null) {
            return;
        }
        
        if (_event.cmpRigidbody.getContainer().name == "Avatar" && isOnPLatform) {
            isOnPLatform = false;
            avatar.lives--;
            gameState.lives = avatar.lives;
            getPlattformDown();
        }
        
        if (avatar.lives == 0) {
            activePhase = GamePhase.Lost;
            alert("you loose");
            restartGame();
        }
    }

    function computeFarCamHight(): void {
        mtxFarCam.y = avatar.mtxWorld.translation.y + 15;
        transFarCamera.mtxLocal.translation = mtxFarCam;
    }

    function restartGame(): void {
        if (gameState.score > +localStorage.getItem("whackyHighScore")) {
            localStorage.setItem("whackyHighScore", "" + gameState.score);
        } 
        clearAll();
        activePhase = GamePhase.Lost;
    }

    function clearAll(): void {
        avatar.removeComponent(avatar.getComponent(fc.ComponentRigidbody));
            
        let lvl: fc.Node = graph.getChildrenByName("lvl")[0];
        for (let lvlElement of lvl.getChildren()) {
            if (lvlElement.name == "ground") {
                lvlElement.getChild(0).removeComponent(lvlElement.getChild(0).getComponent(fc.ComponentRigidbody));
            }
            lvlElement.removeComponent(lvlElement.getComponent(fc.ComponentRigidbody)); 
        }

        for (let i: number = 0; i < allPlatforms.getChildren().length; i++) {
            let platform: Platform = allPlatforms.getChild(i) as Platform;
            platform.getChild(0).removeComponent(platform.getChild(0).getComponent(fc.ComponentRigidbody));
            platform.removeComponent(platform.getComponent(fc.ComponentRigidbody));
        }

        for (let i: number = 0; i < allStopper.getChildren().length; i++) {
            let stopper: Stopper = allStopper.getChild(i) as Stopper;
            stopper.removeComponent(stopper.getComponent(fc.ComponentRigidbody));
        }

        for (let i: number = 0; i < allDistractors.getChildren().length; i++) {
            let distractor: Distractor = allDistractors.getChild(i) as Distractor;
            distractor.removeComponent(distractor.getComponent(fc.ComponentRigidbody));
        }

        graph.removeAllChildren();
        graph = null;
    }

    function hndlJump(_event: KeyboardEvent): void {
        avatar.hndlJump(_event);
    }

    function hndlCameraPerspective(): void {
        if (thirdPerson) {
            thirdPerson = false;
            avatar.headMovement.addComponent(cmpCamera);
            fc.AudioManager.default.listenWith(avatar.headMovement.getComponent(ƒ.ComponentAudioListener));
            avatar.headMovement.addComponent(cmpBackgroundAudio);
        } else if (!thirdPerson) {
            thirdPerson = true;
            farCamera.addComponent(cmpCamera);
            fc.AudioManager.default.listenWith(farEars);
            farCamera.addComponent(cmpBackgroundAudio);
        }
    }

    /*
    PLATFORMS
    */
    function getPlattformDown(): void {
        for (let i: number = 1; i < allPlatforms.getChildren().length; i++) {
            
            let platformDown: Platform = allPlatforms.getChild(i) as Platform;
            
            if (platformDown.up) {
                platformDown.mtxLocal.translateY(-30 * platformDown.number);
                
    
                for (let i: number = 0; i < allStopper.getChildren().length; i++) {
                    let stopper: Stopper = allStopper.getChild(i) as Stopper;
                    if (stopper.platformNumber == platformDown.number)
                        stopper.mtxLocal.translateY(-10 * platformDown.number);
                }

                for (let i: number = 0; i < allDistractors.getChildren().length; i++) {
                    let distractor: Distractor = allDistractors.getChild(i) as Distractor;
                    if (distractor.platformNumber == platformDown.number)
                        distractor.mtxLocal.translateY(-30 * platformDown.number);
                }

                platformDown.activePlatform = false;
                platformDown.up = false;
            }
        }     

        let newActive: Platform = allPlatforms.getChild(0) as Platform ;
        newActive.activePlatform = true;
    }

    export function callGetPlatformUp(_oldIndex: number): void {
        if (_oldIndex + 1 < platformArray.length) {
            getPlatformUp(allPlatforms.getChild(_oldIndex + 1) as Platform);
        } else {
            activePhase = GamePhase.Won;
            alert("You Won!!");
            restartGame();
        }
    }

    function createPlatform(): void {
        try {
            let platformCoordinates: fc.Vector3;
            let platformPos: PlatPos;
        
            for (let i: number = 0; i < platformArray.length; i++) {
                if (i == 0) {
                    platformCoordinates = new fc.Vector3(7, 1, 7);
                    platformPos = PlatPos.rt;
                } else {
                    platformPos = computenextPlatformPosition(platformArray[i - 1]);
                    platformCoordinates = computeNextPlatformCoordinates(platformPos, platformArray[i - 1].mtxLocal.translation.y - 30 );
                }
            
                if (i == platformArray.length - 1) {
                    platformArray[i] = new Platform("platform" + i, platformCoordinates, new fc.Vector3(5, 1, 5), false, i, platformPos, false, true);
                } else {
                    platformArray[i] = new Platform("platform" + i, platformCoordinates, new fc.Vector3(5, 1, 5), false, i, platformPos, false, false);
                }

                if (i == 0) {
                    platformArray[i].activePlatform = true;
                    platformArray[i].up = true;
                }
                allPlatforms.addChild(platformArray[i]);
                createStopper(platformArray[i].position, platformArray[i].mtxLocal.translation, platformArray[i].number);

                let ranDistractor: number = fc.Random.default.getRangeFloored(0, 5);
                if (ranDistractor < disturberProb) {
                    let distractor: Distractor = new Distractor("Distractor " + i, i);
                    allDistractors.addChild(distractor);
                    distractor.mtxLocal.translateX(platformArray[i].mtxLocal.translation.x);
                    distractor.mtxLocal.translateZ(platformArray[i].mtxLocal.translation.z);
                    distractor.mtxLocal.translateY(platformArray[i].mtxLocal.translation.y + 1);
                }
            }
        } catch {
            console.log("no platforms yet");
        }
    }

    export function getPlatformUp(_platform: Platform): void {
        _platform.mtxLocal.translateY(30 * _platform.number);
        
        _platform.activePlatform = true;
        _platform.up = true;

        for (let i: number = 0; i < allStopper.getChildren().length; i++) {
            let stopper: Stopper = allStopper.getChild(i) as Stopper;
            if (stopper.platformNumber == _platform.number)
                stopper.mtxLocal.translateY(10 * _platform.number);
        }

        for (let i: number = 0; i < allDistractors.getChildren().length; i++) {
            let distractor: Distractor = allDistractors.getChild(i) as Distractor;
            if (distractor.platformNumber == _platform.number)
                distractor.mtxLocal.translateY(30 * _platform.number);
        }
    }

    function computeNextPlatformCoordinates(_newPos: PlatPos, _lastPlatAltitude: number): fc.Vector3 {
        let nextPlatformCoordinates: fc.Vector3;

        let ranYPos: number = fc.Random.default.getRangeFloored(2, 3);

        switch (_newPos) {
            case PlatPos.lt:
                nextPlatformCoordinates = new fc.Vector3 ( -7, _lastPlatAltitude + ranYPos, 7);
                break;
            case PlatPos.mt:
                nextPlatformCoordinates = new fc.Vector3 ( 0, _lastPlatAltitude + ranYPos, 7);
                break;
            case PlatPos.rt:
                nextPlatformCoordinates = new fc.Vector3 ( 7, _lastPlatAltitude + ranYPos, 7);
                break;
            case PlatPos.lm:
                nextPlatformCoordinates = new fc.Vector3 ( -7, _lastPlatAltitude + ranYPos, 0);
                break;
            case PlatPos.rm:
                nextPlatformCoordinates = new fc.Vector3 ( 7, _lastPlatAltitude + ranYPos, 0);
                break;
            case PlatPos.lb:
                nextPlatformCoordinates = new fc.Vector3 ( -7, _lastPlatAltitude + ranYPos, -7);
                break;
            case PlatPos.mb:
                nextPlatformCoordinates = new fc.Vector3 ( 0, _lastPlatAltitude + ranYPos, -7);
                break;
            case PlatPos.rb:
                nextPlatformCoordinates = new fc.Vector3 ( 7, _lastPlatAltitude + ranYPos, -7); 
                break;
        }
        return nextPlatformCoordinates ;
    }

    function computenextPlatformPosition(_lastPlatform: Platform): PlatPos {
        let nextPlatformPosition: PlatPos;
        let ranNextPos: number = fc.Random.default.getRangeFloored(0, 4);

        let nextArray: PlatPos[];

        switch (_lastPlatform.position) {
                case PlatPos.lt:
                    nextArray = [PlatPos.rt, PlatPos.mt, PlatPos.lm, PlatPos.lb];
                    nextPlatformPosition = nextArray[ranNextPos];
                    break;
                case PlatPos.mt:
                    nextArray = [PlatPos.rt, PlatPos.rm, PlatPos.lt, PlatPos.lm];
                    nextPlatformPosition = nextArray[ranNextPos];
                    break;
                case PlatPos.rt:
                    nextArray = [PlatPos.rb, PlatPos.mt, PlatPos.rm, PlatPos.lt];
                    nextPlatformPosition = nextArray[ranNextPos];
                    break;
                case PlatPos.lm:
                    nextArray = [PlatPos.mt, PlatPos.mb, PlatPos.lt, PlatPos.lb];
                    nextPlatformPosition = nextArray[ranNextPos];
                    break;
                case PlatPos.rm:
                    nextArray = [PlatPos.rt, PlatPos.mt, PlatPos.rb, PlatPos.mb];
                    nextPlatformPosition = nextArray[ranNextPos];
                    break;
                case PlatPos.lb:
                    nextArray = [PlatPos.rb, PlatPos.mb, PlatPos.lm, PlatPos.lt];
                    nextPlatformPosition = nextArray[ranNextPos];
                    break;
                case PlatPos.mb:
                    nextArray = [PlatPos.rb, PlatPos.rm, PlatPos.lm, PlatPos.lb];
                    nextPlatformPosition = nextArray[ranNextPos];
                    break;
                case PlatPos.rb:
                    nextArray = [PlatPos.rt, PlatPos.rm, PlatPos.mb, PlatPos.lb];
                    nextPlatformPosition = nextArray[ranNextPos];
                    break;
        }
        return nextPlatformPosition;
    }

    function createStopper(_newPos: PlatPos, _coordinates: fc.Vector3, _plattformNumber: number): void {
        let newStopper: Stopper;
        let newStopper2: Stopper;

        let secondStopper: boolean = false;
        
        switch (_newPos) {
            case PlatPos.lb:
                newStopper = new Stopper("Stopper", new fc.Vector3(_coordinates.x, _coordinates.y + 1.5, _coordinates.z - 2), new fc.Vector3(5, 3, 1), true, _plattformNumber); //rb
                newStopper2 = new Stopper("Stopper", new fc.Vector3(_coordinates.x - 2, _coordinates.y + 1.5, _coordinates.z ), new fc.Vector3(1, 3, 5), true, _plattformNumber);
                secondStopper = true;
                break;
            case PlatPos.lm:
                newStopper = new Stopper("Stopper", new fc.Vector3(_coordinates.x - 2, _coordinates.y + 1.5, _coordinates.z ), new fc.Vector3(1, 3, 5), true, _plattformNumber); //rm
                break;
            case PlatPos.lt:
                newStopper = new Stopper("Stopper", new fc.Vector3(_coordinates.x, _coordinates.y + 1.5, _coordinates.z + 2), new fc.Vector3(5, 3, 1), true, _plattformNumber); //rt
                newStopper2 = new Stopper("Stopper", new fc.Vector3(_coordinates.x - 2, _coordinates.y + 1.5, _coordinates.z ), new fc.Vector3(1, 3, 5), true, _plattformNumber);
                secondStopper = true;
                break;
            case PlatPos.mt:
                newStopper = new Stopper("Stopper", new fc.Vector3(_coordinates.x, _coordinates.y + 1.5, _coordinates.z + 2), new fc.Vector3(5, 3, 1), true, _plattformNumber); // mt
                break;
            
            case PlatPos.mb:
                newStopper = new Stopper("Stopper", new fc.Vector3(_coordinates.x, _coordinates.y + 1.5, _coordinates.z - 2), new fc.Vector3(5, 3, 1), true, _plattformNumber); //mb
                break;
            
            case PlatPos.rb:
                newStopper = new Stopper("Stopper", new fc.Vector3(_coordinates.x + 2, _coordinates.y + 1.5, _coordinates.z ), new fc.Vector3(1, 3, 5), true, _plattformNumber); //lb
                newStopper2 = new Stopper("Stopper", new fc.Vector3(_coordinates.x, _coordinates.y + 1.5, _coordinates.z - 2), new fc.Vector3(5, 3, 1), true, _plattformNumber);
                secondStopper = true;
                break;
            case PlatPos.rm:
                newStopper = new Stopper("Stopper", new fc.Vector3(_coordinates.x + 2, _coordinates.y + 1.5, _coordinates.z ), new fc.Vector3(1, 3, 5), true, _plattformNumber); //lm
                break; 
            case PlatPos.rt:
                newStopper = new Stopper("Stopper", new fc.Vector3(_coordinates.x + 2, _coordinates.y + 1.5, _coordinates.z ), new fc.Vector3(1, 3, 5), true, _plattformNumber); //lt
                newStopper2 = new Stopper("Stopper", new fc.Vector3(_coordinates.x, _coordinates.y + 1.5, _coordinates.z + 2), new fc.Vector3(5, 3, 1), true, _plattformNumber);
                secondStopper = true;
                break;
        }

        allStopper.addChild(newStopper);
        if (secondStopper) {
            allStopper.addChild(newStopper2);
        }   
    }


    function soundOn(): void {
        farCamera.addComponent(cmpBackgroundAudio);
        for (let distractor of allDistractors.getChildren()) {
            distractor.addComponent(componentAudioDistractor());
        }
        farCamera.addComponent(farEars);
        audioIsRunning = true;
    }

    function createAudioComponentBackground(_backgroundAudio: fc.Audio): fc.ComponentAudio {
        let cmpAudio: fc.ComponentAudio;
        cmpAudio = new fc.ComponentAudio(_backgroundAudio, true);
        cmpAudio.volume = 0.5;
        cmpAudio.play(true);
        return cmpAudio;
    }

    function componentAudioDistractor (): fc.ComponentAudio {
        let cmpAudio: fc.ComponentAudio;
        cmpAudio = new fc.ComponentAudio(distractorAudio, false);
        return cmpAudio;
    }

    function componentAudioJump(): fc.ComponentAudio {
        let cmpAudio: fc.ComponentAudio;
        cmpAudio = new fc.ComponentAudio(jumpAudio, false);
        return cmpAudio;
    }

    function hndlOptionsStart(): void {
        let options: HTMLDivElement = <HTMLDivElement>document.getElementById("options");
        if (options) {
            options.style.display = "block";
        }
        let start: HTMLButtonElement = <HTMLButtonElement>document.getElementById("start");
        if (start) {
            start.style.display = "block";
        }
        let returnButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("return");
        if (returnButton) {
            returnButton.style.display = "none";
        } 

        let labelProb: HTMLLabelElement = <HTMLLabelElement>document.getElementById("disturberProbabilityLabel");
        if (labelProb) {
            labelProb.style.display = "block";
        }
        let inputProb: HTMLInputElement = <HTMLInputElement>document.getElementById("disturberProbability");
        if (inputProb) {
            inputProb.style.display = "block";
        }
        let labelNumb: HTMLLabelElement = <HTMLLabelElement>document.getElementById("plattformCountLabel");
        if (labelNumb) {
            labelNumb.style.display = "block";
        }
        let inputnumb: HTMLInputElement = <HTMLInputElement>document.getElementById("plattformCount");
        if (inputnumb) {
            inputnumb.style.display = "block";
        }

        //console.log("options Start");
    }

    function hndlPauseReturn(): void {
        let options: HTMLDivElement = <HTMLDivElement>document.getElementById("options");
        if (options) {
            options.style.display = "block";
        }

        let restart: HTMLButtonElement = <HTMLButtonElement>document.getElementById("return");
        if (restart) {
            restart.style.display = "block";
        }

        let start: HTMLButtonElement = <HTMLButtonElement>document.getElementById("start");
        if (start) {
            start.style.display = "none";
        }

        let labelProb: HTMLLabelElement = <HTMLLabelElement>document.getElementById("disturberProbabilityLabel");
        if (labelProb) {
            labelProb.style.display = "none";
        }
        let inputProb: HTMLInputElement = <HTMLInputElement>document.getElementById("disturberProbability");
        if (inputProb) {
            inputProb.style.display = "none";
        }
        let labelNumb: HTMLLabelElement = <HTMLLabelElement>document.getElementById("plattformCountLabel");
        if (labelNumb) {
            labelNumb.style.display = "none";
        }
        let inputnumb: HTMLInputElement = <HTMLInputElement>document.getElementById("plattformCount");
        if (inputnumb) {
            inputnumb.style.display = "none";
        }

        activePhase = GamePhase.Option;
        //console.log("options Return");
    }

    function hndlStart(): void {
        let options: HTMLDivElement = <HTMLDivElement>document.getElementById("options");
        let start: HTMLButtonElement = <HTMLButtonElement>document.getElementById("start");
        if (options) {
            options.style.display = "none";
        }
        if (start) {
            start.style.display = "none";
        }

        let platformValue: HTMLInputElement = <HTMLInputElement>document.getElementById("plattformCount");
        if (platformValue) {
            //console.log(platformValue.value);
        }
        let disturberProbability: HTMLInputElement = <HTMLInputElement>document.getElementById("disturberProbability");
        if (disturberProbability) {
            //console.log(disturberProbability.value);
        }

        
        activePhase = GamePhase.Running;
        
        try {
            clearAll();
        } catch {
            console.log("graph seams to be clean");
        }
        platformArray = new Array(+platformValue.value);
        disturberProb = +disturberProbability.value;

        startInteractiveViewport();
    }

    function hndlReturn(): void {
        let options: HTMLDivElement = <HTMLDivElement>document.getElementById("options");
        let returnButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("return");
        if (options) {
            options.style.display = "none";
        }
        if (returnButton) {
            returnButton.style.display = "none";
        }
        activePhase = GamePhase.Running;
    }
}