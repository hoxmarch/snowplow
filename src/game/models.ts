import * as THREE from 'three';
import { BuildingData, PropData } from './townMap';
import { PlowUpgrades } from '../types/game';

// Procedural texture helper for road asphalt
export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2b303a';
  ctx.fillRect(0, 0, 128, 128);

  // Subtle gravel speckles
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const s = Math.random() * 2 + 1;
    ctx.fillStyle = Math.random() > 0.5 ? '#363d4a' : '#1e2229';
    ctx.fillRect(x, y, s, s);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural texture helper for road yellow divider line
export function createRoadLineTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#2b303a';
  ctx.fillRect(0, 0, 64, 64);

  // Yellow dashed lane line
  ctx.fillStyle = '#fbc02d';
  ctx.fillRect(28, 8, 8, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates the Hero Snow Plow vehicle as a composite 3-12 part THREE.Group.
 */
export function createSnowPlow(upgrades: PlowUpgrades): {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  beaconLight: THREE.PointLight;
  bladeMesh: THREE.Mesh;
  saltSpreaderGroup: THREE.Group;
  accessoryGroup: THREE.Group;
  updateBladeWidth: (level: number) => void;
  updateColor: (hexColor: string) => void;
  updateAccessory: (acc: string) => void;
  updateSaltSpreader: (enabled: boolean) => void;
} {
  const group = new THREE.Group();
  group.name = 'HeroSnowPlow';

  // 1. Vehicle Body Materials (Primary silhouette)
  const truckBodyMat = new THREE.MeshStandardMaterial({
    color: upgrades.paintColor || '#f9a825', // Sunshine yellow default
    roughness: 0.35,
    metalness: 0.65,
  });

  const chassisMat = new THREE.MeshStandardMaterial({
    color: '#263238',
    roughness: 0.85,
    metalness: 0.2,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: '#eceff1',
    roughness: 0.15,
    metalness: 0.95,
  });

  const rubberTireMat = new THREE.MeshStandardMaterial({
    color: '#1a1d20',
    roughness: 0.9,
    metalness: 0.05,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#b0bec5',
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.7,
    thickness: 0.5,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: '#fff9c4',
    emissive: '#fff59d',
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: '#d32f2f',
    emissive: '#e53935',
    emissiveIntensity: 0.6,
  });

  // --- CHASSIS & FRAME ---
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 3.4), chassisMat);
  chassis.position.set(0, 0.55, 0);
  chassis.castShadow = true;
  group.add(chassis);

  // --- CABIN (Upper) ---
  const cabinGeo = new THREE.BoxGeometry(1.5, 1.15, 1.5);
  const cabin = new THREE.Mesh(cabinGeo, truckBodyMat);
  cabin.position.set(0, 1.35, -0.2);
  cabin.castShadow = true;
  group.add(cabin);

  // --- WINDSHIELD & WINDOWS ---
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.65, 0.1), glassMat);
  windshield.position.set(0, 1.45, 0.56);
  windshield.rotation.x = -0.15;
  group.add(windshield);

  // Side windows
  const sideWindowL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.9), glassMat);
  sideWindowL.position.set(-0.76, 1.45, -0.2);
  group.add(sideWindowL);

  const sideWindowR = sideWindowL.clone();
  sideWindowR.position.x = 0.76;
  group.add(sideWindowR);

  // --- HOOD / ENGINE COMPARTMENT (Front) ---
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.7, 1.2), truckBodyMat);
  hood.position.set(0, 0.95, 1.0);
  hood.castShadow = true;
  group.add(hood);

  // Chrome Radiator Grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.1), chromeMat);
  grille.position.set(0, 0.95, 1.62);
  group.add(grille);

  // Headlights (Dual round)
  const headlightGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12);
  headlightGeo.rotateX(Math.PI * 0.5);

  const hlLeft = new THREE.Mesh(headlightGeo, headlightMat);
  hlLeft.position.set(-0.52, 1.0, 1.63);
  group.add(hlLeft);

  const hlRight = new THREE.Mesh(headlightGeo, headlightMat);
  hlRight.position.set(0.52, 1.0, 1.63);
  group.add(hlRight);

  // Dual forward spotlight cones for night plowing
  const spotLightL = new THREE.SpotLight(0xfffaed, 2.5, 25, Math.PI * 0.22, 0.4, 1.2);
  spotLightL.position.set(-0.52, 1.0, 1.6);
  const targetL = new THREE.Object3D();
  targetL.position.set(-0.52, 0.2, 8);
  group.add(targetL);
  spotLightL.target = targetL;
  group.add(spotLightL);

  const spotLightR = spotLightL.clone();
  spotLightR.position.x = 0.52;
  const targetR = new THREE.Object3D();
  targetR.position.set(0.52, 0.2, 8);
  group.add(targetR);
  spotLightR.target = targetR;
  group.add(spotLightR);

  // --- REAR BED (Utility box) ---
  const rearBed = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 1.3), truckBodyMat);
  rearBed.position.set(0, 1.0, -1.35);
  rearBed.castShadow = true;
  group.add(rearBed);

  // Taillights
  const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.08), taillightMat);
  tailL.position.set(-0.6, 0.95, -2.02);
  group.add(tailL);

  const tailR = tailL.clone();
  tailR.position.x = 0.6;
  group.add(tailR);

  // Side Exhaust Stack (Chrome with dark cap)
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), chromeMat);
  exhaust.position.set(-0.82, 1.5, -0.6);
  group.add(exhaust);

  const exhaustCap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.15, 8), chassisMat);
  exhaustCap.position.set(-0.82, 2.22, -0.6);
  group.add(exhaustCap);

  // --- ROTATING AMBER ROOF BEACON ---
  const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.12, 12), chromeMat);
  beaconBase.position.set(0, 1.98, -0.2);
  group.add(beaconBase);

  const beaconDomeMat = new THREE.MeshStandardMaterial({
    color: '#ff9800',
    emissive: '#ff9800',
    emissiveIntensity: 1.2,
    roughness: 0.1,
    transparent: true,
    opacity: 0.9,
  });
  const beaconDome = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.22, 12), beaconDomeMat);
  beaconDome.position.set(0, 2.12, -0.2);
  group.add(beaconDome);

  const beaconLight = new THREE.PointLight(0xff9800, 2.0, 12);
  beaconLight.position.set(0, 2.2, -0.2);
  group.add(beaconLight);

  // --- 4 HEAVY WINTER TIRES WITH WHEEL RIMS ---
  const wheels: THREE.Mesh[] = [];
  const wheelPositions = [
    { x: -0.92, y: 0.5, z: 1.0 }, // Front Left
    { x: 0.92, y: 0.5, z: 1.0 },  // Front Right
    { x: -0.92, y: 0.5, z: -1.1 }, // Rear Left
    { x: 0.92, y: 0.5, z: -1.1 },  // Rear Right
  ];

  const tireGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.36, 16);
  tireGeo.rotateZ(Math.PI * 0.5);

  const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.38, 12);
  rimGeo.rotateZ(Math.PI * 0.5);

  wheelPositions.forEach((pos) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(pos.x, pos.y, pos.z);

    const tireMesh = new THREE.Mesh(tireGeo, rubberTireMat);
    tireMesh.castShadow = true;
    wheelGroup.add(tireMesh);

    const rimMesh = new THREE.Mesh(rimGeo, chromeMat);
    wheelGroup.add(rimMesh);

    group.add(wheelGroup);
    wheels.push(tireMesh);
  });

  // --- FRONT PLOW ASSEMBLY ---
  // Hydraulic support arms
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.9), chassisMat);
  armL.position.set(-0.45, 0.5, 1.9);
  armL.rotation.x = -0.15;
  group.add(armL);

  const armR = armL.clone();
  armR.position.x = 0.45;
  group.add(armR);

  // Heavy steel plow blade
  const bladeWidths = [2.6, 3.2, 3.8, 4.4, 5.0];
  const initialWidth = bladeWidths[Math.min(upgrades.bladeWidthLevel - 1, bladeWidths.length - 1)] || 2.6;

  const bladeMat = new THREE.MeshStandardMaterial({
    color: '#ff6f00', // Safety orange
    roughness: 0.4,
    metalness: 0.7,
  });

  // Curved plow blade (swept curved box)
  const bladeGeo = new THREE.BoxGeometry(initialWidth, 0.75, 0.16);
  const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
  bladeMesh.position.set(0, 0.45, 2.35);
  bladeMesh.rotation.x = -0.12;
  bladeMesh.castShadow = true;
  group.add(bladeMesh);

  // Wear strip (bottom cutting edge)
  const edgeMat = new THREE.MeshStandardMaterial({
    color: '#cfd8dc',
    roughness: 0.2,
    metalness: 0.9,
  });
  const edgeMesh = new THREE.Mesh(new THREE.BoxGeometry(initialWidth, 0.1, 0.18), edgeMat);
  edgeMesh.position.set(0, -0.35, 0);
  bladeMesh.add(edgeMesh);

  // --- REAR SALT SPREADER ATTACHMENT ---
  const saltSpreaderGroup = new THREE.Group();
  saltSpreaderGroup.position.set(0, 0.7, -2.15);

  const hopperMat = new THREE.MeshStandardMaterial({
    color: '#e65100', // Bright orange hopper
    roughness: 0.5,
    metalness: 0.2,
  });
  // Inverted cone hopper
  const hopper = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.6, 12), hopperMat);
  hopper.rotation.x = Math.PI;
  hopper.position.y = 0.3;
  saltSpreaderGroup.add(hopper);

  // Spinner disk
  const spinnerMat = new THREE.MeshStandardMaterial({ color: '#37474f', metalness: 0.8, roughness: 0.3 });
  const spinner = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 12), spinnerMat);
  spinner.position.y = -0.05;
  saltSpreaderGroup.add(spinner);

  saltSpreaderGroup.visible = upgrades.saltSpreader;
  group.add(saltSpreaderGroup);

  // --- ACCESSORY GROUP (Wreath, Antlers, Star, Duck) ---
  const accessoryGroup = new THREE.Group();
  group.add(accessoryGroup);

  function rebuildAccessory(acc: string) {
    while (accessoryGroup.children.length > 0) {
      accessoryGroup.remove(accessoryGroup.children[0]);
    }

    if (acc === 'wreath') {
      // Holiday green wreath on front grill
      const wreathGeo = new THREE.TorusGeometry(0.24, 0.08, 8, 16);
      const wreathMat = new THREE.MeshStandardMaterial({ color: '#2e7d32', roughness: 0.8 });
      const wreath = new THREE.Mesh(wreathGeo, wreathMat);
      wreath.position.set(0, 0.95, 1.7);
      accessoryGroup.add(wreath);

      // Red bow
      const bowMat = new THREE.MeshStandardMaterial({ color: '#d32f2f', roughness: 0.4 });
      const bow = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), bowMat);
      bow.position.set(0, 0.75, 1.74);
      accessoryGroup.add(bow);
    } else if (acc === 'antlers') {
      // Moose antlers on roof
      const antlerMat = new THREE.MeshStandardMaterial({ color: '#795548', roughness: 0.8 });
      const leftAntler = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.08), antlerMat);
      leftAntler.position.set(-0.6, 2.1, -0.2);
      leftAntler.rotation.z = 0.4;
      accessoryGroup.add(leftAntler);

      const rightAntler = leftAntler.clone();
      rightAntler.position.x = 0.6;
      rightAntler.rotation.z = -0.4;
      accessoryGroup.add(rightAntler);

      // Red Rudolph nose on grill
      const noseMat = new THREE.MeshStandardMaterial({ color: '#ff1744', emissive: '#d50000', emissiveIntensity: 0.8 });
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), noseMat);
      nose.position.set(0, 0.95, 1.72);
      accessoryGroup.add(nose);
    } else if (acc === 'star') {
      // Golden star on hood
      const starMat = new THREE.MeshStandardMaterial({
        color: '#ffd700',
        emissive: '#ffb300',
        emissiveIntensity: 0.6,
        metalness: 0.8,
        roughness: 0.2,
      });
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), starMat);
      star.position.set(0, 1.4, 1.4);
      accessoryGroup.add(star);
    } else if (acc === 'duck') {
      // Yellow mascot rubber duck on the hood
      const duckMat = new THREE.MeshStandardMaterial({ color: '#ffeb3b', roughness: 0.3 });
      const duckBody = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), duckMat);
      duckBody.position.set(0, 1.4, 1.4);
      const duckHead = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), duckMat);
      duckHead.position.set(0, 1.55, 1.46);
      duckBody.add(duckHead);

      const billMat = new THREE.MeshStandardMaterial({ color: '#ff9800', roughness: 0.4 });
      const bill = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 8), billMat);
      bill.rotation.x = Math.PI * 0.5;
      bill.position.set(0, 0, 0.12);
      duckHead.add(bill);

      accessoryGroup.add(duckBody);
    }
  }

  rebuildAccessory(upgrades.plowAccessory || 'none');

  function updateBladeWidth(level: number) {
    const widths = [2.6, 3.2, 3.8, 4.4, 5.0];
    const newWidth = widths[Math.min(level - 1, widths.length - 1)] || 2.6;
    bladeMesh.geometry.dispose();
    bladeMesh.geometry = new THREE.BoxGeometry(newWidth, 0.75, 0.16);
    edgeMesh.geometry.dispose();
    edgeMesh.geometry = new THREE.BoxGeometry(newWidth, 0.1, 0.18);
  }

  function updateColor(hexColor: string) {
    truckBodyMat.color.set(hexColor);
  }

  function updateAccessory(acc: string) {
    rebuildAccessory(acc);
  }

  function updateSaltSpreader(enabled: boolean) {
    saltSpreaderGroup.visible = enabled;
  }

  return {
    group,
    wheels,
    beaconLight,
    bladeMesh,
    saltSpreaderGroup,
    accessoryGroup,
    updateBladeWidth,
    updateColor,
    updateAccessory,
    updateSaltSpreader,
  };
}

