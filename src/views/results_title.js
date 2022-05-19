function gestisciDB(id_utente,title){
    var e= document.getElementById("heart-button");
    if (e.innerHTML=='Aggiungi ai preferiti <i class="fa fa-heart-o"></i>'){
        aggiungiPreferiti(id_utente, title);
    }
    else{
        eliminaPreferiti(id_utente, title);
    }
};

function eliminaPreferiti(id_utente, title){
    var xhttp = new XMLHttpRequest();
    var body={"title": title};
    xhttp.onreadystatechange = function(){
        if (this.readyState == 4 && this.status == 200){
            if (this.responseText == "true"){
                alert("Film rimosso dai preferiti!");
                aggiornaButton(); 
            }else{
                alert("Chiamata fallita");
            }
        }
        console.log("Stato: "+ this.readyState + " Status: "+ this.status);
        console.log(this.responseText);
    };
    xhttp.open("POST", '/eliminaPreferiti?id='+id_utente.toString()+"&title="+ title, true);
    xhttp.send(JSON.stringify(body));
}

function aggiungiPreferiti(id_utente, title){
    var xhttp = new XMLHttpRequest();
    var body={"title": title};
    xhttp.onreadystatechange = function(){
        if (this.readyState == 4 && this.status == 200){
            if (this.responseText == "true"){
                alert("Film aggiunto ai preferiti!");
                aggiornaButton(); 
            }else{
                alert("Chiamata fallita");
            }
        }
        console.log("Stato: "+ this.readyState + " Status: "+ this.status);
        console.log(this.responseText);
    };
    xhttp.open("POST", '/aggiungiPreferiti?id='+id_utente.toString()+"&title="+ title, true);
    xhttp.send(JSON.stringify(body));
}


function aggiornaButton(){
    var e= document.getElementById("heart-button");
    if (e.innerHTML=='Aggiungi ai preferiti <i class="fa fa-heart-o"></i>'){
        e.innerHTML='Aggiunto! <i class="fa fa-heart"></i>';
    }
    else{
        e.innerHTML='Aggiungi ai preferiti <i class="fa fa-heart-o"></i>'
    }
}