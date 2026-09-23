import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { ProductKind } from "./products";
import type { Finish, FocusTarget } from "./state";

interface CameraShot {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

interface BuiltProduct {
  group: THREE.Group;
  primaryMaterial: THREE.MeshPhysicalMaterial;
  secondaryMaterial: THREE.MeshPhysicalMaterial;
  engravingPlane?: THREE.Mesh;
  shots: Partial<Record<FocusTarget, CameraShot>>;
}

export const FOCUS_TARGETS_BY_KIND: Record<ProductKind, FocusTarget[]> = {
  headphones: ["overview", "left_cup", "right_cup", "headband"],
  smartwatch: ["overview", "close_up"],
  backpack: ["overview", "close_up"],
  lamp: ["overview", "close_up"],
};

export const FOCUS_LABELS: Record<FocusTarget, string> = {
  overview: "Vista general",
  left_cup: "Copa izq.",
  right_cup: "Copa der.",
  headband: "Diadema",
  close_up: "Detalle",
};

// Textura de ruido sutil, generada una sola vez y reutilizada como
// roughnessMap en todos los materiales: rompe el "plástico CG" perfectamente
// uniforme de un color sólido sin tocar la geometría ni depender de nada
// externo (nada de red, nada de licencias que verificar).
let noiseTexture: THREE.CanvasTexture | null = null;
function getRoughnessNoise(): THREE.CanvasTexture {
  if (noiseTexture) return noiseTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 195 + Math.random() * 60;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  noiseTexture = new THREE.CanvasTexture(canvas);
  noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping;
  noiseTexture.repeat.set(6, 6);
  return noiseTexture;
}

function makeMaterials(color: string): { primary: THREE.MeshPhysicalMaterial; secondary: THREE.MeshPhysicalMaterial } {
  const roughnessMap = getRoughnessNoise();
  return {
    primary: new THREE.MeshPhysicalMaterial({ color, roughness: 0.6, metalness: 0.1, clearcoat: 0, roughnessMap, envMapIntensity: 1.15 }),
    secondary: new THREE.MeshPhysicalMaterial({ color: 0x1a1c22, roughness: 0.85, metalness: 0, roughnessMap, envMapIntensity: 1.05 }),
  };
}

function buildContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(0,0,0,0.45)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.18)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function buildEngravingTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#111318";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (text) {
    ctx.fillStyle = "#e8eaf0";
    ctx.font = "600 64px -apple-system, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text.slice(0, 14).toUpperCase(), canvas.width / 2, canvas.height / 2 + 4);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildHeadphones(color: string): BuiltProduct {
  const { primary, secondary } = makeMaterials(color);
  const group = new THREE.Group();

  const headbandGeo = new THREE.TorusGeometry(1.05, 0.055, 24, 64, Math.PI * 0.92);
  const headband = new THREE.Mesh(headbandGeo, primary);
  headband.rotation.z = (Math.PI - Math.PI * 0.92) / 2;
  headband.position.y = 0.05;
  group.add(headband);

  const engravingGeo = new THREE.PlaneGeometry(0.34, 0.09);
  const engravingMat = new THREE.MeshStandardMaterial({ map: buildEngravingTexture(""), roughness: 0.5 });
  const engravingPlane = new THREE.Mesh(engravingGeo, engravingMat);
  engravingPlane.position.set(0, 1.13, 0.14);
  engravingPlane.rotation.x = -0.35;
  group.add(engravingPlane);

  for (const side of [-1, 1]) {
    const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 12), primary);
    yoke.position.set(side * 1.0, 0.35, 0);
    group.add(yoke);

    const cupOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.24, 32), primary);
    cupOuter.rotation.z = Math.PI / 2;
    cupOuter.position.set(side * 1.05, 0.05, 0);
    group.add(cupOuter);

    const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 20, 32), secondary);
    cushion.rotation.y = Math.PI / 2;
    cushion.position.set(side * (1.05 + 0.13 * side), 0.05, 0);
    group.add(cushion);
  }

  group.position.y = -0.15;

  return {
    group,
    primaryMaterial: primary,
    secondaryMaterial: secondary,
    engravingPlane,
    shots: {
      overview: { position: new THREE.Vector3(0, 0.15, 3.1), target: new THREE.Vector3(0, 0, 0) },
      left_cup: { position: new THREE.Vector3(-1.35, 0.05, 0.9), target: new THREE.Vector3(-0.95, 0, 0) },
      right_cup: { position: new THREE.Vector3(1.35, 0.05, 0.9), target: new THREE.Vector3(0.95, 0, 0) },
      headband: { position: new THREE.Vector3(0, 1.15, 0.9), target: new THREE.Vector3(0, 0.75, 0) },
    },
  };
}

function buildWatchFaceTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  ctx.fillStyle = "#15171c";
  ctx.beginPath();
  ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.lineTo(cx + Math.cos(a) * (r - 14), cy + Math.sin(a) * (r - 14));
    ctx.stroke();
  }

  ctx.lineCap = "round";
  ctx.strokeStyle = "#e8eaf0";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(-Math.PI / 2 - 0.9) * r * 0.5, cy + Math.sin(-Math.PI / 2 - 0.9) * r * 0.5);
  ctx.stroke();

  ctx.strokeStyle = "#6ea8fe";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(-Math.PI / 2 + 1.6) * r * 0.78, cy + Math.sin(-Math.PI / 2 + 1.6) * r * 0.78);
  ctx.stroke();

  ctx.fillStyle = "#6ea8fe";
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildSmartwatch(color: string): BuiltProduct {
  const { primary, secondary } = makeMaterials(color);
  const group = new THREE.Group();

  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 48), primary);
  face.rotation.x = Math.PI / 2;
  group.add(face);

  const screen = new THREE.Mesh(
    new THREE.CircleGeometry(0.44, 48),
    new THREE.MeshStandardMaterial({ map: buildWatchFaceTexture(), roughness: 0.35, metalness: 0.1 })
  );
  screen.position.set(0, 0, 0.061);
  group.add(screen);

  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.045, 16, 48), primary);
  group.add(bezel);

  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 12), secondary);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(0.58, -0.02, 0);
  group.add(crown);

  for (const dir of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.85, 0.08), secondary);
    strap.position.set(0, dir * 0.7, 0);
    group.add(strap);
  }

  return {
    group,
    primaryMaterial: primary,
    secondaryMaterial: secondary,
    shots: {
      overview: { position: new THREE.Vector3(0, 0.2, 2.6), target: new THREE.Vector3(0, 0, 0) },
      close_up: { position: new THREE.Vector3(0, 0, 1.15), target: new THREE.Vector3(0, 0, 0) },
    },
  };
}

function buildBackpack(color: string): BuiltProduct {
  const { primary, secondary } = makeMaterials(color);
  const group = new THREE.Group();

  const body = new THREE.Mesh(new RoundedBoxGeometry(1.15, 1.5, 0.55, 4, 0.12), primary);
  group.add(body);

  const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.62, 0.14, 3, 0.06), secondary);
  pocket.position.set(0, -0.25, 0.35);
  group.add(pocket);

  const zip = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.015, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.4, metalness: 0.6 })
  );
  zip.position.set(0, 0.02, 0.43);
  group.add(zip);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 12, 24, Math.PI), secondary);
  handle.position.set(0, 0.78, 0);
  group.add(handle);

  // Correas asomando por los costados (curvan desde atrás hacia el frente) —
  // así se leen como mochila incluso en una vista de frente, sin taparse
  // detrás del cuerpo ni sobresalir por arriba.
  for (const side of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.55, 4, 8), secondary);
    strap.position.set(side * 0.62, -0.15, -0.05);
    strap.rotation.z = side * 0.1;
    group.add(strap);
  }

  return {
    group,
    primaryMaterial: primary,
    secondaryMaterial: secondary,
    shots: {
      overview: { position: new THREE.Vector3(0, 0.1, 3), target: new THREE.Vector3(0, 0, 0) },
      close_up: { position: new THREE.Vector3(0, -0.15, 1.1), target: new THREE.Vector3(0, -0.2, 0.3) },
    },
  };
}

function buildLamp(color: string): BuiltProduct {
  const { primary, secondary } = makeMaterials(color);
  const group = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.12, 32), secondary);
  base.position.set(0, -0.9, 0);
  group.add(base);

  const armLower = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 12), secondary);
  armLower.position.set(-0.1, -0.35, 0);
  armLower.rotation.z = 0.15;
  group.add(armLower);

  const armUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12), secondary);
  armUpper.position.set(0.35, 0.35, 0);
  armUpper.rotation.z = -0.9;
  group.add(armUpper);

  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.55, 32, 1, true), primary);
  shade.position.set(0.7, 0.6, 0);
  shade.rotation.z = Math.PI * 0.65;
  group.add(shade);

  return {
    group,
    primaryMaterial: primary,
    secondaryMaterial: secondary,
    shots: {
      overview: { position: new THREE.Vector3(0, 0, 3), target: new THREE.Vector3(0, -0.2, 0) },
      close_up: { position: new THREE.Vector3(1.1, 0.7, 1.1), target: new THREE.Vector3(0.7, 0.6, 0) },
    },
  };
}

