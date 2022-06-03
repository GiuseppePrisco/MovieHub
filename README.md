# MovieHub
Progetto svolto per il corso di Reti di Calcolatori 2021/22
Membri del gruppo: Elena Bianchini (matricola 1796906), Simona Lai (matricola 1841636), Giuseppe Prisco (matricola 1895709)

## Scopo del progetto
La nostra Web App **MovieHub** intende fornire all'utente in modo semplice e intuitivo un tramite per ricevere informazioni dettagliate sui film. Inoltre si possono ricevere notizie sui film più visti su Netflix oppure interagire con la nostra chat-bot per farsi suggerire un film di un determinato genere. L'utente può inoltre iscriversi al nostro sito con google per usufruire di ulteriori funzionalità quali l'aggiunta di un film ai preferiti visibili dal proprio profilo oppure l'inserimento nel proprio calendar di un reminder per guardare un film.

## Architettura di riferimento e tecnologie usate

### Requisiti di progetto
- [x] 1. Il servizio REST che implementate (lo chiameremo SERV) deve offrire a terze parti delle API documentate;
- [x] 2. SERV si deve interfacciare con almeno due servizi REST di terze parti (e.g. google maps);
- [x] 3. Almeno uno dei servizi REST esterni deve essere “commerciale” (es: twitter, google, facebook, pubnub,  parse, firbase etc);
- [x] 4. Almeno uno dei servizi REST esterni deve richiedere oauth (e.g. google calendar), Non è sufficiente usare oauth solo per verificare le credenziali è necessario accedere al servizio;
- [x] 5. La soluzione deve prevedere l'uso di protocolli asincroni. Per esempio Websocket e/o AMQP (o simili es MQTT);
- [x] 6. Il progetto deve prevedere l'uso di Docker e l'automazione del processo di lancio, configurazione e test;
- [x] 7. Il progetto deve essere su GIT (GITHUB, GITLAB ...) e documentato don un README che illustri almeno 
    - 1. scopo del progetto
    - 2. architettura di riferimento e tecnologie usate (con un diagramma)
    - 3. chiare indicazioni sul soddisfacimento dei requisiti
    - 4. istruzioni per l'installazione
    - 5. istruzioni per il test
    - 6. Documentazione delle API fornite per esempio con APIDOC
- [x] 8. Deve essere implementata una forma di CI/CD per esempio con le Github Actions;
- [x] 9. Requisiti minimi di sicurezza devono essere considerati e documentati. Self-signed certificate sono più che sufficienti per gli scopi del progetto.

### Tecnologie utilizzate
- Apidoc: utilizzato per fornire API documentate;
  - Soddisfa il requisito n°1;
- TMDB API: utilizzate per ottenere varie informazioni sui film cercati dall'utente;
- Netflix API: utilizzate per ottenere la top 10 dei film più guardati su Netflix;
  - Le 2 API sopra citate soddisfano il requisito n°2.
- Google: utilizzato per accedere al sito web tramite il protocollo Oauth;
  - Soddisfa il requisito n°3 e 4.
- Google Calendar: utilizzato per creare/aggiungere eventi al proprio calendario (tramite accesso Oauth);
  - Soddisfa il requisito n°3 e 4.
- Websocket: utilizzata per implementare la chat-bot con cui un utente può interagire;
  - Soddisfa il requisito n°5.
- Docker: utilizzato per la creazione della Web App su più container e per l'automazione del processo di lancio;
  - Soddisfa il requisito n°6.
- README.md: utilizzato per illustrare i punti fondamentali del progetto (scopo del progetto, tecnologie utilizzate ecc.);
- GitHub: utilizzato per condividere i file e permettere al gruppo di lavorare allo stesso progetto contemporaneamente;
  - Le 2 tecnologie sopra citate soddisfano il requisito n°7.
- GitHub Actions: utilizzate per implementare una forma di CI/CD ed effettuare i test ogni qual volta viene svolta una push;
  - Soddisfa il requisito n°8.
- Self-signed Certificate: utilizzati per ottenere una connessione sicura basata su https;
  - Soddisfa il requisito n°9.

#### Altre tecnologie utilizzate
- CouchDB: utilizzato per il Data storage degli utenti;
- Node.Js: utilizzato ger gestire il back-end della Web App;
- ejs: utilizzato come template per le pagine web;
- css: utilizzato per i fogli di stile per il front-end;
- Express.js: utilizzato come framework per la Web App;

Link API usate:
- TMDB: https://developers.themoviedb.org/3/getting-started/introduction
- Netflix: https://rapidapi.com/blog/directory/netflix/
- Google Oauth & Google Calendar: https://developers.google.com/calendar/api


### Schema
![Schema](./src/views/images/schema%20reti.png)

## Istruzioni per l'installazione
<ins>WINDOWS</ins>: Installare Docker Desktop cliccando su https://www.docker.com/products/docker-desktop e NodeJS su https://nodejs.org/it/download.

<ins>UBUNTU</ins>: Aprire un terminale ed eseguire sudo apt install nodejs, sudo apt install docker e sudo apt install docker-compose.

Una volta completati questi passaggi possiamo passare alla configurazione del servizio **MovieHub** (si assume che sia stato installato Git):
Apriamo il terminale, rechiamoci nella directory in cui vogliamo clonare la repo ed eseguiamo i seguenti comandi:
```
$ git clone https://github.com/GiuseppePrisco/MovieHub.git
$ cd /MovieHub
$ sudo docker-compose up -d --build
```
A questo punto, eseguendo sudo docker ps, dovremmo visualizzare la lista dei nostri 2 container (moviehub_nodejs, e couchdb).

Se il db users non è ancora stato inserito in couchdb, inserirlo utilizzando la GUI al sito http://127.0.0.1:5984/_utils (loggarsi con user: admin, pass: admin), oppure eseguire il tutto da terminale:
```
$ sudo docker container ps  //selezionare l'id del container di couchdb
$ sudo docker exec -it <container-name> /bin/bash
$ curl -X PUT http://admin:admin@127.0.0.1:5984/users
$ curl -X PUT http://admin:admin@127.0.0.1:5984/_users
$ curl -X PUT http://admin:admin@127.0.0.1:5984/_replicator
$ curl -X PUT http://admin:admin@127.0.0.1:5984/_global_changes
$ exit
```
Questi comandi permetteranno di scaricare i file, di configurare il nostro db se è il primo avvio e di scaricare tutti i moduli di NodeJS necessari al funzionamento del servizio che sarà accessibile cliccando su https://localhost:3000.

Per terminare:
```
$ ^[C]
$ sudo docker-compose down --remove
```

## Istruzioni per il test
Per effettuare il test:

Come prima cosa installare mocha:

```
$ sudo npm install -g mocha
```
Dopodiché eseguire:
```
$ mocha
```

## Documentazione delle API
La documentazione delle API fornite dalla nostra Web App è disponibile nel file index.html seguendo il percorso /src/apidoc/index.html