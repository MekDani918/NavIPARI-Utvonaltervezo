async function loginUser(e){
    e.preventDefault();
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    let token = document.getElementById('token').value;
    if(username == undefined || username == "" || password == undefined || password == "" || token == undefined || token == ""){
        let messagebox = document.getElementById('messageOutput');
        messagebox.innerHTML = "A mezők kitöltése kötelező!";
        messagebox.classList.add("text-danger");
        return;
    }
    let loginRes = await getData("./API.php",{
        method: 'POST',
        body: JSON.stringify(
            {
                'function':"loginUser",
                'username':username,
                'password':password,
                'token':token
            }
        )
    });

    if(loginRes.error){
        console.error(loginRes.error);
        return;
    }
    if(loginRes.uzenet){
        if(loginRes.success){
            location.href = "../admin.php";
        }
        else{
            let messagebox = document.getElementById('messageOutput');
            messagebox.innerHTML = loginRes.uzenet;
            messagebox.classList.add("text-danger");
            return;
        }
    }
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


window.addEventListener('load', ()=>{
    document.getElementById('loginButton').addEventListener('click', loginUser);
})