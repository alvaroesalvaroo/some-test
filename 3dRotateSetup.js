import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GridHelper} from "./three/src/helpers/GridHelper.js";

const modelPath = "./discobolo.glb";

const scene = new THREE.Scene();


let container = {};
const sizes = {};
let statue = {};
// Create renderer in html canvas webgl element
let canvas = {};
let renderer = {};
let controls = {};
let controlsDomElement = {};

const lights = [];

function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);
    for (const light of lights) {
        light.intensity = 15; // BLENDER-THREE.JS LIGHT ADJUSTEMENT
    }
}

function onSceneLoaded(model)
{
    scene.add( model );
    const gridHelper = new THREE.GridHelper( 1, 1 );
    scene.add( gridHelper );
    let meshCount = 0;


    model.traverse( ( child ) => {
        if (child.isMesh) {
            meshCount++;
            console.log(child.name);
            child.receiveShadow = true;
            statue = child;
        } else if (child.isLight) {
            lights.push(child);
            console.log("Pushed light");
        }

        if (child.name.startsWith("CamPosition")) {
            console.log("cam position found on statue lab scene");
            camPositions.push(child);
            camPositions.visible = false;
        }

    })

    console.log("Loaded scene with mesh count: " + meshCount);
}

// ---------
// SCREEN RESIZE
// --------

function resize () {
    // Update sizes
    sizes.width = container.clientWidth;
    sizes.height = container.clientHeight;
    console.log("Resized lab small canvas to " + sizes.width + ", " + sizes.height);
    camera.aspect = sizes.width / sizes.height;
    let isNarrowDevice = sizes.width < narrowThreshold;
    camera.setFocalLength(isNarrowDevice ? fovNarrow : fov);
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}



//--------------
// INIT SCENE AND CAMERA
// ------------

const fov = 50;
const fovNarrow = 45; // For (narrow) mobile devices
const narrowThreshold = 500;

let camera;

let camPositions = [];

function init() {

    console.log("Initializing 3D scene...");
    // Select and clear container
    // container = document.querySelector('#project-details-section .project-slider');
    // let outherContainer = document.querySelector("#webgl-container")
    let referenceContainer = document.querySelector("#reference")
    container = document.createElement("div");

    // Add container after (with same parent)
    referenceContainer.after(container);
    referenceContainer.style.position = "relative";
    container.style.zIndex = 9999;
    container.style.position = "absolute";
    container.style.top = "100%"; // Se coloca justo donde termina el padre
    container.style.left = "0";
    container.style.width = "100%"; // Mismo ancho que el padre
    // container.style.marginTop = "15px"; // Desfase adicional

    // Save original size
    sizes.width = container.clientWidth; sizes.height = container.clientHeight;
    container.classList.add('webgl-container');
    container.innerHTML = "";
    container.style.height = "100%";

    // Append canvas
    canvas = document.createElement("canvas");
    container.appendChild(canvas);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true // To combine other renderers
    });

    // Controls relate

    camera = new THREE.PerspectiveCamera(fov,
        sizes.width / sizes.height,   // aspect
        0.01,                          // near point
        1000                          // far away point
    );

    // Controls require an invisible dom element
    controlsDomElement = document.createElement('div');
    controlsDomElement.classList.add('controls');
    controlsDomElement.style.position = 'absolute';
    controlsDomElement.style.top = '0';
    controlsDomElement.style.width = '100%';
    controlsDomElement.style.height = '100%';
    controlsDomElement.style.pointerEvents = 'auto';
    controlsDomElement.style.zIndex = '100'; // Debajo de CSS Renderer y debajo de WebGl Renderer, pero capturando pointer events
    container.appendChild(controlsDomElement);
    // document.body.appendChild(controlsDomElement);

    controls = new OrbitControls(camera);
    controls.connect( controlsDomElement );
    controls.enableDamping = true; // Suaviza el movimiento (da inercia)
    controls.enablePan = false;

    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false; // Mantiene el eje Y estable


    window.addEventListener("resize", resize);

    console.log("Init lab (small) scene in container with sizes: " + sizes.width + ", " + sizes.height);

    // Load glb model
    const loader = new GLTFLoader();

    // AFTER LOAD MODEL
    loader.load( modelPath, function ( gltf ) {
        onSceneLoaded(gltf.scene);
        setupLights();
        resize();

        controls.target.copy(statue.position);
        controls.update();

        const currentAzimuth = controls.getAzimuthalAngle();
        controls.minAzimuthAngle = currentAzimuth - 45 * (Math.PI / 180);
        controls.maxAzimuthAngle = currentAzimuth + 40 * (Math.PI / 180);
        controls.update();

        const currentPolar = 60 * (Math.PI / 180);
        controls.minPolarAngle = currentPolar;
        // controls.minPolarAngle = currentPolar - 2 * (Math.PI / 180); // 45 grados hacia arriba
        controls.maxPolarAngle = currentPolar; // Un poco hacia abajo
        controls.update();

        camera.position.copy(camPositions[0].position);

        const initialDistance = camera.position.distanceTo(controls.target);
        controls.minDistance = initialDistance;
        controls.maxDistance = initialDistance + 1;
        camera.lookAt(statue.position);

        renderer.setAnimationLoop( animate );
        // controls.active = false;

    }, undefined, function ( error ) {
        console.error( "Error loading model: " + error );
    } );
}

// -------------
// MAIN LOOP

const clock = new THREE.Clock();
let deltaTime;

function animate() {

    controls.update(); // Solo necesario si enableDamping = true o autoRotate = true

    // Render
    renderer.render(scene, camera);

}

init();


