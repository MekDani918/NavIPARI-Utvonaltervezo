<?php
    spl_autoload_register(function ($class) {
        include './inc/classes/' . $class . '.class.php';
    });

    session_start();
    if(isset($_SESSION['userID'])){
        header("Location: ../admin.php");
    }

    $_SESSION['token'] = UserFunctions::generate_token(16);
?>

<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
    <title>Bejelentkezés</title>
    <style>html,body{height:100%}</style>
</head>
<body>
    <div class="container h-100 d-flex justify-content-center align-items-center">
        <form>
            <div class="row d-flex justify-content-center p-1 px-md-5">
                <div class="col-12 m-1">
                    <label class="form-label" for="username">Felhasználónév: </label>
                    <input class="form-control" type="text" id="username" required>
                </div>
                <div class="col-12 m-1">
                    <label class="form-label" for="password">Jelszó: </label>
                    <input class="form-control" type="password" id="password" required>
                </div>
                <div class="col-12 m-1 px-0 px-md-5 d-flex justify-content-center">
                    <input class="btn btn-primary w-75 w-md-50 py-3" type="submit" value="Belépés" id="loginButton">
                </div>
                <input type="hidden" id="token" value="<?= $_SESSION['token'] ?>">
                <div class="col-12 m-1 text-center" id="messageOutput"></div>
            </div>
        </form>
    </div>


    <script src="https://code.jquery.com/jquery-3.6.0.slim.min.js" integrity="sha256-u7e5khyithlIdTpu22PHhENmPcRdFiHRjhAuHcs05RI=" crossorigin="anonymous"></script>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>
    <script src="../js/login.js"></script>
</body>
</html>