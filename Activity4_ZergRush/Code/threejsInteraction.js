let container;
let camera, scene, raycaster, renderer;
let globalScore = 0;
let globalTime = 60;
let waifuList = [];
let scoreControl = [0,0,0,0,0,0,0,0,0,0,0,0]

let mouse = new THREE.Vector2(), INTERSECTED, CLICKED;
let radius = 100, theta = 0;

let floorUrl = "../images/checker_large.gif";

function createScene(canvas) 
{
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );
    
    let light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( 1, 1, 1 );
    scene.add( light );


    //OLD GEOMETRIES FOR CUBES!!!!
    // let geometry = new THREE.BoxBufferGeometry( 20, 20, 20 );
    
    // for ( let i = 0; i < 10; i ++ ) 
    // {
    //     let object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
        
    //     object.name = 'Cube' + i;
    //     object.position.set(Math.random() * 200 - 100, Math.random() * 200 - 100, -200);
        
    //     scene.add( object );
    // }

    let rate = 0;
    waifuSpawn(rate, false);
    
    // ENDLINE*************---------------------------

    //Update Timer

    updateTimer();
    
    raycaster = new THREE.Raycaster();
        
    // document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('mousedown', onDocumentMouseDown);
    
    window.addEventListener( 'resize', onWindowResize);

    
}

function updateTimer(){
    setTimeout(
        function() {
            if(globalTime > 0){
                globalTime += -1;
                document.getElementById("TimerBox").innerHTML = "<p>Time Left: " + globalTime + "</p>";
                updateTimer();
            }
    }, 1000);
}

function waifuSpawn(rate, maxRate){
    let objModelUrl = {obj:'../models/waifu.obj', map:'../models/pink.jpg'};
    let interval = Math.floor(Math.random() * (3500 - 3000) + 3000);
    setTimeout(
        function() {
            if(waifuList.length < 1 && globalTime > 0){
                loadObj(objModelUrl, "Waifu1");
                if(!maxRate){
                    rate += -15;
                }
                if(interval+rate < 400){
                    maxRate = true;
                }
            }
            waifuSpawn(rate, maxRate);
    }, interval+rate);
}

function promisifyLoader ( loader, onProgress ) 
{
    function promiseLoader ( url ) {
  
      return new Promise( ( resolve, reject ) => {
  
        loader.load( url, resolve, onProgress, reject );
  
      } );
    }
  
    return {
      originalLoader: loader,
      load: promiseLoader,
    };
}

const onError = ( ( err ) => { console.error( err ); } );

async function loadObj(objModelUrl, objectName)
{
    const objPromiseLoader = promisifyLoader(new THREE.OBJLoader());

    try {
        const object = await objPromiseLoader.load(objModelUrl.obj);
        
        let texture = objModelUrl.hasOwnProperty('map') ? new THREE.TextureLoader().load(objModelUrl.map) : null;

        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.map = texture;
            }
        });

        object.scale.set(3, 3, 3);
        object.position.z = -8;
        object.position.x = Math.random() * (2.5 - (-2.5)) - 2.5;
        object.position.y = Math.random() * (2.5 - (-1.5)) - 1.5;
        object.name = objectName;
        waifuList.push(object);
        scene.add(object);
    }
    catch (err) {
        return onError(err);
    }
}

function onWindowResize() 
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

// function onDocumentMouseMove( event ) 
// {

// }

function onDocumentMouseDown(event)
{
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    let intersects = raycaster.intersectObjects( scene.children, true );

    if ( intersects.length > 0 ) 
    {
        CLICKED = intersects[ intersects.length - 1 ].object;
        if(CLICKED.material.emissive.getHex() != 65280 && globalTime > 0){
            CLICKED.material.emissive.setHex( 0x00ff00 );
            globalScore += 1;
            updateScore();
        }
    } 
}
//
function run() 
{
    requestAnimationFrame( run );
    render();
    if(globalTime>0){
        waifuMove();
    }   
}

function waifuMove(){
    for(let i=0; i<waifuList.length; i++){
        let myWaifu = waifuList[i];
        if (waifuList[i].position.z < -3) {
            waifuList[i].position.z += 0.03;
        }
        else if (waifuList[i].position.z < -2.97){
            debugCounter = 0;
            waifuList[i].traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    console.log(child.material.emissive.getHex());
                    if(child.material.emissive.getHex() != 65280 && scoreControl[i] == 0){
                        child.material.emissive.setHex( 0xff0000 );
                        globalScore += -1;
                        updateScore();
                        scoreControl[i] = 1;
                    }
                }
            });
            waifuList[i].position.z += 0.0285;
        }
        else if (waifuList[i].position.z < 0){
            waifuList[i].position.z += 0.0285;
        }
        else{
            scoreControl[i] = 0;
            scene.remove(waifuList[i]);
            waifuList.splice(i,1);
        }
    }
}

function updateScore(){
    document.getElementById("ScoreBox").innerHTML = "<p>Score: " + globalScore + "</p>";
}

function render() 
{
    renderer.render( scene, camera );
}

//65280