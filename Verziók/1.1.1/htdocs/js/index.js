import * as THREE from 'https://cdn.skypack.dev/-/three@v0.135.0-pjGUcRG9Xt70OdXl97VF/dist=es2020,mode=imports,min/optimized/three.js';
import { OrbitControls } from './OrbitControls.js';
import { SVGLoader } from 'https://cdn.skypack.dev/pin/three@v0.135.0-pjGUcRG9Xt70OdXl97VF/mode=imports,min/unoptimized/examples/jsm/loaders/SVGLoader.js';
import { FontLoader } from 'https://cdn.skypack.dev/pin/three@v0.135.0-pjGUcRG9Xt70OdXl97VF/mode=imports,min/unoptimized/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.skypack.dev/pin/three@v0.135.0-pjGUcRG9Xt70OdXl97VF/mode=imports,min/unoptimized/examples/jsm/geometries/TextGeometry.js';

var FloorURLs = ['./svg/001-foldszint.svg', './svg/002-emelet1.svg', './svg/003-emelet2.svg', './svg/004-I-epulet-padlaster.svg'];
var _Animators = [];

var mapDivWidth, mapDivHeight;
var _scene, _camera, _renderer, _controls, cube, _svg_loader, _guiData, lastZoomVal = 0;
var _Rooms = [], _Nodes = [];
var _Path = [], _Lines = [], _Icons = [];

async function init(){
	updateWindowSize();
	
    _scene = new THREE.Scene();
    _camera = new THREE.PerspectiveCamera( 75, window.outerWidth / window.outerHeight, 1, 1000 );

    
    _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setPixelRatio( window.devicePixelRatio );
    _renderer.setSize( window.outerWidth, window.outerHeight );
    document.getElementById("mapDiv").appendChild( _renderer.domElement );

    _camera.position.z = 200;
    _camera.lookAt(0, 0, 0);

    _controls = new OrbitControls(_camera, _renderer.domElement);

    _controls.enableRotate = false;
    _controls.minDistance = 25;
    _controls.maxDistance = 500;
    _controls.zoomSpeed = 2;
    _controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    _controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };

    _guiData = {
        currentURL: './svg/001-foldszint.svg',
        currentFloor: {'number':1, 'path': './svg/001-foldszint.svg'},
        drawFillShapes: true,
        drawStrokes: true,
        fillShapesWireframe: false,
        strokesWireframe: false
    };

    loadSVG( _guiData.currentURL );
    loadIcons();

    document.getElementById('zoomBtnGroup').addEventListener('click', (e)=>{
        let element = (e.target.tagName == 'svg' ? e.target.parentElement : (e.target.tagName == 'path' ? e.target.parentElement.parentElement : e.target))
        zoomModel(element.value=="+", _controls.getZoomScale() * 0.95);
    });


    window.requestAnimationFrame(animate);

    await createFloorBtns();
    initCollapseBtns();

    await getNodeList();
    await getRoomList();

    document.getElementById('selected-option-from').addEventListener('click', toggleDropdown);
    document.getElementById('fromPlace').addEventListener('input', updateDropdown);
    document.getElementById('selected-option-to').addEventListener('click', toggleDropdown);
    document.getElementById('toPlace').addEventListener('input', updateDropdown);
    document.getElementById('swFromTo').addEventListener('click', swFromTo);
    document.getElementById('planRoute').addEventListener('click', planRoute);

    showRoute();
}

