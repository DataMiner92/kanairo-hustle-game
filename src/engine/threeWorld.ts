import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { TextureFactory } from './proceduralTextures';
import { ModelFactory, AvatarMeshGroup, VehicleMeshGroup } from './models3D';
import { BUILDINGS, ROADS, WORLD_WIDTH, WORLD_HEIGHT } from '../data/zones';
import {
  PlayerPosition,
  PlayerStats,
  Vehicle,
  NPC,
  Mission,
  WeatherType,
  AvatarOutfit,
  CameraMode,
} from '../types';
import { particleSystem } from './particleSystem';
import { soundEngine } from '../audio/soundEngine';

export const WORLD_SCALE = 0.1;
export const WORLD_OFFSET_X = 2700;
export const WORLD_OFFSET_Z = 1200;

export function to3DX(x: number): number {
  return (x - WORLD_OFFSET_X) * WORLD_SCALE;
}

export function to3DZ(y: number): number {
  return (y - WORLD_OFFSET_Z) * WORLD_SCALE;
}

export function to2DX(x3D: number): number {
  return x3D / WORLD_SCALE + WORLD_OFFSET_X;
}

export function to2DY(z3D: number): number {
  return z3D / WORLD_SCALE + WORLD_OFFSET_Z;
}

export class ThreeWorld {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Camera settings
  public cameraMode: CameraMode = 'THIRD_PERSON';
  private cameraTarget = new THREE.Vector3();
  private cinematicAngle = 0;

  // Environment & Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private lightningLight: THREE.DirectionalLight;
  private weather: WeatherType = 'SUNNY';
  private lightningTimer = 0;

  // Weather meshes
  private rainParticles: THREE.Points | null = null;
  private rainGeometry: THREE.BufferGeometry | null = null;
  private rainPositions: Float32Array | null = null;
  private cloudsGroup: THREE.Group = new THREE.Group();

  // Materials for wetness modulation
  private roadMaterials: THREE.MeshStandardMaterial[] = [];

  // Entities
  public playerMesh: AvatarMeshGroup | null = null;
  public playerOutfit: AvatarOutfit = 'STREETWEAR';
  private npcsMap: Map<string, AvatarMeshGroup> = new Map();
  private vehiclesMap: Map<string, VehicleMeshGroup> = new Map();
  private interactionBeacon: THREE.Group;
  private missionCompassArrow: THREE.Mesh;

  // Mouse Keystrokes & Controls state
  public orbitYaw: number = 0;
  public orbitPitch: number = 0;
  public zoomFactor: number = 1.0;
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private mouseNDC: THREE.Vector2 = new THREE.Vector2();
  private groundIntersectTarget: THREE.Vector3 = new THREE.Vector3();

  // Waypoint marker for Click-to-Move
  public waypointMarker: THREE.Group;
  private waypointPulseTime: number = 0;

