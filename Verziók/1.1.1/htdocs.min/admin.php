<?php session_start();if(!isset($_SESSION['userID'])){header("Location: ./php/login.php");} ?><!doctypehtml><html lang="hu"><head><meta charset="UTF-8"><meta content="IE=edge"http-equiv="X-UA-Compatible"><meta content="width=device-width,initial-scale=1"name="viewport"><style>body,div,html{margin:0!important;padding:0!important}</style><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"rel="stylesheet"crossorigin="anonymous"integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3"><link href="./css/index.css"rel="stylesheet"><link href="./css/admin.css"rel="stylesheet"><title>NavIPARI admin</title></head><body class="container-fluid overflow-hidden"><div class=""id="loadingSc"><div class="spinner-container"><div class="spinner"></div></div><img alt="ipari"class="loading-image"src="./img/ipari-cimer-20200623-technikum.svg"></div><div class="bottom-0 end-0 position-fixed"id="cornerMenu"><div class="rounded bg-dark p-1 text-center m-2"><div class="rounded btn-group-vertical"id="zoomBtnGroup"><input class="text-dark btn"type="button"value="+"> <input class="text-dark btn"type="button"value="-"></div></div><div class="rounded bg-dark p-1 text-center m-2"><div class="rounded btn-group-vertical w-100"id="floorBtnGroup"></div></div></div><div class="overflow-auto vh-100"><div class="rounded bg-dark m-0 m-md-2 p-lg-4 text-white w-25 p-3"id="newNodePanel"><form id="newNodeForm"><div class="row"><div class="col-12 form-check my-1 my-md-2"><input class="form-check-input ms-0"id="isStairInput"type="checkbox"value=""> <label class="form-check-label ms-1"for="isStairInput">Lépcső</label></div><div class="col-12"><label class="mt-1 mt-md-2 form-label"for="">Kapcsolódó csomópontok</label> <select class="form-select"id="newNodeNeighbours"><option value="asd1">oof</option><option value="asd2">oof2</option><option value="asd3">oof3</option></select> <input class="mt-1 btn btn-light w-100"id="newNodeAddNeighbour"type="button"value="Kapcsolat hozzáadása"><ul class="mt-1 list-group"id="newNodeNeighbourList"></ul></div><div class="col-12"><input class="col-12 mt-1 mt-md-2 btn btn-warning col-lg-7"id="addNewNode"type="button"value="Mentés"> <input class="col-12 mt-1 mt-md-2 btn btn-danger col-lg-4 float-end"id="deleteNode"type="button"value="Törlés"></div></div></form><div class="rounded bg-dark m-0 end-0 p-1 position-absolute text-center top-0 translate-middle mt-3 mt-md-4"id="newNodePanelX"><p class="m-0 text-white mx-1">✕</p></div></div><div class="rounded bg-dark m-0 m-md-2 p-lg-4 text-white w-25 pt-1 px-3"id="newClassroomPanel"><form id="newClassroomForm"><div class="row"><div class="col-12"><label class="form-label"for="">Terem neve</label> <input class="form-control"id="newClassroomName"></div><div class="col-12 mt-1 mt-md-2"><label class="form-label mt-md-2 mt-0"for="">Kapcsolódó csomópont</label> <select class="form-select"id="newClassroomNode"></select></div><div class="col-12 mt-1 mt-md-2"><label class="form-label mt-md-2 mt-0"for="">Egyéb elnevezések</label> <input class="form-control"id="newClassroomAlias"> <input class="mt-1 btn btn-light w-100"id="newClassroomAddAlias"type="button"value="Elnevezés hozzáadása"><ul class="mt-1 list-group"id="newClassroomAliasList"></ul></div><div class="col-12"><input class="col-12 mt-1 mt-md-2 btn btn-warning col-lg-7"id="addNewClassroom"type="button"value="Mentés"> <input class="col-12 mt-1 mt-md-2 btn btn-danger col-lg-4 float-end"id="deleteClassroom"type="button"value="Törlés"></div></div></form><div class="rounded bg-dark m-0 end-0 p-1 position-absolute text-center top-0 translate-middle mt-3 mt-md-4"id="newClassroomPanelX"><p class="m-0 text-white mx-1">✕</p></div></div><div class="collapsed bg-dark"id="menuDiv"><div class="container-fluid h-100 text-white"><div class="col-12 m-0 h-25 my-0 pt-1 pt-md-2 px-2 px-md-3"><div class="col-12"><a class="align-items-center mb-lg-0 me-lg-auto pb-1 pb-md-3 text-decoration-none text-white"href="./php/logout.php"><span class="fs-5 text-danger text-decoration-underline">Kijelentkezés</span></a></div><div class="col-12 mb-3"><form method="POST"><input class="w-100 btn btn-primary mb-2 mt-3"id="addNode"type="button"value="Csomópont hozzáadása"name="addNode"></form></div><div class="col-12 mb-3"><form method="POST"><input class="w-100 btn btn-primary mb-2 mt-3"id="addClassroom"type="button"value="Terem hozzáadása"name="addClassroom"></form></div></div><div class="col-12 m-0 h-75 px-1"><div class="col-12 d-block h-100 overflow-auto px-3"><div class="row text-center"id="NodeListContainer"><div class="col-12 bg-warning my-2 p-3 rounded">asd1</div><div class="col-12 bg-warning my-2 p-3 rounded">asd1</div><div class="col-12 bg-warning my-2 p-3 rounded">asd1</div></div></div></div></div><div class="rounded bg-dark m-0 end-0 p-1 position-absolute text-center top-0 translate-middle collapseBtnS mt-4"id="btnCollapseX"><p class="m-0 text-white mx-1">✕</p></div></div><div class="py-3 bg-dark collapseBtnS position-absolute px-2 text-center top-50 translate-middle"id="btnCollapse"><p class="m-auto"><i class="arrow right"></i></p></div><div class="mt-1 bg-dark collapseBtnS position-absolute px-4 py-1 start-50 text-center top-0 translate-middle"id="btnCollapseUp"><p class="m-0 mt-2 mx-auto p-0 px-auto"><i class="arrow down"></i></p></div><div class="h-md-100"><div class=""id="mapDiv"></div></div></div><script src="https://code.jquery.com/jquery-3.6.0.slim.min.js"crossorigin="anonymous"integrity="sha256-u7e5khyithlIdTpu22PHhENmPcRdFiHRjhAuHcs05RI="></script><script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"crossorigin="anonymous"integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p"></script><script src="./js/admin.js"type="module"></script></body></html>