function toggleDropdown(e){
    let dropdown_container = e.target.parentElement.getElementsByClassName('dropdown-container')[0];
    for(let element of document.getElementsByClassName('dropdown-container')){
        if(element != dropdown_container && element.classList.contains('dropdown-visible')){
            element.classList.remove('dropdown-visible');
        }
    }
    let searchBox = dropdown_container.querySelector('.form-control');
    if(!dropdown_container.classList.contains('dropdown-visible')){
        initRoomDropdown(dropdown_container, "");
        searchBox.value = "";
    }
    dropdown_container.classList.toggle('dropdown-visible');
    searchBox.focus();
}
async function getNodeList(){
    let nodeData = await getData("./php/API.php",
    {
        method: 'POST',
        body: JSON.stringify({'function':"getNodes"})
    });
    for(let node of nodeData){
        _Nodes.push(new NODE(node.ID, node.POS_X, node.POS_Y, node.FLOOR, (node.IS_STAIR == 1 ? true : false), node.NEIGHBOURS));
    }
    for(let node of _Nodes){
        node.neighbourNodeList = _Nodes.filter(element => node.NeighbourIDList.includes(element.ID));
    }
}
async function getRoomList(){
    _Rooms = await getData("./php/API.php",
    {
        method: 'POST',
        body: JSON.stringify({'function':"getRooms"})
    });
    _Rooms.sort((a,b)=>{
        if(a.NAME > b.NAME) return 1;
        else if(b.NAME > a.NAME) return -1;
        return 0;
    })
    for(let room of _Rooms){
        let aliases = [];
        for(let alias of room.ALIASES){
            aliases.push(alias.ALIAS);
        }
        room.ALIASES = aliases;
    }
}
function updateDropdown(e){
    let dropdown_container = e.target.parentElement;
    initRoomDropdown(dropdown_container, e.target.value);
}
function initRoomDropdown(dropdown_container, keyword){
    let dropdown = dropdown_container.querySelector('.option-container');
    
    dropdown.innerHTML = "";
    for(let room of _Rooms){
        let matchingAliases = aliaslistMatch(room.ALIASES, keyword)
        if(keyword.trim().length < 1 || room.NAME.toLowerCase().includes(keyword.toLowerCase()) || matchingAliases.length > 0){
            let option = document.createElement('li');
            option.classList = "list-group-item";
            option.innerHTML = room.NAME;
            option.value = room.ID;
            if(room.ALIASES.length > 0){
                let aliasContainer = document.createElement('p');
                aliasContainer.classList = "m-0 p-0 text-muted";
                aliasContainer.innerHTML = `(${room.ALIASES.join(', ')})`;
                option.appendChild(aliasContainer);
            }

            option.addEventListener('click', dropdownItemClicked);
            dropdown.appendChild(option);
        }
    }
}
function dropdownItemClicked(e){
    let clickedOption = (e.target.tagName == 'LI'? e.target : e.target.parentElement);

    let selected_option_container = clickedOption.parentElement.parentElement.parentElement.querySelector('.selected-option-container');
    let selected_ROOM = _Rooms.find(room=>room.ID == clickedOption.value);

    selected_option_container.innerHTML = selected_ROOM.NAME;
    selected_option_container.value = selected_ROOM.ID;
    toggleDropdown({'target' : clickedOption.parentElement.parentElement});
}
function aliaslistMatch(aliases, keyword){
    let matches = [];
    for(let alias of aliases){
        if(alias.toLowerCase().includes(keyword.toLowerCase())){
            matches.push(alias);
        }
    }
    return matches;
}

function initCollapseBtns(){
    for(let collapseBtn of document.getElementsByClassName('collapseBtnS')){
        collapseBtn.addEventListener('click', toggleCollapse);
    }
}
function toggleCollapse(){
    let menu = document.getElementById('menuDiv');
    if(menu.classList.contains('collapsed')){
        menu.classList.remove('collapsed');
    }
    else{
        menu.classList.add('collapsed');
    }
}

