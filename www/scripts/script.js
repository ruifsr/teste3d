const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1200);
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({canvas});
let objects = [];
let controlsCam=null;
let controlsDrag = null;

window.addEventListener('click' , e=> {
  switch(e.target.id){
    case 'btnMoveObj':
      moveObj();
      break;
    case 'btnMoveCam':
      moveCam();
      break;
    case 'btnResize':
      scale();
      break;
  }
});

function moveObj() {
  if(controlsCam){
    controlsCam.enabled = false;
    controlsCam = null;
  }
  controlsDrag = new THREE.DragControls(objects,camera,renderer.domElement);
}

function moveCam() {
  if(controlsDrag){
    controlsDrag.enabled = false;
    controlsDrag = null;
  }
  controlsCam = new THREE.OrbitControls(camera,renderer.domElement);
  controlsCam.enableDamping=true;
  controlsCam.campingFactor=0.25;
  controlsCam.enableZoom=true;
}

function scale(){
  let x = document.getElementById("myRangeX").value/100;
  let y = document.getElementById("myRangeY").value/100;
  let z = document.getElementById("myRangeZ").value/100;
  objects[0].scale.set(x, y, z)
}

function main() {
    let scene = new THREE.Scene();
    camera.position.z=200;

    let geometry = new THREE.BoxGeometry(1000,1000,1000);
    let cubeMaterials = [
      new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("/images/left.png"), side:THREE.DoubleSide}),
      new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("/images/back.png"), side:THREE.DoubleSide}),
      new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("/images/top.png"), side:THREE.DoubleSide}),
      new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("/images/bottom.png"), side:THREE.DoubleSide}),
      new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("/images/front.png"), side:THREE.DoubleSide}),
      new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load("/images/right.png"), side:THREE.DoubleSide})
    ];
    //let cubeMaterial = new THREE.MeshFaceMaterial(cubeMaterials);
    let cube = new THREE.Mesh(geometry,cubeMaterials);
    scene.add(cube);

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', () => { 
      renderer.setSize(window.innerWidth, window.innerHeight); 
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
    });

    let keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30,100%,75%)'), 1.0);
    keyLight.position.set(-100,0,100);
    let fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240,100%,75%)'), 0.75);
    fillLight.position.set(-100,0,100);
    let backLight = new THREE.DirectionalLight(0xffffff,1.0);
    backLight.position.set(100,0,-100).normalize();
    scene.add(keyLight);
    scene.add(fillLight);
    scene.add(backLight);

    let loader = new THREE.OBJLoader();
    loader.setPath('/models/');
    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath('/models/');

    mtlLoader.load('blank.mtl', (materials)=>{
      materials.preload();
      loader.setMaterials(materials);
      loader.load('head.obj', (object)=>{
        object.position.y += 20;
        object.position.z += 120;
        object.position.x += 40;
        object.rotation.x += 2;
        object.rotation.y += 3.2;
        objects.push(object);
        scene.add(object);
      });
    });

    mtlLoader.load('r2-d2.mtl', (materials)=>{
      materials.preload();
      loader.setMaterials(materials);
      loader.load('r2-d2.obj', (object)=>{
        object.position.y -= 60;
        objects.push(object);
        scene.add(object);
        scale();
      });
    });

      let GLTFloader = new THREE.GLTFLoader();
      GLTFloader.setPath('/models/');
      
      const dracoLoader = new THREE.DRACOLoader();
      dracoLoader.setDecoderPath('/models/fruits__pbr_texture_files');
      GLTFloader.setDRACOLoader( dracoLoader );

      GLTFloader.load('fruits_glb.gltf', (object)=>{  
        object.scene.position.set(-120,-60,5);
        objects.push(object.scene);
        scene.add(object.scene);
        object.scene.scale.set(10, 10, 10);
      });

      var gltfStore = {};
      var clock = new THREE.Clock();
      GLTFloader.load('test_animation_export.gltf', (object)=>{  
        object.scene.position.set(-90,-57,50);
        objects.push(object.scene);
        scene.add(object.scene);

        gltfStore.mixer = new THREE.AnimationMixer(object.scene);
        gltfStore.mixer.clipAction(object.animations[0]).play();
      });

      //rotation
      const pickPosition = {x: 100000, y: 100000}; //distant positions for start

      window.addEventListener('click', (event)=>{    
        const pos = getCanvasRelativePosition(event);        // setPickPosition
        pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
        pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
        pickHelper.pick(pos,pickPosition, scene, camera);
      });
    
      function getCanvasRelativePosition(event) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: (event.clientX - rect.left) * canvas.width  / rect.width,
          y: (event.clientY - rect.top ) * canvas.height / rect.height,
        };
      }

    //gameLogic
    function update(){
      //cube.rotation.x+=0.01;
      //cube.rotation.y+=0.01;
    }

    //draw a scene
    function render(){
      if(gltfStore.mixer) gltfStore.mixer.update(clock.getDelta());
      if (controlsCam) controlsCam.update();
      renderer.render(scene,camera);
    }

    function gameLoop() {
      requestAnimationFrame(gameLoop);
      update();
      render();

    }
    gameLoop();
}

