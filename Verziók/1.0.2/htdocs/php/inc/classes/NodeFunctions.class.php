<?php
    class NodeFunctions extends DBFunctions{
        public function getNodes($dataIN){
            $query = "SELECT * FROM `ipari`.`nodes`";
            if(isset($dataIN->floor)){
                $floor = $this->conn->real_escape_string($dataIN->floor);
                $query = "SELECT * FROM `ipari`.`nodes` WHERE `FLOOR` = '{$floor}'";
            }
            $res = $this->dbListing($query);
            if(isset($res['error'])){
                echo json_encode(array('error'=>'Sikertelen művelet 001'), JSON_UNESCAPED_UNICODE);
                //echo json_encode(array('error'=>$res['error']), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }
            for($i = 0; $i < count($res); $i++){
                $nodeID = $res[$i]['ID'];
                $query2 = "SELECT `NEIGHBOUR_NODE_ID` as 'ID' FROM `ipari`.`adjacency` WHERE `NODE_ID` = '{$nodeID}'";

                $res2 = $this->dbListing($query2);
                if(isset($res2['error'])){
                    echo json_encode(array('error'=>'Sikertelen művelet 002'), JSON_UNESCAPED_UNICODE);
                    //echo json_encode(array('error'=>$res2['error']), JSON_UNESCAPED_UNICODE);
                    $this->conn->close();
                    die();
                }



                $res[$i]['NEIGHBOURS'] = $res2;
            }
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
            $this->conn->close();
        }
        public function addNode($dataIN){
            if(!isset($dataIN->posX) || !isset($dataIN->posY) || !isset($dataIN->floorId)){
                echo json_encode(array('error'=>'Sikertelen művelet 003'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }
            $neighbours = array();
            if(isset($dataIN->neighbours))
                $neighbours = $dataIN->neighbours;


            $posX = $this->conn->real_escape_string($dataIN->posX);
            $posY = $this->conn->real_escape_string($dataIN->posY);
            $floorId = $this->conn->real_escape_string($dataIN->floorId);
            $isStair = 0;
            if(isset($dataIN->isStair))
                $isStair = ($dataIN->isStair == true? 1 : 0);
            $query = "INSERT INTO `ipari`.`nodes` (POS_X, POS_Y, FLOOR, IS_STAIR) VALUES ({$posX}, {$posY}, {$floorId}, {$isStair});";
            $res = $this->dbExecution($query);
            if(isset($res['error']) || !isset($res['success']) || $res['success'] == false){
            echo json_encode(array('error'=>'Sikertelen művelet 004'/*, 'msg'=>$res, 'asd'=>$query*/), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }
            $query2 = "SELECT `ID` FROM `ipari`.`nodes` ORDER BY `ID` DESC LIMIT 1;";
            $res2 = $this->dbListing($query2);
            if(isset($res2['error']) || count($res2) != 1){
                echo json_encode(array('error'=>'Sikertelen művelet 005'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }
            $newNodeID = $res2[0]['ID'];

            foreach ($neighbours as $value) {
                $neighbourNode = $this->conn->real_escape_string($value);
                $query1 = "INSERT INTO `ipari`.`adjacency` (NODE_ID, NEIGHBOUR_NODE_ID) VALUES ({$newNodeID}, {$neighbourNode});";
                $query2 = "INSERT INTO `ipari`.`adjacency` (NODE_ID, NEIGHBOUR_NODE_ID) VALUES ({$neighbourNode}, {$newNodeID});";

                $res1 = $this->dbExecution($query1);
                if(isset($res1['error']) || !isset($res1['success']) || $res1['success'] == false){
                    echo json_encode(array('error'=>'Sikertelen művelet 006'), JSON_UNESCAPED_UNICODE);
                    $this->conn->close();
                    die();
                }
                $res2 = $this->dbExecution($query2);
                if(isset($res2['error']) || !isset($res2['success']) || $res2['success'] == false){
                    echo json_encode(array('error'=>'Sikertelen művelet 007'), JSON_UNESCAPED_UNICODE);
                    $this->conn->close();
                    die();
                }
            }


            echo json_encode(array('message'=>'Sikeres csomópont felvétel','id'=>$newNodeID), JSON_UNESCAPED_UNICODE);
            $this->conn->close();
        }
        public function updateNode($dataIN){
            if(!isset($dataIN->posX) || !isset($dataIN->posY) || !isset($dataIN->id)){
                echo json_encode(array('error'=>'Sikertelen művelet 008'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }

            
            $neighbours = array();
            if(isset($dataIN->neighbours))
                $neighbours = $dataIN->neighbours;


            $posX = $this->conn->real_escape_string($dataIN->posX);
            $posY = $this->conn->real_escape_string($dataIN->posY);
            $id = $this->conn->real_escape_string($dataIN->id);
            $isStair = 0;
            if(isset($dataIN->isStair))
                $isStair = ($dataIN->isStair == true? 1 : 0);
            $query = "UPDATE `ipari`.`nodes` SET `POS_X` = '{$posX}', `POS_Y` = '{$posY}', `IS_STAIR` = {$isStair} WHERE (`ID` = '{$id}');";
            $res = $this->dbExecution($query);
            if(isset($res['error']) || !isset($res['success'])){
                echo json_encode(array('error'=>'Sikertelen művelet 009','msg'=>$res,'sql'=>$query), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }

            $query2 = "SELECT `NEIGHBOUR_NODE_ID` as 'ID' FROM `ipari`.`adjacency` WHERE `NODE_ID` = '{$id}'";
            $res2 = $this->dbListing($query2);
            if(isset($res2['error'])){
                echo json_encode(array('error'=>'Sikertelen művelet 010'), JSON_UNESCAPED_UNICODE);
                echo json_encode(array('error'=>$res2['error']), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }
            $oldNeighbours = array();
            foreach($res2 as $node){
                array_push($oldNeighbours, $node['ID']);
            }

            foreach($oldNeighbours as $value){
                //var_dump($value);
                $oldNeighbourNode = $this->conn->real_escape_string($value);

                if(!in_array($oldNeighbourNode, $neighbours)){
                    $query3 = "DELETE FROM `ipari`.`adjacency` WHERE (`NODE_ID` = '{$id}' AND `NEIGHBOUR_NODE_ID` = '{$oldNeighbourNode}') OR (`NODE_ID` = '{$oldNeighbourNode}' AND `NEIGHBOUR_NODE_ID` = '{$id}');";
                    $res3 = $this->dbExecution($query3);
                    if(isset($res3['error']) || !isset($res3['success']) || $res3['success'] == false){
                        echo json_encode(array('error'=>'Sikertelen művelet 011'), JSON_UNESCAPED_UNICODE);
                        $this->conn->close();
                        die();
                    }
                }
            }
            foreach($neighbours as $value){
                $newNeighbourNode = $this->conn->real_escape_string($value);

                if(!in_array($newNeighbourNode, $oldNeighbours)){
                    /* var_dump($oldNeighbours);
                    var_dump($neighbours); */
                    $query3 = "INSERT INTO `ipari`.`adjacency` (NODE_ID, NEIGHBOUR_NODE_ID) VALUES ({$id}, {$newNeighbourNode});";
                    $query4 = "INSERT INTO `ipari`.`adjacency` (NODE_ID, NEIGHBOUR_NODE_ID) VALUES ({$newNeighbourNode}, {$id});";

                    $res3 = $this->dbExecution($query3);
                    if(isset($res3['error']) || !isset($res3['success']) || $res3['success'] == false){
                        echo json_encode(array('error'=>'Sikertelen művelet 012'), JSON_UNESCAPED_UNICODE);
                        $this->conn->close();
                        die();
                    }
                    $res4 = $this->dbExecution($query4);
                    if(isset($res4['error']) || !isset($res4['success']) || $res4['success'] == false){
                        echo json_encode(array('error'=>'Sikertelen művelet 013'), JSON_UNESCAPED_UNICODE);
                        $this->conn->close();
                        die();
                    }
                }
            }


            echo json_encode(array('message'=>'Sikeres csomópont frissítés'), JSON_UNESCAPED_UNICODE);
            $this->conn->close();
        }
        public function delNode($dataIN){
            if(!isset($dataIN->id)){
                echo json_encode(array('error'=>'Sikertelen művelet 014'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }

            $id = $this->conn->real_escape_string($dataIN->id);
            $query = "DELETE FROM `ipari`.`nodes` WHERE `ID` = '{$id}';";
            $res = $this->dbExecution($query);
            if(isset($res['error']) || !isset($res['success']) || $res['success'] == false){
                echo json_encode(array('error'=>'Sikertelen művelet 015'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }
            $query2 = "DELETE FROM `ipari`.`adjacency` WHERE `NODE_ID` = '{$id}' OR `NEIGHBOUR_NODE_ID` = '{$id}';";
            $res2 = $this->dbExecution($query2);
            if(isset($res2['error'])){
                echo json_encode(array('error'=>'Sikertelen művelet 016'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }

            echo json_encode(array('message'=>'Sikeres csomópont törlés'), JSON_UNESCAPED_UNICODE);
            $this->conn->close();
        }
    }
?>