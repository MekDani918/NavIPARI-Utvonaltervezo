<?php
    class DBFunctions{
        private const DBADDRESS = "127.0.0.1";
        private const DBUSERNAME = "iparimap";
        private const DBPASSWORD = "1234";
        private const DBSCHEMANAME = "ipari";

        protected $conn;
        
        public function __construct()
        {
            $this->conn = new mysqli(self::DBADDRESS, self::DBUSERNAME, self::DBPASSWORD, self::DBSCHEMANAME);
            if($this->conn == null){
                echo json_encode(array('error'=>'Sikertelen csatlakozás az adatbázis szerverhez'), JSON_UNESCAPED_UNICODE);
                //echo json_encode(array('error'=>'Error 500'), JSON_UNESCAPED_UNICODE);
                die();
            }
        }


        /* public static function createConnection(){
            $conn = new mysqli(self::DBADDRESS, self::DBUSERNAME, self::DBPASSWORD, self::DBSCHEMANAME);
            if ($conn->connect_error) {
                return null;
            }
            return $conn;
        }

        public static function dbListing($conn, $query){
            $res = $conn->query($query);
            if($conn->errno == 0){
                if($res->num_rows > 0){
                    return $res->fetch_all(MYSQLI_ASSOC);
                }
                return [];
            }
            return array("error"=>$conn->error);
        }
        public static function dbExecution($conn, $query){
            $conn->query($query);
            if($conn->errno == 0){
                if($conn->affected_rows > 0){
                    return array("success"=>true, "affected_rows"=>$conn->affected_rows);
                }
                return array("success"=>false, "affected_rows"=>$conn->affected_rows);
            }
            return array("error"=>$conn->error);
        } */



        

        protected function dbListing($query){
            $res = $this->conn->query($query);
            if($this->conn->errno == 0){
                if($res->num_rows > 0){
                    return $res->fetch_all(MYSQLI_ASSOC);
                }
                return [];
            }
            return array("error"=>$this->conn->error);
        }
        protected function dbExecution($query){
            $this->conn->query($query);
            if($this->conn->errno == 0){
                if($this->conn->affected_rows > 0){
                    return array("success"=>true, "affected_rows"=>$this->conn->affected_rows);
                }
                return array("success"=>false, "affected_rows"=>$this->conn->affected_rows);
            }
            return array("error"=>$this->conn->error);
        }
    }
?>