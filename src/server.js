var express = require('express');
var app = express();
var fs = require('fs');
var bodyParser = require("body-parser");
var expressSession = require('express-session');
app.use(bodyParser.urlencoded({ extended: false }));
var request = require('request');
const WebSocket = require('ws');
const https = require('https')
const { info } = require('console');
var { connected } = require('process');
require('dotenv').config();


app.set('view engine', 'ejs');
app.set('views', __dirname+'/views');

const port = 3000;

//impiegato per il corretto utilizzo dei css
app.use(express.static(__dirname + '/views'));

// Gestione della sessione
app.use(expressSession({
  secret: 'MovieHub',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, secure: true } // durata di 24 ore + sicurezza
  // Ha valore cookie di default: { path: '/', httpOnly: true, secure: false, maxAge: null }
}));

app.use(function(req,res,next) {  
  res.locals.session = req.session;
  next();   
}); 


/* ********************************* FINE DIPENDENZE ****************************************** */

const server = https.createServer({
  key: fs.readFileSync('security/key.pem'),
  cert: fs.readFileSync('security/cert.pem')
}, app);

server.addListener('upgrade',(req, res, head) => console.log('UPGRADE:', req.url));

// Per chat-bot:
const wss = new WebSocket.Server({server, path: '/chat'});

app.get('/', function(req, res) {
  if(req.session.utente==undefined){
    connected=false;
  }
  else{
    connected=true;
  }
  res.render('index',{connected:connected});
});

app.get('/error', function(req, res){
  cod_status = req.query.cod_status;
  stringa = req.query.stringa;
  res.render('error', {cod_status:cod_status, connected:connected, stringa:stringa});
});

/* *********************************** GOOGLE OAUTH ******************************************* */

app.get('/login', function(req, res){
  if (req.session.utente!=undefined){ //se un utente si è già connesso 
    res.redirect('/');
  }
  else{
    res.redirect("https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar&response_type=code&include_granted_scopes=true&state=state_parameter_passthrough_value&redirect_uri=https://localhost:3000/googlecallback&client_id="+process.env.G_CLIENT_ID); 
  }
}); 

app.get('/googlecallback', function(req, res){
  if (req.query.code!=undefined){  
    res.redirect('gtoken?code='+req.query.code)
  }
  else{
    cod_status = 404;
    res.redirect('/error?cod_status='+cod_status);
  }
});

app.get('/gtoken', function(req, res){
  var url = 'https://www.googleapis.com/oauth2/v3/token';
  var formData = {
    code: req.query.code,
    client_id: process.env.G_CLIENT_ID,
    client_secret: process.env.G_CLIENT_SECRET,
    redirect_uri: "https://localhost:3000/googlecallback",
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
    cod_status = 404;
    return res.redirect('/error?cod_status='+cod_status);
  }
  
  var google_token = req.session.google_token;
  var url = 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token='+google_token;
  var headers = {'Authorization': 'Bearer '+google_token};

  request.get( {headers: headers, url: url}, function(error, response, body){
    if (error){
      console.log(error);
    }
    var info = JSON.parse(body);
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
                console.log("Utente "+id+", "+info.name+" già registrato");
                res.render('index', {connected:connected});
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
              "my_list": [],
              "calendar": ""
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
              }
            });
          }
        }
      );
    }
  });
});

/* ******************************** FINE GOOGLE OAUTH ***************************************** */

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
        info_p = JSON.parse(body);
        if (info_p.error!=undefined){
          res.send(info_p.error);
        }
        var info_utente = info_p;
        // console.log(info_utente);
        res.render('profilo', {info_utente:info_utente, connected:connected});
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
    res.render('index', {connected:connected});
  }
});

app.get('/delete_account', function(req, res){
  if (req.session.utente!=undefined){
    id = req.session.utente 
    request({
      url: 'http://admin:admin@couchdb:5984/users/'+id,
      method: 'GET',
      headers: {
        'content-type': 'application/json'
      },
    }, function(error, response, body){
      if (error){
        console.log(error);
        res.send("ERRORE");
      }else{
        rev = (JSON.parse(body))._rev;
        request({
          url: 'http://admin:admin@couchdb:5984/users/'+id+'?rev='+rev,
          method: 'DELETE',
          headers: {
            'content-type': 'application/json'
          },
        }, function(error, response, body){
          if (error){
            console.log(error);
            res.send("ERRORE");
          }
          else{
            req.session.destroy();
            connected = false;
            res.render('index', {connected:connected});
            return;
          }
        });
      }
    });  
  }
  else{
    res.redirect('/');
  }
});

