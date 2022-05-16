function aggiungiPreferiti(){
    aggiornaButton();
}

function aggiornaButton(){
    var e= document.getElementById("heart-button");
    if (e.innerHTML=='Aggiungi ai preferiti <i class="fa fa-heart-o"></i>'){
        e.innerHTML="Aggiunto! <i class=\"fa fa-heart\"></i>";
    }
    else{
        e.innerHTML='Aggiungi ai preferiti <i class="fa fa-heart-o"></i>'
    }
}