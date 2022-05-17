function aggiungiPreferiti(id_utente, title){
    var xhttp = new XMLHttpRequest();
    var body={"title": title, 
            "movie": "Stoca"};
    xhttp.onreadystatechange = function(){
        if (this.readyState == 4 && this.status == 200){
            if (this.responseText == "true"){
                alert("Chiamata Ajax riuscita!");
                alert(JSON.stringify(body));
                aggiornaButton(); 
            }else{
                alert("Chiamata fallita");
            }
        }
        console.log("Stato: "+ this.readyState + " Status: "+ this.status);
        console.log(this.responseText);
    };
    xhttp.open("POST", '/aggiungiPreferiti?id='+id_utente.toString()+"&title="+ title, true);
    // xhttp.setRequestHeader('content-type', 'application/json');
    xhttp.send(JSON.stringify(body));

    // var e= document.getElementById("heart-button");
    // if (e.innerHTML=='Aggiungi ai preferiti <i class="fa fa-heart-o"></i>'){
    //     alert(id_utente);
    //     var body={  
    //         "my_list": ["lista"],
    //     }
    //     console.log(JSON.stringify(body));
    //     //inserisci film nel DB
    //     $.ajax({ 
    //         //imposto il tipo di invio dati  
    //         type: "PUT", 
    //         //Invio i dati alla pagina
    //         url: 'http://admin:admin@couchdb:5984/users/'+id_utente,
    //         headers: {
    //             'content-type': 'application/json'
    //           },
    //         //Dati da salvare 
    //         data: JSON.stringify(body),
    //         // dataType: "JSON", 
   
    //         //visualizzazione errori/ok 
    //         success: function(msg) 
    //         { 
    //             alert("Chiamata Ajax riuscita!");
    //             aggiornaButton(); 
    //         }, 
    //         error: function(err) 
    //         { 
    //             console.log(err);
    //             alert("Chiamata fallita");  
    //             aggiornaButton();
        
    //         } 
    //    }); 
    // }
    // else{
    //     //rimuovi film dal DB
    // }
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