# MovieHub
Progetto svolto per il corso di Reti di Calcolatori 2021/22.

Membri del gruppo: Elena Bianchini (matricola 1796906), Simona Lai (matricola 1841636), Giuseppe Prisco (matricola 1895709)

## Scopo del progetto
La nostra Web App **MovieHub** intende fornire all'utente, in modo semplice e intuitivo, un tramite per ricevere informazioni dettagliate sui film. L’applicazione dà la possibilità di cercare il film di interesse a partire dal titolo, di conoscere i dieci più visti su Netflix e di interagire con una chat-bot in grado di suggerire cosa guardare una volta fornito il genere desiderato. Inoltre l’utente può iscriversi all’applicazione, attraverso un account Google, per usufruire di ulteriori funzionalità quali l’aggiunta di film ad una lista di preferiti oppure l’inserimento di un evento che ricordi il giorno in cui si desidera vedere un certo film sul proprio Google Calendar.

## Architettura di riferimento e tecnologie usate

### Requisiti di progetto
- [x] 1. Il servizio REST che implementate (SERV) deve offrire a terze parti delle API documentate;
- [x] 2. SERV si deve interfacciare con almeno due servizi REST di terze parti;
- [x] 3. Almeno uno dei servizi REST esterni deve essere “commerciale”;
- [x] 4. Almeno uno dei servizi REST esterni deve richiedere oauth;
- [x] 5. La soluzione deve prevedere l'uso di protocolli asincroni;
- [x] 6. Il progetto deve prevedere l'uso di Docker e l'automazione del processo di lancio, configurazione e test;
- [x] 7. Il progetto deve essere su GIT (GITHUB, GITLAB ...) e documentato con un README; 
- [x] 8. Deve essere implementata una forma di CI/CD;
- [x] 9. Requisiti minimi di sicurezza devono essere considerati e documentati.

### Tecnologie utilizzate
- Requisito 1:
	- Apidoc: utilizzato per fornire API documentate;
- Requisito 2:
	- TMDB API: utilizzate per ottenere varie informazioni sui film cercati dall'utente;
	- Netflix API: utilizzate per ottenere la top 10 dei film più guardati su Netflix;
- Requisiti 3 e 4:
	- Google: utilizzato per accedere al sito web tramite il protocollo Oauth;
	- Google Calendar: utilizzato per creare/aggiungere eventi al proprio calendario (tramite accesso Oauth);
- Requisito 5:
	- Websocket: utilizzata per implementare la chat-bot con cui un utente può interagire;
- Requisito 6: 
	- Docker: utilizzato per la creazione della Web App su più container e per l'automazione del processo di lancio;
- Requisito 7:
	- README.md: utilizzato per illustrare i punti fondamentali del progetto (scopo del progetto, tecnologie utilizzate ecc.);
	- GitHub: utilizzato per condividere i file e permettere al gruppo di lavorare allo stesso progetto contemporaneamente;
- Requisito 8: 
	- GitHub Actions: utilizzate per implementare una forma di CI/CD ed effettuare i test ogni qual volta viene svolta una push;
- Requisito 9:
	- Self-signed Certificate: utilizzati per ottenere una connessione sicura basata su https;


#### Altre tecnologie utilizzate
- CouchDB: utilizzato per il Data storage degli utenti;
- Node.js: utilizzato ger gestire il back-end della Web App;
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
<ins>WINDOWS e macOS</ins>: Installare Docker Desktop cliccando su https://www.docker.com/products/docker-desktop e NodeJS su https://nodejs.org/it/download.

<ins>UBUNTU</ins>: Aprire un terminale ed eseguire:
```
$ sudo apt install nodejs
$ sudo apt install docker 
$ sudo apt install docker-compose
```

Una volta completati questi passaggi possiamo passare alla configurazione del servizio **MovieHub** (si assume che sia stato installato Git).

Apriamo il terminale, rechiamoci nella directory in cui vogliamo clonare la repo ed eseguiamo i seguenti comandi:
```
$ git clone https://github.com/GiuseppePrisco/MovieHub.git
$ cd /MovieHub
$ sudo docker-compose up -d --build
```
A questo punto, eseguendo
```
$ sudo docker ps
```
dovremmo visualizzare la lista dei nostri 2 container (moviehub_nodejs, e couchdb).

Se il db users non è ancora stato inserito in CouchDB, inserirlo utilizzando la GUI al sito http://127.0.0.1:5984/_utils (loggarsi con user: admin, pass: admin), oppure eseguire il tutto da terminale:
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
Per effettuare il test automatico:

Come prima cosa spostarsi nella cartella src:
```
$ cd src/
```
Poi installare mocha:

```
$ sudo npm install -g mocha
```
Dopodiché eseguire:
```
$ npm test
```

## Documentazione delle API
La documentazione delle API fornite dalla nostra Web App è disponibile nel file index.html seguendo il percorso:

<ins>macOS</ins>
```
$ open ./src/apidoc/index.html
```
<ins>Windows</ins>
```
$ start ./src/apidoc/index.html
```