function loadSVG( url ){
    _scene = new THREE.Scene();
    _scene.background = new THREE.Color( 0xb0b0b0 );

    _svg_loader = new SVGLoader();

    _svg_loader.load( url, function ( data ) {

        const paths = data.paths;

        const group = new THREE.Group();
        group.scale.multiplyScalar( 0.5 );
        group.scale.y *= - 1;

        for ( let i = 0; i < paths.length; i ++ ) {

            const path = paths[ i ];

            const fillColor = path.userData.style.fill;
            if ( _guiData.drawFillShapes && fillColor !== undefined && fillColor !== 'none' ) {

                const material = new THREE.MeshBasicMaterial( {
                    color: new THREE.Color().setStyle( fillColor ),
                    opacity: path.userData.style.fillOpacity,
                    transparent: path.userData.style.fillOpacity < 1,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    wireframe: _guiData.fillShapesWireframe
                } );

                const shapes = SVGLoader.createShapes( path );

                for ( let j = 0; j < shapes.length; j ++ ) {

                    const shape = shapes[ j ];

                    const geometry = new THREE.ShapeGeometry( shape );
                    const mesh = new THREE.Mesh( geometry, material );
        
                    //Ha van id akkor csinál feliratot
                    if(path.userData.node.id!=""){
                        createLabel(path, mesh, group);
                    }

                    group.add( mesh );

                }

            }

            const strokeColor = path.userData.style.stroke;

            if ( _guiData.drawStrokes && strokeColor !== undefined && strokeColor !== 'none' ) {

                const material = new THREE.MeshBasicMaterial( {
                    color: new THREE.Color().setStyle( strokeColor ),
                    opacity: path.userData.style.strokeOpacity,
                    transparent: path.userData.style.strokeOpacity < 1,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    wireframe: _guiData.strokesWireframe
                } );

                for ( let j = 0, jl = path.subPaths.length; j < jl; j ++ ) {

                    const subPath = path.subPaths[ j ];

                    const geometry = SVGLoader.pointsToStroke( subPath.getPoints(), path.userData.style );

                    if ( geometry ) {

                        const mesh = new THREE.Mesh( geometry, material );

                        group.add( mesh );

                    }

                }

            }
        }

        new THREE.Box3().setFromObject( group ).getCenter( group.position ).multiplyScalar( - 1 );
        _scene.add( group );

        setTimeout(() => {
            document.getElementById('loadingSc').classList.add("hideLoading");
            setTimeout(() => {
                document.getElementById('loadingSc').style.display = "none";
            }, 250);
        }, 250); 
        _scene.add( group );

    } );
}