/**
 * Creates a cozy midwestern house with snow-covered roof, stone chimney, and warm glowing windows.
 */
export function createCozyHouse(data: BuildingData, chimneyPositions: THREE.Vector3[]): THREE.Group {
  const group = new THREE.Group();
  group.position.set(data.x, 0, data.z);
  group.rotation.y = data.rotation;

  // 1. Foundation & Siding
  const wallMat = new THREE.MeshStandardMaterial({
    color: data.color,
    roughness: 0.7,
    metalness: 0.1,
  });

  const baseMat = new THREE.MeshStandardMaterial({
    color: '#455a64',
    roughness: 0.9,
    metalness: 0.05,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: data.roofColor,
    roughness: 0.6,
    metalness: 0.1,
  });

  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xf4f9ff,
    roughness: 0.85,
    metalness: 0.02,
  });

  const windowGlowMat = new THREE.MeshStandardMaterial({
    color: '#ffecb3',
    emissive: '#ffe082',
    emissiveIntensity: 0.7,
    roughness: 0.2,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: '#eceff1',
    roughness: 0.5,
  });

  // Base stone trim
  const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(data.width + 0.2, 0.6, data.depth + 0.2), baseMat);
  baseMesh.position.y = 0.3;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Main walls
  const wallHeight = data.height * 0.55;
  const walls = new THREE.Mesh(new THREE.BoxGeometry(data.width, wallHeight, data.depth), wallMat);
  walls.position.y = 0.6 + wallHeight * 0.5;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  // Front Porch
  const porchDepth = 2.0;
  const porchMesh = new THREE.Mesh(new THREE.BoxGeometry(data.width * 0.5, 0.4, porchDepth), baseMat);
  porchMesh.position.set(0, 0.2, data.depth * 0.5 + porchDepth * 0.5);
  porchMesh.receiveShadow = true;
  group.add(porchMesh);

  // Porch roof
  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(data.width * 0.54, 0.2, porchDepth + 0.3), roofMat);
  porchRoof.position.set(0, wallHeight * 0.6, data.depth * 0.5 + porchDepth * 0.5);
  porchRoof.castShadow = true;
  group.add(porchRoof);

  // Porch pillars
  const pillarGeo = new THREE.BoxGeometry(0.18, wallHeight * 0.6, 0.18);
  const pillarL = new THREE.Mesh(pillarGeo, trimMat);
  pillarL.position.set(-data.width * 0.23, wallHeight * 0.3, data.depth * 0.5 + porchDepth - 0.2);
  group.add(pillarL);

  const pillarR = pillarL.clone();
  pillarR.position.x = data.width * 0.23;
  group.add(pillarR);

  // Cozy Front Door
  const doorMat = new THREE.MeshStandardMaterial({ color: '#5d4037', roughness: 0.8 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.1, 0.08), doorMat);
  door.position.set(0, 0.6 + 1.05, data.depth * 0.5 + 0.04);
  group.add(door);

  // Festive Holiday Door Wreath with Red Bow
  const doorWreathMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.8 });
  const doorWreath = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 16), doorWreathMat);
  doorWreath.position.set(0, 0.6 + 1.45, data.depth * 0.5 + 0.1);
  group.add(doorWreath);

  const doorBowMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.3 });
  const doorBow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.06), doorBowMat);
  doorBow.position.set(0, 0.6 + 1.25, data.depth * 0.5 + 0.12);
  group.add(doorBow);

  // Peaked Roof (Prism / Extruded triangle)
  const roofHeight = data.height * 0.45;
  const roofGeo = new THREE.ConeGeometry(data.width * 0.72, roofHeight, 4);
  roofGeo.rotateY(Math.PI * 0.25);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 0.6 + wallHeight + roofHeight * 0.5, 0);
  roof.scale.set(1.0, 1.0, data.depth / data.width);
  roof.castShadow = true;
  group.add(roof);

  // Snow Cap on roof
  const snowCap = new THREE.Mesh(roofGeo, snowMat);
  snowCap.position.set(0, 0.6 + wallHeight + roofHeight * 0.5 + 0.12, 0);
  snowCap.scale.set(1.04, 1.02, (data.depth / data.width) * 1.04);
  snowCap.castShadow = true;
  group.add(snowCap);

  // Stone Chimney
  const chimneyMat = new THREE.MeshStandardMaterial({ color: '#5d4037', roughness: 0.9 });
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.0, roofHeight + 1.2, 1.0), chimneyMat);
  const chimneyX = data.width * 0.28;
  const chimneyY = 0.6 + wallHeight + roofHeight * 0.5;
  const chimneyZ = -data.depth * 0.2;
  chimney.position.set(chimneyX, chimneyY, chimneyZ);
  chimney.castShadow = true;
  group.add(chimney);

  // Record world position of chimney top for rising smoke particles
  const worldChimneyPos = new THREE.Vector3(chimneyX, chimneyY + roofHeight * 0.5 + 0.6, chimneyZ)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), data.rotation)
    .add(new THREE.Vector3(data.x, 0, data.z));
  chimneyPositions.push(worldChimneyPos);

  // Windows with warm amber lighting
  const winGeo = new THREE.BoxGeometry(1.0, 1.2, 0.12);
  const winFrontL = new THREE.Mesh(winGeo, windowGlowMat);
  winFrontL.position.set(-data.width * 0.28, 0.6 + wallHeight * 0.45, data.depth * 0.5 + 0.05);
  group.add(winFrontL);

  const winFrontR = winFrontL.clone();
  winFrontR.position.x = data.width * 0.28;
  group.add(winFrontR);

  // Warm window light spilling out
  const winLight = new THREE.PointLight(0xffb74d, 1.2, 7);
  winLight.position.set(0, 1.5, data.depth * 0.5 + 1.2);
  group.add(winLight);

  return group;
}

