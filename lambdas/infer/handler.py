import io
import json

import boto3
import joblib
import pandas as pd

s3 = boto3.client("s3")

BUCKET_MODELS = "sdcc-models"

FEATURE = [
    "S1_Temp",
    "S2_Temp",
    "S3_Temp",
    "S4_Temp",
    "S1_Light",
    "S2_Light",
    "S3_Light",
    "S4_Light",
    "S1_Sound",
    "S2_Sound",
    "S3_Sound",
    "S4_Sound",
    "S5_CO2",
    "S5_CO2_Slope",
    "S6_PIR",
    "S7_PIR",
    "Ora",
    "GiornoSettimana",
]

MODELLO = None
SCALER = None
CHIAVE_MODELLO_USATO = None


def trova_ultimo_modello() -> str:
    risposta = s3.list_objects_v2(Bucket=BUCKET_MODELS, Prefix="", Delimiter="/")
    modelli = [
        obj
        for obj in risposta.get("Contents", [])
        if obj["Key"].endswith("_modello.joblib")
    ]
    if not modelli:
        raise ValueError("Nessun modello addestrato disponibile nel bucket")

    return max(modelli, key=lambda obj: obj["LastModified"])["Key"]


def carica_modello() -> None:
    global MODELLO, SCALER, CHIAVE_MODELLO_USATO
    if MODELLO is not None:
        return

    CHIAVE_MODELLO_USATO = trova_ultimo_modello()
    obj_modello = s3.get_object(Bucket=BUCKET_MODELS, Key=CHIAVE_MODELLO_USATO)
    MODELLO = joblib.load(io.BytesIO(obj_modello["Body"].read()))

    scaler_key = CHIAVE_MODELLO_USATO.replace("_modello.joblib", "_scaler.joblib")
    obj_scaler = s3.get_object(Bucket=BUCKET_MODELS, Key=scaler_key)
    SCALER = joblib.load(io.BytesIO(obj_scaler["Body"].read()))

    if hasattr(SCALER, "feature_names_in_"):
        attese = list(SCALER.feature_names_in_)
        if attese != FEATURE:
            msg = f"Feature dello scaler {attese} diverse da quelle attese {FEATURE}"
            raise ValueError(msg)


def valida_lettura(lettura: dict) -> None:
    mancanti = [f for f in FEATURE if f not in lettura]
    if mancanti:
        raise ValueError(f"Feature mancanti nella richiesta: {mancanti}")

    for f in FEATURE:
        try:
            float(lettura[f])
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Feature '{f}' non numerica: {lettura[f]}") from exc


def lambda_handler(event: dict, _context: object) -> dict:
    try:
        corpo = json.loads(event.get("body", "{}"))
        valida_lettura(corpo)

        carica_modello()

        riga = pd.DataFrame([[float(corpo[f]) for f in FEATURE]], columns=FEATURE)
        riga_scalata = SCALER.transform(riga)

        predizione = MODELLO.predict(riga_scalata)[0]
        probabilita = MODELLO.predict_proba(riga_scalata)[0]

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "persone_predette": int(predizione),
                    "modello_usato": CHIAVE_MODELLO_USATO,
                    "probabilita_per_classe": {
                        str(c): round(float(p), 3)
                        for c, p in zip(MODELLO.classes_, probabilita, strict=False)
                    },
                }
            ),
        }
    except ValueError as exc:
        return {"statusCode": 400, "body": json.dumps({"errore": str(exc)})}


if __name__ == "__main__":
    esempio = {
        "body": json.dumps(
            {
                "S1_Temp": 25.0,
                "S2_Temp": 24.9,
                "S3_Temp": 24.8,
                "S4_Temp": 25.1,
                "S1_Light": 121,
                "S2_Light": 34,
                "S3_Light": 53,
                "S4_Light": 40,
                "S1_Sound": 0.9,
                "S2_Sound": 0.5,
                "S3_Sound": 0.2,
                "S4_Sound": 0.1,
                "S5_CO2": 700,
                "S5_CO2_Slope": 0.5,
                "S6_PIR": 1,
                "S7_PIR": 1,
                "Ora": 10,
                "GiornoSettimana": 4,
            }
        )
    }
    print(json.dumps(json.loads(lambda_handler(esempio, None)["body"]), indent=2))
