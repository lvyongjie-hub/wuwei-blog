import engineeringSheetUrl from '@/assets/intro/engineering-sheet.png?url';
import indexCardUrl from '@/assets/intro/index-card.png?url';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export interface HomeIntroScene {
  render: (progress: number, pointer: { x: number; y: number }) => void;
  resize: () => void;
  dispose: () => void;
}

interface SceneOptions {
  mobile: boolean;
}

const INK = 0x101714;
const PAPER_DEEP = 0xd8cebc;
const PINE = 0x315747;
const COPPER = 0xb17a3d;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const range = (value: number, start: number, end: number) =>
  clamp01((value - start) / (end - start));
const smooth = (value: number) => value * value * (3 - 2 * value);
const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);
const easeInOut = (value: number) =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function createBookplateTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 768;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');

  const paper = context.createLinearGradient(0, 0, 768, 768);
  paper.addColorStop(0, '#f3efe6');
  paper.addColorStop(0.54, '#e7dece');
  paper.addColorStop(1, '#d5c8b2');
  context.fillStyle = paper;
  context.fillRect(0, 0, 768, 768);

  const random = seededRandom(51);
  context.globalAlpha = 0.14;
  for (let index = 0; index < 1100; index += 1) {
    const x = random() * 768;
    const y = random() * 768;
    const length = 2 + random() * 14;
    context.strokeStyle = random() > 0.5 ? '#75634b' : '#ffffff';
    context.lineWidth = 0.5 + random();
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + length, y + (random() - 0.5) * 2);
    context.stroke();
  }
  context.globalAlpha = 1;

  context.strokeStyle = '#315747';
  context.lineWidth = 11;
  context.strokeRect(46, 46, 676, 676);
  context.strokeStyle = '#b17a3d';
  context.lineWidth = 3;
  context.strokeRect(68, 68, 632, 632);

  context.fillStyle = '#25241f';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '650 176px "Noto Serif SC Variable", "Noto Serif SC", serif';
  context.fillText('五味', 384, 318);

  context.fillStyle = '#315747';
  context.font = '600 25px "JetBrains Mono Variable", monospace';
  context.letterSpacing = '5px';
  context.fillText('ENGINEER\u2019S DIGITAL DESK', 384, 443);

  context.strokeStyle = '#b17a3d';
  context.lineWidth = 10;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.beginPath();
  context.moveTo(122, 548);
  context.lineTo(200, 548);
  context.lineTo(231, 489);
  context.lineTo(272, 615);
  context.lineTo(318, 512);
  context.lineTo(355, 548);
  context.lineTo(430, 548);
  context.lineTo(465, 521);
  context.lineTo(504, 574);
  context.lineTo(548, 548);
  context.lineTo(646, 548);
  context.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

async function loadTexture(url: string, anisotropy: number) {
  const texture = await new THREE.TextureLoader().loadAsync(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

function createPaperObject(texture: THREE.Texture, width: number, height: number, depth: number) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new RoundedBoxGeometry(width, height, depth, 5, Math.min(0.035, depth * 0.4)),
    new THREE.MeshStandardMaterial({
      color: PAPER_DEEP,
      roughness: 0.88,
      metalness: 0,
    }),
  );
  body.castShadow = true;
  body.receiveShadow = true;

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.965, height * 0.94),
    new THREE.MeshBasicMaterial({
      map: texture,
      color: 0xffffff,
      side: THREE.DoubleSide,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
  );
  face.position.z = depth / 2 + 0.05;
  face.receiveShadow = true;

  group.add(body, face);
  return group;
}

