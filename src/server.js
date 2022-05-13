var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require("body-parser");
//var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
app.use(bodyParser.urlencoded({ extended: false }));
var request = require('request');
const WebSocket = require('ws');
require('dotenv').config();


app.set('view engine', 'ejs');
app.set('views', __dirname+'/views');

const port = 3000;

//impiegato per il corretto utilizzo dei css
app.use(express.static(__dirname + '/views'));

// Gestione della sessione
//app.use(cookieParser()); 

app.use(expressSession({
  secret: 'MovieHub',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // durata di 24 ore
  // Ha valore cookie di default: { path: '/', httpOnly: true, secure: false, maxAge: null }
  // se usiamo https dobbiamo decommentare: 
  // cookie: { secure: true }
}));

app.use(function(req,res,next) {  
  res.locals.session = req.session;
  next();   
}); 

// DA COMPLETARE !!!! 

/* ********************************* FINE DIPENDENZE ****************************************** */

// Per chat-bot:
const wss = new WebSocket.Server({port: 9998});

app.get('/', function(req, res) {
  if(req.session.utente==undefined){
    connected=false;
  }
  else{
    connected=true;
  }
  res.render('index',{connected:connected});
});

/* *********************************** GOOGLE OAUTH ******************************************* */

app.get('/login', function(req, res){
  if (req.session.utente!=undefined){ //se un utente si è già connesso 
    res.send("Sei già connesso!");
  }
  else{
    res.redirect("https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar&response_type=code&include_granted_scopes=true&state=state_parameter_passthrough_value&redirect_uri=http://localhost:3000/googlecallback&client_id="+process.env.G_CLIENT_ID); 
  }
}); 

app.get('/googlecallback', function(req, res){
  if (req.query.code!=undefined){  
    res.redirect('gtoken?code='+req.query.code)
  }
  else{
    res.send('Errore durante la richiesta del code di Google'); // da cambiare
  }
});

app.get('/gtoken', function(req, res){
  var url = 'https://www.googleapis.com/oauth2/v3/token';
  var formData = {
    code: req.query.code,
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
      res.send(info.error);
    }
    else{
      req.session.google_token = info.access_token;
      console.log("Il token di google è: "+req.session.google_token);
      res.redirect('/registrazione'); 
    }
  });

});

app.get('/registrazione', function(req, res){

  if(req.session.google_token==undefined){ 
    //siamo qui solo se dalla barra si digita /registrazione
    return res.send("ERRORE!"); // invece di questo redirect a una pagina d'errore
  }
  
  var google_token = req.session.google_token;
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
      res.send(info.error);
    }
    else{
      // Inserire nel database questo account attraverso l'id, controllando che non sia già presente
      var id = info.id;
      request({
        url: 'http://admin:admin@couchdb:5984/users/_all_docs',
        method: 'GET',
        headers: {
          'content-type': 'application/json'
        },
      }, function(error, response, body){
          if(error) {
            console.log(error);
          } else {
            var data = JSON.parse(body); 
            for(var i=0; i<data.total_rows;i++){
              // se questo account google è già registrato torno alla home, altrimenti lo inserisco nel db e torno alla home
              if(data.rows[i].id === id){  
                req.session.utente = id; // imposto l'utente di questa sessione in modo da poter accedere al profilo dopo
                connected = true;
                res.render('index', {connected:connected});
                //res.redirect('/home'); // settare il fatto che l'utente è connesso!
                return;
              }
            }
            var body1 = {
              "id": info.id,
              "name": info.name,
              "given_name": info.given_name,
              "family_name": info.family_name,
              "picture": info.picture,
              "gender": info.gender,
              "locale": info.locale,
              "my_list": []
            }
            request({
              url: 'http://admin:admin@couchdb:5984/users/'+id,
              method: 'PUT',
              headers: {
                'content-type': 'application/json'
              },
              body: JSON.stringify(body1)
            }, function(error, response, body){
              if (error){
                console.log(error);
              }
              else{
                console.log("Registrazione di "+id+", "+info.name+" avvenuta");
                req.session.utente = id; // imposto l'utente di questa sessione in modo da poter accedere al profilo dopo
                connected = true;
                res.render('index', {connected:connected});
                //res.redirect('/home');
              }
            });
          }
        }
      );
    }
  });
});