function createLabel(path, mesh, group){
    const floader = new FontLoader();
    floader.load('./fonts/Open Sans_Regular.json', function (font) {
        let teremNeve = path.userData.node.id.split('_x3B_')[0].replaceAll('_x2C_', ',').replaceAll('_x28_', '(').replaceAll('_x29_', ')').replace(/_[0-9]*_/,'').replaceAll('_', ' ');

        const geometry = new TextGeometry(teremNeve, {
            font: font,
            size: 5,
            height: 1,
            curveSegments: 10,
            bevelEnabled: false,
            bevelOffset: 0,
            bevelSegments: 1,
            bevelSize: 0.3,
            bevelThickness: 1
        });
        const materials = [
            new THREE.MeshPhongMaterial({ color: 0xff6600 }), // front
            new THREE.MeshPhongMaterial({ color: 0x0000ff }) // side
        ];
        var textMesh1 = new THREE.Mesh(geometry, materials);
        textMesh1.castShadow = false
        
        
        var containerGeometry = mesh.geometry;
        containerGeometry.computeBoundingBox();
        var contCenter = new THREE.Vector3();
        containerGeometry.boundingBox.getCenter( contCenter );

        var txtGeometry = textMesh1.geometry;
        txtGeometry.computeBoundingBox();
        var lower = txtGeometry.boundingBox.min;
        var upper = txtGeometry.boundingBox.max;

        textMesh1.position.x = contCenter.x;
        textMesh1.position.x -= (upper.x-lower.x)/2;
        textMesh1.position.y = contCenter.y;
        textMesh1.position.y += (upper.y-lower.y)/3;
        textMesh1.scale.y *= - 1;
        textMesh1.scale.z = 0.1;

        let containerSize = new THREE.Vector3();
        containerGeometry.boundingBox.getSize( containerSize );
        let txtSize = new THREE.Vector3();
        txtGeometry.boundingBox.getSize( txtSize );
        if(containerSize.x < txtSize.x){
            textMesh1.position.x = contCenter.x;
            textMesh1.position.y = contCenter.y;
            if(containerSize.x < containerSize.y){
                textMesh1.rotation.z = Math.PI/2;

                if(containerSize.y < txtSize.x){
                    let resizeScale = Math.floor((containerSize.y / txtSize.x)*10)/10.25;
                    textMesh1.scale.x *= resizeScale;
                    textMesh1.scale.y *= resizeScale;
                    
                    textMesh1.position.x -= (upper.y-lower.y)*resizeScale/3;
                    textMesh1.position.y -= (upper.x-lower.x)*resizeScale/2;
                }
                else{
                    textMesh1.position.x -= (upper.y-lower.y)/3;
                    textMesh1.position.y -= (upper.x-lower.x)/2;
                }
            }
            else{
                let resizeScale = Math.floor((containerSize.x / txtSize.x)*10)/10.25;
                textMesh1.scale.x *= resizeScale;
                textMesh1.scale.y *= resizeScale;

                textMesh1.position.x -= (upper.x-lower.x)*resizeScale/2;
                textMesh1.position.y += (upper.y-lower.y)*resizeScale/3;
            }
        }
        group.add(textMesh1);
    });
}
function showRoute(){
    if(!_Path || _Path.length < 2) return;

    removeIcons();
    drawLine([..._Path]);
    if(_Path[0].Floor == _guiData.currentFloor.number){
        drawIcon("start_icon", new THREE.Vector3(_Path[0].PosX, _Path[0].PosY, -1));
    }
    let lastNode = _Path[_Path.length - 1];
    if(lastNode.Floor == _guiData.currentFloor.number){
        drawIcon("dest_icon3", new THREE.Vector3(lastNode.PosX, lastNode.PosY, -1));
    }
}
function drawIcon(name, pos = new THREE.Vector3(0,0,0.1)){
    let icon = _Icons.find(element=>element.name == name);
    if(icon == undefined) return;
    
    _scene.add(icon.group);
    icon.visible = true;
    icon.position = pos;
}
function removeIcons(){
    for(let icon of _Icons){
        if(_scene.children.includes(icon.group)){
            icon.visible = false;
            _scene.remove(icon.group);
        }
    }
}
function loadIcons(){
    let icons = ["start_icon", "dest_icon3"];
    for(let name of icons){
        _Icons.push(new ICON(name));
    }
}
function drawLine(pointsInput){
    if(pointsInput.length < 2) return;

    for(let line of _Lines){
        _scene.remove(line);
    }
    for(let animator of _Animators){
        animator.stop();
    }

    let split = [];
    while(pointsInput.length > 0){
        let s = pointsInput.findIndex(element=>element.Floor != pointsInput[0].Floor);
        s = s < 0 ? pointsInput.length : s;
        split.push(pointsInput.splice(0, s))
    }

    _Lines=[];
    _Animators=[];
    for(let pointArr of split){
        if(pointArr[0].Floor == _guiData.currentFloor.number){
            dipsLine(pointArr, 3);
        }
    }
}
function dipsLine(points, lineWidth = 2){
    for(let i=1;i<points.length;i++){
        var v1 = new THREE.Vector2(points[i].PosX - points[i-1].PosX, points[i].PosY - points[i-1].PosY);
        var lineLength = Math.sqrt(Math.pow(v1.x,2) + Math.pow(v1.y,2));

        var texture = new THREE.TextureLoader().load('img/run.png');
        var animator = new TextureAnimator( texture, 10, 75 );
        var lineMaterial = new THREE.MeshBasicMaterial( { map: texture, side:THREE.DoubleSide, transparent:true } );
        texture.repeat.y = 1;
        texture.repeat.x = 0.05 * lineLength;

        var lineGeometry = new THREE.PlaneGeometry(lineLength, lineWidth, 1, 1);
        var line = new THREE.Mesh(lineGeometry, lineMaterial);

        var posX = (points[i-1].PosX + points[i].PosX) / 2;
        var posY = (points[i-1].PosY + points[i].PosY) / 2;
        line.position.set(posX, posY);

        var v2 = new THREE.Vector2(1,0);
        var rad = Math.atan2(v1.x*v2.y - v1.y*v2.x, v1.x*v2.x + v1.y*v2.y);
        if(Math.abs(rad) > Math.PI/4 && Math.abs(rad) < 3*Math.PI/4 ) { rad += Math.PI; }
        line.rotation.set(0,0,rad);

        _Lines.push(line);
        _scene.add(line);
        _Animators.push(animator);
    }
}

function zoomModel(isZoomOut, scale) {
    if(isZoomOut){
        _controls.dollyIn(scale);
    }else{
        _controls.dollyOut(scale);
    }
}