app.post('/eliminaPreferiti', function(req,res){
  var id_utente = req.query.id;
  var title = req.query.title;
  var info_utente;
  request({
    url: 'http://admin:admin@couchdb:5984/users/'+id_utente.toString(),
    method: 'GET',
    headers: {
      'content-type': 'application/json;charset=UTF-8'
    },
  }, function(error, response, body){
    if (error){
      console.log(error);
    }
    else{
      info_utente = JSON.parse(body);
      for (var h=0; h<info_utente.my_list.length; h++){
        //scandisce la lista dei film preferiti e quando trova "title" lo elimina dalla lista
        if (info_utente.my_list[h]==title){
          info_utente.my_list.splice(h,1);
        }
      }
      request({
        url: 'http://admin:admin@couchdb:5984/users/'+id_utente,
        method: 'PUT',
        headers: {
          'content-type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify(info_utente),
      }, function(error, response, body){
        if (error){
          console.log(error);
        }
        else{
          res.send("true");
        }
      });
    }
  });
});

app.post('/aggiungiPreferiti', function(req, res){
  var id_utente = req.query.id;
  var title = req.query.title;
  var info_utente;
  request({
    url: 'http://admin:admin@couchdb:5984/users/'+id_utente.toString(),
    method: 'GET',
    headers: {
      'content-type': 'application/json;charset=UTF-8'
    },
  }, function(error, response, body){
    if (error){
      console.log(error);
    }
    else{
      info_utente = JSON.parse(body);
      info_utente.my_list.push(title);
      request({
        url: 'http://admin:admin@couchdb:5984/users/'+id_utente,
        method: 'PUT',
        headers: {
          'content-type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify(info_utente),
      }, function(error, response, body){
        if (error){
          console.log(error);
        }
        else{
          res.send("true");
        }
      });
    }
  });
});
 
/* *********************************** FINE PROFILO ******************************************* */


/* ********************************  GOOGLE CALENDAR ***************************************** */

app.get('/add_calendar', function(req, res){
  //check if a calendar exists
  request({
    url: 'http://admin:admin@couchdb:5984/users/'+req.session.utente,
    method: 'GET',
    headers: {
      'content-type': 'application/json'
    },
  }, function(error, response, body){
    if (!error){
      var data = JSON.parse(body);
      console.log("checking data from database");
      console.log(data);
      if(data.calendar!="") {
        //if the calendar exists, delete it
        console.log("calendar already exists, tring to delete it");
        var options = {
          url: 'https://www.googleapis.com/calendar/v3/calendars/'+data.calendar,
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer '+req.session.google_token
          }
        };
        request(options, function callback(error, response, body) {
          if (!error) {
            console.log("Removed old calendar");
          }
          else {
            console.log(error);
          }
        });
      }
      else {
        console.log("the calendar does not exist, creating a new one");
      }
      
      //creating a new calendar
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
          console.log("info of the calendar just created");
          console.log(info);

          //ho provato a non utilizzare la session, però quando ricarico la pagina a volte non funziona
          req.session.calendar_id = info.id;
          console.log("id of the calendar just created");
          console.log(req.session.calendar_id);
        
          //adding the reader role to calendar
          var data = { 
            "role": "reader",
            "scope": {
              "type": "default"
            }
          };
          request({
            url: 'https://www.googleapis.com/calendar/v3/calendars/'+req.session.calendar_id+'/acl',
            method: 'POST',
            headers: {
              'Authorization': 'Bearer '+req.session.google_token
            },
            body: JSON.stringify(data)
          }, function callback(error, response, body) {
            if (!error) {
              var data1 = JSON.parse(body);
              console.log("info of the role applied to calendar");
              console.log(data1);
            
              //retreiving the revision code
              request({
                url: 'http://admin:admin@couchdb:5984/users/'+req.session.utente,
                method: 'GET',
                headers: {
                  'content-type': 'application/json'
                },
              }, function(error, response, body){
                if (!error){
                  var data = JSON.parse(body);
                  console.log("info of user, including revision code");
                  console.log(data);
                
                  //adding the calendar id to database
                  var body1 = {
                    "id": data.id,
                    "name": data.name,
                    "given_name": data.given_name,
                    "family_name": data.family_name,
                    "picture": data.picture,
                    "gender": data.gender,
                    "locale": data.locale,
                    "my_list": data.my_list,
                    "calendar": info.id,
                    "_rev": data._rev
                  };
                  request({
                    url: 'http://admin:admin@couchdb:5984/users/'+req.session.utente,
                    method: 'PUT',
                    headers: {
                      'content-type': 'application/json'
                  },
                  body: JSON.stringify(body1)
                  }, function(error, response, body){
                    if (!error){
                      var data = JSON.parse(body);
                      console.log("modified entry in database, logging results of modification");
                      console.log(data);
                      console.log("aggiunto calendar a database");
                      res.redirect('/profilo');
                    }
                    else{
                      console.log(error);
                    }
                  });
                }
                else{
                  console.log(error);
                }
              });
            }
            else {
              console.log(error);
            }
          });
        }
        else {
          cod_status = response.statusCode;
          res.redirect('/error?cod_status='+cod_status);
        }
      });
    }
    else {
      console.log(error);
    }
  });
});

