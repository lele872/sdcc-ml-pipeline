# Come è nato questo progetto

Questo documento racconta il progetto nella sua interezza: le scelte, i perché, e soprattutto gli errori che abbiamo fatto strada facendo. È pensato per chi deve capire il sistema ma anche per chi vuole imparare da quello che non ha funzionato al primo colpo.

## Il punto di partenza

Il progetto chiede una pipeline di machine learning completamente automatica: un dataset caricato sullo storage deve innescare, senza intervento umano, la pulizia dei dati, l'addestramento di un modello e un endpoint per usarlo in tempo reale. Il dataset scelto è il **Room Occupancy Estimation** della UCI: letture di sensori ambientali (quattro termometri, quattro sensori di luce, quattro microfoni, un sensore di CO₂ con la sua derivata, due sensori di movimento) campionate ogni trenta secondi in un'aula universitaria, con il numero di persone presenti come valore da prevedere. Diecimila righe, tutte le colonne già numeriche, un significato fisico immediato: la scelta è caduta qui perché permette di concentrarsi sull'architettura cloud senza impantanarsi nel preprocessing.

Prima di scrivere qualsiasi riga di infrastruttura, il problema di machine learning è stato affrontato in locale con un piccolo esperimento: caricare il CSV con pandas, separare le feature dal target, dividere i dati e addestrare una random forest. È stato l'esercizio più istruttivo di tutto il progetto, perché due errori classici sono emersi subito. Il primo: lasciando il target tra le feature, l'accuratezza risultava del 100% — non per bravura, ma perché il modello studiava col compito già svolto in mano (il cosiddetto *data leakage*). Il secondo: il dataset è fortemente sbilanciato (l'aula è vuota nell'81% delle letture), quindi l'accuratezza inganna — un modello sciocco che risponde sempre "vuota" partirebbe comunque dall'81%. Per questo la valutazione finale usa l'F1 macro, che pesa tutte le classi allo stesso modo, e la divisione train/test è stratificata.

