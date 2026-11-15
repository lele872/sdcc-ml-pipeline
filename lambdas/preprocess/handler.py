import io
import json
from pathlib import Path

import boto3
import joblib
import pandas as pd
from sklearn.preprocessing import StandardScaler

s3 = boto3.client("s3")

BUCKET_RAW = "sdcc-raw"
BUCKET_PROCESSED = "sdcc-processed"
COLONNA_TARGET = "Room_Occupancy_Count"
COLONNE_TEMPORALI = ["Date", "Time"]


def carica_dataset(event: dict) -> pd.DataFrame:
    record = event["Records"][0]
    bucket = record["s3"]["bucket"]["name"]
    chiave = record["s3"]["object"]["key"]

    oggetto = s3.get_object(Bucket=bucket, Key=chiave)
    df = pd.read_csv(oggetto["Body"])
    assert isinstance(df, pd.DataFrame)

    if COLONNA_TARGET not in df.columns:
        raise ValueError(f"Colonna target '{COLONNA_TARGET}' assente nel file {chiave}")
    return df


def gestisci_nulli(df: pd.DataFrame) -> pd.DataFrame:
    nulli_totali = int(df.isnull().sum().sum())
    if nulli_totali == 0:
        return df

    senza_target = df.drop(columns=[COLONNA_TARGET])
    colonne_numeriche = senza_target.select_dtypes("number").columns
    df[colonne_numeriche] = df[colonne_numeriche].fillna(df[colonne_numeriche].median())
    return df.dropna()


def encoding_categoriche(df: pd.DataFrame) -> pd.DataFrame:
    escluse = [COLONNA_TARGET, *COLONNE_TEMPORALI]
    categoriche = (
        df.drop(columns=escluse, errors="ignore")
        .select_dtypes(exclude="number")
        .columns.tolist()
    )
    if not categoriche:
        return df

    return pd.get_dummies(df, columns=categoriche, dtype=int)


def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    if not {"Date", "Time"}.issubset(df.columns):
        return df

    datetime_col = pd.to_datetime(df["Date"] + " " + df["Time"], errors="coerce")
    assert isinstance(datetime_col, pd.Series)
    df["Ora"] = datetime_col.dt.hour
    df["GiornoSettimana"] = datetime_col.dt.day_of_week
    return df.drop(columns=COLONNE_TEMPORALI)


def standardizza(df: pd.DataFrame) -> tuple[pd.DataFrame, StandardScaler]:
    feature = df.drop(columns=[COLONNA_TARGET])
    target = df[COLONNA_TARGET]

    scaler = StandardScaler()
    feature_scalate = pd.DataFrame(
        scaler.fit_transform(feature), columns=feature.columns, index=feature.index
    )
    return pd.concat([feature_scalate, target], axis=1), scaler


def salva_su_s3(df: pd.DataFrame, scaler: StandardScaler, chiave: str) -> str:
    base = Path(chiave).stem
    nome_csv = f"{base}_processed.csv"

    buffer_csv = io.BytesIO()
    df.to_csv(buffer_csv, index=False)
    s3.put_object(Bucket=BUCKET_PROCESSED, Key=nome_csv, Body=buffer_csv.getvalue())

    buffer_scaler = io.BytesIO()
    joblib.dump(scaler, buffer_scaler)
    s3.put_object(
        Bucket=BUCKET_PROCESSED, Key="scaler.joblib", Body=buffer_scaler.getvalue()
    )
    return nome_csv


def lambda_handler(event: dict, _context: object) -> dict:
    df = carica_dataset(event)
    righe_iniziali = len(df)

    df = gestisci_nulli(df)
    df = encoding_categoriche(df)
    df = feature_engineering(df)
    df, scaler = standardizza(df)

    chiave = event["Records"][0]["s3"]["object"]["key"]
    nome_csv = salva_su_s3(df, scaler, chiave)

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "file_output": nome_csv,
                "righe_iniziali": righe_iniziali,
                "righe_finali": len(df),
                "distribuzione_classi": df[COLONNA_TARGET]
                .value_counts()
                .sort_index()
                .to_dict(),
            },
            default=str,
        ),
    }