app.get('/delete_account', function(req, res){
  if (req.session.utente!=undefined){
    request({
      url: 'http://admin:admin@couchdb:5984/users/'+req.session.utente,
      method: 'DELETE',
      headers: {
        'content-type': 'application/json'
      },
    }, function(error, response, body){
      if (error){
        console.log(error);
      }
      else{
        req.session.destroy();
        res.send("Utente cancellato");
      }
    });
  }
});


/* ******************************** FINE GOOGLE OAUTH ***************************************** */

/* ********************************  GOOGLE CALENDAR ***************************************** */
https://www.googleapis.com/calendar/v3
app.get('/calendar', function(req, res){
  if (req.session.google_token!=undefined){
    res.send("<br><br><button onclick='window.location.href=\"/add_calendar\"'>Add a new calendar</button>"+
            "<br><br><button onclick='window.location.href=\"/get_calendar\"'>Get calendar</button>"+
            "<br><br><button onclick='window.location.href=\"/delete_calendar\"'>Delete the calendar</button>"+
            "<br><br><button onclick='window.location.href=\"/add_event\"'>Add an event to the calendar</button>");
  }
});

app.get('/add_calendar', function(req, res){
  var options = {
    url: 'https://www.googleapis.com/calendar/v3/calendars',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer '+req.session.google_token
    },
    body: '{"summary": "Movie Calendar"}'
  };
  request(options, function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    var info = JSON.parse(body);
    console.log(info);
    req.session.calendar_id = info.id;
    console.log(req.session.calendar_id);
    res.redirect('/calendar');
    }
  else {
    console.log(error);
  }
  });

});

app.get('/get_calendar', function(req, res){
  var options = {
    url: 'https://www.googleapis.com/calendar/v3/calendars/'+req.session.calendar_id,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer '+req.session.google_token
    }
  };
  request(options, function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    var info = JSON.parse(body);
    console.log(info);
    res.redirect('/calendar');
    }
  else {
    console.log(error);
  }
  });

});

app.get('/delete_calendar', function(req, res){
  var options = {
    url: 'https://www.googleapis.com/calendar/v3/calendars/'+req.session.calendar_id,
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer '+req.session.google_token
    }
  };
  request(options, function callback(error, response, body) {
  if (!error) {
    console.log("Eliminato");
    res.redirect('/calendar');
    }
  else {
    console.log(error);
  }
  });

});

app.get('/add_event', function(req, res) {
  res.render('add_event');
});

app.post('/add_event', function(req, res) {

  var summary = req.body.summary;
  var description = req.body.description;
  var start_date = req.body.start_date;
  var end_date = req.body.end_date;
  var color = req.body.color;
  console.log(start_date);
  console.log(color);
  var body1 = { 
    "summary": summary,
    "description": description,
    "end": {
      "date": end_date,
      "timeZone": "Europe/Zurich"
    },
    "start": {
      "date": start_date,
      "timeZone": "Europe/Zurich"
    },
    "colorId": color
  };
 
  request({
    url: 'https://www.googleapis.com/calendar/v3/calendars/'+req.session.calendar_id+'/events',
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Authorization': 'Bearer '+req.session.google_token
    },
    body: JSON.stringify(body1)
  }, function callback(error, response, body) {
    if (!error) {
      var info = JSON.parse(body);
      console.log(info);
      console.log("creato evento");
      res.redirect('/calendar');
      }
    else {
      console.log(error);
    }
    });
});




/* ******************************** FINE GOOGLE CALENDAR ***************************************** */

/* ************************************** PROFILO ********************************************* */

app.get('/profilo', function(req, res){
  if (req.session.utente!=undefined){
    request({
      url: 'http://admin:admin@couchdb:5984/users/'+req.session.utente,
      method: 'GET',
      headers: {
        'content-type': 'application/json'
      },
    }, function(error, response, body){
      if (error){
        console.log(error);
      }
      else{
        info = JSON.parse(body);
        info_utente = info;
        res.render('profilo', {info_utente:info_utente});
      }
    });
  }
  else{
    res.redirect('/');
  }
});

app.get('/logout', function(req, res){
  if (req.session.utente!=undefined){
    req.session.destroy();
    connected=false;
    res.render('index', {connected:connected});
  }
  else{
    connected = false;
    res.render('index', {connected:conntected});
  }
});

