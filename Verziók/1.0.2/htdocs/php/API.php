<?php
    spl_autoload_register(function ($class) {
        include './inc/classes/' . $class . '.class.php';
    });


    $route = new Route($_SERVER['REQUEST_URI']);
    $route->dataINRoute();
?>