function animate() {
    _controls.update();
    _renderer.render( _scene, _camera );
    window.requestAnimationFrame(animate);
}
/* TextureAnimator function By: Stemkoski FROM: https://stackoverflow.com/questions/16029103/three-js-using-2d-texture-sprite-for-animation-planegeometry */
function TextureAnimator(texture, numberOfTiles, tileDispDuration) 
{
    let animator = {};

    animator.texture = texture;
    animator.frameDuration = tileDispDuration;
    animator.numberOfTiles = numberOfTiles;
    animator.texture.wrapS = THREE.RepeatWrapping;   
    animator.texture.wrapT = THREE.RepeatWrapping;   
    animator.texture.repeat.set( 1/numberOfTiles, 1 );
    animator.currentTile = 0;

    animator.nextFrame = function(){
        animator.currentTile++;
        if (animator.currentTile == animator.numberOfTiles){
            animator.currentTile = 0;
        }

        let curCol = animator.currentTile % animator.numberOfTiles;
        animator.texture.offset.x = curCol / animator.numberOfTiles;
    }
    animator.start = function(){
        animator.intervalID = setInterval(animator.nextFrame, animator.frameDuration);
    }
    animator.stop = function(){
        clearInterval(animator.intervalID);
    }

    animator.start();
    return animator;
}

function onWindowResize() {
	updateWindowSize();
	
    _camera.aspect = window.outerWidth / window.outerHeight;
    _camera.updateProjectionMatrix();

    _renderer.setSize( window.outerWidth, window.outerHeight );
}
function updateWindowSize(){
	mapDivWidth = window.innerWidth;
	mapDivHeight = window.innerHeight;
}

async function createFloorBtns(){
    FloorURLs = await getData("./php/API.php",
    {
        method: 'POST',
        body: JSON.stringify({'function':"getFloors"})
    });


    let btnDiv = document.getElementById('floorBtnGroup');

    for(let url in FloorURLs){
        let input = document.createElement('button');
        input.value = url;
        input.innerHTML = FloorURLs[url].number;
        input.classList = "btn text-dark btn-floor";
        if(FloorURLs[url].number == 1) { input.classList.add("active"); }
        input.addEventListener('click', changeFloor);


        btnDiv.appendChild(input);
    }
}
function changeFloor(e){
    if(FloorURLs[e.target.value].path == _guiData.currentURL) return;
    document.getElementById('loadingSc').style.display = "block";
    document.getElementById('loadingSc').classList.remove("hideLoading");

    _controls.reset();
    if(FloorURLs[e.target.value].path == _guiData.currentURL) return;

    removeIcons();

    _guiData.currentFloor = FloorURLs[e.target.value]
    _guiData.currentURL = _guiData.currentFloor.path;
    loadSVG(_guiData.currentURL);

    for(let btn of document.querySelectorAll(".btn-floor")){
        btn.classList.remove('active');
        if(btn.value == e.target.value) {
            btn.classList.add('active');
        }
    }
    
    _renderer.render( _scene, _camera );
    showRoute();
    _renderer.render( _scene, _camera );

}
function swFromTo(){
    let from = document.getElementById('selected-option-from');
    let to = document.getElementById('selected-option-to');
    if(from.value == undefined && to.value == undefined) return;

    let sId = from.value;
    let sName = from.innerHTML;

    from.value = to.value;
    from.innerHTML=to.innerHTML;
    to.value =sId;
    to.innerHTML=sName;

    if(from.value == undefined) from.innerHTML = "Válassza ki honnan indul";
    if(to.value == undefined) to.innerHTML = "Válassza ki hova szeretne eljutni";

}
function planRoute(e){
    e.preventDefault();
    let from = document.getElementById('selected-option-from').value;
    let to = document.getElementById('selected-option-to').value;
    if(from == undefined || from < 0 || to == undefined || to < 0) return;

    let fromPlace = _Rooms.find(element=>element.ID == from);
    let toPlace = _Rooms.find(element=>element.ID == to);
    let fromNode = _Nodes.find(element=>element.ID == fromPlace.NODE_ID);
    let toNode = _Nodes.find(element=>element.ID == toPlace.NODE_ID);

    _Path = bfs(fromNode, toNode);

    if(_guiData.currentFloor.number == _Path[0].Floor){
        showRoute();
    }
    else{
        changeFloor({
            'target':{
                'value':FloorURLs.findIndex(element=>element.number == _Path[0].Floor)
            }
        });
    }
    toggleCollapse();
}
async function getData(url, init = undefined){
    let res
    if(init){
        res = await fetch(url, init);
    }
    else{
        res = await fetch(url);
    }
    let data = await res.json();
    return data;
}

