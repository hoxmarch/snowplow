import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { generateTownLayout, TownLayout, RoadSegment, BuildingData, PropData } from './townMap';
import { SnowManager } from './snowGrid';
import { ParticleManager } from './particles';
import { BirdManager } from './birds';
import {
  createSnowPlow,
  createCozyHouse,
  createTownHall,
  createDiner,
  createGasStation,
  createWaterTower,
  createPineTree,
  createHolidayTree,
  createSnowman,
  SnowmanEntity,
  createStreetlamp,
  createBench,
  createMailbox,
  createHydrant,
  createAsphaltTexture,
  createRoadLineTexture,
} from './models';
import { soundManager } from '../audio/soundManager';
import { CameraViewMode, PlowUpgrades, PlayerStats, TimeOfDay, TownQuest } from '../types/game';

// Pre-allocated math objects to avoid per-frame GC allocations
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3C = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetCamLookAt = new THREE.Vector3();

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onQuestCompleted: (quest: TownQuest) => void;
  onAllClearedVictory: () => void;
  onComboMilestone: (multiplier: number, text: string) => void;
  onNotification: (text: string) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  // Three.js core
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public renderer!: THREE.WebGLRenderer;
  private clock: THREE.Clock = new THREE.Clock();
  private animFrameId: number | null = null;
  private isDisposed: boolean = false;

  // Dynamic Camera Orbit Angle controls
  public camOrbitYaw: number = Math.PI * 0.25; // 45 degrees default
  public camPitch: number = 0.75; // ~43 degrees elevation
  public camDistance: number = 38; // Distance from plow
  private isPointerDragging: boolean = false;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;

  // Environment & Lights
  private dirKeyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private streetlampLights: THREE.PointLight[] = [];

  // Town & Entities
  public layout!: TownLayout;
  public snowManager!: SnowManager;
  public particleManager!: ParticleManager;
  public birdManager!: BirdManager;
  public plowModel!: ReturnType<typeof createSnowPlow>;
  public snowmen: SnowmanEntity[] = [];

  // Upgrades & Player State
  public upgrades: PlowUpgrades = {
    bladeWidthLevel: 1,
    engineLevel: 1,
    saltSpreader: false,
    snowCannonLevel: 0,
    paintColor: '#f9a825',
    plowAccessory: 'none',
  };

  public cameraMode: CameraViewMode = 'isometric';
  public timeOfDay: TimeOfDay = 'day';
  public isTitleScreen: boolean = true;
  public isPaused: boolean = false;

  // Vehicle Kinematics
  private plowPos = new THREE.Vector3(0, 0, 20);
  private plowRotY = Math.PI;
  private speed = 0; // forward/reverse current speed
  private steerAngle = 0;
  private driftVelocity = new THREE.Vector3();
  private cameraShake = 0;
  private hitstopTimer = 0;

  // Input state
  private keysHeld: Record<string, boolean> = {};
  private virtualJoystick = { x: 0, y: 0 }; // for touch/mobile
  private isVirtualHonk = false;

  // Combo system
  private currentCombo = 0;
  private maxCombo = 0;
  private comboTimer = 0;
  private comboMultiplier = 1;
  private coins = 0;

  // Quests
  public quests: TownQuest[] = [];

  // Collision bounding boxes for buildings
  private buildingColliders: { minX: number; maxX: number; minZ: number; maxZ: number }[] = [];

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.initThree();
    this.initTown();
    this.initSnowAndParticles();
    this.initQuests();
    this.setupInputs();
    this.setTimeOfDay('day');

    this.startLoop();
  }

  private initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#dceeff');
    this.scene.fog = new THREE.FogExp2('#dceeff', 0.012);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    this.camera.position.set(30, 35, 45);
    this.camera.lookAt(0, 0, 0);

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting Rig
    this.hemiLight = new THREE.HemisphereLight(0xdbeeff, 0xa0b4c8, 0.9);
    this.scene.add(this.hemiLight);

    this.dirKeyLight = new THREE.DirectionalLight(0xfff6e5, 1.8);
    this.dirKeyLight.position.set(40, 50, 30);
    this.dirKeyLight.castShadow = true;
    this.dirKeyLight.shadow.mapSize.width = 2048;
    this.dirKeyLight.shadow.mapSize.height = 2048;
    this.dirKeyLight.shadow.camera.near = 10;
    this.dirKeyLight.shadow.camera.far = 160;
    const d = 55;
    this.dirKeyLight.shadow.camera.left = -d;
    this.dirKeyLight.shadow.camera.right = d;
    this.dirKeyLight.shadow.camera.top = d;
    this.dirKeyLight.shadow.camera.bottom = -d;
    this.dirKeyLight.shadow.bias = -0.0004;
    this.dirKeyLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirKeyLight);

    // Window resize handler
    window.addEventListener('resize', this.onResize);
  }

  private initTown() {
    this.layout = generateTownLayout();

    // 1. Snowy Ground Plane
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xf0f7ff,
      roughness: 0.9,
      metalness: 0.02,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI * 0.5;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Road Network Meshes (laid with polygonOffset to eliminate any Z-fighting or flashing)
    const asphaltTex = createAsphaltTexture();
    const asphaltMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.85,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    const roadLineTex = createRoadLineTexture();
    const roadLineMat = new THREE.MeshStandardMaterial({
      map: roadLineTex,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    this.layout.roads.forEach((road: RoadSegment) => {
      const roadMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(road.width, road.length),
        road.isDriveway ? asphaltMat : roadLineMat
      );
      roadMesh.rotation.x = -Math.PI * 0.5;
      // Stagger heights so driveways and roads never Z-fight (y = 0.03 for main roads, 0.035 for driveways)
      roadMesh.position.set(road.x, road.isDriveway ? 0.035 : 0.03, road.z);
      roadMesh.receiveShadow = true;
      this.scene.add(roadMesh);

      // Clean curbs on edges of north-south avenues
      if (road.id.startsWith('maple_ave') || road.id.startsWith('pine_ridge')) {
        const curbMat = new THREE.MeshStandardMaterial({ color: '#cfd8dc', roughness: 0.8 });
        const curbL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, road.length), curbMat);
        curbL.position.set(road.x - road.width * 0.5 - 0.15, 0.075, road.z);
        curbL.receiveShadow = true;
        this.scene.add(curbL);

        const curbR = curbL.clone();
        curbR.position.x = road.x + road.width * 0.5 + 0.15;
        this.scene.add(curbR);
      }
    });

    // 3. Buildings & Chimneys
    const chimneyPositions: THREE.Vector3[] = [];

    this.layout.buildings.forEach((b: BuildingData) => {
      let buildingMesh: THREE.Group;
      if (b.type === 'town_hall') {
        buildingMesh = createTownHall(b, chimneyPositions);
      } else if (b.type === 'diner') {
        buildingMesh = createDiner(b);
      } else if (b.type === 'gas_station') {
        buildingMesh = createGasStation(b);
      } else if (b.type === 'water_tower') {
        buildingMesh = createWaterTower(b);
      } else {
        buildingMesh = createCozyHouse(b, chimneyPositions);
      }

      this.scene.add(buildingMesh);

      // Record bounding box for collision detection
      const halfW = b.width * 0.5 + 0.6;
      const halfD = b.depth * 0.5 + 0.6;
      this.buildingColliders.push({
        minX: b.x - halfW,
        maxX: b.x + halfW,
        minZ: b.z - halfD,
        maxZ: b.z + halfD,
      });
    });

    // 4. Props & Street furniture
    this.layout.props.forEach((p: PropData) => {
      let propMesh: THREE.Object3D | null = null;
      if (p.type === 'tree') {
        propMesh = createPineTree(p);
      } else if (p.type === 'holiday_tree') {
        propMesh = createHolidayTree(p);
      } else if (p.type === 'snowman') {
        const snowman = createSnowman(p);
        this.snowmen.push(snowman);
        propMesh = snowman.group;
      } else if (p.type === 'streetlamp') {
        const { group, light } = createStreetlamp(p);
        propMesh = group;
        this.streetlampLights.push(light);
      } else if (p.type === 'bench') {
        propMesh = createBench(p);
      } else if (p.type === 'mailbox') {
        propMesh = createMailbox(p);
      } else if (p.type === 'hydrant') {
        propMesh = createHydrant(p);
      }

      if (propMesh) {
        this.scene.add(propMesh);
      }
    });

    // 5. Hero Snow Plow
    this.plowModel = createSnowPlow(this.upgrades);
    this.plowPos.set(this.layout.spawnPoint.x, 0, this.layout.spawnPoint.z);
    this.plowRotY = this.layout.spawnPoint.rotation;
    this.plowModel.group.position.copy(this.plowPos);
    this.plowModel.group.rotation.y = this.plowRotY;
    this.scene.add(this.plowModel.group);

    // Initial Chimney positions passed to particle manager later
    this.tempChimneys = chimneyPositions;
  }

  private tempChimneys: THREE.Vector3[] = [];

  private initSnowAndParticles() {
    this.snowManager = new SnowManager(this.layout, this.scene);
    this.particleManager = new ParticleManager(this.scene);
    this.particleManager.setChimneys(this.tempChimneys);
    this.birdManager = new BirdManager(this.scene);
  }

  private initQuests() {
    const bakerTotal = this.snowManager.getRoadStats('dw_mrs_baker')?.total || 10;
    const dinerTotal = this.snowManager.getRoadStats('diner_lot')?.total || 30;
    const schoolTotal = this.snowManager.getRoadStats('dw_school')?.total || 24;
    const plazaTotal = this.snowManager.getRoadStats('plaza_loop')?.total || 35;
    const townTotal = this.snowManager.totalSnowCount;

    this.quests = [
      {
        id: 'q_baker',
        title: "Clear Mrs. Baker's Driveway",
        description: 'Mrs. Baker needs to deliver fresh gingerbread cookies to the diner!',
        targetType: 'driveway',
        targetId: 'dw_mrs_baker',
        requiredSnowCleared: Math.max(1, Math.floor(bakerTotal * 0.8)),
        totalSnowInArea: bakerTotal,
        rewardCoins: 120,
        completed: false,
        active: true,
      },
      {
        id: 'q_diner',
        title: "Clear Bob's Diner Parking",
        description: 'Hot cocoa delivery is arriving soon. Keep the lot clear of drifts!',
        targetType: 'driveway',
        targetId: 'diner_lot',
        requiredSnowCleared: Math.max(1, Math.floor(dinerTotal * 0.8)),
        totalSnowInArea: dinerTotal,
        rewardCoins: 200,
        completed: false,
        active: false,
      },
      {
        id: 'q_school',
        title: 'Clear School Bus Loop',
        description: 'Ensure safe drop-off around the schoolhouse before the morning bell.',
        targetType: 'driveway',
        targetId: 'dw_school',
        requiredSnowCleared: Math.max(1, Math.floor(schoolTotal * 0.8)),
        totalSnowInArea: schoolTotal,
        rewardCoins: 180,
        completed: false,
        active: false,
      },
      {
        id: 'q_townhall',
        title: 'Town Square Celebration Loop',
        description: 'Plow around the festive holiday tree in the center plaza.',
        targetType: 'street',
        targetId: 'plaza_loop',
        requiredSnowCleared: Math.max(1, Math.floor(plazaTotal * 0.8)),
        totalSnowInArea: plazaTotal,
        rewardCoins: 280,
        completed: false,
        active: false,
      },
      {
        id: 'q_half_town',
        title: 'Snow Marshal: Clear 50% of Town',
        description: 'Clear half of all snowy roads and driveways across Frosty Hollow.',
        targetType: 'total_snow',
        requiredSnowCleared: Math.floor(townTotal * 0.5),
        totalSnowInArea: Math.floor(townTotal * 0.5),
        rewardCoins: 500,
        completed: false,
        active: false,
      },
      {
        id: 'q_blizzard_hero',
        title: 'Winter Legend: Clear 100% of Town',
        description: 'Clear every single street and driveway in town for the ultimate town celebration!',
        targetType: 'total_snow',
        requiredSnowCleared: townTotal,
        totalSnowInArea: townTotal,
        rewardCoins: 1200,
        completed: false,
        active: false,
      },
    ];
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      // Prevent default browser scrolling when using arrow keys or spacebar
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
      }

      this.keysHeld[k] = true;

      // Spacebar honk
      if (e.code === 'Space') {
        this.triggerHonk();
      }

      // Camera Angle shortcuts
      if (k === 'q') {
        this.rotateCameraBy(Math.PI / 4); // 45° counter-clockwise
      } else if (k === 'e') {
        this.rotateCameraBy(-Math.PI / 4); // 45° clockwise
      } else if (k === 'c') {
        this.cycleCameraPreset();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysHeld[e.key.toLowerCase()] = false;
    });

    window.addEventListener('blur', () => {
      this.keysHeld = {};
    });

    // Pointer drag on 3D canvas for smooth orbital camera angle change
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', (e) => {
      this.isPointerDragging = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isPointerDragging) return;
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.camOrbitYaw -= dx * 0.007;
      this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * 0.005, 0.2, 1.48);
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDragging = false;
    });
    window.addEventListener('pointercancel', () => {
      this.isPointerDragging = false;
    });

    dom.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.zoomCamera(e.deltaY * 0.03);
      },
      { passive: false }
    );
  }

  public rotateCameraBy(radians: number) {
    this.camOrbitYaw += radians;
    const deg = Math.round((((this.camOrbitYaw * 180) / Math.PI) % 360 + 360) % 360);
    this.callbacks.onNotification(`Camera Angle: ${deg}° (Q/E or Drag)`);
  }

  public zoomCamera(delta: number) {
    this.camDistance = THREE.MathUtils.clamp(this.camDistance + delta, 16, 65);
  }

  public setCameraAnglePreset(degrees: number) {
    this.cameraMode = 'isometric';
    this.camOrbitYaw = (degrees * Math.PI) / 180;
    this.camPitch = 0.75;
    this.callbacks.onNotification(`Camera Angle: ${degrees}° View`);
  }

  public cycleCameraPreset() {
    const presets = [45, 135, 225, 315];
    const currentDeg = Math.round((((this.camOrbitYaw * 180) / Math.PI) % 360 + 360) % 360);
    const nextPreset = presets.find((p) => p > currentDeg + 10) ?? presets[0];
    this.setCameraAnglePreset(nextPreset);
  }

  public setVirtualJoystick(x: number, y: number) {
    this.virtualJoystick.x = x;
    this.virtualJoystick.y = y;
  }

  public triggerHonk() {
    soundManager.playHonk();
    this.cameraShake = Math.max(this.cameraShake, 0.15);
    this.birdManager?.scareAll(this.plowPos);
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.timeOfDay = time;
    if (time === 'day') {
      this.scene.background = new THREE.Color('#cbe5ff'); // vibrant crisp winter sky
      this.scene.fog = new THREE.FogExp2('#cbe5ff', 0.010);
      this.hemiLight.color.set('#e0f2fe');
      this.hemiLight.groundColor.set('#b0bec5');
      this.hemiLight.intensity = 1.05;
      this.dirKeyLight.color.set('#fff5d6'); // warm golden winter sun
      this.dirKeyLight.intensity = 2.1;
      this.dirKeyLight.position.set(40, 50, 30);
      this.streetlampLights.forEach((l) => (l.intensity = 0.6));
    } else if (time === 'sunset') {
      this.scene.background = new THREE.Color('#ffab91'); // rich festive sunset glow
      this.scene.fog = new THREE.FogExp2('#ffccbc', 0.011);
      this.hemiLight.color.set('#ff8a65');
      this.hemiLight.groundColor.set('#5d4037');
      this.hemiLight.intensity = 0.9;
      this.dirKeyLight.color.set('#ff5722');
      this.dirKeyLight.intensity = 2.6;
      this.dirKeyLight.position.set(60, 20, 20);
      this.streetlampLights.forEach((l) => (l.intensity = 1.6));
    } else {
      // Night with warm illuminated holiday glow
      this.scene.background = new THREE.Color('#0a1128'); // deep midnight sapphire
      this.scene.fog = new THREE.FogExp2('#0a1128', 0.013);
      this.hemiLight.color.set('#3f51b5');
      this.hemiLight.groundColor.set('#1a237e');
      this.hemiLight.intensity = 0.4;
      this.dirKeyLight.color.set('#7986cb');
      this.dirKeyLight.intensity = 0.6;
      this.dirKeyLight.position.set(20, 40, 20);
      this.streetlampLights.forEach((l) => (l.intensity = 2.8));
    }
  }

  public setCameraMode(mode: CameraViewMode) {
    this.cameraMode = mode;
  }

  public applyUpgrade(type: 'blade' | 'engine' | 'salt' | 'cannon' | 'color' | 'accessory', value?: string) {
    if (type === 'blade') {
      this.upgrades.bladeWidthLevel = Math.min(5, this.upgrades.bladeWidthLevel + 1);
      this.plowModel.updateBladeWidth(this.upgrades.bladeWidthLevel);
    } else if (type === 'engine') {
      this.upgrades.engineLevel = Math.min(5, this.upgrades.engineLevel + 1);
    } else if (type === 'salt') {
      this.upgrades.saltSpreader = true;
      this.plowModel.updateSaltSpreader(true);
    } else if (type === 'cannon') {
      this.upgrades.snowCannonLevel = Math.min(3, this.upgrades.snowCannonLevel + 1);
    } else if (type === 'color' && value) {
      this.upgrades.paintColor = value;
      this.plowModel.updateColor(value);
    } else if (type === 'accessory' && value) {
      this.upgrades.plowAccessory = value as PlowUpgrades['plowAccessory'];
      this.plowModel.updateAccessory(value);
    }
    soundManager.playUpgrade();
  }

  public addCoins(amount: number) {
    this.coins += amount;
  }

  public getCoins(): number {
    return this.coins;
  }

  public spendCoins(amount: number): boolean {
    if (this.coins >= amount) {
      this.coins -= amount;
      return true;
    }
    return false;
  }

  private startLoop() {
    const animate = () => {
      if (this.isDisposed) return;
      this.animFrameId = requestAnimationFrame(animate);

      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent physics explosions

      if (this.hitstopTimer > 0) {
        this.hitstopTimer -= dt;
        return;
      }

      this.update(dt);
      this.render();
    };
    this.animFrameId = requestAnimationFrame(animate);
  }

  private update(dt: number) {
    if (this.isPaused) return;

    if (this.isTitleScreen) {
      // Cinematic slow orbit around Town Square on Title Screen
      const time = this.clock.getElapsedTime() * 0.18;
      const camRadius = 45;
      this.camera.position.set(Math.cos(time) * camRadius, 26, Math.sin(time) * camRadius);
      this.camera.lookAt(0, 4, -10);

      // Flashing amber beacon still rotates
      this.plowModel.beaconLight.position.x = Math.sin(time * 12) * 0.15;
      this.particleManager.update(dt, this.plowPos);
      this.birdManager?.update(dt, this.plowPos);
      return;
    }

    // 1. Process Driving Inputs (Arrow Keys primary, WASD secondary)
    let forwardInput = 0;
    let turnInput = 0;

    if (this.keysHeld['arrowup'] || this.keysHeld['up']) {
      forwardInput += 1;
    } else if (this.keysHeld['w']) {
      forwardInput += 1;
    }

    if (this.keysHeld['arrowdown'] || this.keysHeld['down']) {
      forwardInput -= 0.85;
    } else if (this.keysHeld['s']) {
      forwardInput -= 0.85;
    }

    if (this.keysHeld['arrowleft'] || this.keysHeld['left']) {
      turnInput += 1;
    } else if (this.keysHeld['a']) {
      turnInput += 1;
    }

    if (this.keysHeld['arrowright'] || this.keysHeld['right']) {
      turnInput -= 1;
    } else if (this.keysHeld['d']) {
      turnInput -= 1;
    }

    // Merge virtual touch joystick if active
    if (Math.abs(this.virtualJoystick.y) > 0.1) {
      forwardInput -= this.virtualJoystick.y; // Joystick up is negative Y
    }
    if (Math.abs(this.virtualJoystick.x) > 0.1) {
      turnInput -= this.virtualJoystick.x;
    }

    // Turbo boost with Shift
    const isTurbo = this.keysHeld['shift'] ? 1.35 : 1.0;

    // 2. Engine & Speed Physics
    const maxForwardSpeed = (9.0 + this.upgrades.engineLevel * 2.2) * isTurbo;
    const maxReverseSpeed = -5.0;
    const acceleration = (18.0 + this.upgrades.engineLevel * 4.0) * dt;
    const deceleration = 14.0 * dt;

    if (forwardInput > 0) {
      this.speed = Math.min(maxForwardSpeed, this.speed + acceleration * forwardInput);
    } else if (forwardInput < 0) {
      this.speed = Math.max(maxReverseSpeed, this.speed + acceleration * forwardInput);
    } else {
      // Natural rolling friction on snow
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - deceleration);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + deceleration);
      }
    }

    // 3. Steering & Drift
    if (Math.abs(this.speed) > 0.1) {
      const turnSpeed = 2.4 * (this.speed >= 0 ? 1 : -1);
      this.steerAngle = turnInput * 0.45;
      this.plowRotY += turnInput * turnSpeed * dt;
    } else {
      this.steerAngle = 0;
    }

    // 4. Update Position with Velocity & Drift
    const forwardVec = new THREE.Vector3(Math.sin(this.plowRotY), 0, Math.cos(this.plowRotY));
    const nextPos = this.plowPos.clone().addScaledVector(forwardVec, this.speed * dt);

    // 5. Building Collision Detection
    const plowRadius = 1.3;
    let collided = false;

    for (const box of this.buildingColliders) {
      if (
        nextPos.x >= box.minX - plowRadius &&
        nextPos.x <= box.maxX + plowRadius &&
        nextPos.z >= box.minZ - plowRadius &&
        nextPos.z <= box.maxZ + plowRadius
      ) {
        collided = true;
        break;
      }
    }

    if (collided) {
      // Bounce back slightly and trigger hitstop/shake
      this.speed = -this.speed * 0.4;
      this.cameraShake = 0.35;
      this.hitstopTimer = 0.05;
      soundManager.playSnowballPop();
    } else {
      this.plowPos.copy(nextPos);
    }

    // Keep plow inside town bounds (-70 to 70)
    this.plowPos.x = THREE.MathUtils.clamp(this.plowPos.x, -68, 68);
    this.plowPos.z = THREE.MathUtils.clamp(this.plowPos.z, -68, 68);

    // Apply to mesh
    this.plowModel.group.position.copy(this.plowPos);
    this.plowModel.group.rotation.y = this.plowRotY;

    // Wheel roll animation
    const rollDelta = (this.speed * dt) / 0.5;
    this.plowModel.wheels.forEach((w) => {
      w.rotation.x += rollDelta;
    });

    // Rotating Amber Beacon
    const beaconAngle = this.clock.getElapsedTime() * 10;
    this.plowModel.beaconLight.position.x = Math.sin(beaconAngle) * 0.2;
    this.plowModel.beaconLight.position.z = Math.cos(beaconAngle) * 0.2;

    // 5b. Breakable Snowmen Update & Collision Check
    const bladeOffset = forwardVec.clone().multiplyScalar(2.3);
    const bladePos = this.plowPos.clone().add(bladeOffset);
    const bladeWidths = [2.6, 3.2, 3.8, 4.4, 5.0];
    const bladeWidth = bladeWidths[this.upgrades.bladeWidthLevel - 1] || 2.6;

    this.snowmen.forEach((snowman) => {
      snowman.update(dt);

      if (!snowman.isBroken) {
        const distToCenter = Math.hypot(this.plowPos.x - snowman.x, this.plowPos.z - snowman.z);
        const distToBlade = Math.hypot(bladePos.x - snowman.x, bladePos.z - snowman.z);

        // Break if hit by plow body or blade
        if (distToCenter < snowman.radius + 1.25 || distToBlade < snowman.radius + bladeWidth * 0.52) {
          const impactSpeed = Math.max(Math.abs(this.speed), 3.5);
          const impactDirection = forwardVec.clone().multiplyScalar(this.speed >= 0 ? 1 : -1);
          snowman.break(impactDirection.multiplyScalar(impactSpeed));

          this.cameraShake = Math.max(this.cameraShake, 0.28);
          this.particleManager.emitPlowSpray(
            new THREE.Vector3(snowman.x, 0.8, snowman.z),
            forwardVec,
            impactSpeed,
            true
          );
          soundManager.playSnowballPop();
          soundManager.playCoin();

          const snowmanReward = 50 * this.comboMultiplier;
          this.coins += snowmanReward;
          this.currentCombo += 5;
          this.comboTimer = 2.5;
          this.callbacks.onNotification(`Snowman Bonked! ⛄ (+${snowmanReward} Coins!)`);
        }
      }
    });

    // 6. Snow Plowing & Clearing Logic
    const saltRadius = this.upgrades.saltSpreader ? 3.6 : 0;

    let isPlowing = false;

    if (Math.abs(this.speed) > 0.4) {
      const clearResult = this.snowManager.clearSnowAt(bladePos, bladeWidth, forwardVec, saltRadius);

      if (clearResult.clearedCount > 0) {
        isPlowing = true;
        this.currentCombo += clearResult.clearedCount;
        this.comboTimer = 2.4; // 2.4 seconds to sustain combo streak
        this.maxCombo = Math.max(this.maxCombo, this.currentCombo);

        // Calculate Multiplier
        let newMult = 1;
        if (this.currentCombo >= 150) newMult = 10;
        else if (this.currentCombo >= 80) newMult = 5;
        else if (this.currentCombo >= 40) newMult = 3;
        else if (this.currentCombo >= 15) newMult = 2;

        if (newMult > this.comboMultiplier) {
          this.comboMultiplier = newMult;
          soundManager.playComboUp(this.comboMultiplier);
          const labels: Record<number, string> = {
            2: '2x Chilly Chugger!',
            3: '3x Snow Sweeper!',
            5: '5x Blizzard Buster!',
            10: '10x Frosty King!',
          };
          this.callbacks.onComboMilestone(newMult, labels[newMult] || `${newMult}x Combo!`);
        }

        // Coins earned
        const earnedCoins = clearResult.clearedCount * this.comboMultiplier;
        this.coins += earnedCoins;
        soundManager.playCoin();

        // Emit snow plume particles
        this.particleManager.emitPlowSpray(
          bladePos,
          forwardVec,
          Math.abs(this.speed),
          this.upgrades.snowCannonLevel > 0
        );

        // Check if full roads completed
        if (clearResult.completedRoads.length > 0) {
          clearResult.completedRoads.forEach((roadName) => {
            const bonus = 100 * this.comboMultiplier;
            this.coins += bonus;
            soundManager.playQuestComplete();
            this.callbacks.onNotification(`Clean Sweep! ${roadName} (+${bonus} Coins!)`);
          });
        }
      }
    }

    // 7. Update Combo Decay Timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.currentCombo = 0;
        this.comboMultiplier = 1;
      }
    }

    // 8. Update Quests Progress
    this.checkQuests();

    // 9. Audio Engine & SFX Update
    const normSpeed = this.speed / maxForwardSpeed;
    soundManager.updateEngine(normSpeed, isPlowing);

    // 10. Particles & Snow & Birds
    this.particleManager.update(dt, this.plowPos);
    this.birdManager?.update(dt, this.plowPos);

    // 11. Camera Tracking with Smooth Spring Damping
    this.updateCamera(dt, forwardVec);

    // 12. Send Stats Update to HUD
    this.callbacks.onStatsUpdate({
      coins: this.coins,
      totalSnowCleared: this.snowManager.clearedSnowCount,
      totalSnowInTown: this.snowManager.totalSnowCount,
      percentCleared: this.snowManager.getPercentCleared(),
      currentCombo: this.currentCombo,
      maxCombo: this.maxCombo,
      comboTimer: Math.max(0, this.comboTimer),
      comboMultiplier: this.comboMultiplier,
      currentSpeed: Math.round(Math.abs(this.speed) * 2.2), // mph approximation
      activeQuestsCompleted: this.quests.filter((q) => q.completed).length,
      totalQuests: this.quests.length,
    });
  }

  private checkQuests() {
    this.quests.forEach((q) => {
      if (q.completed) return;

      let isDone = false;

      if (q.targetType === 'driveway' || q.targetType === 'street') {
        const roadStat = this.snowManager.getRoadStats(q.targetId!);
        if (roadStat && roadStat.cleared >= q.requiredSnowCleared) {
          isDone = true;
        }
      } else if (q.targetType === 'total_snow') {
        if (this.snowManager.clearedSnowCount >= q.requiredSnowCleared) {
          isDone = true;
        }
      }

      if (isDone) {
        q.completed = true;
        this.coins += q.rewardCoins;
        soundManager.playQuestComplete();
        this.callbacks.onQuestCompleted(q);

        // Unlock next quest in list
        const nextIdx = this.quests.indexOf(q) + 1;
        if (nextIdx < this.quests.length) {
          this.quests[nextIdx].active = true;
        }
      }
    });

    // Check overall victory when town is 100% cleared
    if (this.snowManager.getPercentCleared() >= 100) {
      this.callbacks.onAllClearedVictory();
    }
  }

  private updateCamera(dt: number, forwardVec: THREE.Vector3) {
    if (this.cameraMode === 'chase') {
      // Third-person vehicle chase cam
      const behindOffset = forwardVec.clone().multiplyScalar(-10);
      _targetCamPos.set(this.plowPos.x + behindOffset.x, 5.5, this.plowPos.z + behindOffset.z);
      _targetCamLookAt.set(this.plowPos.x + forwardVec.x * 6, 1.5, this.plowPos.z + forwardVec.z * 6);
    } else if (this.cameraMode === 'topdown') {
      // Bird's eye tactical map cam
      _targetCamPos.set(this.plowPos.x, this.camDistance, this.plowPos.z + 0.1);
      _targetCamLookAt.set(this.plowPos.x, 0, this.plowPos.z);
    } else {
      // Fully changeable orbital / isometric camera angle
      const cosPitch = Math.cos(this.camPitch);
      const sinPitch = Math.sin(this.camPitch);
      const offsetX = Math.sin(this.camOrbitYaw) * this.camDistance * cosPitch;
      const offsetZ = Math.cos(this.camOrbitYaw) * this.camDistance * cosPitch;
      const offsetY = this.camDistance * sinPitch;

      _targetCamPos.set(this.plowPos.x + offsetX, offsetY, this.plowPos.z + offsetZ);
      _targetCamLookAt.set(this.plowPos.x, 1.2, this.plowPos.z);
    }

    // Apply camera shake if any
    if (this.cameraShake > 0) {
      _targetCamPos.x += (Math.random() - 0.5) * this.cameraShake * 2;
      _targetCamPos.y += (Math.random() - 0.5) * this.cameraShake * 2;
      this.cameraShake = Math.max(0, this.cameraShake - dt * 1.5);
    }

    // Smooth exponential damping
    this.camera.position.lerp(_targetCamPos, 1.0 - Math.exp(-6.5 * dt));

    // Smooth lookAt target interpolation
    _vec3C.lerp(_targetCamLookAt, 1.0 - Math.exp(-8.0 * dt));
    this.camera.lookAt(_vec3C);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private onResize = () => {
    if (!this.container || this.isDisposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose() {
    this.isDisposed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);

    soundManager.destroy();
    this.snowManager.dispose();
    this.particleManager.dispose();
    this.birdManager?.dispose();

    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}
