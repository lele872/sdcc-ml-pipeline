import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent.parent
CSV_IN = ROOT / "data" / "processed" / "Occupancy_Estimation_processed.csv"
SCALER_IN = ROOT / "data" / "processed" / "scaler.joblib"
CARTELLA_OUT = ROOT / "data" / "models"
COLONNA_TARGET = "Room_Occupancy_Count"


def carica_dati() -> tuple[pd.DataFrame, pd.Series]:
    df: pd.DataFrame = pd.read_csv(CSV_IN)
    X = df.drop(columns=[COLONNA_TARGET])
    y = df[COLONNA_TARGET]
    print(f"Caricato {CSV_IN.name}: {len(df)} righe, {X.shape[1]} feature")
    return X, y


def addestra_e_valuta(X_train, X_test, y_train, y_test, nome: str, modello) -> dict:
    modello.fit(X_train, y_train)
    predizioni = modello.predict(X_test)
    return {
        "modello": nome,
        "accuratezza": accuracy_score(y_test, predizioni),
        "f1_macro": f1_score(y_test, predizioni, average="macro"),
        "report": classification_report(y_test, predizioni, output_dict=True),
    }


def main() -> None:
    X, y = carica_dati()

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
        print(f"\n--- {nome} ---")
        print(f"Accuratezza: {risultato['accuratezza']:.3f}")
        print(f"F1 macro:    {risultato['f1_macro']:.3f}")
        print(classification_report(y_test, modello.predict(X_test)))

    migliore, modello_migliore = max(risultati, key=lambda c: c[0]["f1_macro"])

    CARTELLA_OUT.mkdir(parents=True, exist_ok=True)
    joblib.dump(modello_migliore, CARTELLA_OUT / "modello.joblib")
    scaler = joblib.load(SCALER_IN)
    joblib.dump(scaler, CARTELLA_OUT / "scaler.joblib")

    metadata = {
        "modello_scelto": migliore["modello"],
        "metriche": {k: v for k, v in migliore.items() if k != "report"},
        "feature": list(X.columns),
        "classi": sorted(y.unique().tolist()),
        "report_completo": migliore["report"],
    }
    report_json = json.dumps(metadata, indent=2, default=str)
    (CARTELLA_OUT / "metadata.json").write_text(report_json)

    print(f"\nScelto {migliore['modello']} (F1 macro {migliore['f1_macro']:.3f})")
    print(f"Modello e scaler salvati in {CARTELLA_OUT.name}/")


if __name__ == "__main__":
    main()