/**
 * Creates Town Hall with neoclassical columns, snowy pediment, and Clock Tower.
 */
export function createTownHall(data: BuildingData, chimneyPositions: THREE.Vector3[]): THREE.Group {
  const group = new THREE.Group();
  group.position.set(data.x, 0, data.z);

  const stoneMat = new THREE.MeshStandardMaterial({ color: '#e0d8c8', roughness: 0.7, metalness: 0.1 });
  const brickMat = new THREE.MeshStandardMaterial({ color: '#8d2b2b', roughness: 0.8, metalness: 0.05 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf4f9ff, roughness: 0.85 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#ffd700', metalness: 0.85, roughness: 0.2 });

  // Main two-story building
  const mainHall = new THREE.Mesh(new THREE.BoxGeometry(data.width, 5.0, data.depth), stoneMat);
  mainHall.position.y = 2.5;
  mainHall.castShadow = true;
  mainHall.receiveShadow = true;
  group.add(mainHall);

  // Front stately columns
  for (let i = -2; i <= 2; i++) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 4.8, 12), stoneMat);
    col.position.set(i * 2.2, 2.4, data.depth * 0.5 + 1.0);
    col.castShadow = true;
    group.add(col);
  }

  // Pediment portico roof
  const pediment = new THREE.Mesh(new THREE.BoxGeometry(data.width * 0.9, 0.6, 2.8), stoneMat);
  pediment.position.set(0, 5.1, data.depth * 0.5 + 0.6);
  group.add(pediment);

  // Main snowy roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(data.width + 0.6, 1.2, data.depth + 0.6), brickMat);
  roof.position.set(0, 5.6, 0);
  roof.castShadow = true;
  group.add(roof);

  const snowRoof = new THREE.Mesh(new THREE.BoxGeometry(data.width + 0.8, 0.4, data.depth + 0.8), snowMat);
  snowRoof.position.set(0, 6.3, 0);
  group.add(snowRoof);

  // Clock Tower
  const tower = new THREE.Mesh(new THREE.BoxGeometry(4.0, 5.0, 4.0), brickMat);
  tower.position.set(0, 8.5, 0);
  tower.castShadow = true;
  group.add(tower);

  // Clock faces (North, South, East, West)
  const clockGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.1, 16);
  clockGeo.rotateX(Math.PI * 0.5);
  const clockMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#fffde7',
    emissiveIntensity: 0.6,
  });

  const clockFront = new THREE.Mesh(clockGeo, clockMat);
  clockFront.position.set(0, 8.8, 2.05);
  group.add(clockFront);

  // Golden Bell Cupola & Weather Vane
  const cupola = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.8, 8), goldMat);
  cupola.position.set(0, 12.4, 0);
  cupola.castShadow = true;
  group.add(cupola);

  const vane = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), goldMat);
  vane.position.set(0, 14.2, 0);
  group.add(vane);

  return group;
}

