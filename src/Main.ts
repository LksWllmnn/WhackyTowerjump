namespace PrimaAbgabeLW {
    import fc = FudgeCore;

    interface BaseData {
        thirdPerson: true;
        cIsPressed: boolean;
        kIsPressed: boolean;
        isOnPLatform: boolean;
        platformArray: number;
        iTriggerActivator: number;
        triggerOn: boolean;
        createNewPlatform: boolean;
        score: number;
    }
    
    let graph: fc.Graph;
    let allPlatforms: fc.Node; 
    let allStopper: fc.Node; 
    let allDistractors: fc.Node;
    
    let viewport: fc.Viewport;
    export let cmpCamera: fc.ComponentCamera;

    let thirdPerson: boolean;
    let cIsPressed: boolean;
    let kIsPressed: boolean;

    let cmpAvatar: fc.ComponentRigidbody; 
    export let avatar: Avatar;

    let ray: fc.RayHitInfo;

    let farCamera: fc.Node; 
    let transFarCamera: fc.ComponentTransform; 

    let iTriggerActivator: number;
    export let triggerOn: boolean;
    export let createNewPlatform: boolean;

    let mtxFarCam: fc.Vector3;

    export let isOnPLatform: boolean;

    let platformArray: Platform[];

    let forward: fc.Vector3;

    window.addEventListener("load", startInteractiveViewport);

    window.addEventListener("keyup", hndlJump);

    let restartButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("restart");
    if (restartButton) {
        restartButton.addEventListener("click", restartGame);
    }

    async function startInteractiveViewport(): Promise <void> {
        await fc.Project.loadResourcesFromHTML();
        let jsonGraph: fc.SerializableResource = fc.Project.resources["Graph|2021-05-19T16:31:42.747Z|51435"];
        graph = <fc.Graph>jsonGraph;
        console.log(graph);
        loadBaseData();
    }

    async function loadBaseData(): Promise<void> {
        let baseJson: Response = await fetch("../lvl/rootData.json");
        let baseData: BaseData = await baseJson.json();
        cIsPressed = baseData["cIsPressed"];
        createNewPlatform = baseData["createNewPlatform"];
        iTriggerActivator = baseData["iTriggerActivator"];
        isOnPLatform = baseData["isOnPLatform"];
        kIsPressed = baseData["kIsPressed"];
        platformArray = new Array(baseData["platformArray"]);
        gameState.score = baseData["score"];
        thirdPerson = baseData["thirdPerson"];
        triggerOn = baseData["triggerOn"];

        hndlLoaded();
    }

    function hndlLoaded(): void {
        fc.Physics.settings.debugDraw = true;

        loadAllButtons();

        let canvas: HTMLCanvasElement = document.querySelector("canvas");

        viewport = new FudgeCore.Viewport();
        cmpCamera = new FudgeCore.ComponentCamera();
        
        allPlatforms = new fc.Node("All Platforms");
        allStopper = new fc.Node("AllStopper");
        allDistractors = new fc.Node("All Distractors");

        farCamera = new fc.Node("FarCamera");
        transFarCamera = new fc.ComponentTransform();
        mtxFarCam = new fc.Vector3(-20, 15, -20);

        avatar = new Avatar("Avatar");
        graph.addChild(avatar);
        cmpAvatar = avatar.getComponent(fc.ComponentRigidbody);

        graph.addChild(allPlatforms);
        graph.addChild(allStopper);
        graph.addChild(allDistractors);
        
        transFarCamera.mtxLocal.translateY(15);
        transFarCamera.mtxLocal.translateX(-30);
        transFarCamera.mtxLocal.translateZ(-30);
        transFarCamera.mtxLocal.rotateY(45);
        transFarCamera.mtxLocal.rotateX(35);
        transFarCamera.mtxLocal.rotateZ(0);

        farCamera.addComponent(transFarCamera);
        
        farCamera.addComponent(cmpCamera);
        graph.addChild(farCamera);

        gameState.lives = avatar.lives;

        createRigidbodys();
        createPlatform();

        let distractor: Distractor = new Distractor("Distractor", -1);
        distractor.mtxLocal.translateX(1);
        distractor.mtxLocal.translateY(1);
        graph.appendChild(distractor);

        viewport.initialize("InteractiveViewport", graph, cmpCamera, canvas);

        Hud.start();
       
        fc.Physics.adjustTransforms(graph, true);

        fc.Loop.start(fc.LOOP_MODE.TIME_REAL, 30);
        fc.Loop.addEventListener(fc.EVENT.LOOP_FRAME, renderAFrame);

        fc.AudioManager.default.listenTo(graph);
        fc.AudioManager.default.listenWith(avatar.headMovement.getComponent(ƒ.ComponentAudioListener));
    }

    function loadAllButtons(): void {
        let restartButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById("restart");
        if (restartButton) {
            restartButton.addEventListener("click", restartGame);
        }
    }

    function renderAFrame(): void {
        
        if (graph == null) {
            startInteractiveViewport();
            return;
        }
        
        fc.Physics.world.simulate(fc.Loop.timeFrameReal / 1000);
        
        if (iTriggerActivator > 15) {
            triggerOn = true;
        } else {
            iTriggerActivator++;
        }   
        
        computeFarCamHight();
        listenForKeys();
        viewport.draw();

        fc.Physics.settings.debugDraw = true;
    }

    function listenForKeys(): void {
        let _offset: number = 100 * fc.Loop.timeFrameReal / 1000;

        forward = avatar.mtxWorld.getZ();

        ray = fc.Physics.raycast(avatar.mtxWorld.translation, new fc.Vector3(0, -1, 0), 1);

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.A]) && ray.hit && !avatar.isParalyzed) {
            cmpAvatar.rotateBody(new fc.Vector3(0, 2, 0));
        }

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.D]) && ray.hit && !avatar.isParalyzed) {       
            cmpAvatar.rotateBody(new fc.Vector3(0, -2, 0));
        }

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.W ]) && ray.hit && !avatar.isParalyzed) {
            cmpAvatar.setVelocity(fc.Vector3.SCALE(forward, _offset));
        }

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.S]) && ray.hit && !avatar.isParalyzed) {
            cmpAvatar.setVelocity(fc.Vector3.SCALE(forward, -_offset));
        }

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.E]) && !avatar.isParalyzed) {
            avatar.headMovement.mtxLocal.rotateX(-2);
        }

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.R]) && !avatar.isParalyzed) {
            avatar.headMovement.mtxLocal.rotateX(2);
        }

        if (fc.Keyboard.isPressedOne([fc.KEYBOARD_CODE.SPACE]) && ray.hit && !avatar.isParalyzed) {
            avatar.computeJumpForce();
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
            console.log("you loose");
            restartGame();
        }
    }

    function computeFarCamHight(): void {
        mtxFarCam.y = avatar.mtxWorld.translation.y + 15;
        transFarCamera.mtxLocal.translation = mtxFarCam;
    }

    function restartGame(): void {
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
        } else if (!thirdPerson) {
            thirdPerson = true;
            farCamera.addComponent(cmpCamera);
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
            alert("You Won!!");
            restartGame();
        }
    }

    function createPlatform(): void {
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

            let ranDistractor: number = fc.Random.default.getRangeFloored(0, 2);
            if (ranDistractor == 1) {
                let distractor: Distractor = new Distractor("Distractor " + i, i);
                allDistractors.addChild(distractor);
                distractor.mtxLocal.translateX(platformArray[i].mtxLocal.translation.x);
                distractor.mtxLocal.translateZ(platformArray[i].mtxLocal.translation.z);
                distractor.mtxLocal.translateY(platformArray[i].mtxLocal.translation.y + 1);
            }
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
}