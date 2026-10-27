import * as THREE from 'three';
import { soundManager } from '../audio/soundManager';

export interface BirdEntity {
  group: THREE.Group;
  wingL: THREE.Mesh;
  wingR: THREE.Mesh;
  state: 'hopping' | 'circling' | 'scared';
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  targetPos: THREE.Vector3;
  hopTimer: number;
  hopDuration: number;
  hopStartPos: THREE.Vector3;
  hopEndPos: THREE.Vector3;
  circlingAngle: number;
  circlingRadius: number;
  circlingHeight: number;
  scaredTimer: number;
  flapTimer: number;
  peckTimer: number;
}

export class BirdManager {
  private scene: THREE.Scene;
  public birds: BirdEntity[] = [];
  private birdCount = 12;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initBirds();
  }

  private createBirdModel(): { group: THREE.Group; wingL: THREE.Mesh; wingR: THREE.Mesh } {
    const group = new THREE.Group();

    // Vibrant Festive Winter Cardinal Palette
    const redMat = new THREE.MeshStandardMaterial({
      color: '#d32f2f', // Rich bright cardinal red
      roughness: 0.6,
      metalness: 0.1,
    });

    const chestMat = new THREE.MeshStandardMaterial({
      color: '#ef5350', // Lighter red belly
      roughness: 0.7,
    });

    const blackMat = new THREE.MeshStandardMaterial({
      color: '#212121', // Black face mask
      roughness: 0.8,
    });

    const beakMat = new THREE.MeshStandardMaterial({
      color: '#ff9800', // Bright orange beak
      roughness: 0.4,
    });

    const eyeMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.2,
    });

    // 1. Plump Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), redMat);
    body.scale.set(0.9, 1.0, 1.25);
    body.position.y = 0.22;
    body.castShadow = true;
    group.add(body);

    // Pale chest patch
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), chestMat);
    chest.position.set(0, 0.19, 0.08);
    chest.scale.set(0.85, 0.85, 0.6);
    group.add(chest);

    // 2. Head & Cardinal Crest
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), redMat);
    head.position.set(0, 0.35, 0.15);
    group.add(head);

    // Pointed crest feather
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 5), redMat);
    crest.position.set(0, 0.46, 0.1);
    crest.rotation.x = -0.35;
    group.add(crest);

    // Black mask
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.08), blackMat);
    mask.position.set(0, 0.35, 0.23);
    group.add(mask);

    // Orange Beak
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), beakMat);
    beak.rotation.x = Math.PI * 0.5;
    beak.position.set(0, 0.34, 0.32);
    group.add(beak);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.025, 4, 4);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.08, 0.37, 0.22);
    group.add(eyeL);

    const eyeR = eyeL.clone();
    eyeR.position.x = 0.08;
    group.add(eyeR);

    // 3. Tail Feathers
    const tailMat = new THREE.MeshStandardMaterial({ color: '#b71c1c', roughness: 0.6 });
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.28), tailMat);
    tail.position.set(0, 0.22, -0.32);
    tail.rotation.x = 0.25;
    group.add(tail);

    // 4. Articulated Wings (can flap up and down)
    const wingGeo = new THREE.BoxGeometry(0.24, 0.03, 0.18);
    wingGeo.translate(0.12, 0, 0); // Pivot at shoulder joint

    const wingL = new THREE.Mesh(wingGeo, redMat);
    wingL.position.set(0.12, 0.25, 0.0);
    group.add(wingL);

    const wingRGeo = new THREE.BoxGeometry(0.24, 0.03, 0.18);
    wingRGeo.translate(-0.12, 0, 0);
    const wingR = new THREE.Mesh(wingRGeo, redMat);
    wingR.position.set(-0.12, 0.25, 0.0);
    group.add(wingR);

    // Scale bird to cute cartoon proportions
    group.scale.set(1.1, 1.1, 1.1);

    return { group, wingL, wingR };
  }

  private initBirds() {
    for (let i = 0; i < this.birdCount; i++) {
      const { group, wingL, wingR } = this.createBirdModel();

      // Spawn initial positions around town plaza
      const angle = (i / this.birdCount) * Math.PI * 2;
      const radius = 6 + Math.random() * 8;
      const startPos = new THREE.Vector3(Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius);

      group.position.copy(startPos);
      this.scene.add(group);

      const isCircling = i % 3 === 0;

      this.birds.push({
        group,
        wingL,
        wingR,
        state: isCircling ? 'circling' : 'hopping',
        pos: startPos.clone(),
        vel: new THREE.Vector3(),
        targetPos: startPos.clone(),
        hopTimer: 0,
        hopDuration: 0.35 + Math.random() * 0.15,
        hopStartPos: startPos.clone(),
        hopEndPos: startPos.clone(),
        circlingAngle: angle,
        circlingRadius: 8 + Math.random() * 7,
        circlingHeight: 3.5 + Math.random() * 3.0,
        scaredTimer: 0,
        flapTimer: Math.random() * 10,
        peckTimer: Math.random() * 2,
      });
    }
  }

  /**
   * Scares the flock when the player honks the horn!
   */
  public scareAll(plowPos: THREE.Vector3) {
    soundManager.playBirdChirp();

    this.birds.forEach((bird, idx) => {
      bird.state = 'scared';
      bird.scaredTimer = 4.0 + Math.random() * 2.0;

      // Launch upward and radially outward away from the snow plow
      const awayDir = new THREE.Vector3(bird.pos.x - plowPos.x, 0, bird.pos.z - plowPos.z);
      if (awayDir.lengthSq() < 0.1) {
        awayDir.set(Math.cos(idx), 0, Math.sin(idx));
      }
      awayDir.normalize();

      bird.vel.set(
        awayDir.x * (6.0 + Math.random() * 5.0),
        7.5 + Math.random() * 4.5,
        awayDir.z * (6.0 + Math.random() * 5.0)
      );
    });
  }

  public update(dt: number, plowPos: THREE.Vector3) {
    this.birds.forEach((bird) => {
      bird.flapTimer += dt;

      if (bird.state === 'scared') {
        // Frantic frightened flight high up into the sky
        bird.scaredTimer -= dt;

        bird.pos.addScaledVector(bird.vel, dt);
        bird.vel.y -= 3.5 * dt; // Soft upward lift then gliding
        bird.vel.x *= 0.98;
        bird.vel.z *= 0.98;

        // Face flight direction
        if (bird.vel.lengthSq() > 0.5) {
          bird.group.rotation.y = Math.atan2(bird.vel.x, bird.vel.z);
        }

        // Rapid terrified wing flap
        const flap = Math.sin(bird.flapTimer * 28) * 0.95;
        bird.wingL.rotation.z = flap;
        bird.wingR.rotation.z = -flap;

        // When scared timer runs out, transition back to relaxed circling or glide to ground
        if (bird.scaredTimer <= 0) {
          bird.state = 'circling';
          bird.circlingHeight = 4.5 + Math.random() * 2.5;
          bird.circlingRadius = 10 + Math.random() * 6;
          bird.circlingAngle = Math.atan2(bird.pos.x - plowPos.x, bird.pos.z - plowPos.z);
        }
      } else if (bird.state === 'circling') {
        // Playful orbit in the air around the snow plow
        bird.circlingAngle += dt * 0.85;

        const targetX = plowPos.x + Math.sin(bird.circlingAngle) * bird.circlingRadius;
        const targetZ = plowPos.z + Math.cos(bird.circlingAngle) * bird.circlingRadius;
        const targetY = bird.circlingHeight + Math.sin(bird.flapTimer * 2) * 0.6;

        bird.pos.x += (targetX - bird.pos.x) * (3.0 * dt);
        bird.pos.z += (targetZ - bird.pos.z) * (3.0 * dt);
        bird.pos.y += (targetY - bird.pos.y) * (2.5 * dt);

        // Face forward along tangent of circle
        bird.group.rotation.y = bird.circlingAngle + Math.PI * 0.5;
        bird.group.rotation.z = -0.25; // Banked flight turn

        // Smooth flight flapping
        const flap = Math.sin(bird.flapTimer * 16) * 0.7;
        bird.wingL.rotation.z = flap;
        bird.wingR.rotation.z = -flap;

        // Chance to glide down and land on the ground near the plow
        if (Math.random() < 0.008 && bird.pos.y < 5.0) {
          bird.state = 'hopping';
          bird.hopTimer = 0;
          bird.pos.y = 0.15;
          bird.hopStartPos.copy(bird.pos);
          bird.hopEndPos.copy(bird.pos);
          bird.group.rotation.z = 0;
        }
      } else if (bird.state === 'hopping') {
        // Ground behavior: cute little hops, pecking in snow, staying near plow
        bird.hopTimer += dt;
        bird.group.rotation.z = 0;
        const distToPlow = bird.pos.distanceTo(plowPos);

        if (bird.hopTimer >= bird.hopDuration) {
          // Finished previous hop, pick new small hop target or peck
          bird.hopTimer = 0;
          bird.hopDuration = 0.3 + Math.random() * 0.6;
          bird.hopStartPos.copy(bird.pos);

          // If too far from plow (>22m), hop toward it or take flight
          if (distToPlow > 24) {
            bird.state = 'circling';
            bird.circlingAngle = Math.random() * Math.PI * 2;
            bird.vel.y = 4.0;
            return;
          }

          // If plow is driving right toward the bird (<3.2m), hop quickly away
          if (distToPlow < 3.8) {
            const escapeAngle = Math.atan2(bird.pos.x - plowPos.x, bird.pos.z - plowPos.z);
            bird.hopEndPos.set(
              bird.pos.x + Math.sin(escapeAngle) * (2.0 + Math.random()),
              0.15,
              bird.pos.z + Math.cos(escapeAngle) * (2.0 + Math.random())
            );
          } else {
            // Casual hop in random direction near current spot
            const hopAngle = Math.random() * Math.PI * 2;
            const hopDist = 0.5 + Math.random() * 1.2;
            bird.hopEndPos.set(
              bird.pos.x + Math.sin(hopAngle) * hopDist,
              0.15,
              bird.pos.z + Math.cos(hopAngle) * hopDist
            );
          }

          // Face hop direction
          const hopDirX = bird.hopEndPos.x - bird.hopStartPos.x;
          const hopDirZ = bird.hopEndPos.z - bird.hopStartPos.z;
          if (Math.hypot(hopDirX, hopDirZ) > 0.05) {
            bird.group.rotation.y = Math.atan2(hopDirX, hopDirZ);
          }
        }

        // Interpolate hop with parabolic arc height
        const progress = Math.min(1.0, bird.hopTimer / (bird.hopDuration * 0.7));
        bird.pos.x = THREE.MathUtils.lerp(bird.hopStartPos.x, bird.hopEndPos.x, progress);
        bird.pos.z = THREE.MathUtils.lerp(bird.hopStartPos.z, bird.hopEndPos.z, progress);

        // Parabolic arc for hopping height
        const hopHeight = Math.sin(progress * Math.PI) * 0.42;
        bird.pos.y = 0.15 + hopHeight;

        // Wing flutter during hop
        if (hopHeight > 0.05) {
          const hopWing = Math.sin(progress * Math.PI * 4) * 0.5;
          bird.wingL.rotation.z = hopWing;
          bird.wingR.rotation.z = -hopWing;
        } else {
          bird.wingL.rotation.z = 0.05;
          bird.wingR.rotation.z = -0.05;

          // Cute snow pecking head tilt when resting on ground
          bird.peckTimer += dt;
          if (Math.sin(bird.peckTimer * 5) > 0.8) {
            bird.group.rotation.x = 0.35; // Head down to peck snow
          } else {
            bird.group.rotation.x = 0.0;
          }
        }

        // Chance to take flight and circle around plow
        if (Math.random() < 0.003 && distToPlow < 15) {
          bird.state = 'circling';
          bird.circlingAngle = Math.atan2(bird.pos.x - plowPos.x, bird.pos.z - plowPos.z);
        }
      }

      // Update 3D position
      bird.group.position.copy(bird.pos);
    });
  }

  public dispose() {
    this.birds.forEach((bird) => {
      this.scene.remove(bird.group);
      bird.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    this.birds = [];
  }
}