const BUILDERS: Record<ProductKind, (color: string) => BuiltProduct> = {
  headphones: buildHeadphones,
  smartwatch: buildSmartwatch,
  backpack: buildBackpack,
  lamp: buildLamp,
};

export class ProductScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private clock = new THREE.Clock();
  private container: HTMLElement;

  private built: BuiltProduct | null = null;
  private contactShadow: THREE.Mesh;
  private cameraAnim: { from: THREE.Vector3; to: THREE.Vector3; fromTarget: THREE.Vector3; toTarget: THREE.Vector3; t: number } | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 50);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 0.8;
    this.controls.maxDistance = 6;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.background = new THREE.Color(0xf5f5f7);

    // Iluminación de 3 puntos (key / fill / rim) en vez de una sola luz
    // direccional plana — el fill frío y el rim dan volumen y un borde de
    // luz que separa el producto del fondo.
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(3, 4, 2);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xbcd4ff, 0.5);
    fill.position.set(-3, 1.2, -1.5);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.7);
    rim.position.set(-1.5, 2.5, -3);
    this.scene.add(rim);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.18));

    // Sombra de contacto "falsa" (textura con gradiente radial) bajo el
    // producto — más barata y siempre estable que un shadow map real, y
    // le da peso al objeto aunque esté "flotando" en el encuadre.
    this.contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: buildContactShadowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.6,
      })
    );
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.contactShadow);

    window.addEventListener("resize", this.onResize);
    this.renderer.setAnimationLoop(() => this.tick());
  }

  loadProduct(kind: ProductKind, color: string): void {
    if (this.built) {
      this.scene.remove(this.built.group);
      this.built.primaryMaterial.dispose();
      this.built.secondaryMaterial.dispose();
    }
    this.built = BUILDERS[kind](color);
    this.scene.add(this.built.group);

    const box = new THREE.Box3().setFromObject(this.built.group);
    const size = box.getSize(new THREE.Vector3());
    const footprint = Math.max(size.x, size.z) * 1.2;
    this.contactShadow.scale.set(footprint, footprint, 1);
    this.contactShadow.position.set(0, box.min.y + 0.01, 0);

    const overview = this.built.shots.overview!;
    this.camera.position.copy(overview.position);
    this.controls.target.copy(overview.target);
    this.cameraAnim = null;
  }

  setBackground(hex: string): void {
    this.scene.background = new THREE.Color(hex);
  }

  setAutoRotate(enabled: boolean, speed = 1.6): void {
    this.controls.autoRotate = enabled;
    this.controls.autoRotateSpeed = speed;
  }

  setColor(hex: string): void {
    this.built?.primaryMaterial.color.set(hex);
  }

  setFinish(finish: Finish): void {
    if (!this.built) return;
    const presets: Record<Finish, { roughness: number; metalness: number; clearcoat: number }> = {
      matte: { roughness: 0.75, metalness: 0.05, clearcoat: 0 },
      glossy: { roughness: 0.15, metalness: 0.1, clearcoat: 0.9 },
      metallic: { roughness: 0.3, metalness: 0.9, clearcoat: 0.2 },
    };
    const preset = presets[finish];
    const material = this.built.primaryMaterial;
    material.roughness = preset.roughness;
    material.metalness = preset.metalness;
    material.clearcoat = preset.clearcoat;
    material.needsUpdate = true;
  }

  setEngraving(text: string): void {
    if (!this.built?.engravingPlane) return;
    const material = this.built.engravingPlane.material as THREE.MeshStandardMaterial;
    material.map?.dispose();
    material.map = buildEngravingTexture(text);
    material.needsUpdate = true;
  }

  focusOn(target: FocusTarget): void {
    const shot = this.built?.shots[target] ?? this.built?.shots.overview;
    if (!shot) return;
    this.cameraAnim = {
      from: this.camera.position.clone(),
      to: shot.position.clone(),
      fromTarget: this.controls.target.clone(),
      toTarget: shot.target.clone(),
      t: 0,
    };
  }

  dispose(): void {
    window.removeEventListener("resize", this.onResize);
    this.renderer.setAnimationLoop(null);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }

  private onResize = (): void => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };

  private tick(): void {
    const dt = this.clock.getDelta();

    if (this.cameraAnim) {
      this.cameraAnim.t = Math.min(1, this.cameraAnim.t + dt / 0.9);
      const ease = 1 - Math.pow(1 - this.cameraAnim.t, 3);
      this.camera.position.lerpVectors(this.cameraAnim.from, this.cameraAnim.to, ease);
      this.controls.target.lerpVectors(this.cameraAnim.fromTarget, this.cameraAnim.toTarget, ease);
      if (this.cameraAnim.t >= 1) this.cameraAnim = null;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