/**
 * Creates Bob's 50s Diner with retro awning, neon sign, and corner windows.
 */
export function createDiner(data: BuildingData): THREE.Group {
  const group = new THREE.Group();
  group.position.set(data.x, 0, data.z);

  const chromeMat = new THREE.MeshStandardMaterial({ color: '#cfd8dc', metalness: 0.9, roughness: 0.2 });
  const tealMat = new THREE.MeshStandardMaterial({ color: '#26c6da', roughness: 0.4 });
  const awningRedMat = new THREE.MeshStandardMaterial({ color: '#e53935', roughness: 0.6 });
  const neonMat = new THREE.MeshStandardMaterial({ color: '#ff4081', emissive: '#f50057', emissiveIntensity: 1.5 });
  const windowGlow = new THREE.MeshStandardMaterial({ color: '#fff9c4', emissive: '#fff59d', emissiveIntensity: 0.6 });

  // Diner body
  const body = new THREE.Mesh(new THREE.BoxGeometry(data.width, 3.8, data.depth), tealMat);
  body.position.y = 1.9;
  body.castShadow = true;
  group.add(body);

  // Chrome lower & upper bands
  const bandGeo = new THREE.BoxGeometry(data.width + 0.2, 0.35, data.depth + 0.2);
  const bandBottom = new THREE.Mesh(bandGeo, chromeMat);
  bandBottom.position.y = 0.5;
  group.add(bandBottom);

  const bandTop = new THREE.Mesh(bandGeo, chromeMat);
  bandTop.position.y = 3.6;
  group.add(bandTop);

  // Large diner panoramic windows
  const winFront = new THREE.Mesh(new THREE.BoxGeometry(data.width * 0.75, 1.6, 0.1), windowGlow);
  winFront.position.set(0, 2.0, data.depth * 0.5 + 0.05);
  group.add(winFront);

  // Striped Awning
  const awning = new THREE.Mesh(new THREE.BoxGeometry(data.width * 0.85, 0.3, 1.8), awningRedMat);
  awning.position.set(0, 3.1, data.depth * 0.5 + 0.9);
  awning.rotation.x = 0.2;
  group.add(awning);

  // Roof Neon Sign ("BOB'S")
  const signMesh = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 0.3), neonMat);
  signMesh.position.set(0, 4.6, 0);
  group.add(signMesh);

  // Roof snow blanket
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf4f9ff, roughness: 0.9 });
  const snow = new THREE.Mesh(new THREE.BoxGeometry(data.width + 0.3, 0.4, data.depth + 0.3), snowMat);
  snow.position.set(0, 3.9, 0);
  group.add(snow);

  return group;
}

