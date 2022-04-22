var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
var request = require('request');
require('dotenv').config();

// DA COMPLETARE !!!! 

/* ********************************* FINE DIPENDENZE ****************************************** */

/* *********************************** GOOGLE OAUTH ******************************************* */

var google_token = '';
var code = '';

// app.get('/login', function(req, res){
//   res.redirect("https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/calendar&response_type=code&include_granted_scopes=true&state=state_parameter_passthrough_value&redirect_uri=http://localhost:3000/googlecallback&client_id="+process.env.G_CLIENT_ID); 
// });

app.get('/login', function(req, res){
  res.redirect("https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/userinfo.profile&response_type=code&include_granted_scopes=true&state=state_parameter_passthrough_value&redirect_uri=http://localhost:3000/googlecallback&client_id="+process.env.G_CLIENT_ID); 
}); 

app.get('/googlecallback', function(req, res){
  if (req.query.code!=undefined){  
    res.redirect('gtoken?code='+req.query.code)
    code += req.query.code;
  }
  else{
    res.status(403).redirect(403, '/error?statusCode=403')
  }
});

app.get('/gtoken', function(req, res){
  var url = 'https://www.googleapis.com/oauth2/v3/token';
  var formData = {
    code: code,
    client_id: process.env.G_CLIENT_ID,
    client_secret: process.env.G_CLIENT_SECRET,
    redirect_uri: "http://localhost:3000/googlecallback",
    grant_type: 'authorization_code'
  }

  request.post({url: url, form: formData}, function(error, response, body){
    if (error){
      console.log(error);
    }
    var info = JSON.parse(body);
    if(info.error != undefined){
      res.redirect(404, '/error?statusCode=404' );
    }
    else{
      google_token += info.access_token;
      console.log("Il token di google è: "+google_token);

      res.redirect('/registrazione'); 
    }
  });

});

app.get('/registrazione', function(req, res){
  
  var url = 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token='+google_token;
  var headers = {'Authorization': 'Bearer '+google_token};

  request.get( {headers: headers, url: url}, function(error, response, body){
    if (error){
      console.log(error);
    }
    var info = JSON.parse(body);
    console.log(info);
      /* 
        QUESTE INFO SONO COSI' FATTE:
        {
          "id": "xx",
          "name": "xx",
          "given_name": "xx",
          "family_name": "xx",
          "link": "xx",
          "picture": "xx",
          "gender": "xx",
          "locale": "xx"
        }
      */

    if(info.error != undefined){
      res.redirect(404, '/error?statusCode=404');
    }
    else{
      res.send("Nome: "+info.name);

      // Inserire nel database questo account attraverso l'id, controllando che non sia già presente 
    }
        
  });
});

  // fare la creazione dell'account con google (da salvare su couchdb)

/* ******************************** FINE GOOGLE OAUTH ***************************************** */

/* ****************************** FEEDBACK CON RABBIT MQ ************************************** */



/* ********************************** FINE FEEDBACK ******************************************* */

/* ************************************* CHAT BOT ********************************************* */

// potremmo usare un API per la chat bot(ex. https://docs.nativechat.com/docs/1.0/publishing/rest.html)
// fare con tecnologia asincrona la pubblicazione di un commento su un certo film sul proprio profilo

app.get('/bot', function(req,res){  // ---> è solo una prova!!!
  //var genere = //da inserire; --> è un nome associato a una parola chiave es. felicità --> commedia 
  var lista;
  var gid;
  var suggerito;

  var option = {
    url: 'https://api.themoviedb.org/3/genre/movie/list?api_key='+process.env.FILM_KEY+'&language=it-IT', 
  }

  request.get(option,function(error, response, body){
    if(error) {
      console.log(error);
    } else {
        if (response.statusCode == 200) {
          lista = JSON.parse(body).genres;
          for (var i=0; i<lista.length; i++){
            if (genere == lista[i].name){
              gid=lista[i].id
              break;
            }
          }
        }
        else{
          // ??? 
        }
    }
  });


  option = {
    url: 'https://api.themoviedb.org/3/discover/movie?api_key='+process.env.FILM_KEY+'&language=it-IT&sort_by=popularity.desc&with_genres='+gid, // rendere segreta la chiave 
  }

  request.get(option,function(error, response, body){
    if(error) {
      console.log(error);
    } else {
        if (response.statusCode == 200) {
          var info = JSON.parse(body);
          suggerito = info.results[0].title;
          res.send("Ti consiglio di guardare il film: <br>"+suggerito+"</br>");
        }
        else{
          // ??? 
        }
    }
  });
});

