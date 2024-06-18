<?php
    class RoomFunctions extends DBFunctions{
        public function getRooms($dataIN){

            $query = "SELECT * FROM `ipari`.`classrooms`";
            $res = $this->dbListing($query);
            if(isset($res['error'])){
                echo json_encode(array('error'=>'Sikertelen művelet 001'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }
            for($i = 0; $i < count($res); $i++){
                $roomID = $res[$i]['ID'];
                $query2 = "SELECT `ALIAS` FROM `ipari`.`aliases` WHERE `ROOM_ID` = '{$roomID}'";

                $res2 = $this->dbListing($query2);
                if(isset($res2['error'])){
                    echo json_encode(array('error'=>'Sikertelen művelet 002'), JSON_UNESCAPED_UNICODE);
                    $this->conn->close();
                    die();
                }



                $res[$i]['ALIASES'] = $res2;
            }
            echo json_encode($res, JSON_UNESCAPED_UNICODE);
            $this->conn->close();
        }
        public function addRoom($dataIN){
            if(!isset($dataIN->name) || !isset($dataIN->nodeid)){
                echo json_encode(array('error'=>'Sikertelen művelet 003'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }
            $aliases = array();
            if(isset($dataIN->aliaslist))
                $aliases = $dataIN->aliaslist;


            $name = $this->conn->real_escape_string($dataIN->name);
            $nodeid = $this->conn->real_escape_string($dataIN->nodeid);
            $query = "INSERT INTO `ipari`.`classrooms` (`NAME`, `NODE_ID`) VALUES ('{$name}', '{$nodeid}');";
            $res = $this->dbExecution($query);
            if(isset($res['error']) || !isset($res['success']) || $res['success'] == false){
                echo json_encode(array('error'=>'Sikertelen művelet 004'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }
            $query2 = "SELECT `ID` FROM `ipari`.`classrooms` ORDER BY `ID` DESC LIMIT 1;";
            $res2 = $this->dbListing($query2);
            if(isset($res2['error']) || count($res2) != 1){
                echo json_encode(array('error'=>'Sikertelen művelet 005'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }
            $newRoomID = $res2[0]['ID'];

            foreach ($aliases as $value) {
                $aliasName = $this->conn->real_escape_string($value);
                $query1 = "INSERT INTO `ipari`.`aliases` (ROOM_ID, ALIAS) VALUES ('{$newRoomID}', '{$aliasName}');";

                $res1 = $this->dbExecution($query1);
                if(isset($res1['error']) || !isset($res1['success']) || $res1['success'] == false){
                    echo json_encode(array('error'=>'Sikertelen művelet 006', 'sql'=>$query1, 'res'=>$res1), JSON_UNESCAPED_UNICODE);
                    $this->conn->close();
                    die();
                }
            }


            echo json_encode(array('message'=>'Sikeres terem felvétel','id'=>$newRoomID), JSON_UNESCAPED_UNICODE);
            $this->conn->close();
        }
        public function updateRoom($dataIN){
            if(!isset($dataIN->name) || !isset($dataIN->nodeid) || !isset($dataIN->id)){
                echo json_encode(array('error'=>'Sikertelen művelet 008'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }

            
            $aliases = array();
            if(isset($dataIN->aliaslist))
                $aliases = $dataIN->aliaslist;


            $name = $this->conn->real_escape_string($dataIN->name);
            $nodeid = $this->conn->real_escape_string($dataIN->nodeid);
            $id = $this->conn->real_escape_string($dataIN->id);
            $query = "UPDATE `ipari`.`classrooms` SET `NAME` = '{$name}', `NODE_ID` = '{$nodeid}' WHERE (`ID` = '{$id}');";
            $res = $this->dbExecution($query);
            if(isset($res['error']) || !isset($res['success'])){
                echo json_encode(array('error'=>'Sikertelen művelet 009'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }

            $query2 = "SELECT `ALIAS` FROM `ipari`.`aliases` WHERE `ROOM_ID` = '{$id}'";
            $res2 = $this->dbListing($query2);
            if(isset($res2['error'])){
                echo json_encode(array('error'=>'Sikertelen művelet 010'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }
            $oldAliases = array();
            foreach($res2 as $alias){
                array_push($oldAliases, $alias['ALIAS']);
            }

            foreach($oldAliases as $value){
                $oldAliasName = $this->conn->real_escape_string($value);

                if(!in_array($oldAliasName, $aliases)){
                    $query3 = "DELETE FROM `ipari`.`aliases` WHERE (`ROOM_ID` = '{$id}' AND `ALIAS` = '{$oldAliasName}');";
                    $res3 = $this->dbExecution($query3);
                    if(isset($res3['error']) || !isset($res3['success']) || $res3['success'] == false){
                        echo json_encode(array('error'=>'Sikertelen művelet 011'), JSON_UNESCAPED_UNICODE);
                        $this->conn->close();
                        die();
                    }
                }
            }
            foreach($aliases as $value){
                $newAliasName = $this->conn->real_escape_string($value);

                if(!in_array($newAliasName, $oldAliases)){
                    $query3 = "INSERT INTO `ipari`.`aliases` (ROOM_ID, ALIAS) VALUES ('{$id}', '{$newAliasName}');";

                    $res3 = $this->dbExecution($query3);
                    if(isset($res3['error']) || !isset($res3['success']) || $res3['success'] == false){
                        echo json_encode(array('error'=>'Sikertelen művelet 012'), JSON_UNESCAPED_UNICODE);
                        $this->conn->close();
                        die();
                    }
                }
            }


            echo json_encode(array('message'=>'Sikeres terem frissítés'), JSON_UNESCAPED_UNICODE);
            $this->conn->close();
        }
        public function delRoom($dataIN){
            if(!isset($dataIN->id)){
                echo json_encode(array('error'=>'Sikertelen művelet 014'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }

            $id = $this->conn->real_escape_string($dataIN->id);
            $query = "DELETE FROM `ipari`.`classrooms` WHERE `ID` = '{$id}';";
            $res = $this->dbExecution($query);
            if(isset($res['error']) || !isset($res['success']) || $res['success'] == false){
                echo json_encode(array('error'=>'Sikertelen művelet 015'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }
            $query2 = "DELETE FROM `ipari`.`aliases` WHERE `ROOM_ID` = '{$id}';";
            $res2 = $this->dbExecution($query2);
            if(isset($res2['error'])){
                echo json_encode(array('error'=>'Sikertelen művelet 016'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }

            echo json_encode(array('message'=>'Sikeres terem törlés'), JSON_UNESCAPED_UNICODE);
            $this->conn->close();
        }
    }
?>