app.get('/delete_calendar', function(req, res){
  //check if a calendar exists
  request({
    url: 'http://admin:admin@couchdb:5984/users/'+req.session.utente,
    method: 'GET',
    headers: {
      'content-type': 'application/json'
    },
  }, function(error, response, body){
    if (!error){
      var data = JSON.parse(body);
      console.log("checking data from database");
      console.log(data);
      if(data.calendar!="") {
        //if the calendar exists, delete it from google calendar
        var options = {
          url: 'https://www.googleapis.com/calendar/v3/calendars/'+data.calendar,
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer '+req.session.google_token
          }
        };
        request(options, function callback(error, response, body) {
        if (!error) {
          //also delete the calendar from database

          //retreive information from database
          request({
            url: 'http://admin:admin@couchdb:5984/users/'+req.session.utente,
            method: 'GET',
            headers: {
              'content-type': 'application/json'
            },
          }, function(error, response, body){
            if (!error){
              var data = JSON.parse(body);
              console.log("info of user, including revision code");
              console.log(data);

              //removing calendar from database
              var body1 = {
                "id": data.id,
                "name": data.name,
                "given_name": data.given_name,
                "family_name": data.family_name,
                "picture": data.picture,
                "gender": data.gender,
                "locale": data.locale,
                "my_list": data.my_list,
                "calendar": "",
                "_rev": data._rev
              };
              request({
                url: 'http://admin:admin@couchdb:5984/users/'+req.session.utente,
                method: 'PUT',
                headers: {
                  'content-type': 'application/json'
              },
              body: JSON.stringify(body1)
              }, function(error, response, body){
                if (!error){
                  var data = JSON.parse(body);
                  console.log("modified entry in database, logging results of modification");
                  console.log(data);
                  console.log("removed calendar from database");
                  res.redirect('/profilo');
                }
                else {
                  console.log(error);
                }
              });
            }
            else {
              console.log(error);
            }
          });
          }
          else {
            console.log(error);
          }
        });
      }
      else {
        console.log("the calendar does not exists for this user");
        res.redirect('/profilo');
      }
    }
    else {
      console.log(error);
    }
  });
});

app.get('/add_event', function(req, res) {
  title = req.query.title;
  res.render('add_event',  {title:title});
});

app.post('/add_event', function(req, res) {
  //retreive data of current calendar
  request({
    url: 'http://admin:admin@couchdb:5984/users/'+req.session.utente,
    method: 'GET',
    headers: {
      'content-type': 'application/json'
    },
  }, function(error, response, body){
    if (!error){
      var data = JSON.parse(body);
      console.log("checking data from database");
      console.log(data);
      if(data.calendar!="") {

        //creating the new event
        var summary = req.body.summary;
        var description = req.body.description;
        var start_date = req.body.start_date;
        var end_date = req.body.end_date;
        var color = req.body.color;
        
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
          url: 'https://www.googleapis.com/calendar/v3/calendars/'+data.calendar+'/events',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'Authorization': 'Bearer '+req.session.google_token
          },
          body: JSON.stringify(body1)
        }, function callback(error, response, body) {
          if (!error) {
            var info = JSON.parse(body);
            console.log("info of the newly created event");
            console.log(info);
            res.redirect('/profilo');
          }
          else {
            console.log(error);
          }
          });
      }
      else {
        console.log("calendar does not exists, creating a new one, next you can re-create the event");
        res.redirect('/add_calendar');
      }
    }
    else{
      console.log(error);
    }
  });
});


/* ******************************** FINE GOOGLE CALENDAR ***************************************** */

