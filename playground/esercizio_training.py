from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

cartella_script = Path(__file__).resolve().parent
dataset_path = cartella_script.parent / "data" / "raw" / "Occupancy_Estimation.csv"
df: pd.DataFrame = pd.read_csv(dataset_path)

print("Com'è fatto il dataset:")
print("Righe e colonne:", df.shape)
print("\nTipi delle colonne:")
print(df.dtypes)
print("\nValori nulli per colonna (somma):")
print(df.isnull().sum())
print("\nQuante letture per ogni numero di occupanti:")
print(df["Room_Occupancy_Count"].value_counts().sort_index())

X = df.drop(columns=["Date", "Time", "Room_Occupancy_Count"])
y = df["Room_Occupancy_Count"]
print("\nSeparazione feature e target:")
print("Feature (X):", list(X.columns))
print("Target (y): Room_Occupancy_Count, valori possibili:", sorted(y.unique()))

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print("\nDivisione train/test:")
print("Righe per imparare (train):", len(X_train))
print("Righe per il voto (test):  ", len(X_test))

modello = RandomForestClassifier(n_estimators=100, random_state=42)
modello.fit(X_train, y_train)
print("\nTraining completato.")

predizioni = modello.predict(X_test)
acc = accuracy_score(y_test, predizioni)
print("\nValutazione sul test set:")
print(f"Accuratezza: {acc:.3f}  ({acc * 100:.1f}%)")

nuova_lettura = X_test.iloc[[0]]
print("\nProva dal vivo su una lettura mai vista:")
print("  Predizione:", modello.predict(nuova_lettura)[0], "persone")
print("  Probabilita' per classe:", modello.predict_proba(nuova_lettura)[0].round(3))
print("  Risposta vera:", y_test.iloc[0])