app.get('/calendario', function(req,res){
  if(req.session.google_token==undefined){ 
    //siamo qui solo se dalla barra si digita /registrazione
    return res.send("ERRORE!"); // invece di questo redirect a una pagina d'errore
  }
  
  var google_token = req.session.google_token;
  var url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
  var headers = {'Authorization': 'Bearer '+google_token};

  request.get( {headers: headers, url: url}, function(error, response, body){
    if (error){
      console.log(error);
    }
    var info = JSON.parse(body);
    console.log(info);
    res.send(info);
  });
});

/* *********************************** FINE PROFILO ******************************************* */

/* ************************************* CHAT BOT ********************************************* */

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    //rendo la prima lettera maiuscola e le altre minuscole
    var mes=data.toString();
    mes=mes[0].toUpperCase()+mes.slice(1).toLowerCase();

    if (mes == 'Stop'){
      ws.send('Ciao e buona visione!');
      ws.close();
    }
    else{
      var lista;
      var genere_id;
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
            var trovato=0;
            // cerco l'id del genere per le richiesta successiva
            for (var i=0; i<lista.length; i++){
              if (mes == lista[i].name){
                trovato=1;
                genere_id=lista[i].id
                break;
              }
            }

            // Se il dato inserito non è corretto 
            if (!trovato){
              ws.send('Genere non trovato, mi dispiace :-(');
            }

            else{
              // richiesta del film secondo dall'id del genere
              option = {
                url: 'https://api.themoviedb.org/3/discover/movie?api_key='+process.env.FILM_KEY+'&language=it-IT&sort_by=popularity.desc&with_genres='+genere_id, // rendere segreta la chiave 
              }
      
              request.get(option,function(error, response, body){
                if(error) {
                  console.log(error);
                } else {
                  if (response.statusCode == 200) {
                    var info = JSON.parse(body);
                    suggerito = info.results[0].title;
                    ws.send("Ti suggerisco di guardare: "+suggerito);
                  }
                }
              });
            }
          }
        }
      });
    }
  });
  // Messaggio di benvenuto
  ws.send('Ciao! Inserisci un genere che ti consiglio un film da cercare, "Stop" per terminare :-)');
});

/* *********************************** FINE CHAT BOT ******************************************* */

/* *************************************** TMDB *********************************************** */

//inizio aggiunta delle pagine di ricerca e registrazione, il resto non è stato modificato
// le pagine relative alla registrazione vanno riviste e integrate con oauth e di conseguenza
//non rimarranno in questa sezione relativa a tmdb

app.post('/results_film', function(req, res) {
  var titolo = req.body.search; 
    
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
          res.render("results_film", {info:info});   
        }
        else{
          res.send("Il film cercato non esiste...");
        }
      }
    }
  });
});


/*app.post('/results_title', function(req, res) {
  var movie_id = req.body.movie_id;
    
  var option = {
    url: 'https://api.themoviedb.org/3/movie/'+movie_id+'?api_key='+process.env.FILM_KEY+'&language=en-US',
  }
    
  request.get(option,function(error, response, body){
    if(error) {
      console.log(error);
    } 
    else {
      if (response.statusCode == 200) {
        var info = JSON.parse(body);
        if (info!=undefined){
          res.render("results_title", {info:info});   
        }
        else{
          res.send("Il film cercato non esiste...");
        }
      }
    }
  });
});
*/

app.get("/results_title", function(req,res){
  var movie_id=req.query.id;
  var option = {
    url: 'https://api.themoviedb.org/3/movie/'+movie_id+'?api_key='+process.env.FILM_KEY+'&language=en-US',
  }
    
  request.get(option,function(error, response, body){
    if(error) {
      console.log(error);
    } 
    else {
      if (response.statusCode == 200) {
        var info = JSON.parse(body);
        if (info!=undefined){
          console.log(info);
          res.render("results_title", {info:info});   
        }
        else{
          res.send("Il film cercato non esiste...");
        }
      }
    }
  });
});

//fine aggiunta delle pagine di ricerca, il resto non è stato modificato

app.get("/cercaTitolo", function(req,res){
  res.render('prova')
});

// Primo esempio per fare la chiamata rest al TMDB --> database dei film
app.post('/cercaTitolo',function(req,res){
  var titolo = req.body.search; // da mettere nell'html
  var movie_id="";
    
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
          res.render("results", {info:info});
        }
      
          
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

app.listen(port);