function createBookplate(texture: THREE.Texture) {
  const group = new THREE.Group();

  const copperFrame = new THREE.Mesh(
    new RoundedBoxGeometry(2.34, 2.34, 0.26, 7, 0.12),
    new THREE.MeshPhysicalMaterial({
      color: COPPER,
      metalness: 0.82,
      roughness: 0.27,
      clearcoat: 0.38,
      clearcoatRoughness: 0.2,
    }),
  );
  copperFrame.castShadow = true;

  const pineInset = new THREE.Mesh(
    new RoundedBoxGeometry(2.14, 2.14, 0.2, 7, 0.09),
    new THREE.MeshPhysicalMaterial({
      color: PINE,
      metalness: 0.2,
      roughness: 0.48,
      clearcoat: 0.25,
    }),
  );
  pineInset.position.z = 0.1;
  pineInset.castShadow = true;

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1.93, 1.93),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.66,
      metalness: 0.02,
    }),
  );
  face.position.z = 0.215;

  group.add(copperFrame, pineInset, face);

  const rivetMaterial = new THREE.MeshPhysicalMaterial({
    color: COPPER,
    metalness: 0.9,
    roughness: 0.22,
  });
  for (const [x, y] of [
    [-0.91, -0.91],
    [0.91, -0.91],
    [-0.91, 0.91],
    [0.91, 0.91],
  ] as const) {
    const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), rivetMaterial);
    rivet.position.set(x, y, 0.24);
    group.add(rivet);
  }

  return group;
}

function createTrace(points: THREE.Vector3[], color: number, opacity = 1) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      toneMapped: false,
    }),
  );
}

function createSignalPoints() {
  const anchors = [
    [-6.4, 0],
    [-5.3, 0],
    [-5.0, 0.78],
    [-4.66, -1.05],
    [-4.25, 0.58],
    [-3.92, 0],
    [-2.72, 0],
    [-2.4, 0.42],
    [-2.08, -0.46],
    [-1.7, 0],
    [-0.45, 0],
    [-0.1, 0.78],
    [0.23, -1.05],
    [0.64, 0.58],
    [0.98, 0],
    [2.12, 0],
    [2.48, 0.42],
    [2.82, -0.46],
    [3.18, 0],
    [4.25, 0],
    [4.55, 0.78],
    [4.88, -1.05],
    [5.3, 0.58],
    [5.65, 0],
    [6.4, 0],
  ] as const;
  const points: THREE.Vector3[] = [];
  anchors.slice(0, -1).forEach((anchor, index) => {
    const next = anchors[index + 1];
    for (let step = 0; step < 8; step += 1) {
      const amount = step / 8;
      points.push(
        new THREE.Vector3(
          THREE.MathUtils.lerp(anchor[0], next[0], amount),
          THREE.MathUtils.lerp(anchor[1], next[1], amount),
          1.34,
        ),
      );
    }
  });
  points.push(new THREE.Vector3(6.4, 0, 1.34));
  return points;
}

function addCircuitDetails(parent: THREE.Group) {
  const paths = [
    [
      [-2.55, 0.92],
      [-1.78, 0.92],
      [-1.48, 0.62],
      [-0.75, 0.62],
    ],
    [
      [0.66, 1.03],
      [1.2, 1.03],
      [1.56, 0.67],
      [2.37, 0.67],
    ],
    [
      [-2.42, -1.14],
      [-1.56, -1.14],
      [-1.2, -0.78],
      [-0.46, -0.78],
    ],
    [
      [0.48, -1.18],
      [1.34, -1.18],
      [1.7, -0.82],
      [2.48, -0.82],
    ],
  ];

  paths.forEach((path, index) => {
    const points = path.map(([x, y]) => new THREE.Vector3(x, y, 0.09));
    const trace = createTrace(points, index % 2 === 0 ? COPPER : PINE, 0.86);
    parent.add(trace);

    const node = new THREE.Mesh(
      new THREE.CircleGeometry(0.045, 18),
      new THREE.MeshBasicMaterial({ color: index % 2 === 0 ? COPPER : PINE }),
    );
    const end = points.at(-1);
    if (end) node.position.copy(end).add(new THREE.Vector3(0, 0, 0.002));
    parent.add(node);
  });
}

function createDust(count: number) {
  const random = seededRandom(2026);
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 15;
    positions[index * 3 + 1] = (random() - 0.5) * 9;
    positions[index * 3 + 2] = (random() - 0.5) * 8;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xe0a761,
      size: 0.018,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
}