function rand(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + (max - min) * Math.random();
}

//------------------

class PickHelper {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.pickedObjectSavedColor = 0;
  }
  get PickedObject(){return this.pickedObject;}
  set PickedObject(value){this.pickedObject=value;}
  pick(positions, normalizedPosition, scene, camera) {
    var self=this;
    // cast a ray through the frustum
    this.raycaster.setFromCamera(normalizedPosition, camera);
    // get the list of objects the ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(scene.children);
    //escape 27//left = 37//up = 38//right = 39//down = 40//escape event 25
    function keysHandler(ev) {
      ev = ev || window.event;
      if (ev.keyCode == 27) {
        self.pickedObject = null; 
        deleteArrows();
        document.removeEventListener("keydown", keysHandler);
      } else if (ev.keyCode == 37) { self.pickedObject.rotation.y+=0.2;
      } else if (ev.keyCode == 38) { self.pickedObject.rotation.x-=0.2;
      } else if (ev.keyCode == 39) { self.pickedObject.rotation.y-=0.2;
      } else if (ev.keyCode == 40) { self.pickedObject.rotation.x+=0.2;
    }}
    
    if (this.pickedObject && !intersectedObjects.length) {
      this.pickedObject = null;
      deleteArrows();     
      document.removeEventListener("keydown", keysHandler);
      return;
    }

    if (intersectedObjects.length && !this.pickedObject) {
      // pick the first object. It's the closest one
      this.pickedObject = intersectedObjects[0].object;
      //load arrows here
      addImg(positions.x,positions.y-30,'images/upArrow.png',this.pickedObject,keysHandler)//up
      addImg(positions.x+30,positions.y,'images/rightArrow.png',this.pickedObject,keysHandler)//right
      addImg(positions.x-30,positions.y,'images/leftArrow.png',this.pickedObject,keysHandler)//left
      addImg(positions.x,positions.y+35,'images/downArrow.png',this.pickedObject,keysHandler)//down
      addImg(positions.x+40,positions.y-35,'images/close.png',this.pickedObject,keysHandler)//close
      document.addEventListener("keydown", keysHandler);
    }
  }
}

//-----------------------

function deleteArrows(){
  let imgsArrows =document.querySelectorAll(".arrow");
  for (let i = imgsArrows.length - 1; i >= 0; i--)
    imgsArrows[i].parentNode.removeChild(imgsArrows[i]);
}

//-------------------------

function addImg(x, y, src, pickedObject, keysHandler) {
  let img = document.createElement('img');
  img.className = 'arrow';
  img.style.top = y + "px" ;
  img.style.left = x + "px";
  img.src = src;
  img.addEventListener('mousedown', ()=>{
    if(img.src.includes("up")){pickedObject.rotation.x-=0.2;
    } else if(img.src.includes("right")){ pickedObject.rotation.y-=0.2;
    } else if(img.src.includes("left")){ pickedObject.rotation.y+=0.2;
    } else if(img.src.includes("down")){ pickedObject.rotation.x+=0.2;
    } else {
      pickHelper.PickedObject=null;
      deleteArrows();
      document.removeEventListener("keydown", keysHandler);
  }});
  document.getElementById('videoHolderDivId').appendChild(img);
}

const pickHelper = new PickHelper();

main();