/**
 * Creates Vintage Gas Station with canopy and dual gas pumps.
 */
export function createGasStation(data: BuildingData): THREE.Group {
  const group = new THREE.Group();
  group.position.set(data.x, 0, data.z);

  const yellowMat = new THREE.MeshStandardMaterial({ color: '#fbc02d', roughness: 0.5 });
  const steelMat = new THREE.MeshStandardMaterial({ color: '#455a64', metalness: 0.8, roughness: 0.3 });
  const pumpRedMat = new THREE.MeshStandardMaterial({ color: '#d32f2f', metalness: 0.4, roughness: 0.4 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf4f9ff, roughness: 0.9 });

  // Office & service garage
  const garage = new THREE.Mesh(new THREE.BoxGeometry(data.width * 0.6, 4.0, data.depth), yellowMat);
  garage.position.set(-data.width * 0.2, 2.0, 0);
  garage.castShadow = true;
  group.add(garage);

  // Garage roll-up door
  const doorMat = new THREE.MeshStandardMaterial({ color: '#90a4ae', roughness: 0.7 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.2, 0.1), doorMat);
  door.position.set(-data.width * 0.2, 1.6, data.depth * 0.5 + 0.05);
  group.add(door);

  // Canopy extending out over gas pumps
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.5, 6.0), yellowMat);
  canopy.position.set(data.width * 0.3, 3.8, 0);
  group.add(canopy);

  // Canopy snow
  const canopySnow = new THREE.Mesh(new THREE.BoxGeometry(6.7, 0.3, 6.2), snowMat);
  canopySnow.position.set(data.width * 0.3, 4.15, 0);
  group.add(canopySnow);

  // Steel canopy support pillars
  const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.6, 12), steelMat);
  pillar1.position.set(data.width * 0.3 - 2.2, 1.8, 0);
  group.add(pillar1);

  const pillar2 = pillar1.clone();
  pillar2.position.x = data.width * 0.3 + 2.2;
  group.add(pillar2);

  // Vintage Red Gas Pumps
  [-1.0, 1.0].forEach((offset) => {
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.6), pumpRedMat);
    pump.position.set(data.width * 0.3 + offset, 0.9, 0);
    pump.castShadow = true;
    group.add(pump);

    // Glowing globe on top
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 12, 12),
      new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.8 })
    );
    globe.position.set(data.width * 0.3 + offset, 2.0, 0);
    group.add(globe);
  });

  return group;
}

