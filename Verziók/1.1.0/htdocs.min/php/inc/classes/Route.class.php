<?php
    class Route{
        private $fullURI;
        private $URL;
        private $dataIN;
        private $isAdmin = false;
        private const FloorURLs = [
            ['number'=> 4, 'path'=> './svg/004-I-epulet-padlaster.svg'],
            ['number'=> 3, 'path'=> './svg/003-emelet2.svg'],
            ['number'=> 2, 'path'=> './svg/002-emelet1.svg'],
            ['number'=> 1, 'path'=> './svg/001-foldszint.svg']
        ];

        public function __construct($fullurl){
            $this->fullURI = $fullurl;
            $this->URL = explode('/', $this->fullURI);
            $this->dataIN = json_decode(file_get_contents("php://input"), false);
            if(!isset($this->dataIN->function)){
                echo json_encode(array('error'=>'Undefined API function'), JSON_UNESCAPED_UNICODE);
                die();
                
            }

            session_start();
            if(isset($_SESSION['userID'])){
                $this->isAdmin = true;
            }
        }

        public function urlRoute(){

        }
        public function dataINRoute(){
            switch ($this->dataIN->function) {
                case 'getFloors':
                    echo json_encode(self::FloorURLs, JSON_UNESCAPED_UNICODE);
                    break;
                case 'getNodes':
                    $nodeFunctions = new NodeFunctions();
                    $nodeFunctions->getNodes($this->dataIN);
                    break;
                case 'getRooms':
                    $roomFunctions = new RoomFunctions();
                    $roomFunctions->getRooms($this->dataIN);
                    break;
                case 'addNode':
                    $this->checkAccess();
                    $nodeFunctions = new NodeFunctions();
                    $nodeFunctions->addNode($this->dataIN);
                    break;
                case 'addRoom':
                    $this->checkAccess();
                    $roomFunctions = new RoomFunctions();
                    $roomFunctions->addRoom($this->dataIN);
                    break;
                case 'updateNode':
                    $this->checkAccess();
                    $nodeFunctions = new NodeFunctions();
                    $nodeFunctions->updateNode($this->dataIN);
                    break;
                case 'updateRoom':
                    $this->checkAccess();
                    $roomFunctions = new RoomFunctions();
                    $roomFunctions->updateRoom($this->dataIN);
                    break;
                case 'delNode':
                    $this->checkAccess();
                    $nodeFunctions = new NodeFunctions();
                    $nodeFunctions->delNode($this->dataIN);
                    break;
                case 'delRoom':
                    $this->checkAccess();
                    $roomFunctions = new RoomFunctions();
                    $roomFunctions->delRoom($this->dataIN);
                    break;
                case 'loginUser':
                    $userFunctions = new UserFunctions();
                    $userFunctions->loginUser($this->dataIN);
                    break;
                default:
                    echo json_encode(array('error'=>'Unknown API function'), JSON_UNESCAPED_UNICODE);
                    die();
                    break;
            }
        }

        private function checkAccess(){
            if(!$this->isAdmin){
                echo json_encode(array('error'=>'Access denied'), JSON_UNESCAPED_UNICODE);
                die();
            }
        }
    }
?>