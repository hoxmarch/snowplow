import * as THREE from 'three';

interface SnowPlumeParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
}

interface ChimneySmokeParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
}

export class ParticleManager {
  private scene: THREE.Scene;

  // 1. Ambient Falling Snow
  private snowParticlesMesh!: THREE.Points;
  private snowCount = 1800;
  private snowPositions!: Float32Array;
  private snowVelocities!: Float32Array;

  // 2. Active Snow Plumes (plow spray)
  private plumes: SnowPlumeParticle[] = [];
  private plumeMesh!: THREE.InstancedMesh;
  private maxPlumes = 180;
  private dummy = new THREE.Object3D();

  // 3. Chimney Smoke
  private smokes: ChimneySmokeParticle[] = [];
  private smokeMesh!: THREE.InstancedMesh;
  private maxSmokes = 80;

  // Chimney emitter world positions
  private chimneyEmitters: THREE.Vector3[] = [];
  private smokeTimer: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initAmbientSnow();
    this.initPlumes();
    this.initSmoke();
  }

  public setChimneys(positions: THREE.Vector3[]) {
    this.chimneyEmitters = positions;
  }

  private initAmbientSnow() {
    const geo = new THREE.BufferGeometry();
    this.snowPositions = new Float32Array(this.snowCount * 3);
    this.snowVelocities = new Float32Array(this.snowCount * 3);

    const rangeX = 130;
    const rangeZ = 130;
    const rangeY = 40;

    for (let i = 0; i < this.snowCount; i++) {
      this.snowPositions[i * 3 + 0] = (Math.random() - 0.5) * rangeX;
      this.snowPositions[i * 3 + 1] = Math.random() * rangeY;
      this.snowPositions[i * 3 + 2] = (Math.random() - 0.5) * rangeZ;

      this.snowVelocities[i * 3 + 0] = (Math.random() - 0.5) * 0.8; // wind drift
      this.snowVelocities[i * 3 + 1] = -1.8 - Math.random() * 2.2; // fall speed
      this.snowVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));

    // Circular soft snowflake texture generated on canvas
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.5, 'rgba(230, 245, 255, 0.8)');
    grad.addColorStop(1, 'rgba(230, 245, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 15, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.PointsMaterial({
      size: 0.8,
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
      blending: THREE.NormalBlending,
    });

    this.snowParticlesMesh = new THREE.Points(geo, mat);
    this.scene.add(this.snowParticlesMesh);
  }

  private initPlumes() {
    const geo = new THREE.DodecahedronGeometry(0.32, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: true,
    });

    this.plumeMesh = new THREE.InstancedMesh(geo, mat, this.maxPlumes);
    this.plumeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Hide initially
    for (let i = 0; i < this.maxPlumes; i++) {
      this.dummy.position.set(0, -100, 0);
      this.dummy.scale.set(0.001, 0.001, 0.001);
      this.dummy.updateMatrix();
      this.plumeMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.plumeMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.plumeMesh);
  }

  private initSmoke() {
    const geo = new THREE.SphereGeometry(0.3, 6, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 1.0,
      metalness: 0.0,
      transparent: true,
      opacity: 0.45,
    });

    this.smokeMesh = new THREE.InstancedMesh(geo, mat, this.maxSmokes);
    this.smokeMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < this.maxSmokes; i++) {
      this.dummy.position.set(0, -100, 0);
      this.dummy.scale.set(0.001, 0.001, 0.001);
      this.dummy.updateMatrix();
      this.smokeMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.smokeMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.smokeMesh);
  }

  public emitPlowSpray(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    isCannon: boolean = false
  ) {
    const count = isCannon ? 6 : 3;
    const sprayRight = new THREE.Vector3(-direction.z, 0, direction.x).normalize();

    for (let i = 0; i < count; i++) {
      if (this.plumes.length >= this.maxPlumes) {
        this.plumes.shift(); // Recycle oldest
      }

      // Spray out to the right side and forward
      const sideOffset = sprayRight.clone().multiplyScalar(0.7 + Math.random() * 0.8);
      const sprayVel = sprayRight
        .clone()
        .multiplyScalar(2.2 + Math.random() * (isCannon ? 8 : 4))
        .add(direction.clone().multiplyScalar(1.2 + speed * 0.8));

      sprayVel.y = isCannon ? 4.5 + Math.random() * 3.5 : 1.8 + Math.random() * 2.2;

      // Random jitter
      sprayVel.x += (Math.random() - 0.5) * 1.0;
      sprayVel.z += (Math.random() - 0.5) * 1.0;

      this.plumes.push({
        position: origin.clone().add(sideOffset),
        velocity: sprayVel,
        life: 0,
        maxLife: isCannon ? 0.9 : 0.6,
        scale: (isCannon ? 1.4 : 1.0) * (0.6 + Math.random() * 0.6),
      });
    }
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    // 1. Update ambient falling snow
    const posAttr = this.snowParticlesMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < this.snowCount; i++) {
      const idx = i * 3;
      array[idx + 0] += this.snowVelocities[idx + 0] * delta;
      array[idx + 1] += this.snowVelocities[idx + 1] * delta;
      array[idx + 2] += this.snowVelocities[idx + 2] * delta;

      // Wrap around near player
      if (array[idx + 1] < 0.1) {
        array[idx + 1] = 35 + Math.random() * 5;
        array[idx + 0] = playerPos.x + (Math.random() - 0.5) * 110;
        array[idx + 2] = playerPos.z + (Math.random() - 0.5) * 110;
      }
    }
    posAttr.needsUpdate = true;

    // 2. Update plow plumes
    for (let i = this.plumes.length - 1; i >= 0; i--) {
      const p = this.plumes[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.plumes.splice(i, 1);
        continue;
      }

      p.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 9.8 * delta; // Gravity
      p.velocity.x *= 0.96;
      p.velocity.z *= 0.96;

      // Prevent sinking through ground
      if (p.position.y < 0.15) {
        p.position.y = 0.15;
        p.velocity.set(0, 0, 0);
      }
    }

    // Render plumes into InstancedMesh
    for (let i = 0; i < this.maxPlumes; i++) {
      if (i < this.plumes.length) {
        const p = this.plumes[i];
        const progress = p.life / p.maxLife;
        const currentScale = p.scale * (1.0 - progress * 0.6);

        this.dummy.position.copy(p.position);
        this.dummy.scale.set(currentScale, currentScale, currentScale);
        this.dummy.rotation.x += delta * 4;
        this.dummy.rotation.y += delta * 3;
        this.dummy.updateMatrix();
        this.plumeMesh.setMatrixAt(i, this.dummy.matrix);
      } else {
        this.dummy.position.set(0, -100, 0);
        this.dummy.scale.set(0.001, 0.001, 0.001);
        this.dummy.updateMatrix();
        this.plumeMesh.setMatrixAt(i, this.dummy.matrix);
      }
    }
    this.plumeMesh.instanceMatrix.needsUpdate = true;

    // 3. Emit and update chimney smoke puffs
    this.smokeTimer += delta;
    if (this.smokeTimer > 0.45) {
      this.smokeTimer = 0;
      this.chimneyEmitters.forEach((pos) => {
        if (this.smokes.length < this.maxSmokes) {
          this.smokes.push({
            position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0, (Math.random() - 0.5) * 0.2)),
            velocity: new THREE.Vector3(0.3 + Math.random() * 0.2, 1.2 + Math.random() * 0.4, 0.2 + (Math.random() - 0.5) * 0.3),
            life: 0,
            maxLife: 3.2,
            scale: 0.4 + Math.random() * 0.3,
          });
        }
      });
    }

    for (let i = this.smokes.length - 1; i >= 0; i--) {
      const s = this.smokes[i];
      s.life += delta;
      if (s.life >= s.maxLife) {
        this.smokes.splice(i, 1);
        continue;
      }

      s.position.addScaledVector(s.velocity, delta);
      s.scale += delta * 0.5; // Expands as it rises
    }

    for (let i = 0; i < this.maxSmokes; i++) {
      if (i < this.smokes.length) {
        const s = this.smokes[i];
        this.dummy.position.copy(s.position);
        this.dummy.scale.set(s.scale, s.scale, s.scale);
        this.dummy.updateMatrix();
        this.smokeMesh.setMatrixAt(i, this.dummy.matrix);
      } else {
        this.dummy.position.set(0, -100, 0);
        this.dummy.scale.set(0.001, 0.001, 0.001);
        this.dummy.updateMatrix();
        this.smokeMesh.setMatrixAt(i, this.dummy.matrix);
      }
    }
    this.smokeMesh.instanceMatrix.needsUpdate = true;
  }

  public dispose() {
    this.snowParticlesMesh.geometry.dispose();
    (this.snowParticlesMesh.material as THREE.Material).dispose();

    this.plumeMesh.geometry.dispose();
    (this.plumeMesh.material as THREE.Material).dispose();

    this.smokeMesh.geometry.dispose();
    (this.smokeMesh.material as THREE.Material).dispose();
  }
}