/**
 * Creates Water Tower on 4 structural steel truss legs with "FROSTY HOLLOW" banner.
 */
export function createWaterTower(data: BuildingData): THREE.Group {
  const group = new THREE.Group();
  group.position.set(data.x, 0, data.z);

  const steelMat = new THREE.MeshStandardMaterial({ color: '#78909c', metalness: 0.7, roughness: 0.4 });
  const tankMat = new THREE.MeshStandardMaterial({ color: '#90caf9', roughness: 0.4, metalness: 0.3 });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf4f9ff, roughness: 0.9 });

  // 4 steel support legs
  const legHeight = 9.0;
  const legPositions = [
    { x: -2.0, z: -2.0 },
    { x: 2.0, z: -2.0 },
    { x: -2.0, z: 2.0 },
    { x: 2.0, z: 2.0 },
  ];

  legPositions.forEach((pos) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, legHeight, 8), steelMat);
    leg.position.set(pos.x, legHeight * 0.5, pos.z);
    leg.castShadow = true;
    group.add(leg);
  });

  // Cross bracing
  const braceMat = new THREE.MeshStandardMaterial({ color: '#546e7a', metalness: 0.6 });
  const brace = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.12, 8, 16), braceMat);
  brace.position.y = legHeight * 0.6;
  brace.rotation.x = Math.PI * 0.5;
  group.add(brace);

  // Large Cylindrical Tank
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 4.0, 18), tankMat);
  tank.position.y = legHeight + 2.0;
  tank.castShadow = true;
  group.add(tank);

  // Conical roof with thick snow
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 2.0, 18), tankMat);
  roof.position.y = legHeight + 5.0;
  roof.castShadow = true;
  group.add(roof);

  const snowRoof = new THREE.Mesh(new THREE.ConeGeometry(4.0, 1.8, 18), snowMat);
  snowRoof.position.y = legHeight + 5.3;
  group.add(snowRoof);

  // Red blinking aviation beacon on top
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#ff1744', emissive: '#d50000', emissiveIntensity: 1.5 })
  );
  beacon.position.y = legHeight + 6.3;
  group.add(beacon);

  return group;
}

/**
 * Creates Fluffy Snowy Pine Tree with 3 tiered cones.
 */
export function createPineTree(data: PropData): THREE.Group {
  const group = new THREE.Group();
  group.position.set(data.x, 0, data.z);
  const scale = data.scale || 1.0;
  group.scale.set(scale, scale, scale);

  const trunkMat = new THREE.MeshStandardMaterial({ color: '#5d4037', roughness: 0.9 });
  const pineMat = new THREE.MeshStandardMaterial({ color: '#2e7d32', roughness: 0.75, flatShading: true });
  const snowMat = new THREE.MeshStandardMaterial({ color: 0xf4f9ff, roughness: 0.85, flatShading: true });

  // Trunk
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.6, 8), trunkMat);
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  group.add(trunk);

  // 3 branch cones with snow caps
  const tiers = [
    { radius: 2.2, height: 2.2, y: 2.0 },
    { radius: 1.7, height: 1.9, y: 3.3 },
    { radius: 1.1, height: 1.6, y: 4.4 },
  ];

  tiers.forEach((t) => {
    const branches = new THREE.Mesh(new THREE.ConeGeometry(t.radius, t.height, 8), pineMat);
    branches.position.y = t.y;
    branches.castShadow = true;
    group.add(branches);

    // Snow blanket on branches
    const snowLayer = new THREE.Mesh(new THREE.ConeGeometry(t.radius * 0.95, t.height * 0.4, 8), snowMat);
    snowLayer.position.y = t.y + t.height * 0.25;
    group.add(snowLayer);
  });

  return group;
}

/**
 * Creates the giant Town Center Holiday Tree with colorful glowing fairy lights and gold star!
 */