/* ************************************* CHAT BOT ********************************************* */

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    //rendo la prima lettera maiuscola e le altre minuscole
    var mes=data.toString();
    mes=mes[0].toUpperCase()+mes.slice(1).toLowerCase();
    console.log(mes);
    
    
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
                  i = Math.round(Math.random()*2); // numero casuale tra 0 e 2 (primi 3 film)
                  suggerito = info.results[i].title;
                  ws.send("Ti suggerisco di guardare: "+suggerito);
                }
              }
            });
          }
        }
        else{
          cod_status = response.statusCode;
          res.redirect('/error?cod_status='+cod_status);
        }
      }
    });
  });
  // Messaggio di benvenuto
  ws.send('Ciao! Inserisci un genere che ti consiglio un film da cercare...');
});

/* *********************************** FINE CHAT BOT ******************************************* */

/* *************************************** TMDB *********************************************** */

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
          res.render("results_film", {info:info, connected:connected});   
        }
        else{
          cod_status = response.statusCode;
          stringa="Il film cercato non esiste."
          res.redirect('/error?cod_status='+cod_status+'&stringa='+stringa);
        }
      }
      else{
        cod_status = response.statusCode;
        res.redirect('/error?cod_status='+cod_status);
      }
    }
  });
});

app.get("/results_topten", function(req, res){
  var movie_name=req.query.name;
  if (movie_name!=undefined){
    var option = {
      url: 'https://api.themoviedb.org/3/search/movie?api_key='+process.env.FILM_KEY+'&language=it-IT&query='+movie_name, 
    }
    request.get(option, function(error, response, body){
      if (error){
        console.log(error);
      }
      else{
        if (response.statusCode==200){
          var info= JSON.parse(body);
          added_to_favourites=false;
          if (info.results.length>=0){
            var option = {
              url: 'https://api.themoviedb.org/3/movie/'+info.results[0].id+'?api_key='+process.env.FILM_KEY+'&language=it-IT',
            }

            request.get(option,function(error, response, body){
              if(error) {
                console.log(error);
              } 
              else {
                if (response.statusCode == 200) {
                  var info = JSON.parse(body);
                  id_utente = req.session.utente;
                  if (info!=undefined){
                    movie_name=info.original_title;
                    if (req.session.utente!=undefined){
                      request({
                        url: 'http://admin:admin@couchdb:5984/users/'+id_utente,
                        method: 'GET',
                        headers: {
                          'content-type': 'application/json'
                        },
                      }, function(error, response, body){
                        if (error){
                          console.log(error);
                        }
                        else{
                          info_p = JSON.parse(body);
                          console.log(info_p);
                          for (var h=0; h<info_p.my_list.length; h++){
                            if (info_p.my_list[h]==movie_name){
                              added_to_favourites=true;
                            }
                          }
                          console.log(added_to_favourites);
                          res.render("results_title", {info:info, id_utente: id_utente, connected:connected, added_to_favourites:added_to_favourites}); 
                        }
                      });
                    }
                    else{
                      res.render("results_title", {info:info, id_utente: id_utente, connected:connected, added_to_favourites:added_to_favourites}); 
                    }
                  }
                  else{
                    cod_status = response.statusCode;
                    stringa="Il film cercato non esiste.";
                    res.redirect('/error?cod_status='+cod_status+'&stringa='+stringa);
                  }
                }
                else{
                  cod_status = response.statusCode;
                  res.redirect('/error?cod_status='+cod_status);
                }
              }
            });
          }
          else{
            cod_status = response.statusCode;
            stringa="Il film cercato non esiste."
            res.redirect('/error?cod_status='+cod_status+'&stringa='+stringa);
          }
        }
        else{
          cod_status = response.statusCode;
          res.redirect('/error?cod_status='+cod_status);
        }
      }
    })
  }
  else{
    cod_status = 404;
    res.redirect('/error?cod_status='+cod_status);
  }
})

