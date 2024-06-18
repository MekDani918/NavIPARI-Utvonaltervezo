<?php
    session_start();
    if(!isset($_SESSION['userID'])){
        header("Location: ./php/login.php");
    }
?>

<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        html,body,div {
			margin: 0 !important;
			padding: 0 !important;
		}
    </style>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
    <link href="./css/index.css" rel="stylesheet">
    <link href="./css/admin.css" rel="stylesheet">
	<title>IpariMap admin</title>
</head>
<body class="container-fluid overflow-hidden">
	<div id="loadingSc" class="">
		<div class="spinner-container">
			<div class="spinner"></div>
		</div>
		<img src="./img/ipari-cimer-20200623-technikum.svg" alt="ipari" class="loading-image">
	</div>

	<div class="position-fixed bottom-0 end-0" id="cornerMenu">
		<div class="bg-dark m-2 p-1 text-center rounded">
			<div class="btn-group-vertical rounded" id="zoomBtnGroup">
				<input type="button" value="+" class="btn text-dark">
				<input type="button" value="-" class="btn text-dark">
			</div>
		</div>
		<div class="bg-dark m-2 p-1 text-center rounded">
			<div class="btn-group-vertical w-100 rounded" id="floorBtnGroup">
			</div>
		</div>
	</div>

    <div class="vh-100 overflow-auto">
        <div id="newNodePanel" class="bg-dark text-white p-3 p-lg-4 m-0 m-md-2 w-25 rounded">
            <form id="newNodeForm">
                <div class="row">
                    <div class="col-12 my-1 my-md-2 form-check">
                        <input class="form-check-input ms-0" type="checkbox" value="" id="isStairInput">
                        <label class="form-check-label ms-1" for="isStairInput">Lépcső</label>
                    </div>
                    <div class="col-12">
                        <label class="form-label mt-1 mt-md-2" for="">Kapcsolódó csomópontok</label>
                        <select id="newNodeNeighbours" class="form-select">
							<option value="asd1">oof</option>
							<option value="asd2">oof2</option>
							<option value="asd3">oof3</option>
						</select>
                        <input class="btn btn-light mt-1 w-100" type="button" id="newNodeAddNeighbour" value="Kapcsolat hozzáadása">
                        <ul class="list-group mt-1" id="newNodeNeighbourList">
                        </ul>
                    </div>
                    <div class="col-12">
                        <input class="btn btn-warning mt-1 mt-md-2 col-12 col-lg-7" type="button" id="addNewNode" value="Mentés">
                        <input class="btn btn-danger mt-1 mt-md-2 col-12 col-lg-4 float-end" type="button" id="deleteNode" value="Törlés">
                    </div>
                </div>
            </form>
			<div class="position-absolute end-0 top-0 translate-middle bg-dark text-center p-1 m-0 mt-3 mt-md-4 rounded" id="newNodePanelX">
				<p class="text-white m-0 mx-1">&#x2715;</p>
			</div>
        </div>
		<div id="newClassroomPanel" class="bg-dark text-white px-3 pt-1 p-lg-4 m-0 m-md-2 w-25 rounded">
            <form id="newClassroomForm">
                <div class="row">
                    <div class="col-12">
                        <label class="form-label" for="">Terem neve</label>
                        <input class="form-control" type="text" id="newClassroomName">
                    </div>
    
    
                    <div class="col-12 mt-1 mt-md-2">
                        <label class="form-label mt-0 mt-md-2" for="">Kapcsolódó csomópont</label>
                        <select id="newClassroomNode" class="form-select"></select>
                    </div>
    
                    <div class="col-12 mt-1 mt-md-2">
                        <label class="form-label mt-0 mt-md-2" for="">Egyéb elnevezések</label>
                        <input class="form-control" type="text" id="newClassroomAlias">
                        <input class="btn btn-light mt-1 w-100" type="button" id="newClassroomAddAlias" value="Elnevezés hozzáadása">
                        <ul class="list-group mt-1" id="newClassroomAliasList">
                        </ul>
                    </div>
    
                    <div class="col-12">
                        <input class="btn btn-warning mt-1 mt-md-2 col-12 col-lg-7" type="button" id="addNewClassroom" value="Mentés">
                        <input class="btn btn-danger mt-1 mt-md-2 col-12 col-lg-4 float-end" type="button" id="deleteClassroom" value="Törlés">
                    </div>
                </div>
            </form>
			<div class="position-absolute end-0 top-0 translate-middle bg-dark text-center p-1 m-0 mt-3 mt-md-4 rounded" id="newClassroomPanelX">
				<p class="text-white m-0 mx-1">&#x2715;</p>
			</div>
        </div>

		<div class="bg-dark collapsed" id="menuDiv">
				<div class="container-fluid h-100 text-white">
                    <div class="col-12 m-0 px-2 px-md-3 my-0 pt-1 pt-md-2 h-25">
                        <div class="col-12">
                            <a href="./php/logout.php" class="align-items-center pb-1 pb-md-3 mb-lg-0 me-lg-auto text-white text-decoration-none">
                                <span class="fs-5 text-decoration-underline text-danger">Kijelentkezés</span>
                            </a>
                        </div>
                        <div class="col-12 mb-3">
                            <form method="POST">
                                <input type="button" class="btn btn-primary mt-3 mb-2 w-100" name="addNode" id="addNode" value="Csomópont hozzáadása">
                            </form>
                        </div>
                        <div class="col-12 mb-3">
                            <form method="POST">
                                <input type="button" class="btn btn-primary mt-3 mb-2 w-100" name="addClassroom" id="addClassroom" value="Terem hozzáadása">
                            </form>
                        </div>
                    </div>
                    <div class="col-12 m-0 px-1 h-75">
                        <div class="col-12 h-100 d-block px-3 overflow-auto">
                            <div class="row text-center" id="NodeListContainer">
                                <div class="col-12 p-3 my-2 bg-warning rounded">asd1</div>
                                <div class="col-12 p-3 my-2 bg-warning rounded">asd1</div>
                                <div class="col-12 p-3 my-2 bg-warning rounded">asd1</div>
                            </div>
                        </div>
                    </div>
					
					
				</div>
			<div class="position-absolute end-0 top-0 translate-middle bg-dark text-center p-1 m-0 mt-4 rounded collapseBtnS" id="btnCollapseX">
				<p class="text-white m-0 mx-1">&#x2715;</p>
			</div>
		</div>
		<div class="position-absolute top-50 translate-middle bg-dark text-center px-2 py-3 collapseBtnS" id="btnCollapse">
			<p class="m-auto"><i class="arrow right"></i></p>
		</div>
		<div class="position-absolute top-0 start-50 translate-middle bg-dark text-center px-4 py-1 mt-1 collapseBtnS" id="btnCollapseUp">
			<p class="m-0 mt-2 mx-auto p-0 px-auto"><i class="arrow down"></i></p>
		</div>

		<div class="h-md-100">
			<div class="" id="mapDiv"></div>
		</div>
	</div>
	
    <script src="https://code.jquery.com/jquery-3.6.0.slim.min.js" integrity="sha256-u7e5khyithlIdTpu22PHhENmPcRdFiHRjhAuHcs05RI=" crossorigin="anonymous"></script>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>
	<script type="module" src="./js/admin.js"></script>
</body>
</html>