Da qui la natura del problema: il numero di occupanti può valere solo 0, 1, 2 o 3, quindi si tratta di una **classificazione multi-classe**, non di una regressione — non esiste "2.7 persone". Tutte le scelte successive (estimator `Classifier` di scikit-learn, risposta dell'endpoint con le probabilità per classe) derivano da questa osservazione.

## L'infrastruttura locale

Sviluppare direttamente su AWS costa, richiede un account e rende il progetto irreproducibile per chi lo valuta. Abbiamo quindi lavorato con **Floci**, un emulatore AWS che espone le stesse API di S3, Lambda, IAM, SES, API Gateway e Cognito sulla porta 4566, con tanto di console web. Il codice non cambia di una riga tra emulatore e cloud reale: cambia solo l'endpoint a cui puntare. Questo ha permesso di rovinare l'ambiente decine di volte senza conseguenze — e in un progetto didattico è una libertà impagabile.

Le prime risorse erano create a colpi di AWS CLI. Funzionava, ma era fragile: nessuno stato, aggiornamenti a mano, `|| true` sparsi per tollerare i doppioni. La svolta è stata **Terraform**: l'infrastruttura descritta in file versione nel repository, un file per area (i bucket, il SES, i ruoli IAM, le funzioni, i trigger, l'API Gateway, Cognito), e `terraform apply` che converge verso lo stato desiderato. Il file `terraform.tfstate` fa da memoria di ciò che è stato creato, e i `plan` successivi mostrano solo le differenze. La configurazione del provider (credenziali di test, region, endpoint dell'emulatore per ogni servizio) vive in `vars.tf`: puntare al cloud reale significherebbe cambiare una mappa, non riscrivere il codice.

Anche il packaging delle funzioni Lambda ha insegnato qualcosa. Il runtime fornisce solo Python e boto3: tutto il resto — pandas, scikit-learn, numpy, scipy — deve viaggiare dentro lo zip insieme all'handler. Il primo pacchetto, costruito sul Mac, è fallito in AWS con un errore di import di numpy: conteneva le wheel per macOS e Python 3.15, mentre la Lambda gira in un container Linux con Python 3.12. La build ora installa esplicitamente le wheel `manylinux` per la versione giusta. Peso a parte: lo zip superava i 50 MB, limite dell'upload diretto, e il deploy passa quindi da S3, in un bucket dedicato agli artefatti — che è anche il flusso raccomandato da AWS per i pacchetti serii. Per tenere il peso sotto controllo lo script di build elimina le suite di test di scipy, sklearn e pandas; quelle di numpy no, perché numpy le importa davvero all'avvio.

Il bug più istruttivo di tutta la parte infrastrutturale riguarda le notifiche S3. Un bucket AWS ammette **una sola** configurazione di notifica: due risorse Terraform separate sullo stesso bucket (il trigger dello scan e quello del preprocessing, entrambi su `sdcc-raw`) si sovrascrivono a vicenda in silenzio — l'ultima applicata vince. Il file arrivato in `approved/` non faceva più scattare nulla. La correzione è un'unica notifica con più blocchi, filtrati per prefisso: `incoming/` sveglia lo scan, `approved/` sveglia il preprocessing.

## La sicurezza degli upload

Ogni file che entra nel sistema viene controllato prima di toccare la pipeline. Il punto di partenza è una considerazione semplice: i controlli lato browser sono esperienza utente, non sicurezza — chiunque con `curl` li aggira. Tutto ciò che decide davvero sta lato server.

Il flusso segue il pattern classico del *bucket antivirus*: l'upload avviene sul prefisso `incoming/`, una Lambda dedicata lo esamina e, se è a posto, lo promuove al prefisso `approved/` dove parte il trigger del preprocessing; se qualcosa non torna, il file finisce nel bucket di quarantena e la pipeline si ferma. I controlli, in ordine: estensione `.csv`, dimensione massima di 50 MB (verificata con `head_object`, che legge solo i metadati senza scaricare il file), e scansione antivirus.

L'antivirus è **ClamAV**, eseguito come servizio separato nel docker-compose: la Lambda gli invia il file via socket con il protocollo INSTREAM, usando solo la standard library — quindi il pacchetto di questa Lambda pesa un paio di kilobyte contro i sessanta megabyte delle sorelle. I test sono stati fatti con l'EICAR, la firma standard con cui si collaudano gli antivirus: un CSV legittimo viene approvato e processato, un file con estensione sbagliata fermato prima ancora della scansione, e lo stesso file infetto mascherato da `.csv` riconosciuto e messo in quarantena.

## Aprire il sistema al mondo

L'inferenza doveva essere raggiungibile via HTTP. L'abbiamo esposta nel modo AWS: un **API Gateway** (REST, integrazione `AWS_PROXY`) che invoca la Lambda di inferenza su `POST /predici`. La Lambda sceglie da sola il modello più recente nel bucket, lo tiene in cache tra le invocazioni, e trasforma i dati in ingresso con lo **stesso scaler** usato in addestramento — un dettaglio che non è estetica: predire con feature trasformate diversamente da come il modello le ha imparate produce risultati senza senso. Per questo lo scaler viene salvato accanto al modello, con un nome legato al singolo addestramento, e la verifica di coerenza delle feature è esplicita.

Il browser però non può chiamare né Floci né l'API Gateway direttamente: servirebbero credenziali AWS lato client, cosa che non si fa mai. Tra frontend e cloud c'è quindi un livello di microservizi NestJS — cinque, uno per competenza: autenticazione, inferenza, upload, log, health. Condividono una libreria interna con gli **schema zod** che descrivono richieste e risposte: gli stessi schema validano i dati sul backend e sul frontend, importato via alias dal build di Vite. Un contratto unico, due esecutori.

L'ingresso è **Traefik**: un reverse proxy che scopre i container dalle label Docker e si costruisce le rotte da solo. Aggiungere un microservizio significa aggiungere un servizio al compose con due label, niente configurazione centralizzata. La dashboard su porta 8080 mostra i router live — nei sistemi distribuiti veder girare il traffico non ha prezzo. L'autenticazione non è demandata al gateway: i token li emette **Cognito** (JWT firmati RS256, verificati da ogni microservizio con la chiave pubblica del pool) e Traefik instrada e basta.

La cosa che sembra banale e non lo è: il sistema ha tre livelli di instradamento, con tre filosofie diverse. Traefik per le API del frontend verso i microservizi (HTTP, autenticazione applicativa). API Gateway per l'accesso serverless alle Lambda. I trigger S3 per la pipeline, dove nessuno chiama nessuno: sono i dati che, arrivando, fanno succedere le cose.

## Il frontend

L'interfaccia è in React con Ant Design, tema scuro. Quattro sezioni: il login, l'inferenza, l'upload e i log. L'inferenza è il cuore: i diciotto sensori raggruppati in card tematiche (temperatura, luce, suono, CO₂, movimento, orario) e quattro scenari precompilati — aula vuota, lezione piena, studio tranquillo, sera — per provare il modello con un click. Il risultato appare centrato a schermo: il numero di persone in cifra grande, le probabilità per ciascuna classe come barre, il nome del modello usato, e un pulsante per ripetere la prova. La sezione upload valida estensione e dimensione anche lato client (per l'esperienza, la sicurezza sta dietro), e i log mostrano la cronologia delle Lambda con i colori degli esiti; cliccando una riga si apre il dettaglio con il JSON formattato.

## I test

Tutto il flusso è certificato da uno script di test end-to-end che prova l'intera catena: login, caricamento di un CSV buono con attesa della sua promozione e del modello addestrato, caricamento di un file infetto con verifica della quarantena, inferenza valida e invalida, log. Dodici controlli, tutti verdi, eseguibili con un comando — il che significa che la stessa dimostrazione si può ripetere il giorno dell'esame senza fede, solo prove.

Anche i test hanno insegnato: la prima versione falliva su quattro controlli perché NestJS risponde 201 alle POST di default e lo script pretendeva 201... no, 200 — ed era giusto pretendere 200, quindi il backend è stato corretto con `@HttpCode`. E un falso positivo è nato da un nome file ambiguo tra upload buono e infetto: la lezione è che nei test i nomi contano come i contenuti.

## Quello che questo progetto ci ha insegnato

Raccolti in ordine sparso, gli inciampi veri, quelli che non si dimenticano:

- **Il data leakage rende tutto troppo bello**: un'accuratezza del 100% non è una vittoria, è un campanello d'allarme.
- **Le classi sbilanciate ingannano l'accuratezza**: serve l'F1 macro, e serve dirlo in relazione.
- **Le wheel sono per piattaforma e versione**: un pacchetto costruito su macOS non gira in una Lambda Linux, e viceversa.
- **S3 ammette una sola notifica per bucket**: più risorse sulla stessa notifica si sovrascrivono in silenzio.
- **L'emulatore non impone l'IAM**: una policy incompleta funziona uguale su Floci e morirebbe al primo accesso su AWS. Il contrario di un test.
- **La cache di build mente**: una build che passa in locale può nascondere errori già corretti; pulire `dist` prima di fidarsi.
- **L'import "type" ammazza la dependency injection**: NestJS ha bisogno degli import veri per iniettare; un formatter troppo zelante li trasforma e il container non parte.
- **I controlli lato client sono cortesia, quelli lato server sono sicurezza**.
- **Le ancore YAML vanno bene per configurazioni identiche**, non per configurazioni quasi identiche: un `PORT` ereditato vale un'ora di debug.