export async function createHomeIntroScene(
  canvas: HTMLCanvasElement,
  options: SceneOptions,
): Promise<HomeIntroScene> {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !options.mobile,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(INK, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = !options.mobile;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(INK);
  scene.fog = new THREE.FogExp2(INK, 0.044);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  const cameraStartZ = options.mobile ? 10.6 : 8.4;
  const stageBaseScale = options.mobile ? 0.78 : 1;
  camera.position.set(0, 0.12, cameraStartZ);

  const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), options.mobile ? 2 : 8);
  await Promise.race([
    document.fonts?.load('650 176px "Noto Serif SC Variable"'),
    new Promise((resolve) => window.setTimeout(resolve, 180)),
  ]);
  const [engineeringTexture, indexTexture] = await Promise.all([
    loadTexture(engineeringSheetUrl, maxAnisotropy),
    loadTexture(indexCardUrl, maxAnisotropy),
  ]);
  const bookplateTexture = createBookplateTexture();
  bookplateTexture.anisotropy = maxAnisotropy;

  const stage = new THREE.Group();
  stage.scale.setScalar(stageBaseScale);
  scene.add(stage);

  const sheet = createPaperObject(engineeringTexture, 5.65, 3.58, 0.075);
  sheet.position.set(0, -3.6, -1.4);
  sheet.rotation.set(-0.18, 0.05, -0.08);
  addCircuitDetails(sheet);
  stage.add(sheet);

  const leftCard = createPaperObject(indexTexture, 3.25, 2.02, 0.085);
  leftCard.position.set(-5.1, 2.4, -0.8);
  leftCard.rotation.set(-0.12, -0.28, -0.22);
  stage.add(leftCard);

  const rightCard = createPaperObject(indexTexture, 2.82, 1.76, 0.07);
  rightCard.position.set(5, 1.7, -1.1);
  rightCard.rotation.set(-0.08, 0.26, 0.2);
  rightCard.scale.setScalar(0.9);
  stage.add(rightCard);

  const bookplate = createBookplate(bookplateTexture);
  bookplate.position.set(2.9, 2.35, 3.4);
  bookplate.rotation.set(-0.34, -0.75, 0.38);
  bookplate.scale.setScalar(0.34);
  stage.add(bookplate);

  const signalPoints = createSignalPoints();
  const signal = createTrace(signalPoints, 0xe0a761);
  signal.geometry.setDrawRange(0, 0);
  stage.add(signal);

  const signalGlow = createTrace(signalPoints, 0xf5bf76, 0.28);
  signalGlow.scale.set(1, 1.045, 1);
  signalGlow.geometry.setDrawRange(0, 0);
  stage.add(signalGlow);

  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xffcb80, toneMapped: false }),
  );
  stage.add(pulse);

  const dust = createDust(options.mobile ? 42 : 92);
  scene.add(dust);

  scene.add(new THREE.HemisphereLight(0xdbe7dc, 0x16110b, 1.25));

  const keyLight = new THREE.DirectionalLight(0xffd19a, options.mobile ? 2.2 : 3.4);
  keyLight.position.set(-4, 5, 7);
  keyLight.castShadow = !options.mobile;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const pineLight = new THREE.PointLight(0x76a887, 5.5, 12, 2);
  pineLight.position.set(4.5, -2.5, 3.5);
  scene.add(pineLight);

  const pulseLight = new THREE.PointLight(0xf0a958, 6.5, 4.5, 2);
  scene.add(pulseLight);

  const spot = new THREE.SpotLight(0xf0c58e, 8, 18, Math.PI / 7, 0.6, 1.4);
  spot.position.set(-4.5, 5.5, 7);
  spot.target.position.set(0.3, 0, 0);
  scene.add(spot, spot.target);

  let composer: EffectComposer | undefined;
  if (!options.mobile) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.58, 0.74, 0.82));
  }

  const pointerCurrent = new THREE.Vector2();
  const targetVector = new THREE.Vector3();

  const resize = () => {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, options.mobile ? 1.2 : 1.65);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    composer?.setPixelRatio(pixelRatio);
    composer?.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const render = (progress: number, pointer: { x: number; y: number }) => {
    const signalProgress = easeOut(range(progress, 0, 0.28));
    const signalCount = Math.max(2, Math.floor(signalPoints.length * signalProgress));
    signal.geometry.setDrawRange(0, signalCount);
    signalGlow.geometry.setDrawRange(0, signalCount);
    const pulseIndex = Math.min(signalPoints.length - 1, signalCount - 1);
    pulse.position.copy(signalPoints[pulseIndex]);
    pulseLight.position.copy(pulse.position);

    const paperProgress = easeInOut(range(progress, 0.12, 0.47));
    sheet.position.lerpVectors(
      new THREE.Vector3(0, -3.6, -1.4),
      new THREE.Vector3(0, -0.08, -0.5),
      paperProgress,
    );
    sheet.rotation.x = THREE.MathUtils.lerp(-0.18, -0.08, paperProgress);
    sheet.rotation.z = THREE.MathUtils.lerp(-0.08, -0.025, paperProgress);

    leftCard.position.lerpVectors(
      new THREE.Vector3(-5.1, 2.4, -0.8),
      new THREE.Vector3(-2.2, -0.72, 0.12),
      paperProgress,
    );
    leftCard.rotation.y = THREE.MathUtils.lerp(-0.28, 0.08, paperProgress);
    leftCard.rotation.z = THREE.MathUtils.lerp(-0.22, -0.14, paperProgress);

    rightCard.position.lerpVectors(
      new THREE.Vector3(5, 1.7, -1.1),
      new THREE.Vector3(2.35, 0.86, -0.16),
      paperProgress,
    );
    rightCard.rotation.y = THREE.MathUtils.lerp(0.26, -0.06, paperProgress);
    rightCard.rotation.z = THREE.MathUtils.lerp(0.2, 0.11, paperProgress);

    const plateProgress = easeInOut(range(progress, 0.36, 0.7));
    bookplate.position.lerpVectors(
      new THREE.Vector3(2.9, 2.35, 3.4),
      new THREE.Vector3(0, 0.08, 0.82),
      plateProgress,
    );
    bookplate.rotation.x = THREE.MathUtils.lerp(-0.34, -0.05, plateProgress);
    bookplate.rotation.y = THREE.MathUtils.lerp(-0.75, 0.04, plateProgress);
    bookplate.rotation.z = THREE.MathUtils.lerp(0.38, 0.035, plateProgress);
    const press = Math.sin(range(progress, 0.58, 0.72) * Math.PI);
    bookplate.position.z -= press * 0.12;
    bookplate.scale.setScalar(
      THREE.MathUtils.lerp(0.34, 0.64, easeOut(plateProgress)) - press * 0.018,
    );

    const exitProgress = smooth(range(progress, 0.72, 1));
    camera.position.z = THREE.MathUtils.lerp(
      cameraStartZ,
      options.mobile ? 7.4 : 4.75,
      exitProgress,
    );
    camera.position.y = THREE.MathUtils.lerp(0.12, 0.05, exitProgress);
    camera.lookAt(0.18, -0.04, 0);
    stage.scale.setScalar(
      THREE.MathUtils.lerp(stageBaseScale, stageBaseScale * 1.22, exitProgress),
    );

    pointerCurrent.x = THREE.MathUtils.lerp(pointerCurrent.x, pointer.x, 0.055);
    pointerCurrent.y = THREE.MathUtils.lerp(pointerCurrent.y, pointer.y, 0.055);
    stage.rotation.y = pointerCurrent.x * 0.045;
    stage.rotation.x = -pointerCurrent.y * 0.028;
    dust.rotation.y += 0.00055;
    dust.position.y = Math.sin(progress * Math.PI * 2) * 0.04;

    targetVector.set(0, 0, 0);
    spot.target.position.lerp(targetVector, 0.08);
    spot.target.updateMatrixWorld();

    if (composer) composer.render();
    else renderer.render(scene, camera);
  };

  const dispose = () => {
    scene.traverse((object) => {
      const renderable = object as THREE.Mesh | THREE.Line | THREE.Points;
      renderable.geometry?.dispose();
      const materials = Array.isArray(renderable.material)
        ? renderable.material
        : renderable.material
          ? [renderable.material]
          : [];
      materials.forEach((material) => material.dispose());
    });
    engineeringTexture.dispose();
    indexTexture.dispose();
    bookplateTexture.dispose();
    composer?.dispose();
    renderer.dispose();
  };

  resize();
  return { render, resize, dispose };
}