export function createHolidayTree(data: PropData): THREE.Group {
  const group = createPineTree(data);

  // Gold Star on tip
  const starMat = new THREE.MeshStandardMaterial({
    color: '#ffd700',
    emissive: '#ffb300',
    emissiveIntensity: 1.0,
    metalness: 0.8,
  });
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), starMat);
  star.position.y = 5.6;
  group.add(star);

  // Colorful glowing bauble lights
  const lightColors = ['#ff1744', '#00e676', '#ffea00', '#2979ff', '#ff3d00', '#f50057', '#76ff03'];
  const lightCount = 42;

  for (let i = 0; i < lightCount; i++) {
    const angle = i * 0.55;
    const progress = i / lightCount;
    const radius = 2.1 * (1.0 - progress * 0.72);
    const y = 1.6 + progress * 3.6;

    const bulbColor = lightColors[i % lightColors.length];
    const bulbMat = new THREE.MeshStandardMaterial({
      color: bulbColor,
      emissive: bulbColor,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 6), bulbMat);
    bulb.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    group.add(bulb);
  }

  // Warm festive tree glow
  const treeGlow = new THREE.PointLight(0xffecb3, 1.8, 16, 1.5);
  treeGlow.position.set(0, 3.2, 0);
  group.add(treeGlow);

  return group;
}

export interface SnowmanPart {
  mesh: THREE.Object3D;
  initialPos: THREE.Vector3;
  initialRot: THREE.Euler;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
}

export interface SnowmanEntity {
  group: THREE.Group;
  x: number;
  z: number;
  radius: number;
  isBroken: boolean;
  respawnTimer: number;
  parts: SnowmanPart[];
  break: (impactVel: THREE.Vector3) => void;
  update: (dt: number) => void;
  reset: () => void;
}

/**
 * Creates friendly breakable Snowman with top hat, carrot nose, and red scarf.
 */
export function createSnowman(data: PropData): SnowmanEntity {
  const group = new THREE.Group();
  group.position.set(data.x, 0, data.z);
  if (data.rotation) group.rotation.y = data.rotation;

  const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
  const coalMat = new THREE.MeshStandardMaterial({ color: '#212121', roughness: 0.9 });
  const carrotMat = new THREE.MeshStandardMaterial({ color: '#ff6f00', roughness: 0.6 });
  const scarfMat = new THREE.MeshStandardMaterial({ color: '#c62828', roughness: 0.7 });
  const woodMat = new THREE.MeshStandardMaterial({ color: '#4e342e', roughness: 0.9 });

  const parts: SnowmanPart[] = [];

  function registerPart(mesh: THREE.Object3D) {
    parts.push({
      mesh,
      initialPos: mesh.position.clone(),
      initialRot: mesh.rotation.clone(),
      vel: new THREE.Vector3(),
      rotVel: new THREE.Vector3(),
    });
    group.add(mesh);
    return mesh;
  }

  // 1. Base sphere
  const base = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 12), snowMat);
  base.position.y = 0.65;
  base.castShadow = true;
  registerPart(base);

  // 2. Middle sphere
  const middle = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), snowMat);
  middle.position.y = 1.55;
  middle.castShadow = true;
  registerPart(middle);

  // 3. Head sphere
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), snowMat);
  head.position.y = 2.25;
  head.castShadow = true;
  registerPart(head);

  // 4. Red Scarf
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.09, 8, 16), scarfMat);
  scarf.position.y = 1.95;
  scarf.rotation.x = Math.PI * 0.5;
  registerPart(scarf);

  // 5. Carrot Nose
  const carrot = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 8), carrotMat);
  carrot.position.set(0, 2.25, 0.45);
  carrot.rotation.x = Math.PI * 0.5;
  registerPart(carrot);

  // 6. Black Top Hat
  const hatGroup = new THREE.Group();
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.05, 12), coalMat);
  hatBrim.position.y = 2.55;
  hatGroup.add(hatBrim);

  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.45, 12), coalMat);
  hatCrown.position.y = 2.8;
  hatGroup.add(hatCrown);

  // Festive Red Ribbon Band on Hat
  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.1, 12), scarfMat);
  hatBand.position.y = 2.62;
  hatGroup.add(hatBand);

  registerPart(hatGroup);

  // 7. Stick arms
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), woodMat);
  armL.position.set(-0.65, 1.6, 0);
  armL.rotation.z = 0.7;
  registerPart(armL);

  const armR = armL.clone();
  armR.position.x = 0.65;
  armR.rotation.z = -0.7;
  registerPart(armR);

  let isBroken = false;
  let respawnTimer = 0;

  const entity: SnowmanEntity = {
    group,
    x: data.x,
    z: data.z,
    radius: 1.1,
    get isBroken() {
      return isBroken;
    },
    set isBroken(v: boolean) {
      isBroken = v;
    },
    get respawnTimer() {
      return respawnTimer;
    },
    set respawnTimer(v: number) {
      respawnTimer = v;
    },
    parts,
    break(impactVel: THREE.Vector3) {
      if (isBroken) return;
      isBroken = true;
      respawnTimer = 16.0; // Respawns after 16 seconds

      // Scatter parts with comical explosion physics
      parts.forEach((part, index) => {
        const speed = 2.5 + Math.random() * 4.0;
        const spreadAngle = (index / parts.length) * Math.PI * 2 + (Math.random() - 0.5);

        part.vel.set(
          impactVel.x * 0.5 + Math.cos(spreadAngle) * speed,
          3.5 + Math.random() * 4.5,
          impactVel.z * 0.5 + Math.sin(spreadAngle) * speed
        );

        part.rotVel.set(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12
        );
      });
    },
    update(dt: number) {
      if (!isBroken) return;

      respawnTimer -= dt;

      // Update flying / rolling parts
      parts.forEach((part) => {
        part.vel.y -= 14 * dt; // Gravity
        part.mesh.position.addScaledVector(part.vel, dt);

        part.mesh.rotation.x += part.rotVel.x * dt;
        part.mesh.rotation.y += part.rotVel.y * dt;
        part.mesh.rotation.z += part.rotVel.z * dt;

        // Ground bounce and sliding friction
        if (part.mesh.position.y <= 0.15) {
          part.mesh.position.y = 0.15;
          if (part.vel.y < -0.8) {
            part.vel.y = -part.vel.y * 0.28;
          } else {
            part.vel.y = 0;
          }
          part.vel.x *= 0.88;
          part.vel.z *= 0.88;
          part.rotVel.multiplyScalar(0.88);
        }
      });

      // Respawn when timer finishes
      if (respawnTimer <= 0) {
        entity.reset();
      }
    },
    reset() {
      isBroken = false;
      respawnTimer = 0;
      parts.forEach((part) => {
        part.mesh.position.copy(part.initialPos);
        part.mesh.rotation.copy(part.initialRot);
        part.vel.set(0, 0, 0);
        part.rotVel.set(0, 0, 0);
      });
    },
  };

  return entity;
}

