import * as THREE from 'three';
import { AvatarOutfit, Building, NPC, Vehicle } from '../types';
import { TextureFactory } from './proceduralTextures';

/**
 * 3D Procedural Models & Hierarchical Avatars
 * Built according to Three.js composite multi-part architectural guidelines.
 * All props and actors pivoted at bottom-center (y = 0) to sit flush on terrain.
 */

export interface AvatarMeshGroup extends THREE.Group {
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  head: THREE.Group;
  umbrella?: THREE.Group;
  visionCone?: THREE.Mesh;
  updateAnimation: (
    dt: number,
    speed: number,
    isSprinting: boolean,
    isDriving: boolean,
    hasUmbrella: boolean,
    isAlert?: boolean
  ) => void;
}

export interface VehicleMeshGroup extends THREE.Group {
  wheels: THREE.Mesh[];
  headlights: THREE.Light[];
  hazardLights?: THREE.Mesh[];
  sirenLights?: { red: THREE.PointLight; blue: THREE.PointLight; barRed: THREE.Mesh; barBlue: THREE.Mesh };
  riderGroup?: THREE.Group;
  updateAnimation: (dt: number, speed: number, steering: number, isBraking: boolean, sirenOn?: boolean) => void;
}

export class ModelFactory {
  // Reusable materials
  private static tireMaterial = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9, metalness: 0.1 });
  private static chromeMaterial = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.15, metalness: 0.95 });
  private static glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });

  /**
   * Procedural Multi-Part 3D Humanoid Avatar
   */
  public static createAvatar(outfit: AvatarOutfit = 'STREETWEAR', role: string = 'CIVILIAN'): AvatarMeshGroup {
    const root = new THREE.Group() as AvatarMeshGroup;

    // Palette setup based on outfit
    let shirtColor = 0xe11d48; // Red hoodie
    let pantsColor = 0x1e293b; // Dark denim
    let skinColor = 0x6d4023;  // Warm dark skin tone
    let shoeColor = 0xf8fafc;  // White sneakers
    let hatType: 'NONE' | 'CAP' | 'HELMET' | 'BERET' | 'HEADSCARF' | 'FEDORA' = 'CAP';

    if (outfit === 'BODA' || role === 'BODA') {
      shirtColor = 0xb45309; // Leather jacket
      pantsColor = 0x334155;
      hatType = 'HELMET';
    } else if (outfit === 'MATATU_TOUT' || role === 'TOUT') {
      shirtColor = 0x84cc16; // Fluorescent reflector vest
      pantsColor = 0x0f172a;
      hatType = 'CAP';
    } else if (outfit === 'UNDERCOVER' || role === 'DCI') {
      shirtColor = 0x0f172a; // Dark trench
      pantsColor = 0x0f172a;
      hatType = 'FEDORA';
      shoeColor = 0x0f172a;
    } else if (outfit === 'SMART_HUSTLER') {
      shirtColor = 0x0284c7; // Crisp cyan blazer
      pantsColor = 0xf1f5f9;
      shoeColor = 0x78350f;
    } else if (role === 'KANJO') {
      shirtColor = 0x854d0e; // Deep khaki enforcement shirt
      pantsColor = 0x713f12; // Khaki trousers
      hatType = 'BERET';
      shoeColor = 0x18181b;
    } else if (role === 'POLICE') {
      shirtColor = 0x1e3a8a; // Navy
      pantsColor = 0x1e3a8a;
      hatType = 'BERET';
      shoeColor = 0x09090b;
    } else if (role === 'VENDOR') {
      shirtColor = 0x16a34a; // Green apron
      hatType = 'HEADSCARF';
    }

    const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.75, metalness: 0.05 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.65, metalness: 0.1 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8, metalness: 0.05 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.5, metalness: 0.2 });

    // 1. Pelvis / Hips (Center pivot anchor)
    const pelvis = new THREE.Group();
    pelvis.position.y = 0.95;
    root.add(pelvis);

    // 2. Torso
    const torsoGeo = new THREE.BoxGeometry(0.48, 0.56, 0.28);
    const torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
    torsoMesh.position.y = 0.28;
    torsoMesh.castShadow = true;
    pelvis.add(torsoMesh);

    // Reflector stripe if matatu tout
    if (outfit === 'MATATU_TOUT' || role === 'TOUT') {
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.3, emissive: 0xec4899, emissiveIntensity: 0.2 });
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.3), stripeMat);
      stripe.position.y = 0.24;
      pelvis.add(stripe);
    }

    // Authentic Nairobi County Enforcement Uniform (Kanjo High-Vis Vest & Vision Cone)
    if (role === 'KANJO') {
      const vestMat = new THREE.MeshStandardMaterial({
        color: 0xeab308,
        roughness: 0.45,
        emissive: 0xca8a04,
        emissiveIntensity: 0.35,
      });
      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.32), vestMat);
      vest.position.y = 0.28;
      pelvis.add(vest);

      // Silver reflective safety cross-bands
      const silverMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.2,
        emissive: 0xffffff,
        emissiveIntensity: 0.8,
      });
      const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.08, 0.34), silverMat);
      reflector.position.y = 0.26;
      pelvis.add(reflector);

      // Chest radio walkie-talkie
      const radio = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.08), new THREE.MeshStandardMaterial({ color: 0x18181b }));
      radio.position.set(0.18, 0.42, 0.18);
      pelvis.add(radio);

      // 3D Ground Vision Cone (Projected Detection Sector)
      const coneGeo = new THREE.ConeGeometry(9.0, 20, 16, 1, false, -Math.PI / 2, Math.PI);
      coneGeo.rotateX(Math.PI / 2);
      coneGeo.translate(0, 0, 10);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const visionMesh = new THREE.Mesh(coneGeo, coneMat);
      visionMesh.position.y = 0.04;
      root.add(visionMesh);
      root.visionCone = visionMesh;
    }

    // 3. Neck & Head
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.62;
    pelvis.add(headGroup);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Headwear
    if (hatType === 'HELMET') {
      const helmetMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.6 });
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), helmetMat);
      helmet.scale.set(1.05, 1.0, 1.1);
      helmet.position.y = 0.08;
      headGroup.add(helmet);

      // Visor
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.1), this.glassMaterial);
      visor.position.set(0, 0.02, 0.16);
      headGroup.add(visor);
    } else if (hatType === 'CAP') {
      const capMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.7 });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), capMat);
      cap.position.y = 0.16;
      headGroup.add(cap);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.16), capMat);
      brim.position.set(0, 0.13, 0.16);
      headGroup.add(brim);
    } else if (hatType === 'BERET') {
      const beretMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.8 });
      const beret = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.08, 12), beretMat);
      beret.rotation.z = -0.2;
      beret.position.set(0.04, 0.16, 0);
      headGroup.add(beret);
    }

    // Shades for Undercover
    if (outfit === 'UNDERCOVER' || role === 'DCI') {
      const shades = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.04), this.tireMaterial);
      shades.position.set(0, 0.02, 0.16);
      headGroup.add(shades);
    }

    // 4. Arms
    const createArm = (isLeft: boolean): THREE.Group => {
      const shoulder = new THREE.Group();
      shoulder.position.set(isLeft ? -0.32 : 0.32, 0.5, 0);

      const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.14), shirtMat);
      upperArm.position.y = -0.15;
      upperArm.castShadow = true;
      shoulder.add(upperArm);

      const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.12), skinMat);
      forearm.position.y = -0.4;
      forearm.castShadow = true;
      shoulder.add(forearm);

      pelvis.add(shoulder);
      return shoulder;
    };

    const leftArm = createArm(true);
    const rightArm = createArm(false);

    // 5. Legs
    const createLeg = (isLeft: boolean): THREE.Group => {
      const hip = new THREE.Group();
      hip.position.set(isLeft ? -0.14 : 0.14, 0, 0);

      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.46, 0.18), pantsMat);
      thigh.position.y = -0.23;
      thigh.castShadow = true;
      hip.add(thigh);

      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.16), pantsMat);
      shin.position.y = -0.66;
      shin.castShadow = true;
      hip.add(shin);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.24), shoeMat);
      foot.position.set(0, -0.9, 0.04);
      foot.castShadow = true;
      hip.add(foot);

      root.add(hip);
      return hip;
    };

    const leftLeg = createLeg(true);
    const rightLeg = createLeg(false);

    // 6. Optional 3D Umbrella
    const umbrellaGroup = new THREE.Group();
    umbrellaGroup.visible = false;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 8), this.chromeMaterial);
    pole.position.y = 0.45;
    umbrellaGroup.add(pole);

    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.25, 12, 1, true), canopyMat);
    canopy.position.y = 0.85;
    umbrellaGroup.add(canopy);
    rightArm.add(umbrellaGroup);

    // Assign hierarchy references
    root.leftArm = leftArm;
    root.rightArm = rightArm;
    root.leftLeg = leftLeg;
    root.rightLeg = rightLeg;
    root.head = headGroup;
    root.umbrella = umbrellaGroup;

    let animTime = Math.random() * 10;

    // Animation update function
    root.updateAnimation = (
      dt: number,
      speed: number,
      isSprinting: boolean,
      isDriving: boolean,
      hasUmbrella: boolean,
      isAlert: boolean = false
    ) => {
      animTime += dt * (isSprinting ? 12 : 7) * (speed > 0.05 ? 1 : 0.2);

      if (root.umbrella) {
        root.umbrella.visible = hasUmbrella;
      }

      // Animate vision cone for Kanjo officer
      if (root.visionCone) {
        const mat = root.visionCone.material as THREE.MeshBasicMaterial;
        if (isAlert) {
          mat.color.setHex(0xef4444);
          mat.opacity = 0.28 + Math.sin(animTime * 12) * 0.12;
        } else {
          mat.color.setHex(0xfbbf24);
          mat.opacity = 0.18 + Math.sin(animTime * 3) * 0.05;
        }
      }

      if (isDriving) {
        // Seated driving pose
        leftLeg.rotation.x = -1.3;
        rightLeg.rotation.x = -1.3;
        leftArm.rotation.x = -0.8;
        rightArm.rotation.x = -0.8;
        pelvis.position.y = 0.55;
        return;
      }

      pelvis.position.y = 0.95;

      if (speed > 0.05) {
        // Moving walk/run cycle
        const stride = Math.sin(animTime);
        const legAmp = isSprinting ? 0.95 : 0.6;
        const armAmp = isSprinting ? 1.1 : 0.65;

        leftLeg.rotation.x = stride * legAmp;
        rightLeg.rotation.x = -stride * legAmp;

        if (hasUmbrella) {
          // Holding umbrella steady upright in right hand
          rightArm.rotation.x = -1.4;
          rightArm.rotation.z = -0.2;
          leftArm.rotation.x = stride * armAmp;
        } else {
          leftArm.rotation.x = -stride * armAmp;
          rightArm.rotation.x = stride * armAmp;
        }

        // Subtle torso bounce
        pelvis.position.y = 0.95 + Math.abs(Math.sin(animTime * 2)) * (isSprinting ? 0.08 : 0.04);
        torsoMesh.rotation.y = Math.sin(animTime) * 0.1;
      } else {
        // Idle breathing
        leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, 0, 10, dt);
        rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, 0, 10, dt);
        leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, 0, 10, dt);

        if (hasUmbrella) {
          rightArm.rotation.x = -1.4;
        } else {
          rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, 0, 10, dt);
        }

        pelvis.position.y = 0.95 + Math.sin(animTime * 0.8) * 0.02;
        torsoMesh.rotation.y = 0;
      }
    };

    return root;
  }

  /**
   * Signature Nairobi Nganya Matatu ("Kiboko ya Barabara")
   * Detailed 14-part composite model with custom graffiti, neon underglow, chrome rims, and lights.
   */
  public static createMatatu(): VehicleMeshGroup {
    const root = new THREE.Group() as VehicleMeshGroup;
    root.wheels = [];
    root.headlights = [];

    // 1. Minibus Chassis / Lower body
    const graffitiTex = TextureFactory.getMatatuGraffitiTexture();
    const bodyMat = new THREE.MeshStandardMaterial({
      map: graffitiTex,
      roughness: 0.25,
      metalness: 0.45,
    });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.4, 5.2), bodyMat);
    chassis.position.y = 1.1;
    chassis.castShadow = true;
    root.add(chassis);

    // 2. Windshield and Cabin Windows (Tinted glass)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 4.4), this.glassMaterial);
    cabin.position.set(0, 1.95, -0.1);
    root.add(cabin);

    // 3. Aerodynamic Roof Spoiler
    const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.5), spoilerMat);
    spoilerWing.position.set(0, 2.6, 2.3);
    root.add(spoilerWing);
    const spoilerStrutL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3), spoilerMat);
    spoilerStrutL.position.set(-0.9, 2.45, 2.3);
    const spoilerStrutR = spoilerStrutL.clone();
    spoilerStrutR.position.x = 0.9;
    root.add(spoilerStrutL, spoilerStrutR);

    // 4. Roof Luggage Rack with Subwoofers
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.7 });
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 2.8), rackMat);
    rack.position.set(0, 2.45, 0.2);
    root.add(rack);

    // 5. Four Detailed Chrome Wheels
    const wheelPositions = [
      { x: -1.2, y: 0.45, z: 1.7 },
      { x: 1.2, y: 0.45, z: 1.7 },
      { x: -1.2, y: 0.45, z: -1.7 },
      { x: 1.2, y: 0.45, z: -1.7 },
    ];

    wheelPositions.forEach((pos) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, pos.y, pos.z);

      // Rubber Tire
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.3, 16), this.tireMaterial);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Chrome Rim
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.32, 12), this.chromeMaterial);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      root.add(wheelGroup);
      root.wheels.push(tire);
    });

    // 6. Dual Front Projector Headlights
    const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2 });
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), hlMat);
    hlL.position.set(-0.85, 0.95, -2.62);
    const hlR = hlL.clone();
    hlR.position.x = 0.85;
    root.add(hlL, hlR);

    // Actual 3D Spotlights
    const spotL = new THREE.SpotLight(0xfff7ed, 4.0, 35, Math.PI / 6, 0.3, 1.2);
    spotL.position.set(-0.85, 1.0, -2.7);
    spotL.target.position.set(-0.85, 0.2, -18);
    root.add(spotL);
    root.add(spotL.target);
    root.headlights.push(spotL);

    const spotR = spotL.clone();
    spotR.position.x = 0.85;
    spotR.target.position.x = 0.85;
    root.add(spotR);
    root.add(spotR.target);
    root.headlights.push(spotR);

    // 7. Neon Cyan Underglow Light
    const underglow = new THREE.PointLight(0x06b6d4, 2.5, 6, 1.5);
    underglow.position.set(0, 0.25, 0);
    root.add(underglow);

    // 8. Rear Brake Lights
    const blMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.5 });
    const blL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.08), blMat);
    blL.position.set(-0.85, 1.0, 2.62);
    const blR = blL.clone();
    blR.position.x = 0.85;
    root.add(blL, blR);

    // Animation update
    let wheelRotation = 0;
    root.updateAnimation = (dt: number, speed: number, steering: number, isBraking: boolean) => {
      wheelRotation += speed * dt * 3.5;
      root.wheels.forEach((w) => {
        w.rotation.x = wheelRotation;
      });
      // Front wheel steering
      if (root.wheels[2] && root.wheels[3]) {
        root.wheels[2].parent!.rotation.y = steering * 0.45;
        root.wheels[3].parent!.rotation.y = steering * 0.45;
      }
      // Brake lights glow
      blMat.emissiveIntensity = isBraking ? 2.5 : 0.4;
      // Body tilt on turns
      chassis.rotation.z = THREE.MathUtils.damp(chassis.rotation.z, -steering * 0.08 * (speed / 10), 8, dt);
    };

    return root;
  }

  /**
   * 3D Boda Boda Motorbike with Rider
   */
  public static createBoda(): VehicleMeshGroup {
    const root = new THREE.Group() as VehicleMeshGroup;
    root.wheels = [];
    root.headlights = [];

    const frameMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.8 }); // Amber bike

    // 1. Bike Frame & Fuel Tank
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.9), frameMat);
    tank.position.set(0, 0.85, -0.2);
    tank.castShadow = true;
    root.add(tank);

    // 2. Dual Long Seat
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.95), seatMat);
    seat.position.set(0, 0.92, 0.4);
    seat.castShadow = true;
    root.add(seat);

    // 3. Handlebars & Mirrors
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8), this.chromeMaterial);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 1.15, -0.65);
    root.add(bar);

    // 4. Wheels
    const createBikeWheel = (z: number): THREE.Mesh => {
      const wGroup = new THREE.Group();
      wGroup.position.set(0, 0.35, z);
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 16), this.tireMaterial);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wGroup.add(tire);
      root.add(wGroup);
      root.wheels.push(tire);
      return tire;
    };

    createBikeWheel(-0.95); // Front
    createBikeWheel(0.95);  // Rear

    // 5. Headlight
    const hl = new THREE.SpotLight(0xfffbeb, 3.0, 25, Math.PI / 5, 0.3, 1.2);
    hl.position.set(0, 0.95, -1.0);
    hl.target.position.set(0, 0.2, -15);
    root.add(hl);
    root.add(hl.target);
    root.headlights.push(hl);

    // 6. Animated Boda Rider on top
    const rider = this.createAvatar('BODA', 'BODA');
    rider.position.set(0, 0.45, 0.1);
    root.add(rider);
    root.riderGroup = rider;

    let wheelRot = 0;
    root.updateAnimation = (dt: number, speed: number, steering: number) => {
      wheelRot += speed * dt * 4.5;
      root.wheels.forEach((w) => (w.rotation.x = wheelRot));
      // Rider leans deeply into corners
      root.rotation.z = THREE.MathUtils.damp(root.rotation.z, -steering * 0.22, 10, dt);
      rider.updateAnimation(dt, speed, false, true, false);
    };

    return root;
  }

  /**
   * 3D Police LandCruiser Patrol Car with Strobe Light Bar
   */
  public static createPoliceCruiser(): VehicleMeshGroup {
    const root = new THREE.Group() as VehicleMeshGroup;
    root.wheels = [];
    root.headlights = [];

    const cruiserMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2, metalness: 0.6 }); // Police Navy

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.2, 4.6), cruiserMat);
    body.position.y = 1.0;
    body.castShadow = true;
    root.add(body);

    // Roof & Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 2.6), this.glassMaterial);
    cabin.position.set(0, 1.8, -0.1);
    root.add(cabin);

    // Bullbar on front
    const bullbar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.2), this.chromeMaterial);
    bullbar.position.set(0, 0.7, -2.4);
    root.add(bullbar);

    // 4 Wheels
    [
      { x: -1.1, z: 1.5 },
      { x: 1.1, z: 1.5 },
      { x: -1.1, z: -1.5 },
      { x: 1.1, z: -1.5 },
    ].forEach((p) => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 16), this.tireMaterial);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(p.x, 0.42, p.z);
      tire.castShadow = true;
      root.add(tire);
      root.wheels.push(tire);
    });

    // Roof Emergency Strobe Lightbar
    const barRed = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.12, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.0 })
    );
    barRed.position.set(-0.35, 2.32, -0.1);
    const barBlue = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.12, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 1.0 })
    );
    barBlue.position.set(0.35, 2.32, -0.1);
    root.add(barRed, barBlue);

    const lightRed = new THREE.PointLight(0xef4444, 0, 12, 2);
    lightRed.position.set(-0.5, 2.5, -0.1);
    const lightBlue = new THREE.PointLight(0x3b82f6, 0, 12, 2);
    lightBlue.position.set(0.5, 2.5, -0.1);
    root.add(lightRed, lightBlue);

    root.sirenLights = {
      red: lightRed,
      blue: lightBlue,
      barRed,
      barBlue,
    };

    let strobeTimer = 0;
    root.updateAnimation = (dt: number, speed: number, _steering: number, _isBraking: boolean, sirenOn = false) => {
      strobeTimer += dt * 14;
      if (sirenOn) {
        const toggle = Math.sin(strobeTimer) > 0;
        lightRed.intensity = toggle ? 4.0 : 0.0;
        lightBlue.intensity = toggle ? 0.0 : 4.0;
        (barRed.material as THREE.MeshStandardMaterial).emissiveIntensity = toggle ? 3.0 : 0.2;
        (barBlue.material as THREE.MeshStandardMaterial).emissiveIntensity = toggle ? 0.2 : 3.0;
      } else {
        lightRed.intensity = 0;
        lightBlue.intensity = 0;
        (barRed.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
        (barBlue.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;
      }
    };

    return root;
  }

  /**
   * 3D Civilian Car (White Toyota Probox or Sedan)
   */
  public static createCivilianCar(colorHex: number = 0xffffff): VehicleMeshGroup {
    const root = new THREE.Group() as VehicleMeshGroup;
    root.wheels = [];
    root.headlights = [];

    const carMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.35, metalness: 0.5 });
    // Boxy Probox wagon
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.1, 4.4), carMat);
    body.position.y = 0.95;
    body.castShadow = true;
    root.add(body);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.8, 2.8), this.glassMaterial);
    cabin.position.set(0, 1.7, 0.2);
    root.add(cabin);

    // Roof rack with sacks
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 2.2), new THREE.MeshStandardMaterial({ color: 0xb45309 }));
    rack.position.set(0, 2.2, 0.2);
    root.add(rack);

    // 4 Wheels
    [
      { x: -1.0, z: 1.4 },
      { x: 1.0, z: 1.4 },
      { x: -1.0, z: -1.4 },
      { x: 1.0, z: -1.4 },
    ].forEach((p) => {
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.24, 16), this.tireMaterial);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(p.x, 0.38, p.z);
      tire.castShadow = true;
      root.add(tire);
      root.wheels.push(tire);
    });

    root.updateAnimation = (dt: number, speed: number) => {
      root.wheels.forEach((w) => (w.rotation.x += speed * dt * 3.5));
    };

    return root;
  }

  /**
   * 3D Building Generator
   * Supports Kayole residential plots, Kibandaski stalls, Bedsitters, and CBD Skyscrapers.
   */
  public static createBuilding(bld: Building, worldScale: number = 0.1): THREE.Group {
    const group = new THREE.Group();
    const w = bld.width * worldScale;
    const d = bld.height * worldScale;
    const isCBD = bld.zone === 'cbd';

    // Height based on zone and type
    let h = isCBD ? 28 + Math.random() * 24 : bld.type === 'KIBANDASKI' ? 3.5 : 6.5;
    if (bld.type === 'BEDSITTER') h = 5.2;

    // 1. Wall Mesh
    let wallMat: THREE.Material;
    if (isCBD) {
      wallMat = new THREE.MeshStandardMaterial({
        map: TextureFactory.getSkyscraperWindowsTexture(),
        roughness: 0.15,
        metalness: 0.75,
      });
    } else {
      wallMat = new THREE.MeshStandardMaterial({
        color: bld.color || 0x8b5a2b,
        roughness: 0.85,
        metalness: 0.05,
      });
    }

    const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    walls.position.y = h / 2;
    walls.castShadow = true;
    walls.receiveShadow = true;
    group.add(walls);

    // 2. Corrugated Iron Mabati Roof (Kayole style)
    if (!isCBD) {
      const roofTex = TextureFactory.getMabatiRoofTexture(bld.type === 'KIBANDASKI' ? '#334155' : '#78909c');
      const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.45, metalness: 0.5 });
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 1.06, 0.25, d * 1.06), roofMat);
      roof.position.y = h + 0.12;
      roof.rotation.x = 0.05; // Gentle slope
      roof.castShadow = true;
      group.add(roof);

      // Water tank on roof (iconic Nairobi green plastic tank)
      const tankMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 12), tankMat);
      tank.position.set(w * 0.28, h + 0.75, d * 0.28);
      group.add(tank);
    }

    // 3. Veranda / Porch & Door for shops and bedsitter
    if (bld.type === 'KIBANDASKI' || bld.type === 'BEDSITTER' || bld.type === 'SHOP' || bld.type === 'ELECTRONICS') {
      const porchMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.9 });
      const awning = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, 0.1, 1.4), porchMat);
      awning.position.set(0, 2.6, d / 2 + 0.7);
      group.add(awning);

      // Warm veranda lamp
      const lamp = new THREE.PointLight(0xf59e0b, 1.5, 7);
      lamp.position.set(0, 2.3, d / 2 + 0.5);
      group.add(lamp);
    }

    // 4. Shop Signboard
    const signTex = TextureFactory.getSignTexture(bld.name, bld.color || '#1e3a8a');
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(Math.min(w * 0.9, 10), 1.2, 0.15), signMat);
    sign.position.set(0, isCBD ? 4.5 : Math.min(h - 0.5, 3.2), d / 2 + 0.1);
    group.add(sign);

    return group;
  }

  /**
   * Iconic African Acacia Tree (Umbrella-shaped canopy)
   */
  public static createAcaciaTree(): THREE.Group {
    const tree = new THREE.Group();

    // Trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.95 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.45, 4.5, 8), trunkMat);
    trunk.position.y = 2.25;
    trunk.rotation.z = 0.08;
    trunk.castShadow = true;
    tree.add(trunk);

    // Wide umbrella canopy
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.75, metalness: 0.05 });
    const canopy1 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 0.6, 10), foliageMat);
    canopy1.position.y = 4.6;
    canopy1.castShadow = true;
    tree.add(canopy1);

    const canopy2 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 0.5, 8), foliageMat);
    canopy2.position.set(0.4, 5.1, 0.2);
    canopy2.castShadow = true;
    tree.add(canopy2);

    return tree;
  }

  /**
   * Highway Streetlight Post with Downward Spotlight
   */
  public static createStreetlight(): THREE.Group {
    const post = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.8 });

    // Vertical pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8), metalMat);
    pole.position.y = 3.75;
    post.add(pole);

    // Horizontal arm
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), metalMat);
    arm.rotation.z = Math.PI / 2.3;
    arm.position.set(1.0, 7.5, 0);
    post.add(arm);

    // Light fixture head
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 1.0 });
    const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.4), headMat);
    lampHead.position.set(1.8, 7.4, 0);
    post.add(lampHead);

    // Downward spotlight
    const spot = new THREE.SpotLight(0xffedd5, 3.5, 20, Math.PI / 4, 0.4, 1.2);
    spot.position.set(1.8, 7.3, 0);
    spot.target.position.set(1.8, 0, 0);
    post.add(spot);
    post.add(spot.target);

    return post;
  }
}
