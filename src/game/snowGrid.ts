import * as THREE from 'three';
import { RoadSegment, TownLayout } from './townMap';

export interface SnowVoxel {
  id: number;
  x: number;
  z: number;
  roadId: string;
  cleared: boolean;
  scaleY: number;
  initialScaleY: number;
}

export interface SnowClearResult {
  clearedCount: number;
  coinsEarned: number;
  comboTriggered: boolean;
  clearedPositions: { x: number; y: number; z: number }[];
  completedRoads: string[];
}

export class SnowManager {
  public voxels: SnowVoxel[] = [];
  public instancedMesh!: THREE.InstancedMesh;
  public totalSnowCount: number = 0;
  public clearedSnowCount: number = 0;

  // Road completion tracking
  public roadSnowCount: Map<string, { total: number; cleared: number; name: string }> = new Map();
  public newlyCompletedRoads: string[] = [];

  // Temporary Three.js math objects to avoid GC allocation during ticks
  private dummy = new THREE.Object3D();
  private tempColor = new THREE.Color();
  private gridSpatialHash: Map<string, number[]> = new Map();
  private readonly cellSize: number = 1.6; // Spacing of snow voxels
  private readonly hashCellSize: number = 3.2; // Spatial bucket size for O(1) broadphase

  constructor(townLayout: TownLayout, scene: THREE.Scene) {
    this.buildSnowGrid(townLayout);
    this.createInstancedMesh(scene);
  }

  private hashKey(x: number, z: number): string {
    const cx = Math.floor(x / this.hashCellSize);
    const cz = Math.floor(z / this.hashCellSize);
    return `${cx},${cz}`;
  }

  private buildSnowGrid(townLayout: TownLayout) {
    let idCounter = 0;

    // Populate snow on all roads, avenues, driveways, and plazas
    townLayout.roads.forEach((road: RoadSegment) => {
      const halfW = road.width * 0.5 - 0.4;
      const halfL = road.length * 0.5 - 0.4;

      let roadTotal = 0;

      for (let x = -halfW; x <= halfW; x += this.cellSize) {
        for (let z = -halfL; z <= halfL; z += this.cellSize) {
          const worldX = road.x + x;
          const worldZ = road.z + z;

          // 1. Don't spawn snow outside reachable town boundary
          if (Math.abs(worldX) > 55 || Math.abs(worldZ) > 52) {
            continue;
          }

          // 2. Don't spawn snow under or directly against buildings (clearance margin = 1.3m)
          let underBuilding = false;
          for (const b of townLayout.buildings) {
            const clearance = 1.3;
            const bHalfW = b.width * 0.5 + clearance;
            const bHalfD = b.depth * 0.5 + clearance;
            if (
              worldX >= b.x - bHalfW &&
              worldX <= b.x + bHalfW &&
              worldZ >= b.z - bHalfD &&
              worldZ <= b.z + bHalfD
            ) {
              underBuilding = true;
              break;
            }
          }
          if (underBuilding) continue;

          // 3. Don't spawn snow inside holiday tree trunk at center plaza (0, -12)
          if (Math.hypot(worldX, worldZ - (-12)) < 2.2) {
            continue;
          }

          // 4. Don't spawn snow right where the plow sits at spawn
          const distToSpawn = Math.hypot(worldX - townLayout.spawnPoint.x, worldZ - townLayout.spawnPoint.z);
          if (distToSpawn < 3.2) continue;

          // Subtle organic height variation for cartoon fluffy snow mounds
          const heightVariation = 0.65 + Math.sin(worldX * 0.5) * 0.15 + Math.cos(worldZ * 0.6) * 0.12;

          const voxel: SnowVoxel = {
            id: idCounter,
            x: worldX,
            z: worldZ,
            roadId: road.id,
            cleared: false,
            scaleY: heightVariation,
            initialScaleY: heightVariation,
          };

          this.voxels.push(voxel);

          // Spatial hash for lightning fast collision detection
          const key = this.hashKey(worldX, worldZ);
          if (!this.gridSpatialHash.has(key)) {
            this.gridSpatialHash.set(key, []);
          }
          this.gridSpatialHash.get(key)!.push(idCounter);

          idCounter++;
          roadTotal++;
        }
      }

      this.roadSnowCount.set(road.id, {
        total: roadTotal,
        cleared: 0,
        name: road.name,
      });
    });

    this.totalSnowCount = this.voxels.length;
  }

