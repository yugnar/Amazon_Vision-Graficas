/*----------------------------------------------------------
 * Actividad 4: Zerg-Rush Game
 * Fecha: 31/03/2020
 * Autor: A01339605 Rafael Rojas Obregón
 *----------------------------------------------------------*/

let container;
let camera, scene, raycaster, renderer;
let globalScore = 0;
let globalTime = 0;
let gameStarted = false;
let waifuList = [];

let mouse = new THREE.Vector2(), INTERSECTED, CLICKED;
let radius = 100, theta = 0;

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

    //Sets difficulty (speed) of the waifu generation and calls for waifuSpawn()
    let rate = 0;
    waifuSpawn(rate, false);

    //Update Timer

    updateTimer();
    
    raycaster = new THREE.Raycaster();
    
    //Add event listeners
    document.addEventListener('mousedown', onDocumentMouseDown);    
    window.addEventListener( 'resize', onWindowResize);

}

//Updates the timer in the GUI
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

//Spawns a waifu OBJ in a random (x,y) coordinate at random time intervals starting at 1-1.5s per waifu -> getting faster as time progresses until maxRate is reached (maxDifficulty)
function waifuSpawn(rate, maxRate){
    let objModelUrl = {obj:'../models/waifu.obj', map:'../models/pink.jpg'};
    let interval = Math.floor(Math.random() * (1500 - 1000) + 1000);
    setTimeout(
        function() {
            if(waifuList.length < 12 && globalTime > 0){
                loadObj(objModelUrl, "Waifu1");
                if(!maxRate){
                    rate += -15;
                }
                if(interval+rate < 300){
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
        object.covid19 = true;
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
            //Score a point and marks waifu as green
            CLICKED.material.emissive.setHex( 0x00ff00 );
            CLICKED.parent.covid19 = false;
            globalScore += 1;
            updateScore();
        }
    } 
}
//
function run() 
{
    if(!gameStarted){
        gameStarted = !gameStarted;
        globalTime = 60;
        updateTimer();
    }
    requestAnimationFrame( run );
    render();
    if(globalTime>0){
        waifuMove();
    }   
}

//moves a waifu, checks for penalty on certain (position.z) reached, removes waifus from scene.
function waifuMove(){
    for(let i=0; i<waifuList.length; i++){
        let myWaifu = waifuList[i];
        if (waifuList[i].position.z < -2.5) {
            waifuList[i].position.z += 0.03;
        }
        else if (waifuList[i].position.z < -2.47){
            waifuList[i].traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    if(waifuList[i].covid19){
                        waifuList[i].covid19 = false;
                        globalScore += -1;
                        updateScore();
                    }
                }
            });
            waifuList[i].position.z += 0.03;
        }
        else if (waifuList[i].position.z < 0){
            waifuList[i].position.z += 0.03;
        }
        else{
            scene.remove(waifuList[i]);
            waifuList.splice(i,1);
        }
    }
}

//Updates score on HTML
function updateScore(){
    document.getElementById("ScoreBox").innerHTML = "<p>Score: " + globalScore + "</p>";
}

function render() 
{
    renderer.render( scene, camera );
}