# 🧰 Onboarding Kit — SDCC ML Pipeline

Guida **non tecnica** per preparare la macchina a far girare questo progetto.
Per ogni strumento trovi: a cosa serve, come si installa e come verifici che funzioni.

> 💡 Non serve installare tutto in un colpo solo: la tabella "Quando serve" ti dice
> da quale step del progetto diventa necessario.

## Riepilogo

| # | Strumento | A cosa serve | Quando serve |
|---|-----------|--------------|--------------|
| 1 | Docker Desktop (o OrbStack) | Fa girare l'emulatore AWS di Floci | Subito |
| 2 | Make + Makefile plugin | Scorciatoie per i comandi (`make up`, `make scan`) | Subito |
| 3 | Node.js + npm | Fa girare Nx (i task del progetto) | Subito |
| 4 | Git | Versionamento del codice | Subito |
| 5 | AWS CLI | Comandi "AWS" (creazione bucket, Lambda, ecc.) | Fase 1 in poi |
| 6 | Python 3 + venv | Le funzioni Lambda e il machine learning | Fase 2 in poi |
| 7 | Trivy (opzionale) | Scansione sicurezza immagini Docker | Opzionale |
| 8 | Terraform | Creazione delle risorse AWS (bucket, Lambda, IAM) come codice | Da subito (infra) |
| 9 | IDE / editor | Scrivere il codice | Subito |

---

## 1. Docker Desktop (o OrbStack)

**Cosa fa**: esegue i "contenitori" — scatole chiuse che fanno girare software
(in questo caso l'emulatore AWS Floci) senza installarlo sul Mac.

**Installazione**: scarica Docker Desktop da https://www.docker.com/products/docker-desktop/
oppure, come alternativa più leggera su Mac, OrbStack: https://orbstack.dev

**Verifica** (terminale):

```bash
docker --version        # aspettati: Docker version 2x.x
docker compose version  # deve rispondere senza errori
```

---

## 2. Make (+ plugin per l'IDE)

**Cosa fa**: esegue le scorciatoie definite nel `Makefile` del progetto.
Invece di ricordare comandi lunghi scrivi `make up`, `make scan`, ecc.

**Installazione su macOS**: è incluso nei "Command Line Tools" di Apple:

```bash
xcode-select --install
```

**Plugin IDE (consigliato)**: per vedere ed eseguire i target del Makefile
direttamente dall'editor, come fai con i target Nx:
- **IntelliJ IDEA / WebStorm**: plugin built-in "Makefile" (attivo di default; se
  non vedi il pannello: Settings → Plugins → cerca "Makefile")
- **VS Code**: estensione "Makefile Tools" (Microsoft) dal marketplace

**Verifica**:

```bash
make --version   # aspettati: GNU Make 3.x o 4.x
```

---

## 3. Node.js + npm

**Cosa fa**: Nx (il runner di task del progetto) gira sopra Node.js.
npm arriva insieme a Node.

**Installazione**: scarica la versione "LTS" da https://nodejs.org
(con Homebrew: `brew install node`)

**Verifica**:

```bash
node --version   # aspettati: v20 o superiore
npm --version
```

Nota: il progetto usa Nx in modalità "standalone" (`nx init`): non serve
`npm install` a mano, Nx scarica da sé quello che gli serve in `.nx/installation`.

---

## 4. Git

**Cosa fa**: salva la storia del codice, indispensabile per la consegna.

**Installazione**: su macOS arriva con i Command Line Tools (vedi punto 2).

**Verifica**:

```bash
git --version
```

---

## 5. AWS CLI

**Cosa fa**: il terminale "AWS". La useremo per creare bucket S3, funzioni
Lambda e permessi IAM — tutti puntati sull'emulatore locale Floci, quindi
**nessun account AWS né carta di credito necessari**.

**Installazione** (Homebrew):

```bash
brew install awscli
```

**Verifica**:

```bash
aws --version    # aspettati: aws-cli/2.x
```

---

## 6. Python 3 (+ venv)

**Cosa fa**: linguaggio delle funzioni Lambda e del machine learning
(libreria scikit-learn). Su macOS è già presente; servirà anche `pip`.

**Verifica**:

```bash
python3 --version   # 3.10 o superiore
python3 -m pip --version
```

Se manca: https://www.python.org/downloads/ (o `brew install python`).

---

## 7. Trivy (opzionale)

**Cosa fa**: cerca vulnerabilità di sicurezza nelle immagini Docker.

**Perché opzionale**: se non lo installi, il target `scan:image` usa da solo
un contenitore Trivy scaricato al volo — funziona uguale, solo la prima
volta è più lenta.

**Installazione** (Homebrew):

```bash
brew install trivy
```

**Verifica**:

```bash
trivy --version
```

---

## 8. Terraform

**Cosa fa**: crea le risorse AWS del progetto (bucket S3, ruoli IAM, funzioni Lambda) a partire da file di configurazione — l'equivalente dichiarativo di "questa è l'infrastruttura che voglio", e lui la crea/aggiorna. Nel progetto è puntato su Floci, quindi lavora solo in locale.

**Installazione** (Homebrew):

```bash
brew install terraform
```

**Plugin IDE consigliato**:
- **WebStorm**: plugin **HashiCorp Terraform / HCL** (Settings → Plugins → Marketplace)
- **VS Code**: estensione ufficiale **HashiCorp Terraform**

**Verifica**:

```bash
terraform version   # 1.6 o superiore
```

## 9. IDE / editor

Qualsiasi editor va bene. Consigliati:
- **WebStorm Community Edition** (gratuito) — perfetto per la parte frontend/React e per il Makefile; è quello che usiamo in questo progetto
- **VS Code** — estensioni: Python, Makefile Tools, Docker. Utile come secondo editor per la parte Python (le Lambda), che WebStorm non supporta nativamente

---

## ✅ Checklist finale

Copia-incolla questa riga nel terminale: controlla in un colpo solo che
tutto sia a posto:

```bash
for c in docker node npm make aws python3 git trivy; do printf "%-8s: " $c; command -v $c >/dev/null && echo OK || echo MANCANTE; done
```

Se tutte le righe dicono `OK` sei pronto. Poi:

```bash
make up      # avvia l'emulatore AWS locale
make scan    # (opzionale) scansione sicurezza immagini
```
