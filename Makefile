.PHONY: up down reset scan

up:      ## Avvia l'infrastruttura locale (floci + ui + init)
	docker compose --profile infra up -d

down:    ## Stop dell'infrastruttura
	docker compose --profile infra down

reset:   ## Stop + cancella tutti i dati locali (bucket, stato floci)
	docker compose --profile infra down && rm -rf .docker-data

scan:    ## Scansione vulnerabilita' immagini (target Nx scan:image)
	./nx run scan:image