app.get("/results_title", function(req,res){
  var movie_id=req.query.id;
  var movie_name;
  var added_to_favourites=false;
  var option = {
    url: 'https://api.themoviedb.org/3/movie/'+movie_id+'?api_key='+process.env.FILM_KEY+'&language=it-IT',
  }
    
  request.get(option,function(error, response, body){
    if(error) {
      console.log(error);
    } 
    else {
      if (response.statusCode == 200) {
        var info = JSON.parse(body);
        var id_utente=req.session.utente;
        if (info!=undefined){
          movie_name=info.original_title;
          if (req.session.utente!=undefined){
            request({
              url: 'http://admin:admin@couchdb:5984/users/'+id_utente,
              method: 'GET',
              headers: {
                'content-type': 'application/json'
              },
            }, function(error, response, body){
              if (error){
                console.log(error);
              }
              else{
                info_p = JSON.parse(body);
                console.log(info_p);
                for (var h=0; h<info_p.my_list.length; h++){
                  if (info_p.my_list[h]==movie_name){
                    added_to_favourites=true;
                  }
                }
                console.log(added_to_favourites);
                res.render("results_title", {info:info, info_p:info_p, id_utente: id_utente, connected:connected, added_to_favourites:added_to_favourites}); 
              }
            });
          }
          else{
            res.render("results_title", {info:info, id_utente: id_utente, connected:connected, added_to_favourites:added_to_favourites}); 
          }
        }
        else{
          cod_status = response.statusCode;
          stringa="Il film cercato non esiste."
          res.redirect('/error?cod_status='+cod_status+'&stringa='+stringa);
        }
      }
      else{
        cod_status = response.statusCode;
        res.redirect('/error?cod_status='+cod_status);
      }
    }
  });
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
        console.log(info.error);
      }
      else{
        res.render("top_movies", {info:info, connected:connected});
        console.log(info);
      }
    }
  });
})

/* ************************************ FINE NETFLIX TOP 10 ********************************************* */


/* ************************************ REST API ********************************************* */

//restituisce la lista dei film preferiti di un utente tramite id
app.get('/api/user/:id', function(req,res){
  var id= req.params.id;
  request({
    url: 'http://admin:admin@couchdb:5984/users/'+id.toString(),
    method: 'GET',
    headers: {
      'content-type': 'application/json;charset=UTF-8'
    },
  }, function(error, response, body){
    if (error){
      res.status(500).send({success:false, message:'Internal server error'});
    }
    else{
      if (body!=undefined){
        var info_utente = JSON.parse(body);
        var lista_preferiti = info_utente.my_list;
        res.status(200).send({success: true, id: id, list: lista_preferiti});
      }
      else{
        res.status(404).send({success:false, error: 'Id not found.'});
      }
    }
  })
});

//restituisce un film consigliato in base al genere
app.get('/api/recommended/:genre', function(req,res){
  var lista;
  var suggerito;
  var genre_id;
  var genre=req.params.genre.toString();
  genre=genre[0].toUpperCase()+genre.slice(1).toLowerCase();
  var option = {
    url: 'https://api.themoviedb.org/3/genre/movie/list?api_key='+process.env.FILM_KEY+'&language=it-IT', 
  }
    
  request.get(option,function(error, response, body){
    if(error) {
      res.status(500).send({success:false, message:'Internal server error'});
    } 
    else {
      if (response.statusCode == 200) {
        lista = JSON.parse(body).genres;
        console.log(lista);
        console.log(genre);
        var trovato=0;
        // cerco l'id del genere per le richiesta successiva
        for (var i=0; i<lista.length; i++){
          if (genre == lista[i].name){
            console.log("qui");
            trovato=1;
            genre_id=lista[i].id
            break;
          }
        }

        // Se il dato inserito non è corretto 
        if (!trovato){
          res.status(404).send({success:false, error: 'Genre not found'});
        }

        else{
          // richiesta del film secondo dall'id del genere
          option = {
            url: 'https://api.themoviedb.org/3/discover/movie?api_key='+process.env.FILM_KEY+'&language=it-IT&sort_by=popularity.desc&with_genres='+genre_id, // rendere segreta la chiave 
          }
    
          request.get(option,function(error, response, body){
            if(error) {
              res.status(500).send({success:false, message:'Internal server error'});
            } else {
              if (response.statusCode == 200) {
                var info = JSON.parse(body);
                i = Math.round(Math.random()*2); // numero casuale tra 0 e 2 (primi 3 film)
                suggerito = info.results[i].title;
                res.status(200).send({success: true, recommended: suggerito});
              }
            }
          });
        }
      }
      else{
        res.status(500).send({success:false, message:'Internal server error'});
      }
    }
  });
});


app.get("/api/topten", function(req, res){
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
      res.status(500).send({success:false, message:'Internal server error'});
    }
    else{
      var info = JSON.parse(body);
      if (info.error!=undefined){
        res.status(500).send({success:false, message:'Internal server error'});
      }
      else{
        const list =[];
        for (var i=0; i<info.length;i++){
          var result = {list: i+1, name: info[i].name};
          list.push(result);
        }
        res.status(200).send({success: true, recommended: list});
      }
    }
  });
});

/* ************************************ FINE REST API ********************************************* */

/* ********************************* DEFINIZIONE DELLA PORTA ****************************************** */

app.use(function(req, res, next){
  res.status(404).redirect('/error?cod_status='+404);
});

server.listen(port);