  // Jump animation state
  public jumpY: number = 0;
  public jumpVy: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    // 1. Renderer Setup with PBR standard
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });

    const isHeadless = typeof navigator !== 'undefined' && (/HeadlessChrome/i.test(navigator.userAgent) || navigator.webdriver);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);

    TextureFactory.init(this.renderer);

    // 2. Scene & Studio Reflections
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Nairobi blue sky
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0035);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Camera
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 15, 25);

    // 4. Lighting Rig (Key, Fill, Rim)
    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
    this.dirLight.position.set(80, 140, 70);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 400;
    this.dirLight.shadow.camera.left = -120;
    this.dirLight.shadow.camera.right = 120;
    this.dirLight.shadow.camera.top = 120;
    this.dirLight.shadow.camera.bottom = -120;
    this.dirLight.shadow.bias = -0.0005;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x78350f, 1.3);
    this.scene.add(this.hemiLight);

    // Lightning Flash Light
    this.lightningLight = new THREE.DirectionalLight(0xdbeafe, 0);
    this.lightningLight.position.set(0, 100, 0);
    this.scene.add(this.lightningLight);

    // 5. Build Environment (Terrain, Roads, Buildings, Props)
    this.buildTerrain();
    this.buildRoads();
    this.buildBuildings();
    this.buildProps();
    this.buildWeatherEffects();

    // 6. Interaction Beacon & Mission Marker
    this.interactionBeacon = this.createInteractionBeacon();
    this.scene.add(this.interactionBeacon);

    this.missionCompassArrow = this.createMissionArrow();
    this.scene.add(this.missionCompassArrow);

    // 7. Click-to-Move Holographic Waypoint Marker
    this.waypointMarker = this.createWaypointMarker();
    this.scene.add(this.waypointMarker);

    // 8. Player Avatar
    this.setPlayerOutfit('STREETWEAR');
  }

  /**
   * Base Terrain: Kayole reddish soil blending into CBD asphalt
   */
  private buildTerrain() {
    const dirtTex = TextureFactory.getKayoleDirtTexture();
    const terrainMat = new THREE.MeshStandardMaterial({
      map: dirtTex,
      roughness: 0.95,
      metalness: 0.05,
    });

    const terrainGeo = new THREE.PlaneGeometry(
      WORLD_WIDTH * WORLD_SCALE + 200,
      WORLD_HEIGHT * WORLD_SCALE + 200,
      1,
      1
    );
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.05;
    terrain.receiveShadow = true;
    this.scene.add(terrain);
  }

  /**
   * Procedural Roads & High-Way Corridor
   */
  private buildRoads() {
    const roadTex = TextureFactory.getRoadTexture();

    ROADS.forEach((rd) => {
      const w = rd.width * WORLD_SCALE;
      const d = rd.height * WORLD_SCALE;
      const centerX = to3DX(rd.x + rd.width / 2);
      const centerZ = to3DZ(rd.y + rd.height / 2);

      const mat = new THREE.MeshStandardMaterial({
        map: roadTex,
        roughness: 0.75,
        metalness: 0.2,
      });
      mat.polygonOffset = true;
      mat.polygonOffsetFactor = -1;
      mat.polygonOffsetUnits = -1;
      this.roadMaterials.push(mat);

      const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.set(centerX, 0.01, centerZ);
      roadMesh.receiveShadow = true;
      this.scene.add(roadMesh);

      // Concrete curbs alongside roads
      const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
      if (rd.width > rd.height) {
        // Horizontal road curbs
        const curbN = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, 0.4), curbMat);
        curbN.position.set(centerX, 0.07, centerZ - d / 2 - 0.2);
        const curbS = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, 0.4), curbMat);
        curbS.position.set(centerX, 0.07, centerZ + d / 2 + 0.2);
        this.scene.add(curbN, curbS);
      } else {
        // Vertical road curbs
        const curbW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, d), curbMat);
        curbW.position.set(centerX - w / 2 - 0.2, 0.07, centerZ);
        const curbE = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, d), curbMat);
        curbE.position.set(centerX + w / 2 + 0.2, 0.07, centerZ);
        this.scene.add(curbW, curbE);
      }
    });
  }

  /**
   * Spawn All Buildings (Kayole plots, Kibandaski, Bedsitter, CBD Skyscrapers)
   */
  private buildBuildings() {
    BUILDINGS.forEach((bld) => {
      const bldMesh = ModelFactory.createBuilding(bld, WORLD_SCALE);
      const posX = to3DX(bld.x + bld.width / 2);
      const posZ = to3DZ(bld.y + bld.height / 2);
      bldMesh.position.set(posX, 0, posZ);
      this.scene.add(bldMesh);
    });
  }

  /**
   * Trees, Streetlights, Highway Dividers, and Billboards
   */
  private buildProps() {
    // 1. Acacia Trees in Kayole and highway fringes
    for (let i = 0; i < 35; i++) {
      const tree = ModelFactory.createAcaciaTree();
      // Place scattered outside main road channels
      const x = to3DX(200 + Math.random() * 5000);
      const z = to3DZ(400 + Math.random() * 1600);
      // Avoid center roads
      if (Math.abs(z) > 12) {
        tree.position.set(x, 0, z);
        const s = 0.8 + Math.random() * 0.4;
        tree.scale.set(s, s, s);
        tree.rotation.y = Math.random() * Math.PI * 2;
        this.scene.add(tree);
      }
    }

    // 2. High-Mast Streetlights along Jogoo Road Highway
    for (let x2D = 1800; x2D <= 3400; x2D += 200) {
      const postN = ModelFactory.createStreetlight();
      postN.position.set(to3DX(x2D), 0, to3DZ(1180 - 15));
      const postS = ModelFactory.createStreetlight();
      postS.position.set(to3DX(x2D), 0, to3DZ(1180 + 110 + 15));
      postS.rotation.y = Math.PI;
      this.scene.add(postN, postS);
    }

    // 3. Giant Highway Billboards
    this.createBillboard(to3DX(2200), to3DZ(1140), 'M-PESA: TUMA NA UTOE PESA PAP!', '#16a34a');
    this.createBillboard(to3DX(2600), to3DZ(1320), 'TUSKER: BARA YA NAIROBI', '#eab308');
    this.createBillboard(to3DX(3000), to3DZ(1140), 'SAFARICOM 5G: SPEED YA BAZUU', '#0284c7');
  }

  private createBillboard(x: number, z: number, text: string, color: string) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Dual steel posts
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8), postMat);
    p1.position.set(-3.5, 4, 0);
    const p2 = p1.clone();
    p2.position.x = 3.5;
    group.add(p1, p2);

    // Board
    const tex = TextureFactory.getSignTexture(text, color);
    const boardMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(9, 3.2, 0.3), boardMat);
    board.position.set(0, 8, 0);
    board.castShadow = true;
    group.add(board);

    this.scene.add(group);
  }

  /**
   * 3D Weather Systems (Rain particles, Drifting 3D Clouds)
   */
  private buildWeatherEffects() {
    // 1. Rain particle system
    const rainCount = 3000;
    this.rainGeometry = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 160;
      this.rainPositions[i * 3 + 1] = Math.random() * 60;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 160;
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.22,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });

    this.rainParticles = new THREE.Points(this.rainGeometry, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);

    // 2. Drifting 3D Low-Poly Clouds
    this.cloudsGroup = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.9,
      transparent: true,
      opacity: 0.75,
    });

    for (let i = 0; i < 18; i++) {
      const cloud = new THREE.Group();
      const count = 4 + Math.floor(Math.random() * 4);
      for (let j = 0; j < count; j++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(6 + Math.random() * 8, 8, 8),
          cloudMat
        );
        puff.position.set((j - count / 2) * 8, Math.random() * 3, Math.random() * 6);
        cloud.add(puff);
      }
      cloud.position.set((Math.random() - 0.5) * 450, 45 + Math.random() * 20, (Math.random() - 0.5) * 250);
      this.cloudsGroup.add(cloud);
    }
    this.scene.add(this.cloudsGroup);
  }

  /**
   * Glowing 3D Interaction Beacon (floats over current interactable door/NPC)
   */
  private createInteractionBeacon(): THREE.Group {
    const beacon = new THREE.Group();
    beacon.visible = false;

    // Glowing diamond ring
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 12, 24), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.5;
    beacon.add(ring);

    // Floating pulsing diamond
    const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.4), ringMat);
    diamond.position.y = 1.3;
    beacon.add(diamond);

    return beacon;
  }

  /**
   * 3D Mission Arrow (Points towards active mission objective)
   */
  private createMissionArrow(): THREE.Mesh {
    const arrowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.2,
      roughness: 0.3,
    });
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.0, 8), arrowMat);
    arrow.rotation.x = Math.PI / 2;
    arrow.position.y = 2.8;
    return arrow;
  }

  /**
   * Holographic Animated Waypoint Marker for Mouse Click-To-Move Navigation
   */
  private createWaypointMarker(): THREE.Group {
    const group = new THREE.Group();
    group.visible = false;

    // Outer cyber glowing ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.72, 32), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    group.add(ring);

    // Inner pulsing target dot
    const dotMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), dotMat);
    dot.rotation.x = -Math.PI / 2;
    dot.position.y = 0.06;
    group.add(dot);

    // Vertical holographic beacon cylinder
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.35, 2.0, 16, 1, true), beamMat);
    beam.position.y = 1.0;
    group.add(beam);

    return group;
  }

  /**
   * Unproject 2D client coordinates to 3D world ground plane
   */
  public getGroundIntersection(
    clientX: number,
    clientY: number,
    canvasRect: DOMRect
  ): { x: number; y: number } | null {
    if (canvasRect.width === 0 || canvasRect.height === 0) return null;
    this.mouseNDC.x = ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
    this.mouseNDC.y = -((clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this.groundIntersectTarget);
    if (hit) {
      return {
        x: to2DX(this.groundIntersectTarget.x),
        y: to2DY(this.groundIntersectTarget.z),
      };
    }
    return null;
  }

  /**
   * Set or clear 3D waypoint marker
   */
  public setWaypoint(target: { x: number; y: number } | null) {
    if (target) {
      this.waypointMarker.visible = true;
      this.waypointMarker.position.set(to3DX(target.x), 0, to3DZ(target.y));
    } else {
      this.waypointMarker.visible = false;
    }
  }

  /**
   * Reset mouse orbit yaw, pitch, and zoom back to default
   */
  public resetCameraOrbit() {
    this.orbitYaw = 0;
    this.orbitPitch = 0;
    this.zoomFactor = 1.0;
  }

  /**
   * Avatar Outfits Switcher
   */
  public setPlayerOutfit(outfit: AvatarOutfit) {
    this.playerOutfit = outfit;
    if (this.playerMesh) {
      this.scene.remove(this.playerMesh);
    }
    this.playerMesh = ModelFactory.createAvatar(outfit, 'CIVILIAN');
    this.scene.add(this.playerMesh);
  }

  public cyclePlayerOutfit(): AvatarOutfit {
    const outfits: AvatarOutfit[] = ['STREETWEAR', 'BODA', 'MATATU_TOUT', 'UNDERCOVER', 'SMART_HUSTLER'];
    const nextIdx = (outfits.indexOf(this.playerOutfit) + 1) % outfits.length;
    this.setPlayerOutfit(outfits[nextIdx]);
    return outfits[nextIdx];
  }

  public cycleCameraMode(): CameraMode {
    const modes: CameraMode[] = ['THIRD_PERSON', 'ISOMETRIC', 'FIRST_PERSON', 'CINEMATIC'];
    const nextIdx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
    this.cameraMode = modes[nextIdx];
    return modes[nextIdx];
  }

  /**
   * Update Weather State & Shaders
   */
  public updateWeather(newWeather: WeatherType, dt: number) {
    this.weather = newWeather;

    if (newWeather === 'RAINY') {
      this.scene.background = new THREE.Color(0x334155);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x334155);
      this.dirLight.intensity = 1.2;
      this.dirLight.color.setHex(0x94a3b8);
      this.hemiLight.intensity = 0.8;
      if (this.rainParticles) this.rainParticles.visible = true;

      // Wet reflective asphalt
      this.roadMaterials.forEach((m) => {
        m.roughness = 0.12;
        m.metalness = 0.45;
      });

      // Periodic Lightning
      this.lightningTimer += dt;
      if (this.lightningTimer > 9 + Math.random() * 6) {
        this.lightningTimer = 0;
        this.lightningLight.intensity = 8.0;
        soundEngine.playThunder();
        setTimeout(() => {
          this.lightningLight.intensity = 0;
        }, 80);
      }
    } else if (newWeather === 'CLOUDY') {
      this.scene.background = new THREE.Color(0x94a3b8);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x94a3b8);
      this.dirLight.intensity = 2.0;
      this.dirLight.color.setHex(0xe2e8f0);
      this.hemiLight.intensity = 1.1;
      if (this.rainParticles) this.rainParticles.visible = false;

      this.roadMaterials.forEach((m) => {
        m.roughness = 0.65;
        m.metalness = 0.2;
      });
    } else {
      // SUNNY
      this.scene.background = new THREE.Color(0x38bdf8);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x38bdf8);
      this.dirLight.intensity = 3.4;
      this.dirLight.color.setHex(0xffedd5);
      this.hemiLight.intensity = 1.4;
      if (this.rainParticles) this.rainParticles.visible = false;

      this.roadMaterials.forEach((m) => {
        m.roughness = 0.85;
        m.metalness = 0.1;
      });
    }

    // Animate Rain Particles
    if (this.rainParticles && this.rainPositions && this.rainGeometry && newWeather === 'RAINY') {
      const pos = this.rainPositions;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] -= 55 * dt; // Fall velocity
        pos[i] -= 12 * dt;     // Wind slant
        if (pos[i + 1] < 0) {
          pos[i + 1] = 55;
          pos[i] = (Math.random() - 0.5) * 160;
          pos[i + 2] = (Math.random() - 0.5) * 160;
        }
      }
      this.rainGeometry.attributes.position.needsUpdate = true;
      if (this.playerMesh) {
        this.rainParticles.position.set(this.playerMesh.position.x, 0, this.playerMesh.position.z);
      }
    }

    // Drift Clouds
    this.cloudsGroup.children.forEach((c) => {
      c.position.x += 4 * dt;
      if (c.position.x > 250) c.position.x = -250;
    });
  }

  /**
   * Main Per-Frame 3D World Update
   */
  public update(
    dt: number,
    playerPos: PlayerPosition,
    stats: PlayerStats,
    npcs: NPC[],
    vehicles: Vehicle[],
    activeMission: Mission | null,
    interactableTarget: { label: string; x: number; y: number; type: string; id: string } | null
  ) {
    const pX = to3DX(playerPos.x);
    const pZ = to3DZ(playerPos.y);

    // 1. Update Jump Physics
    if (this.jumpY > 0 || this.jumpVy > 0) {
      this.jumpY += this.jumpVy * dt;
      this.jumpVy -= 22 * dt; // Gravity
      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.jumpVy = 0;
      }
    }

    // 2. Update Player Mesh
    if (this.playerMesh) {
      if (playerPos.isInVehicle) {
        // Hide avatar or seat avatar inside vehicle
        const drivenVeh = vehicles.find((v) => v.id === playerPos.vehicleId);
        if (drivenVeh && drivenVeh.type === 'BODA') {
          // Boda has rider visible on top
          this.playerMesh.visible = false;
        } else {
          // Inside car/matatu
          this.playerMesh.visible = false;
        }
      } else {
        this.playerMesh.visible = true;
        this.playerMesh.position.set(pX, this.jumpY, pZ);
        this.playerMesh.rotation.y = -playerPos.rotation + Math.PI / 2;

        const hasUmbrella = this.weather === 'RAINY';
        this.playerMesh.updateAnimation(dt, playerPos.speed, playerPos.isSprinting, false, hasUmbrella);
      }
    }

    // 3. Update NPCs
    npcs.forEach((npc) => {
      let npcMesh = this.npcsMap.get(npc.id);
      if (!npcMesh) {
        npcMesh = ModelFactory.createAvatar('STREETWEAR', npc.role);
        this.scene.add(npcMesh);
        this.npcsMap.set(npc.id, npcMesh);
      }

      const nX = to3DX(npc.x);
      const nZ = to3DZ(npc.y);
      npcMesh.position.set(nX, 0, nZ);
      npcMesh.rotation.y = -npc.rotation + Math.PI / 2;
      const isAlert = npc.role === 'KANJO' && (npc.name.includes('PURSUIT') || npc.color === '#ef4444');
      npcMesh.updateAnimation(dt, npc.speed, false, false, !!npc.hasUmbrella, isAlert);
    });

    // 4. Update Vehicles
    vehicles.forEach((veh) => {
      let vehMesh = this.vehiclesMap.get(veh.id);
      if (!vehMesh) {
        if (veh.type === 'MATATU') {
          vehMesh = ModelFactory.createMatatu();
        } else if (veh.type === 'BODA') {
          vehMesh = ModelFactory.createBoda();
        } else if (veh.type === 'POLICE_CAR') {
          vehMesh = ModelFactory.createPoliceCruiser();
        } else {
          vehMesh = ModelFactory.createCivilianCar(veh.color === '#ffffff' ? 0xf8fafc : 0x0284c7);
        }
        this.scene.add(vehMesh);
        this.vehiclesMap.set(veh.id, vehMesh);
      }

      const vX = to3DX(veh.x);
      const vZ = to3DZ(veh.y);
      vehMesh.position.set(vX, 0, vZ);
      vehMesh.rotation.y = -veh.rotation + Math.PI / 2;

      const isBraking = veh.speed < 0;
      const sirenActive = veh.isPolicePatrol && stats.policeHeat >= 40;
      vehMesh.updateAnimation(dt, veh.speed, 0, isBraking, sirenActive);

      // Tailpipe smoke particle effect when moving
      if (Math.abs(veh.speed) > 1.0 && Math.random() < 0.25) {
        particleSystem.addSmoke(veh.x, veh.y, 0, 0, 'rgba(160, 160, 160, 0.4)');
      }
    });

    // 5. Update Interaction Beacon
    if (interactableTarget) {
      this.interactionBeacon.visible = true;
      const tX = to3DX(interactableTarget.x);
      const tZ = to3DZ(interactableTarget.y);
      this.interactionBeacon.position.set(tX, 0, tZ);
      this.interactionBeacon.rotation.y += 2.5 * dt;
    } else {
      this.interactionBeacon.visible = false;
    }

    // 6. Update Mission Compass Arrow
    if (activeMission && activeMission.targetLocation) {
      this.missionCompassArrow.visible = true;
      const mX = to3DX(activeMission.targetLocation.x);
      const mZ = to3DZ(activeMission.targetLocation.y);
      this.missionCompassArrow.position.set(pX, 2.8 + Math.sin(Date.now() * 0.005) * 0.2, pZ);

      // Point towards mission target
      const angle = Math.atan2(mZ - pZ, mX - pX);
      this.missionCompassArrow.rotation.y = -angle + Math.PI / 2;
    } else {
      this.missionCompassArrow.visible = false;
    }

    // 7. Update Click-to-Move Waypoint Hologram Animation
    if (this.waypointMarker && this.waypointMarker.visible) {
      this.waypointPulseTime += dt;
      const pulseScale = 1.0 + Math.sin(this.waypointPulseTime * 6) * 0.12;
      this.waypointMarker.scale.set(pulseScale, 1.0, pulseScale);
      this.waypointMarker.rotation.y += 1.8 * dt;
    }

    // 8. Update Camera Modes with Mouse Orbit & Zoom
    this.updateCamera(dt, pX, pZ, playerPos);

    // 9. Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Smooth Damped Camera Controls across 4 Perspectives with Mouse Orbit & Zoom
   */
  private updateCamera(dt: number, pX: number, pZ: number, playerPos: PlayerPosition) {
    this.cameraTarget.set(pX, 1.4, pZ);

    if (this.cameraMode === 'THIRD_PERSON') {
      // Chase cam behind player/vehicle with smooth spring damping + mouse orbit & zoom
      const baseDist = playerPos.isInVehicle ? 14 : 8.5;
      const camDist = baseDist * this.zoomFactor;
      const camHeight = (playerPos.isInVehicle ? 6.5 : 4.5) * this.zoomFactor;
      const rot = playerPos.rotation + this.orbitYaw;

      // Position camera factoring in mouse yaw and pitch
      const desiredX = pX - Math.cos(rot) * camDist;
      const desiredZ = pZ - Math.sin(rot) * camDist;
      const desiredY = Math.max(1.0, 1.2 + camHeight + this.orbitPitch * 6);

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, desiredX, 7, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, desiredY, 7, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, desiredZ, 7, dt);
      this.camera.lookAt(pX, 1.6 + this.orbitPitch * 1.5, pZ);
    } else if (this.cameraMode === 'ISOMETRIC') {
      // High-angle 45-degree top-down RPG perspective with mouse rotation & zoom
      const isoDist = 28 * this.zoomFactor;
      const isoAngle = Math.PI / 4 + this.orbitYaw;
      const desiredX = pX + Math.cos(isoAngle) * isoDist;
      const desiredY = Math.max(4.0, (28 + this.orbitPitch * 12) * this.zoomFactor);
      const desiredZ = pZ + Math.sin(isoAngle) * isoDist;

      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, desiredX, 6, dt);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, desiredY, 6, dt);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, desiredZ, 6, dt);
      this.camera.lookAt(pX, 0, pZ);
    } else if (this.cameraMode === 'FIRST_PERSON') {
      // Eye-level view walking through Kayole or inside windshield
      const headHeight = playerPos.isInVehicle ? 1.5 : 1.7;
      const lookDist = 20;
      const rot = playerPos.rotation + this.orbitYaw;
      const pitchOffset = this.orbitPitch * 8;

      this.camera.position.set(pX, headHeight + this.jumpY, pZ);
      this.camera.lookAt(pX + Math.cos(rot) * lookDist, headHeight + 0.2 + pitchOffset, pZ + Math.sin(rot) * lookDist);
    } else if (this.cameraMode === 'CINEMATIC') {
      // Orbiting camera revolving around hero + zoom
      this.cinematicAngle += 0.4 * dt;
      const orbitRadius = 11 * this.zoomFactor;
      const desiredX = pX + Math.cos(this.cinematicAngle + this.orbitYaw) * orbitRadius;
      const desiredZ = pZ + Math.sin(this.cinematicAngle + this.orbitYaw) * orbitRadius;
      const desiredY = Math.max(1.5, (4.5 + Math.sin(this.cinematicAngle * 0.5) * 1.5 + this.orbitPitch * 5) * this.zoomFactor);

      this.camera.position.set(desiredX, desiredY, desiredZ);
      this.camera.lookAt(pX, 1.5, pZ);
    }
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public dispose() {
    this.renderer.dispose();
    this.scene.clear();
  }
}