  private createInstancedMesh(scene: THREE.Scene) {
    // Cute pillowy beveled box geometry for fluffy snow mounds
    const geometry = new THREE.CylinderGeometry(0.85, 0.95, 0.45, 8);
    geometry.translate(0, 0.225, 0); // bottom pivot flush with road

    // Crisp cartoon snow material with soft specular and slight ice-blue tint
    const material = new THREE.MeshStandardMaterial({
      color: 0xf4f9ff,
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.voxels.length);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Initial transform matrix setup (placed cleanly at y = 0.04 to sit atop roads without Z-fighting)
    for (let i = 0; i < this.voxels.length; i++) {
      const v = this.voxels[i];
      this.dummy.position.set(v.x, 0.04, v.z);
      this.dummy.scale.set(1.0, v.scaleY, 1.0);
      this.dummy.rotation.set(0, (i * 1.3) % (Math.PI * 2), 0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.computeBoundingSphere();
    scene.add(this.instancedMesh);
  }

  /**
   * Check snow in front of the plow blade and clear it
   */
  public clearSnowAt(
    bladeCenter: THREE.Vector3,
    bladeWidth: number,
    plowForward: THREE.Vector3,
    saltRadius: number = 0
  ): SnowClearResult {
    const result: SnowClearResult = {
      clearedCount: 0,
      coinsEarned: 0,
      comboTriggered: false,
      clearedPositions: [],
      completedRoads: [],
    };

    const searchRadius = Math.max(bladeWidth * 0.7, saltRadius) + this.hashCellSize;
    const minCx = Math.floor((bladeCenter.x - searchRadius) / this.hashCellSize);
    const maxCx = Math.floor((bladeCenter.x + searchRadius) / this.hashCellSize);
    const minCz = Math.floor((bladeCenter.z - searchRadius) / this.hashCellSize);
    const maxCz = Math.floor((bladeCenter.z + searchRadius) / this.hashCellSize);

    let matrixNeedsUpdate = false;

    // Normal perpendicular to plow forward vector (along blade)
    const bladeRight = new THREE.Vector3(-plowForward.z, 0, plowForward.x).normalize();

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const voxelIds = this.gridSpatialHash.get(`${cx},${cz}`);
        if (!voxelIds) continue;

        for (const id of voxelIds) {
          const v = this.voxels[id];
          if (v.cleared) continue;

          let shouldClear = false;

          // 1. Blade sweep check
          const toVoxel = new THREE.Vector3(v.x - bladeCenter.x, 0, v.z - bladeCenter.z);
          const forwardDist = toVoxel.dot(plowForward);
          const lateralDist = Math.abs(toVoxel.dot(bladeRight));

          if (forwardDist >= -0.6 && forwardDist <= 1.4 && lateralDist <= bladeWidth * 0.55) {
            shouldClear = true;
          }

          // 2. Salt spreader check (behind vehicle)
          if (!shouldClear && saltRadius > 0) {
            const dist = Math.hypot(v.x - bladeCenter.x, v.z - bladeCenter.z);
            if (dist <= saltRadius) {
              shouldClear = true;
            }
          }

          if (shouldClear) {
            v.cleared = true;
            v.scaleY = 0;
            this.clearedSnowCount++;
            result.clearedCount++;
            result.clearedPositions.push({ x: v.x, y: 0.2, z: v.z });

            // Zero scale to make voxel disappear instantly
            this.dummy.position.set(v.x, -0.5, v.z);
            this.dummy.scale.set(0.0001, 0.0001, 0.0001);
            this.dummy.updateMatrix();
            this.instancedMesh.setMatrixAt(id, this.dummy.matrix);
            matrixNeedsUpdate = true;

            // Track road clearance
            const roadStat = this.roadSnowCount.get(v.roadId);
            if (roadStat) {
              roadStat.cleared++;
              if (roadStat.cleared === roadStat.total && roadStat.total > 0) {
                result.completedRoads.push(roadStat.name);
              }
            }
          }
        }
      }
    }

    if (matrixNeedsUpdate) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }

    return result;
  }

  public getRoadStats(roadId: string) {
    return this.roadSnowCount.get(roadId);
  }

  public getPercentCleared(): number {
    if (this.totalSnowCount === 0) return 100;
    if (this.clearedSnowCount >= this.totalSnowCount - 1) return 100;
    return Math.min(100, Math.floor((this.clearedSnowCount / this.totalSnowCount) * 100));
  }

  public dispose() {
    if (this.instancedMesh) {
      this.instancedMesh.geometry.dispose();
      if (Array.isArray(this.instancedMesh.material)) {
        this.instancedMesh.material.forEach((m) => m.dispose());
      } else {
        this.instancedMesh.material.dispose();
      }
    }
  }
}