/* *********************************** FINE CHAT BOT ******************************************* */

/* *************************************** TMDB *********************************************** */

// Primo esempio per fare la chiamata rest al TMDB --> database dei film
app.post('/cercaTitolo',function(req,res){
  var titolo = req.body.search; // da mettere nell'html
  var movie_id;
    
  // per ottenere l'id del film utile per la richiesta delle informazioni del film

  var option = {
    url: 'https://api.themoviedb.org/3/search/movie?api_key='+process.env.FILM_KEY+'&language=it-IT&query='+titolo, 
  }
    
  request.get(option,function(error, response, body){
    if(error) {
      console.log(error);
    } 
    else {
      if (response.statusCode == 200) {
        var info = JSON.parse(body);
        if (info.results.length>0){
          movie_id = info.results[0].id; // gestire il fatto che sia una lista di film 
          console.log(movie_id);
          res.send("Il film ha id: "+movie_id);
          
          // altra chiamata REST per mostrare i dettagli del film --> bisogna farne altre per ottenere attori, ecc.
          // request.get('https://api.themoviedb.org/3/movie/'+movie_id+'?api_key='+process.env.FILM_KEY+'&language=it-IT', function(error, response, body){
          //   if(error) {
          //     console.log(error);
          //   } else {
          //     if (response.statusCode == 200) {
          //       var info = JSON.parse(body);
          //       console.log("Paese: "+info.production_countries[0].name); // NELLA PAGINA CON LE INFO DEL FILM FARE UNA CHIAMATA A QUALCHE API DI MAPPE CON EVIDENZIATI I DIVERSI PAESI IN CUI E' STATO GIRATO 
          //       // ... aprire la pagina con il titolo del film e le varie informazioni

          //     }
          //     else{
          //       res.send(response.statusCode+" "+body); // da modificare 
          //     }
          //     console.log(response.statusCode, body);
          //   }
          // });
        }
        else{
          res.send("Il film cercato non esiste...");
        }
        //res.redirect(...); <-- a una pagina con l'elenco dei film con quel titolo 
      }
      // else{
      //   res.send(response.statusCode+" "+body); // da modificare 
      // }
      // console.log(response.statusCode, body);
    }
  });

  /* QUI NON FUNZIONA, DENTRO ALL'ALTRA FUNZIONE SI' MA E' DA CAMBIARE QUALCOSA */
  // altra chiamata REST per mostrare i dettagli del film --> bisogna farne altre per ottenere attori, ecc.
  // request.get('https://api.themoviedb.org/3/movie/'+movie_id+'?api_key='+process.env.FILM_KEY+'&language=it-IT', function(error, response, body){
  //   if(error) {
  //     console.log(error);
  //   } else {
  //     if (response.statusCode == 200) {
  //       var info = JSON.parse(body);
  //       console.log("Paese: "+info.production_countries[0].name); // NELLA PAGINA CON LE INFO DEL FILM FARE UNA CHIAMATA A QUALCHE API DI MAPPE CON EVIDENZIATI I DIVERSI PAESI IN CUI E' STATO GIRATO 
  //       // ... aprire la pagina con il titolo del film e le varie informazioni

  //     }
  //     else{
  //       res.send(response.statusCode+" "+body); // da modificare 
  //     }
  //     console.log(response.statusCode, body);
  //   }
  // }); 

});

/* **************************************** FINE TMDB ************************************************* */

/* ************************************** NETFLIX TOP 10 ********************************************** */

app.get('/topMovie', function(req, res){
  const options = {
    method: 'GET',
    url: 'https://netflix-weekly-top-10.p.rapidapi.com/api/movie',
    headers: {
      'X-RapidAPI-Host': 'netflix-weekly-top-10.p.rapidapi.com',
      'X-RapidAPI-Key': process.env.NETFLIX_KEY
    }
  };

  request.get(options, function(error, response, body){
    if (error){
      console.log(error);
    }
    else{
      var info = JSON.parse(body);
      if (info.error!=undefined){
        res.redirect(404, 'Errore');
      }
      else{
        var output='1) '+info[0].name+'<br>';
        for (var i=1; i<info.length; i++){
          output+=i+1+') '+info[i].name+'</br>';
        }
        res.send(output);
      }
    }

  });
})


/* ************************************ FINE NETFLIX TOP 10 ********************************************* */


/* ********************************* DEFINIZIONE DELLA PORTA ****************************************** */

app.listen(3000);