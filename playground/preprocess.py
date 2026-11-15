import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parent.parent
CSV_IN = ROOT / "data" / "raw" / "Occupancy_Estimation.csv"
CARTELLA_OUT = ROOT / "data" / "processed"
COLONNA_TARGET = "Room_Occupancy_Count"
COLONNE_TEMPORALI = ["Date", "Time"]


def carica_dataset(percorso: Path) -> pd.DataFrame:
    if not percorso.exists():
        raise FileNotFoundError(f"Dataset non trovato: {percorso}")

    df: pd.DataFrame = pd.read_csv(percorso)

    if COLONNA_TARGET not in df.columns:
        trovate = list(df.columns)
        msg = f"Colonna target '{COLONNA_TARGET}' assente, trovate: {trovate}"
        raise ValueError(msg)
    print(f"Caricato {percorso.name}: {df.shape[0]} righe x {df.shape[1]} colonne")
    return df


def gestisci_nulli(df: pd.DataFrame) -> pd.DataFrame:
    nulli_totali = int(df.isnull().sum().sum())
    if nulli_totali == 0:
        print("Nessun valore nullo, il dataset è già pulito")
        return df

    righe_prima = len(df)
    senza_target = df.drop(columns=[COLONNA_TARGET])
    colonne_numeriche = senza_target.select_dtypes("number").columns
    df[colonne_numeriche] = df[colonne_numeriche].fillna(df[colonne_numeriche].median())
    df = df.dropna()
    print(f"Rimossi {nulli_totali} valori nulli, righe: {righe_prima} -> {len(df)}")
    return df


def encoding_categoriche(df: pd.DataFrame) -> pd.DataFrame:
    categoriche = (
        df.drop(columns=[COLONNA_TARGET, *COLONNE_TEMPORALI], errors="ignore")
        .select_dtypes(exclude="number")
        .columns.tolist()
    )
    if not categoriche:
        print("Nessuna colonna categorica da encodare")
        return df

    df = pd.get_dummies(df, columns=categoriche, dtype=int)
    print(f"Encoding one-hot di: {categoriche}")
    return df


def feature_engineering(df: pd.DataFrame) -> pd.DataFrame:
    if not {"Date", "Time"}.issubset(df.columns):
        print("Colonne Date/Time assenti, si prosegue senza")
        return df

    datetime_col = pd.to_datetime(df["Date"] + " " + df["Time"], errors="coerce")
    df["Ora"] = datetime_col.dt.hour
    df["GiornoSettimana"] = datetime_col.dt.day_of_week
    df = df.drop(columns=COLONNE_TEMPORALI)
    print("Derivate le feature Ora e GiornoSettimana da Date/Time")
    return df


def standardizza(df: pd.DataFrame) -> tuple[pd.DataFrame, StandardScaler]:
    feature = df.drop(columns=[COLONNA_TARGET])
    target = df[COLONNA_TARGET]

    scaler = StandardScaler()
    feature_scalate = pd.DataFrame(
        scaler.fit_transform(feature), columns=feature.columns, index=feature.index
    )
    df_out = pd.concat([feature_scalate, target], axis=1)
    print(f"[5] Standardizzate {feature.shape[1]} feature (media 0, dev.std 1)")
    return df_out, scaler


def salva(df: pd.DataFrame, scaler: StandardScaler, report: dict) -> None:
    CARTELLA_OUT.mkdir(parents=True, exist_ok=True)

    percorso_csv = CARTELLA_OUT / "Occupancy_Estimation_processed.csv"
    df.to_csv(percorso_csv, index=False)

    percorso_scaler = CARTELLA_OUT / "scaler.joblib"
    joblib.dump(scaler, percorso_scaler)

    percorso_report = CARTELLA_OUT / "report.json"
    percorso_report.write_text(json.dumps(report, indent=2, default=str))

    print(f"File salvati in {CARTELLA_OUT}:")
    print(f"- {percorso_csv.name} ({len(df)} righe)")
    print(f"- {percorso_scaler.name}")
    print(f"- {percorso_report.name}")


def main() -> None:
    df = carica_dataset(CSV_IN)
    righe_iniziali = len(df)

    df = gestisci_nulli(df)
    df = encoding_categoriche(df)
    df = feature_engineering(df)
    df, scaler = standardizza(df)

    report = {
        "file_input": CSV_IN.name,
        "righe_iniziali": righe_iniziali,
        "righe_finali": len(df),
        "colonne_finali": list(df.columns),
        "distribuzione_classi": df[COLONNA_TARGET]
        .value_counts()
        .sort_index()
        .to_dict(),
    }
    salva(df, scaler, report)
    print("\nPreprocessing completato, dati pronti per il training")


if __name__ == "__main__":
    main()
