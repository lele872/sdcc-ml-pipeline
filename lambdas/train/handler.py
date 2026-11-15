import io
import json

import boto3
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split

s3 = boto3.client("s3")
ses = boto3.client("ses")

BUCKET_PROCESSED = "sdcc-processed"
BUCKET_MODELS = "sdcc-models"
COLONNA_TARGET = "Room_Occupancy_Count"
MITTENTE_SES = "training@sdcc-local.dev"
DESTINATARIO_SES = "studente@sdcc-local.dev"


def carica_dataset(event: dict) -> tuple[pd.DataFrame, str]:
    record = event["Records"][0]
    chiave = record["s3"]["object"]["key"]
    oggetto = s3.get_object(Bucket=BUCKET_PROCESSED, Key=chiave)
    df = pd.read_csv(oggetto["Body"])
    assert isinstance(df, pd.DataFrame)
    return df, chiave


def addestra_e_valuta(X_train, X_test, y_train, y_test, nome, modello):
    modello.fit(X_train, y_train)
    predizioni = modello.predict(X_test)
    return {
        "modello": nome,
        "accuratezza": accuracy_score(y_test, predizioni),
        "f1_macro": f1_score(y_test, predizioni, average="macro"),
        "report": classification_report(y_test, predizioni, output_dict=True),
    }


def allena(df: pd.DataFrame) -> tuple[dict, object]:
    X = df.drop(columns=[COLONNA_TARGET])
    y = df[COLONNA_TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    candidati = [
        ("RandomForest", RandomForestClassifier(n_estimators=100, random_state=42)),
        ("LogisticRegression", LogisticRegression(max_iter=1000, random_state=42)),
    ]

    risultati = []
    for nome, modello in candidati:
        risultato = addestra_e_valuta(X_train, X_test, y_train, y_test, nome, modello)
        risultati.append((risultato, modello))

    return max(risultati, key=lambda c: c[0]["f1_macro"])


def salva_su_s3(migliore, modello, chiave_csv: str) -> str:
    base = chiave_csv.replace("_processed.csv", "")
    nome_modello = f"{base}_modello.joblib"

    buffer = io.BytesIO()
    joblib.dump(modello, buffer)
    s3.put_object(Bucket=BUCKET_MODELS, Key=nome_modello, Body=buffer.getvalue())

    scaler = s3.get_object(Bucket=BUCKET_PROCESSED, Key="scaler.joblib")
    s3.put_object(
        Bucket=BUCKET_MODELS, Key=f"{base}_scaler.joblib", Body=scaler["Body"].read()
    )

    metadata = {
        "modello_scelto": migliore["modello"],
        "metriche": {k: v for k, v in migliore.items() if k != "report"},
        "report_completo": migliore["report"],
        "file_training": chiave_csv,
    }
    s3.put_object(
        Bucket=BUCKET_MODELS,
        Key="metadata.json",
        Body=json.dumps(metadata, indent=2, default=str),
    )
    return nome_modello


def invia_notifica(migliore, nome_modello: str) -> dict:
    return ses.send_email(
        Source=MITTENTE_SES,
        Destination={"ToAddresses": [DESTINATARIO_SES]},
        Message={
            "Subject": {"Data": "Training completato"},
            "Body": {
                "Text": {
                    "Data": (
                        f"Il training e' terminato.\n\n"
                        f"Modello scelto: {migliore['modello']}\n"
                        f"Accuratezza: {migliore['accuratezza']:.3f}\n"
                        f"F1 macro: {migliore['f1_macro']:.3f}\n"
                        f"Salvato come: {nome_modello}"
                    )
                }
            },
        },
    )


def lambda_handler(event: dict, _context: object) -> dict:
    df, chiave = carica_dataset(event)
    migliore, modello = allena(df)
    nome_modello = salva_su_s3(migliore, modello, chiave)
    invia_notifica(migliore, nome_modello)

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "modello_scelto": migliore["modello"],
                "metriche": {k: v for k, v in migliore.items() if k != "report"},
                "file_modello": nome_modello,
            },
            default=str,
        ),
    }
