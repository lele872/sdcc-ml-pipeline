import json
import os
import socket

import boto3

s3 = boto3.client("s3")

BUCKET_RAW = "sdcc-raw"
BUCKET_QUARANTENA = "sdcc-quarantine"
PREFISSO_INCOMING = "incoming/"
PREFISSO_APPROVED = "approved/"

ESTENSIONI_AMMESSE = (".csv",)
DIMENSIONE_MAX_BYTES = 50 * 1024 * 1024
CLAMD_HOST = os.environ.get("CLAMD_HOST", "clamav")
CLAMD_PORT = int(os.environ.get("CLAMD_PORT", "3310"))
CLAMD_TIMEOUT = 60
CHUNK_SIZE = 32768


def parametri_da_evento(event: dict) -> tuple[str, str]:
    record = event["Records"][0]
    bucket = record["s3"]["bucket"]["name"]
    chiave = record["s3"]["object"]["key"]
    return bucket, chiave


def controlla_estensione(chiave: str) -> None:
    if not chiave.lower().endswith(ESTENSIONI_AMMESSE):
        raise ValueError(f"Estensione non ammessa: {chiave}")


def controlla_dimensione(bucket: str, chiave: str) -> int:
    head = s3.head_object(Bucket=bucket, Key=chiave)
    dimensione = head["ContentLength"]
    if dimensione > DIMENSIONE_MAX_BYTES:
        raise ValueError(
            f"File troppo grande: {dimensione} bytes (max {DIMENSIONE_MAX_BYTES})"
        )
    return dimensione


def scansiona_con_clamav(corpo: bytes) -> str:
    with socket.create_connection(
        (CLAMD_HOST, CLAMD_PORT), timeout=CLAMD_TIMEOUT
    ) as sock:
        sock.sendall(b"zINSTREAM\0")
        for i in range(0, len(corpo), CHUNK_SIZE):
            chunk = corpo[i : i + CHUNK_SIZE]
            sock.sendall(len(chunk).to_bytes(4, "big"))
            sock.sendall(chunk)
        sock.sendall((0).to_bytes(4, "big"))

        risposta = b""
        while not risposta.endswith(b"\0"):
            parte = sock.recv(4096)
            if not parte:
                break
            risposta += parte
        return risposta.rstrip(b"\0").decode(errors="replace")


def sposta(bucket_src: str, chiave: str, bucket_dst: str, chiave_dst: str) -> None:
    s3.copy_object(
        Bucket=bucket_dst,
        Key=chiave_dst,
        CopySource={"Bucket": bucket_src, "Key": chiave},
    )
    s3.delete_object(Bucket=bucket_src, Key=chiave)


def lambda_handler(event: dict, _context: object) -> dict:
    bucket, chiave = parametri_da_evento(event)
    esito = "approvato"
    motivo = ""
    destinazione = ""

    try:
        controlla_estensione(chiave)
        dimensione = controlla_dimensione(bucket, chiave)

        oggetto = s3.get_object(Bucket=bucket, Key=chiave)
        corpo = oggetto["Body"].read()

        esito_clamav = scansiona_con_clamav(corpo)
        if "OK" in esito_clamav:
            nome = chiave.removeprefix(PREFISSO_INCOMING)
            sposta(bucket, chiave, BUCKET_RAW, PREFISSO_APPROVED + nome)
            destinazione = PREFISSO_APPROVED + nome
            motivo = f"pulito ({dimensione} bytes)"
        else:
            nome = chiave.removeprefix(PREFISSO_INCOMING)
            sposta(bucket, chiave, BUCKET_QUARANTENA, nome)
            esito = "quarantena"
            destinazione = f"{BUCKET_QUARANTENA}/{nome}"
            motivo = esito_clamav

    except ValueError as exc:
        sposta(
            bucket, chiave, BUCKET_QUARANTENA, chiave.removeprefix(PREFISSO_INCOMING)
        )
        esito = "quarantena"
        motivo = str(exc)
        destinazione = f"{BUCKET_QUARANTENA}/{chiave.removeprefix(PREFISSO_INCOMING)}"

    print(json.dumps({"file": chiave, "esito": esito, "motivo": motivo}))

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "file": chiave,
                "esito": esito,
                "motivo": motivo,
                "destinazione": destinazione,
            }
        ),
    }
