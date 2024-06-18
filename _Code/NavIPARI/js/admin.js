//import * as THREE from 'https://cdn.skypack.dev/pin/three@v0.135.0-pjGUcRG9Xt70OdXl97VF/mode=imports,min/optimized/three.js';
import * as THREE from 'https://cdn.skypack.dev/-/three@v0.135.0-pjGUcRG9Xt70OdXl97VF/dist=es2020,mode=imports,min/optimized/three.js';
//import { OrbitControls } from 'https://cdn.skypack.dev/pin/three@v0.135.0-pjGUcRG9Xt70OdXl97VF/mode=imports,min/unoptimized/examples/jsm/controls/OrbitControls.js';
import { OrbitControls } from './OrbitControls.js';
import { SVGLoader } from 'https://cdn.skypack.dev/pin/three@v0.135.0-pjGUcRG9Xt70OdXl97VF/mode=imports,min/unoptimized/examples/jsm/loaders/SVGLoader.js';
import { FontLoader } from 'https://cdn.skypack.dev/pin/three@v0.135.0-pjGUcRG9Xt70OdXl97VF/mode=imports,min/unoptimized/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'https://cdn.skypack.dev/pin/three@v0.135.0-pjGUcRG9Xt70OdXl97VF/mode=imports,min/unoptimized/examples/jsm/geometries/TextGeometry.js';

var FloorURLs = ['./svg/001-foldszint.svg', './svg/002-emelet1.svg', './svg/003-emelet2.svg', './svg/004-I-epulet-padlaster.svg'];

var mapDivWidth, mapDivHeight;
var _scene, _camera, _renderer, _controls, cube, _svg_loader, _guiData, _Nodes = [], _Classrooms = [], isNewNodeMode = false, lastZoomVal = 0;
var EditedNode = null, isEditMode = false, EditedNodeLastPos = null, EditedNeighbours = [];
var EditedClassroom = null, isCEditMode = false, EditedAliases = [];
var _EdgeList = [];

