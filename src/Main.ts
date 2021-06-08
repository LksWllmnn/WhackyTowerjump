namespace PrimaAbgabeLW {
    import fc = FudgeCore;

    let graph: fc.Graph;
    let allPlatforms: fc.Node; 
    let allStopper: fc.Node; 
    
    let viewport: fc.Viewport;
    let cmpCamera: fc.ComponentCamera;
    
    let thirdPerson: boolean = true;
    let cIsPressed: boolean = false;
    let kIsPressed: boolean = false;

    let cmpAvatar: fc.ComponentRigidbody;
    let headMovement: fc.Node;
    let avatar: fc.Node; 
    let avatarJumpForce: number = 0;
    let avatarJumpForceUp: boolean = true;
    let avatarLives: number;
    let ray: fc.RayHitInfo;

    let farCamera: fc.Node; 
    let transFarCamera: fc.ComponentTransform; 

    let iTriggerActivator: number;
    export let triggerOn: boolean;
    export let createNewPlatform: boolean;

    let mtxFarCam: fc.Vector3;

    export let isOnPLatform: boolean = false;

    let platformArray: Platform[] = new Array(10);

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
        console.log("hi");
        let baseJson: Response = await fetch("../lvl/rootData.json");

        console.log(baseJson.text());
        hndlLoaded();
    }

    function hndlLoaded(): void {
        fc.Physics.settings.debugDraw = true;

        gameState.score = 0;
        loadAllButtons();
        console.log("hi2");

        let canvas: HTMLCanvasElement = document.querySelector("canvas");

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
        gameState.lives = avatarLives;

        iTriggerActivator = 0;
        triggerOn = false;
        createNewPlatform = false;

        createRigidbodys();
        createPlatform();

        viewport.initialize("InteractiveViewport", graph, cmpCamera, canvas);

        Hud.start();
       
        fc.Physics.adjustTransforms(graph, true);

        fc.Loop.start(fc.LOOP_MODE.TIME_REAL, 30);
        fc.Loop.addEventListener(fc.EVENT.LOOP_FRAME, renderAFrame);

        fc.AudioManager.default.listenTo(graph);
        fc.AudioManager.default.listenWith(headMovement.getComponent(ƒ.ComponentAudioListener));
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
            avatarLives--;
            gameState.lives = avatarLives;
            getPlattformDown();
        }
        
        if (avatarLives == 0) {
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
            //aconsole.log(platform);
        }

        for (let i: number = 0; i < allStopper.getChildren().length; i++) {
            let stopper: Stopper = allStopper.getChild(i) as Stopper;
            stopper.removeComponent(stopper.getComponent(fc.ComponentRigidbody));
        }
        
        graph.removeAllChildren();
        graph = null;
    }

    /*
    AVATAR
    */

    function settingUpAvatar(): void {
        let ears: fc.ComponentAudioListener = new fc.ComponentAudioListener();
        
        headMovement = new fc.Node("Head");
        
        let cmpTransHead: fc.ComponentTransform = new fc.ComponentTransform();
        cmpTransHead.mtxLocal.translateY(0.5);
        cmpTransHead.mtxLocal.translateZ(0);

        let avatarBody: fc.Node = new fc.Node("AvatarBody");
        let avatarFeet: fc.Node = new fc.Node("AvatarFeet");

        let nose: fc.Node = new fc.Node("AvatarFarView");

        let avatarMeshHead: fc.Mesh = new fc.MeshSphere("AvatarMesh", 6, 6);
        let cmpAvatarMeshHead: fc.ComponentMesh = new fc.ComponentMesh(avatarMeshHead);
        let avatarMeshBody: fc.Mesh = new fc.MeshCube("AvatarMeshBody");
        let cmpAvatarMeshBody: fc.ComponentMesh = new fc.ComponentMesh(avatarMeshBody);
        cmpAvatarMeshBody.mtxPivot.scaleX(0.75);
        cmpAvatarMeshBody.mtxPivot.scaleZ(0.75);
        let cmpAvatarMeshFeet: fc.ComponentMesh = new fc.ComponentMesh(avatarMeshHead);
        cmpAvatarMeshFeet.mtxPivot.translateY(-0.5);
        let cmpNoseMesh: fc.ComponentMesh = new fc.ComponentMesh(avatarMeshBody);
        cmpNoseMesh.mtxPivot.scaleY(0.3);
        cmpNoseMesh.mtxPivot.scaleX(0.2);
        cmpNoseMesh.mtxPivot.scaleZ(1);
        cmpNoseMesh.mtxPivot.translateZ(0.2);

        let avatarMat: fc.Material = new fc.Material("AvatarMaterial", fc.ShaderFlat, new fc.CoatColored(fc.Color.CSS("RED")));
        let cmpAvatarMat: fc.ComponentMaterial = new fc.ComponentMaterial(avatarMat);
        let cmpAvatarMatBody: fc.ComponentMaterial = new fc.ComponentMaterial(avatarMat);
        let cmpAvatarMatFeet: fc.ComponentMaterial = new fc.ComponentMaterial(avatarMat);
        let cmpNoseMat: fc.ComponentMaterial = new fc.ComponentMaterial(avatarMat);
        

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

    function computeJumpForce(): void {
        if (avatarJumpForceUp) {
            avatarJumpForce = avatarJumpForce + 2;
            if (avatarJumpForce > 100)
                avatarJumpForceUp = false;
        } else if (!avatarJumpForceUp) {
            avatarJumpForce = avatarJumpForce - 2;
            if (avatarJumpForce <= 0)
                avatarJumpForceUp = true;
        }
        gameState.jumpStrength = avatarJumpForce;
        //console.log(avatarJumpForce);
    }

    function hndlJump(_event: KeyboardEvent): void {
        if (_event.code == "Space") {
            let jumpVector: fc.Vector3 = new fc.Vector3(headMovement.mtxWorld.getZ().x * avatarJumpForce * 5, headMovement.mtxWorld.getZ().y + 1 * avatarJumpForce * 5, headMovement.mtxWorld.getZ().z * avatarJumpForce * 5);
            cmpAvatar.applyForce(jumpVector);
            avatarJumpForce = 0;
            gameState.jumpStrength = avatarJumpForce;
        }
        
    }

    function hndlCameraPerspective(): void {
        console.log(thirdPerson);
        if (thirdPerson) {
            thirdPerson = false;
            headMovement.addComponent(cmpCamera);
        } else if (!thirdPerson) {
            thirdPerson = true;
            farCamera.addComponent(cmpCamera);
        }
    }


    /*
    PLATFORMS
    */


    function getPlattformDown(): void {
        //console.log("!!! PLaforms down");
        for (let i: number = 1; i < allPlatforms.getChildren().length; i++) {
            
            let platformDown: Platform = allPlatforms.getChild(i) as Platform;
            
            if (platformDown.up) {
                platformDown.mtxLocal.translateY(-30 * platformDown.number);
                
    
                for (let i: number = 0; i < allStopper.getChildren().length; i++) {
                    let stopper: Stopper = allStopper.getChild(i) as Stopper;
                    if (stopper.platformNumber == platformDown.number)
                        stopper.mtxLocal.translateY(-10 * platformDown.number);
                }

                platformDown.activePlatform = false;
                platformDown.up = false;
            }

            //console.log(platformDown.number + " : " + "platform up: " + platformDown.up + " : " + platformDown.mtxLocal.translation.y);
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

    export function getPlatformUp(_platform: Platform): void {
        _platform.mtxLocal.translateY(30 * _platform.number);
        
        _platform.activePlatform = true;
        _platform.up = true;

        //console.log(_platform.number + " : " + "platform up: " + _platform.up + " : " + _platform.mtxLocal.translation.y);

        for (let i: number = 0; i < allStopper.getChildren().length; i++) {
            let stopper: Stopper = allStopper.getChild(i) as Stopper;
            if (stopper.platformNumber == _platform.number)
                stopper.mtxLocal.translateY(10 * _platform.number);
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