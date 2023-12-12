import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as dat from 'dat.gui';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class FluffyGrass {
	// # Need access to these outside the comp
	private loadingManager: THREE.LoadingManager;
	private textureLoader: THREE.TextureLoader;

	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private scene: THREE.Scene;
	private canvas: HTMLCanvasElement;
	private stats: Stats;
  private orbitControls: OrbitControls;
	private gui: dat.GUI;
	private sceneGUI: dat.GUI;
	private sceneProps = {
		fogColor: '#2d2d2d',
		volumetricLight1: '#f7f7ff',
		volumetricLight2: '#f7f7ff',
		volumetricLight3: '#f7f7ff',
		fogDensity: 0.0007,
		blueWindowColor: '#6593aa',
	};
	private textures: { [key: string]: THREE.Texture } = {};

	Uniforms = {
		uTime: { value: 0 },
		color: { value: new THREE.Color('#0000ff') },
		blueWindowColor: {
			value: new THREE.Color(this.sceneProps.blueWindowColor),
		},
		useDotPattern: {
			value: 1,
		},
		rows: { value: 220 },
		cols: { value: 220 },
		radius: { value: 0.001184 },
		windowEmissionIntensity: { value: 0.6 },
		concreteRoughness: { value: 1.48 },
		blimpRoughness: { value: 1.15 },
		metalRoughness: { value: 100 },
	};
	private clock = new THREE.Clock();

	private gltfLoader: GLTFLoader;


	constructor(_canvas: HTMLCanvasElement) {
		this.loadingManager = new THREE.LoadingManager();
		this.textureLoader = new THREE.TextureLoader(this.loadingManager);

		this.gui = new dat.GUI();
		this.setupGUI();
		this.sceneGUI = this.gui.addFolder('Scene Properties');
		this.sceneGUI.open();

		this.gltfLoader = new GLTFLoader(this.loadingManager);

		this.canvas = _canvas;
		// this.canvas.style.pointerEvents = 'all';
		this.stats = new Stats();

		this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.camera.position.set(20,20,20)
		this.scene = new THREE.Scene();

		this.scene.background = new THREE.Color(this.sceneProps.fogColor);
		this.scene.fog = new THREE.FogExp2(
			this.sceneProps.fogColor,
			this.sceneProps.fogDensity,
		);

		this.sceneGUI
			.add(this.sceneProps, 'fogDensity', 0, 0.01, 0.000001)
			.onChange((value) => {
				(this.scene.fog as THREE.FogExp2).density = value;
			});
		this.sceneGUI.addColor(this.sceneProps, 'fogColor').onChange((value) => {
			this.scene.fog?.color.set(value);
			this.scene.background = new THREE.Color(value);
		});

		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true,
			alpha: true,
			precision: 'highp', // Use high precision
		});
		// this.renderer.shadowMap.enabled = true;
		// this.renderer.shadowMap.autoUpdate = true;
		// this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.scene.frustumCulled = true;

    this.orbitControls = new OrbitControls(this.camera, canvas);

		this.init();
	}

	private init() {
		this.setupStats();
		this.setupTextures();
		this.loadModels();
		this.setupEventListeners();
    this.addLights();
    this.addObjects();
	}

  private addObjects() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshMatcapMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
  }
  private addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);
  }

	private loadModels() {
		const billboardMat = new THREE.MeshBasicMaterial({
		});

		
		// this.gltfLoader.load(
		// 	'/models/model.glb',
		// 	(gltf) => {
		// 		gltf.scene.traverse((child) => {
		// 			if (child instanceof THREE.Mesh) {
		// 			}
		// 		});

		// 		this.scene.add(gltf.scene);
		// 	},
		// 	undefined,
		// 	(error: any) => {
		// 		console.error(error);
		// 	},
		// );
	}

	public render() {

		this.Uniforms.uTime.value += this.clock.getDelta();
		this.renderer.render(this.scene, this.camera);
		// this.postProcessingManager.update();
		this.stats.update();
    requestAnimationFrame(() => this.render());
		return;
	}

	private setupTextures() {
		this.textures.perlinNoise = this.textureLoader.load(
			'/textures/noise/perlinnoise.webp',
		);

		this.textures.perlinNoise.wrapS = this.textures.perlinNoise.wrapT = THREE.RepeatWrapping;
	}

	private setupGUI() {
		this.gui.close();
		const guiContainer = this.gui.domElement.parentElement as HTMLDivElement;
		guiContainer.style.zIndex = '9999';
		guiContainer.style.position = 'fixed';
		guiContainer.style.top = '0';
		guiContainer.style.left = '0';
		guiContainer.style.right = 'auto';
		guiContainer.style.display = 'block';
	}

	private setupStats() {
		this.stats.dom.style.bottom = '0';
		this.stats.dom.style.top = 'auto';
		this.stats.dom.style.left = 'auto';
		this.stats.dom.style.right = '0';
		this.stats.dom.style.display = 'block';
		document.body.appendChild(this.stats.dom);
	}

	private setupEventListeners() {
		window.addEventListener('resize', () => this.setAspectResolution(), false);

		this.stats.dom.addEventListener('click', () => {
			console.log(this.renderer.info.render);
		});
	}

	private setAspectResolution() {

		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(window.innerWidth, window.innerHeight);
		// this.postProcessingManager.composer.setSize(
		// 	window.innerWidth,
		// 	window.innerHeight,
		// );
	}
}

const canvas = document.querySelector('#canvas') as HTMLCanvasElement;
const app = new FluffyGrass(canvas);
app.render();