window.addEventListener('resize', onWindowResize);
window.addEventListener('load', init);




function bfs(startNode, endNode){
    var avoid = [250,251,252,253,254,255,256,257,258,259,260,261,262,263,264,265];
    if(avoid.includes(parseInt(startNode.ID)) || avoid.includes(parseInt(endNode.ID))){
        avoid = [];
    }

    for(let node of _Nodes){
        node.isVisited = false;
        node.prevNode = null;
    }
    let queue = [startNode];
    startNode.isVisited = true;

    while (!queue.length == 0) {
        let node = queue.splice(0, 1)[0];

        for(let next of node.neighbourNodeList.filter(e=>!avoid.includes(parseInt(e.ID)))){
            if(!next.isVisited){
                queue.push(next);
                next.isVisited = true;
                next.prevNode = node;
            }
        }
    }

    let path = [];
    for(let at = endNode; at != null; at = at.prevNode){
        path.push(at);
    }
    path.reverse();

    if(path[0] == startNode){
        return path;
    }
    return [];
}



class NODE{
    constructor(nodeId, posX, posY, floorId, isStair = false, neighbourList = []){
        this.ID = nodeId;
        this.PosX = parseFloat(posX);
        this.PosY = parseFloat(posY);
        this.Floor = floorId;
        this.IsStair = isStair;
        this.NeighbourIDList = []
        for(let neighbourID of neighbourList){
            this.NeighbourIDList.push(neighbourID.ID);
        }
        this.neighbourNodeList = [];
    }
}
class ICON{
    constructor(name, posX = 0, posY = 0){
        this.offsetX = 4.73;
        this.offsetY = 11.75;
        this.group = new THREE.Group();

        this.loadSVGFile(name, posX, posY);
    }

    loadSVGFile(name, posX, posY){
        _svg_loader = new SVGLoader();
        this.group = new THREE.Group();
        this.group.scale.multiplyScalar( 0.055 );
        this.group.scale.y *= - 1;
        this.group.visible = false;
        this.group.renderOrder = 99
        this.group.name = name;
        _svg_loader.loadAsync(`./svg/icons/${name}.svg`).then((data)=>{
            this.loaderFunction(data);
            this.position = new THREE.Vector3(posX, posY, 0.25);
        });
    }
    loaderFunction(data) {
        const paths = data.paths;

        for ( let i = 0; i < paths.length; i ++ ) {
            const path = paths[ i ];

            const fillColor = path.userData.style.fill;
            const shapeMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setStyle( fillColor ),
                opacity: path.userData.style.fillOpacity,
                transparent: path.userData.style.fillOpacity < 1,
                side: THREE.DoubleSide,
                depthWrite: false,
                wireframe: _guiData.fillShapesWireframe
            });

            const shapes = SVGLoader.createShapes( path );
            for ( let j = 0; j < shapes.length; j ++ ) {
                const shape = shapes[ j ];

                const geometry = new THREE.ShapeGeometry( shape );
                const mesh = new THREE.Mesh( geometry, shapeMaterial );
    
                this.group.add( mesh );
            }

            
            const strokeColor = path.userData.style.stroke;
            const strokeMaterial = new THREE.MeshBasicMaterial( {
                color: new THREE.Color().setStyle( strokeColor ),
                opacity: path.userData.style.strokeOpacity,
                transparent: path.userData.style.strokeOpacity < 1,
                side: THREE.DoubleSide,
                depthWrite: false,
                wireframe: _guiData.strokesWireframe
            } );

            for ( let j = 0, jl = path.subPaths.length; j < jl; j ++ ) {
                const subPath = path.subPaths[ j ];
                const geometry = SVGLoader.pointsToStroke( subPath.getPoints(), path.userData.style );

                if ( geometry ) {
                    const mesh = new THREE.Mesh( geometry, strokeMaterial );

                    this.group.add( mesh );
                }
            }
        }
    }

    get name(){
        return this.group.name;
    }
    get position(){
        return this.group.position;
    }
    set position(pos){
        this.group.position.set(pos.x - this.offsetX, pos.y + this.offsetY, 0.1);
    }
    get visible(){
        return this.group.visible;
    }
    set visible(value){
        this.group.visible = value;
    }
}