/**
 * Creates vintage cast iron streetlamp with glowing lantern.
 */
export function createStreetlamp(data: PropData): { group: THREE.Group; light: THREE.PointLight } {
  const group = new THREE.Group();
  group.position.set(data.x, 0, data.z);

  const ironMat = new THREE.MeshStandardMaterial({ color: '#263238', metalness: 0.85, roughness: 0.4 });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: '#ffe082',
    emissive: '#ffb300',
    emissiveIntensity: 1.2,
    roughness: 0.1,
  });

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.6, 8), ironMat);
  base.position.y = 0.3;
  group.add(base);

  // Pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 4.2, 8), ironMat);
  pole.position.y = 2.4;
  pole.castShadow = true;
  group.add(pole);

  // Ornate top bracket & Lantern
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.3, 6), ironMat);
  cap.position.y = 4.8;
  group.add(cap);

  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.5, 6), lanternMat);
  glass.position.y = 4.45;
  group.add(glass);

  // Festive Holiday Evergreen Wreath & Red Velvet Bow on Lamppost
  const wreathMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.8 });
  const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 16), wreathMat);
  wreath.position.set(0, 2.7, 0.12);
  group.add(wreath);

  const bowMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 });
  const bow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.06), bowMat);
  bow.position.set(0, 2.48, 0.14);
  group.add(bow);

  // Warm glowing point light for cozy nighttime lighting
  const light = new THREE.PointLight(0xffb74d, 1.6, 14, 1.2);
  light.position.set(0, 4.3, 0);
  group.add(light);

  return { group, light };
}

/**
 * Creates town park bench.
 */
export function createBench(data: PropData): THREE.Group {
  const group = new THREE.Group();
  group.position.set(data.x, 0, data.z);
  if (data.rotation) group.rotation.y = data.rotation;

  const woodMat = new THREE.MeshStandardMaterial({ color: '#6d4c41', roughness: 0.8 });
  const ironMat = new THREE.MeshStandardMaterial({ color: '#37474f', metalness: 0.8 });

  // Seat slats
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.6), woodMat);
  seat.position.y = 0.55;
  group.add(seat);

  // Backrest
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.1), woodMat);
  back.position.set(0, 1.0, -0.28);
  back.rotation.x = -0.15;
  group.add(back);

  // Cast iron legs
  const legGeo = new THREE.BoxGeometry(0.08, 0.55, 0.6);
  const legL = new THREE.Mesh(legGeo, ironMat);
  legL.position.set(-0.85, 0.275, 0);
  group.add(legL);

  const legR = legL.clone();
  legR.position.x = 0.85;
  group.add(legR);

  return group;
}

/**
 * Creates wooden mailbox.
 */
export function createMailbox(data: PropData): THREE.Group {
  const group = new THREE.Group();
  group.position.set(data.x, 0, data.z);

  const postMat = new THREE.MeshStandardMaterial({ color: '#8d6e63', roughness: 0.9 });
  const boxMat = new THREE.MeshStandardMaterial({ color: '#cfd8dc', metalness: 0.6, roughness: 0.3 });
  const flagMat = new THREE.MeshStandardMaterial({ color: '#e53935' });

  // Wooden post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.3, 6), postMat);
  post.position.y = 0.65;
  group.add(post);

  // Curved mailbox
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.65), boxMat);
  box.position.set(0, 1.35, 0.1);
  group.add(box);

  // Red flag up
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.12), flagMat);
  flag.position.set(0.2, 1.45, 0.15);
  group.add(flag);

  return group;
}

/**
 * Creates red fire hydrant.
 */
export function createHydrant(data: PropData): THREE.Group {
  const group = new THREE.Group();
  group.position.set(data.x, 0, data.z);

  const redMat = new THREE.MeshStandardMaterial({ color: '#d32f2f', roughness: 0.5, metalness: 0.4 });
  const capMat = new THREE.MeshStandardMaterial({ color: '#ffd54f', metalness: 0.7 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.8, 12), redMat);
  body.position.y = 0.4;
  group.add(body);

  const top = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 10), redMat);
  top.position.y = 0.8;
  group.add(top);

  const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 6), capMat);
  nut.position.y = 0.95;
  group.add(nut);

  return group;
}