async function init(){
	updateWindowSize();
	
    _scene = new THREE.Scene();
    _camera = new THREE.PerspectiveCamera( 75, window.outerWidth / window.outerHeight, 1, 1000 );

    _renderer = new THREE.WebGLRenderer();
    _renderer.setSize( window.outerWidth, window.outerHeight );
    document.getElementById("mapDiv").appendChild( _renderer.domElement );

    _camera.position.z = 200;
    _camera.lookAt(0, 0, 0);

    _controls = new OrbitControls(_camera, _renderer.domElement);
    _controls.addEventListener('change', moveNode);

    _controls.enableRotate = false;
    _controls.minDistance = 25;
    _controls.maxDistance = 200;
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

    document.getElementById('zoomBtnGroup').addEventListener('click', (e)=>{
        zoomModel(e.target.value=="+", _controls.getZoomScale() * 0.95);
    });


    window.requestAnimationFrame(animate);

    await createFloorBtns();
    initCollapseBtns();
    await initNodeList();
    await initClassroomList();
    initPanels();
    //_scene.add(createNodeCircle(0,0,"NULLA",0x00aaff));
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

async function initNodeList(){
    for(let node of _Nodes){
        _scene.remove(node.uiElement);
    }
    _Nodes = [];


    let row = document.getElementById('NodeListContainer');
    row.innerHTML = "";
    var nodedata = await getData("./php/API.php",
    {
        method: 'POST',
        //body: JSON.stringify({'function':"getNodes", 'floor':_guiData.currentFloor.number})
        body: JSON.stringify({'function':"getNodes"})
    });

    /* for(let node of nodedata){
        if(_guiData.currentFloor.number == node.FLOOR){
            let circle = createNodeCircle(node.POS_X, node.POS_Y, node.ID, 0xffff00);
            _Nodes.push( new NODE(node.ID, circle, node.FLOOR, node.IS_STAIR == 1, node.NEIGHBOURS) );
            row.appendChild(createNodeListEntry(_Nodes[_Nodes.length - 1]));
            _scene.add( circle );
        }   
    } */
    for(let node of nodedata){
        let circle = createNodeCircle(node.POS_X, node.POS_Y, node.ID, 0xffff00);
        _Nodes.push( new NODE(node.ID, circle, node.FLOOR, node.IS_STAIR == 1, node.NEIGHBOURS) );
        if(_guiData.currentFloor.number == node.FLOOR){
            row.appendChild(createNodeListEntry(_Nodes[_Nodes.length - 1]));
            _scene.add( circle );
    
            /* let lGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(circle.position.x,circle.position.y,0),new THREE.Vector3(0,0,10)]);
            let lMaterial = new THREE.LineBasicMaterial({ color:0xff0000 });
        
            let line = new THREE.Line(lGeometry, lMaterial);
            _scene.add(line); */
        }   
    }

    updateEdges();
}
function updateEdges(){
    for(let edge of _EdgeList){
        _scene.remove(edge);
    }
//TODO: Aliasz hozzáadásnál kitörölni a mező tartalmát
    let voteman = [];
    for(let node of _Nodes){
        if(node.floorId == _guiData.currentFloor.number){
            //console.log(node)
            for(let neighbour of node.neighbourList){
                let nodeTo = _Nodes.find(e=>e.id == neighbour);
                if(nodeTo.floorId == _guiData.currentFloor.number && !(voteman[node.id] && voteman[node.id].includes(neighbour)) && !(voteman[neighbour] && voteman[neighbour].includes(node.id))){
                    let vFrom = new THREE.Vector3(node.uiElement.position.x, node.uiElement.position.y, 0.1);
                    let vTo = new THREE.Vector3(nodeTo.uiElement.position.x, nodeTo.uiElement.position.y, 0.1);
                    let lGeometry = new THREE.BufferGeometry().setFromPoints([vFrom, vTo]);
                    let lMaterial = new THREE.LineBasicMaterial({ color:0xff0000 });
                
                    let line = new THREE.Line(lGeometry, lMaterial);
                    _scene.add(line);
                    _EdgeList.push(line);
                    if(!voteman[node.id]) voteman[node.id] = [];
                    voteman[node.id].push(neighbour);
                }
            }
        }
    }
}
async function initClassroomList(){
    var roomdata = await getData("./php/API.php",
    {
        method: 'POST',
        body: JSON.stringify({'function':"getRooms"})
    });

    for(let room of roomdata){
		let classroom = new CLASSROOM(room.ID,room.NAME,room.ALIASES);
		classroom.node_id = room.NODE_ID;
        if(_Nodes.findIndex((element)=>element.id == room.NODE_ID && element.floorId == _guiData.currentFloor.number)>=0){
            document.getElementById(`RC${classroom.node_id}`).appendChild(classroom.uiListElement);
        }
		_Classrooms.push(classroom);
    }

    updateNodeColors();
}
function initNodeNeighboursList(){
    let select = document.getElementById('newNodeNeighbours');
    select.innerHTML = "";

    let option = document.createElement('option');
    option.innerHTML = "";
    option.value = -1;
    select.appendChild(option);

    for(let node of _Nodes){
        if((!EditedNode || node.id != EditedNode.id) && node.floorId == _guiData.currentFloor.number){
            option = document.createElement('option');
            option.innerHTML = node.id;
            option.value = node.id;
    
            select.appendChild(option);
        }
    }
    let ul = document.getElementById('newNodeNeighbourList');
    ul.innerHTML = "";
    for(let id of EditedNeighbours){
        ul.appendChild(createLIelement(id, id, removeLIelement));
    }
}
function initClassroomNodeList(){
    let select = document.getElementById('newClassroomNode');
    select.innerHTML = "";

    for(let node of _Nodes){
        if(node.floorId == _guiData.currentFloor.number){
            let option = document.createElement('option');
            option.innerHTML = node.id;
            option.value = node.id;

            select.appendChild(option);
        }
    }
    if(EditedClassroom!=null){
        let ul = document.getElementById('newClassroomAliasList');
        ul.innerHTML = "";
        for(let alias of EditedAliases){
            ul.appendChild(createLIelement(alias, alias, removeRoomLIelement));
        }
    }
}
function createNodeListEntry(node){
    let col = document.createElement('div');
    col.classList = "col-12 p-3 my-2 bg-warning rounded nodeList-item c-pointer";
    col.id = `N${node.id}`;
    col.addEventListener('click', editNode);
    let p = document.createElement('p');
    p.classList = "p-1 m-0 user-select-none nodeList-item-textcontainer";
    let id = document.createElement('span');
    id.innerHTML = `${node.id}:`;
    id.classList = "float-start fw-bold nodeList-item-text";
    let pos = document.createElement('span');
    pos.innerHTML = `${node.posX} ${node.posY}`;
    pos.classList = "fst-italic nodeList-item-text";

    let roomContainer = document.createElement('div');
    roomContainer.classList = "row text-center";
    roomContainer.id = `RC${node.id}`;

    id.addEventListener('click', editNode)
    pos.addEventListener('click', editNode)
    p.appendChild(id);
    p.appendChild(pos);
    col.appendChild(p);
    col.appendChild(roomContainer);
    return col;
}
function createNodeCircle(posX, posY, name, color){
        var cGeometry = new THREE.CircleGeometry( 2, 16 );
        var cMaterial = new THREE.MeshBasicMaterial( { color: color } );
        var circle = new THREE.Mesh( cGeometry, cMaterial );
        circle.position.x = posX;
        circle.position.y = posY;
        circle.position.z = 0.25;
        circle.name = name;
        createLabel(name, circle, circle, true);

        return circle;
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
        
                    if(path.userData.node.id!=""){
                        let teremNeve = path.userData.node.id.split('_x3B_')[0].replaceAll('_x2C_', ',').replaceAll('_x28_', '(').replaceAll('_x29_', ')').replace(/_[0-9]*_/,'').replaceAll('_', ' ');
                        createLabel(teremNeve, mesh, group);
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

function createLabel(teremNeve, mesh, group, isNode = false){
    const floader = new FontLoader();
    floader.load('./fonts/Open Sans_Regular.json', function (font) {
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
        var txtGeometry = textMesh1.geometry;
        txtGeometry.computeBoundingBox();
        
        let containerSize = new THREE.Vector3();
        containerGeometry.boundingBox.getSize( containerSize );
        let txtSize = new THREE.Vector3();
        txtGeometry.boundingBox.getSize( txtSize );

        if(isNode){
            let resizeScale;
            if(txtSize.x > txtSize.y){
                resizeScale = Math.floor((containerSize.x / txtSize.x) * 1000) / 1150;
            }
            else{
                resizeScale = Math.floor((containerSize.y / txtSize.y) * 1000) / 1250;
            }
            textMesh1.scale.x *= resizeScale;
            textMesh1.scale.y *= resizeScale;

            txtGeometry = textMesh1.geometry;
            txtGeometry.computeBoundingBox();
            txtGeometry.boundingBox.getSize( txtSize );

            let widthOffset = Math.abs(containerSize.x - txtSize.x) / 2;
            let heightOffset = (containerSize.y - txtSize.y) / 2;
            //console.log(widthOffset);
            //console.log(txtSize);
            //console.log(containerSize);
            /* if(txtSize.x > txtSize.y){
                //textMesh1.position.x -= txtSize.x/4; */
                textMesh1.position.x -= (txtSize.x*resizeScale/2);
                textMesh1.position.x -= widthOffset / 8;
            /*}
            else{
                //textMesh1.position.x -= txtSize.x/3;
                textMesh1.position.x -= (txtSize.x*resizeScale/2);
                textMesh1.position.x -= widthOffset / 8;
            }*/
            //textMesh1.position.y -= txtSize.y/4;
            textMesh1.position.y -= txtSize.y*resizeScale/2;
            textMesh1.position.y -= heightOffset / 8;
            
            textMesh1.scale.z = 0.1

            group.add(textMesh1);
            return;
        }
        
        var contCenter = new THREE.Vector3();
        containerGeometry.boundingBox.getCenter( contCenter );

        var lower = txtGeometry.boundingBox.min;
        var upper = txtGeometry.boundingBox.max;

        textMesh1.position.x = contCenter.x;
        textMesh1.position.x -= (upper.x-lower.x)/2;
        textMesh1.position.y = contCenter.y;
        textMesh1.position.y += (upper.y-lower.y)/3;
        textMesh1.scale.y *= -1;
        textMesh1.scale.z = 0.1;

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

function onWindowResize() {
    updateWindowSize();
	
    //_camera.aspect = window.innerWidth / window.innerHeight;
    _camera.aspect = window.outerWidth / window.outerHeight;
    _camera.updateProjectionMatrix();

    //_renderer.setSize( mapDivWidth, mapDivHeight );
    _renderer.setSize( window.outerWidth, window.outerHeight );

    resizePanels();
}
function updateWindowSize(){
	mapDivWidth = window.innerWidth;
	mapDivHeight = window.innerHeight;
}
function resizePanels(){
    updateWindowSize();
    if(mapDivWidth <= 767.98){
        let panel = document.getElementById('newNodePanel');
        panel.classList.remove('w-25');
        panel.classList.add('w-100');

        panel = document.getElementById('newClassroomPanel');
        panel.classList.remove('w-25');
        panel.classList.add('w-100');
    }
    else{
        let panel = document.getElementById('newNodePanel');
        panel.classList.remove('w-100');
        panel.classList.add('w-25');

        panel = document.getElementById('newClassroomPanel');
        panel.classList.remove('w-100');
        panel.classList.add('w-25');
    }
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
async function changeFloor(e){
    if(FloorURLs[e.target.value].path == _guiData.currentURL) return;
    document.getElementById('loadingSc').style.display = "block";
    document.getElementById('loadingSc').classList.remove("hideLoading");

    _controls.reset();
    if(FloorURLs[e.target.value].path == _guiData.currentURL) return;

    _guiData.currentFloor = FloorURLs[e.target.value]
    _guiData.currentURL = _guiData.currentFloor.path;
    loadSVG(_guiData.currentURL);

    for(let btn of document.querySelectorAll(".btn-floor")){
        btn.classList.remove('active');
        if(btn.value == e.target.value) {
            btn.classList.add('active');
        }
    }
    await initNodeList();
    await initClassroomList();
}



function addNewNode(){
    if(EditedNode != null || EditedClassroom != null) return;

    document.getElementById('newNodeNeighbours').innerHTML = "";
    document.getElementById('isStairInput').checked = false;

    initNodeNeighboursList();
    updateWindowSize();
    if(mapDivWidth<=767.98) toggleCollapse();
    document.getElementById('newNodePanel').style.display = "block";
    document.getElementById('newClassroomPanel').style.display = "none";

    var cPos = new THREE.Vector3();
    cPos.copy(_camera.position );
    
    let circle = createNodeCircle(cPos.x, cPos.y, "", 0xff0000);
    EditedNode = new NODE( -1, circle , _guiData.currentFloor.number);
    _scene.add( circle );
}
function moveNode(){
    if(EditedNode == null) return;

    var cPos = new THREE.Vector3();
    cPos.copy(_camera.position );
    EditedNode.uiElement.position.x = cPos.x;
    EditedNode.uiElement.position.y = cPos.y;
}
async function saveNewNode(){
    EditedNode.isStair = document.getElementById('isStairInput').checked;
    if(isEditMode){
        let resp = await getData("./php/API.php",
        {
            method: 'POST',
            body: JSON.stringify(
                {
                    'function':"updateNode",
                    'id':EditedNode.id,
                    'posX':EditedNode.posX,
                    'posY':EditedNode.posY,
                    'isStair':EditedNode.isStair,
                    'neighbours':EditedNeighbours
                }
            )
        });
        if(resp.error){
            console.error(resp.error);
            return;
        }
        isEditMode = false;
    }
    else{
        let resp = await getData("./php/API.php",
        {
            method: 'POST',
            body: JSON.stringify(
                {
                    'function':"addNode",
                    'posX':EditedNode.posX,
                    'posY':EditedNode.posY,
                    'floorId':EditedNode.floorId,
                    'isStair':EditedNode.isStair,
                    'neighbours':EditedNeighbours
                }
            )
        });
        if(resp.error){
            console.error(resp.error);
            return;
        }
        if(!resp.id){
            console.error('Valami nem jó');
            return;
        }

        EditedNode.id = resp.id;
        document.getElementById('NodeListContainer').appendChild(createNodeListEntry(EditedNode));
        _Nodes.push(EditedNode);
    }
    EditedNode.neighbourList = EditedNeighbours.map((x)=>x);
    for(let node of _Nodes){
        if(node.id != EditedNode.id){
            if(EditedNode.neighbourList.includes(node.id) && !node.neighbourList.includes(EditedNode.id)){
                node.neighbourList.push(EditedNode.id);
            }
            if(node.neighbourList.includes(EditedNode.id) && !EditedNode.neighbourList.includes(node.id)){
                node.neighbourList.splice(node.neighbourList.findIndex((element)=>element == EditedNode.id), 1);
            }
        }
    }
    
    EditedNode.uiElement.material.color.setHex(0xffff00);
    document.getElementById('newNodePanel').style.display = "none";
    EditedNode = null;
    EditedNeighbours = [];

    updateEdges();
    updateNodeColors();
}
async function deleteNode(){
    if(isEditMode){
        let resp = await getData("./php/API.php",
        {
            method: 'POST',
            body: JSON.stringify(
                {
                    'function':"delNode",
                    'id':EditedNode.id
                }
            )
        });
        if(resp.error){
            console.error(resp.error);
            return;
        }
        document.getElementById('NodeListContainer').removeChild(document.getElementById(`N${EditedNode.id}`));
        for(let node of _Nodes){
            if(node.neighbourList.includes(EditedNode.id)){
                node.neighbourList.splice(node.neighbourList.findIndex((element)=>element == EditedNode.id), 1);
            }
        }
        _Nodes.splice(_Nodes.findIndex((element)=>element == EditedNode), 1);
        isEditMode = false;
    }
    _scene.remove(EditedNode.uiElement);
    document.getElementById('newNodePanel').style.display = "none";
    EditedNode = null;
    EditedNeighbours = [];

    updateEdges();
}
function editNode(e){
    if(EditedNode != null || EditedClassroom != null) return;

    //console.log(_Nodes);
    let nID;
    if(e.target.classList.contains('nodeList-item')){
        nID = e.target.id.substr(1);
    }
    else if(e.target.classList.contains('nodeList-item-textcontainer')){
        nID = e.target.parentElement.id.substr(1);
    }
    else if(e.target.classList.contains('nodeList-item-text')){
        nID = e.target.parentElement.parentElement.id.substr(1);
    }

    for(let node of _Nodes){
        if(node.id == nID){
            let scale = _controls.getZoom();
            isEditMode = true;
            EditedNodeLastPos = new THREE.Vector3();
            EditedNodeLastPos.copy(node.uiElement.position);
            document.getElementById('newNodeNeighbours').innerHTML = "";
            EditedNeighbours = node.neighbourList.map((x)=>x);
            EditedNode = node;

            node.uiElement.material.color.setHex(0xff0000)

            var posNode = new THREE.Vector3(node.posX, node.posY, 0);
            _controls.target.set(posNode.x, posNode.y, posNode.z);
            _camera.position.set(posNode.x, posNode.y, 200);
        
            initNodeNeighboursList();
            //document.getElementById('newNodeNeighbours').removeChild(document.getElementById('newNodeNeighbours').querySelector(`option[value="${node.id}"]`));
            updateWindowSize();
            if(mapDivWidth<=767.98) toggleCollapse();
            document.getElementById('newNodePanel').style.display = "block";
            document.getElementById('newClassroomPanel').style.display = "none";
            
            document.getElementById('isStairInput').checked = EditedNode.isStair;
            isStairChange();
            _controls.dollyIn(scale);
            return;
        }
    }

}



function addNewClassroom(){
    if(EditedNode != null || EditedClassroom != null) return;

    initClassroomNodeList();
    document.getElementById('newClassroomName').value = "";
    document.getElementById('newClassroomAlias').value = "";
    document.getElementById('newClassroomAliasList').innerHTML = "";
    
    updateWindowSize();
    if(mapDivWidth<=767.98) toggleCollapse();
    document.getElementById('newClassroomPanel').style.display = "block";
    document.getElementById('newNodePanel').style.display = "none";

    EditedClassroom = new CLASSROOM("-1","temproom");
}
async function saveNewClassroom(){
    let cName = document.getElementById('newClassroomName');
    let bindingNode = document.getElementById('newClassroomNode');

    if(cName.value == null || cName.value == "") return;
    if(_Nodes.findIndex((element)=>element.id == bindingNode.value) < 0) return;

    if(isCEditMode){
        let resp = await getData("./php/API.php",
        {
            method: 'POST',
            body: JSON.stringify(
                {
                    'function':"updateRoom",
                    'id':EditedClassroom.id,
                    'name':cName.value,
                    'nodeid':bindingNode.value,
                    'aliaslist':EditedAliases
                }
            )
        });
        if(resp.error){
            console.error(resp.error);
            return;
        }
        if(EditedClassroom.node_id != bindingNode.value){
            //console.log(EditedClassroom.uiListElement.parentElement);
            document.getElementById(`RC${bindingNode.value}`).appendChild(EditedClassroom.uiListElement);
            EditedClassroom.node_id = bindingNode.value;
        }
        if(EditedClassroom.name != cName.value){
            EditedClassroom.name = cName.value;
        }
        isCEditMode = false;
    }
    else{
        let resp = await getData("./php/API.php",
        {
            method: 'POST',
            body: JSON.stringify(
                {
                    'function':"addRoom",
                    'name':cName.value,
                    'nodeid':bindingNode.value,
                    'aliaslist':EditedAliases
                }
            )
        });
        if(resp.error){
            console.error(resp.error);
            return;
        }
        if(!resp.id){
            console.error('Valami nem jó');
            return;
        }
        EditedClassroom = new CLASSROOM(resp.id, cName.value,EditedAliases);
        EditedClassroom.node_id = bindingNode.value;
        document.getElementById(`RC${EditedClassroom.node_id}`).appendChild(EditedClassroom.uiListElement);
        _Classrooms.push(EditedClassroom);
    }
    EditedClassroom.aliasList = EditedAliases;
    
    document.getElementById('newClassroomPanel').style.display = "none";
    EditedClassroom = null;
    EditedAliases = [];

    //console.log(_Classrooms);
    //console.log(EditedClassroom);
    updateNodeColors();
}
async function deleteClassroom(){
    if(isCEditMode){
        let resp = await getData("./php/API.php",
        {
            method: 'POST',
            body: JSON.stringify(
                {
                    'function':"delRoom",
                    'id':EditedClassroom.id
                }
            )
        });
        if(resp.error){
            console.error(resp.error);
            return;
        }
        let elem = document.getElementById(`R${EditedClassroom.id}`);
        elem.parentElement.removeChild(elem);
        //EditedClassroom.uiListElement.parentElement.removeChild(EditedClassroom.uiListElement);
        _Classrooms.splice(_Classrooms.findIndex((element)=> element == EditedClassroom), 1);
        isCEditMode = false;
    }
    document.getElementById('newClassroomPanel').style.display = "none";
    EditedClassroom = null;
    EditedAliases = [];
}
function editClassroom(e){
    if(EditedNode != null || EditedClassroom != null) return;

    let roomID;
    if(e.target.classList.contains('roomList-item-text')){
        roomID = e.target.parentElement.id.substr(1);
    }
    else{
        roomID = e.target.id.substr(1);
    }

    for(let room of _Classrooms){
        if(room.id == roomID){
            isCEditMode = true;
            EditedClassroom = room;
            EditedAliases = room.aliasList;

            document.getElementById('newClassroomName').value = room.name;
            let select = document.getElementById('newClassroomNode');
            select.innerHTML = "";
            initClassroomNodeList();
            document.getElementById('newClassroomAlias').value = "";
            for(let optionID in select.children){
                if(select.children[optionID].value == EditedClassroom.node_id){
                    select.selectedIndex = optionID;
                }
            }

            updateWindowSize();
            if(mapDivWidth<=767.98) toggleCollapse();
            document.getElementById('newClassroomPanel').style.display = "block";
            return;
        }
    }

}
function updateNodeColors(){
    for(let node of _Nodes){
        node.uiElement.material.color.setHex(0xffff00);
    }
    for(let room of _Classrooms){
        _Nodes.find(element=>element.id == room.node_id).uiElement.material.color.setHex(0xf19616);
    }
}

function createLIelement(innerhtml, value, onClickEvent){
    let li = document.createElement('li');
    li.classList = "list-group-item";
    li.innerHTML = innerhtml;
    li.setAttribute('value', value);
    li.addEventListener('click', onClickEvent);

    return li;
}
function removeLIelement(e){
    EditedNeighbours.splice(EditedNeighbours.findIndex((element)=>element == e.target.value), 1);
    document.getElementById('newNodeNeighbourList').removeChild(e.target);
}
function removeRoomLIelement(e){
    EditedAliases.splice(EditedAliases.findIndex((element)=>element == e.target.getAttribute('value')), 1);
    document.getElementById('newClassroomAliasList').removeChild(e.target);
}
function initPanels(){
    document.getElementById('newClassroomAddAlias').addEventListener('click', ()=>{
        let ul = document.getElementById('newClassroomAliasList');
        let txt = document.getElementById('newClassroomAlias');
        if(txt.value == null || txt.value == "") return;
        
        EditedAliases.push(txt.value);
        ul.appendChild(createLIelement(txt.value, txt.value, removeRoomLIelement));
        //console.log(EditedAliases);
    });

    document.getElementById('newNodeAddNeighbour').addEventListener('click', ()=>{
        let select = document.getElementById('newNodeNeighbours');
        if(select.selectedIndex <= 0) return;
        if(EditedNeighbours.includes(select.selectedOptions[0].value)) return;

        let option = select[select.selectedIndex]
        let ul = document.getElementById('newNodeNeighbourList');
        
        EditedNeighbours.push(option.value);
        ul.appendChild(createLIelement(option.innerHTML, option.value, removeLIelement));
    });
    document.getElementById('addNode').addEventListener('click', addNewNode);
    document.getElementById('newNodePanelX').addEventListener('click', ()=>{
        if(isEditMode){
            EditedNode.uiElement.position.copy(EditedNodeLastPos);
            EditedNode.uiElement.material.color.setHex(0xffff00);
            isEditMode = false;
            updateNodeColors();
        }
        else{
            _scene.remove(EditedNode.uiElement);
        }
        document.getElementById('newNodePanel').style.display = "none";
        EditedNode = null;
        EditedNeighbours = [];
    })
    document.getElementById('addClassroom').addEventListener('click', addNewClassroom);
    document.getElementById('newClassroomPanelX').addEventListener('click', ()=>{
        if(isCEditMode){
            //HE? Ez mi?
        }
        isCEditMode = false;
        document.getElementById('newClassroomPanel').style.display = "none";
        EditedClassroom = null;
        EditedAliases = [];
    })
    document.getElementById('addNewClassroom').addEventListener('click', saveNewClassroom);
    document.getElementById('deleteClassroom').addEventListener('click', deleteClassroom);
    document.getElementById('addNewNode').addEventListener('click', saveNewNode);
    document.getElementById('deleteNode').addEventListener('click', deleteNode);

    document.getElementById('isStairInput').addEventListener('change', isStairChange);
    resizePanels();
}
function isStairChange(){
    initNodeNeighboursList();

    if(!document.getElementById('isStairInput').checked) return;
    let optgroup = document.createElement('optgroup');
    optgroup.label = "Lépcsők";
    for(let node of _Nodes){
        if(node.isStair && node.id != EditedNode.id && node.floorId != _guiData.currentFloor.number){
            let option = document.createElement('option');
            option.innerHTML=node.id;
            option.value=node.id;

            optgroup.appendChild(option);
        }
    }
    document.getElementById('newNodeNeighbours').appendChild(optgroup);

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


class NODE{
    constructor(nodeId, nodeUIElement, floorId, isStair = false, neighbourList = []){
        this.uiElement = nodeUIElement;
        this.uiElement.name = nodeId;
        this.neighbourList = [];
        for(let neighbour of neighbourList){
            this.neighbourList.push(neighbour.ID);
        }
        this.floorId = floorId;
        this.isStair = isStair == true;
    }
    get posX(){
        return parseFloat(this.uiElement.position.x);
    }
    get posY(){
        return parseFloat(this.uiElement.position.y);
    }
    set id(newID){
        if(this.uiElement.children.length > 0)
            this.uiElement.remove(this.uiElement.children[0]);
        createLabel(newID, this.uiElement, this.uiElement, true);

        this.uiElement.name = newID;
    }
    get id(){
        return this.uiElement.name;
    }
}
class CLASSROOM{
    constructor(roomId, roomName, aliasList = []){
        this.uiListElement = document.createElement('div');
        this.uiListElement.classList = "col-12 bg-danger mt-1 p-1 rounded";
        this.uiListElement.id = `R${roomId}`;
        this.uiListElement.addEventListener('click', editClassroom);
        let spanID = document.createElement('span');
        spanID.classList = "float-start fw-bold roomList-item-text";
        spanID.innerHTML = roomId;
        let spanName = document.createElement('span');
        spanName.classList = "fst-italic roomList-item-text";
        spanName.innerHTML = roomName;
        this.uiListElement.appendChild(spanID);
        this.uiListElement.appendChild(spanName);

        this.id = roomId;
        this._NAME = roomName;
        
        this.aliasList = [];
        for(let element of aliasList){
            this.aliasList.push(element.ALIAS);
        }

        this.node_id = null;
    }
    
    get name(){
        return this._NAME;
    }
    set name(newName){
        this._NAME = newName;
        this.uiListElement.children[1].innerHTML = newName;
    }
}