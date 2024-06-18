<?php
    class UserFunctions extends DBFunctions{
        public function loginUser($dataIN){
            if(!isset($_SESSION['token']) || !isset($dataIN->token) || $_SESSION['token'] != $dataIN->token){
                echo json_encode(array('error'=>'Token error','success'=>false), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }

            $username = $this->conn->real_escape_string($dataIN->username);
            $password = $this->conn->real_escape_string($dataIN->password);
            $passwordHash = hash("sha256", $password);

            $query = "SELECT `admins`.`ID` FROM `ipari`.`admins` WHERE `admins`.`USERNAME` = '{$username}' AND `admins`.`PASSWORD` = '{$passwordHash}'";
            $res = $this->dbListing($query);
            if(isset($res['error'])){
                echo json_encode(array('error'=>'Sikertelen művelet'), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }
            if(is_array($res) && count($res) > 0 && isset($res[0]['ID'])){
                $_SESSION['userID'] = $res[0]['ID'];
            }
            else{
                echo json_encode(array('uzenet'=>'Helytelen felhasználónév vagy jelszó','success'=>false), JSON_UNESCAPED_UNICODE);
                $this->conn->close();
                die();
            }

            echo json_encode(array('uzenet'=>'Sikeres bejelentkezés','success'=>true), JSON_UNESCAPED_UNICODE);
            $this->conn->close();
        }
        public static function generate_token($size = 16){
            return bin2hex(random_bytes($size));
        }
    }
?>