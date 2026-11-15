import pandas as pd

from lambdas.preprocess.handler import (
    COLONNA_TARGET,
    encoding_categoriche,
    feature_engineering,
    gestisci_nulli,
    standardizza,
)


def dataset_base():
    return pd.DataFrame(
        {
            "S1_Temp": [24.0, 25.0, 26.0],
            "S5_CO2": [400, 500, 600],
            "S6_PIR": [0, 1, 0],
            "Stagione": ["estate", "inverno", "estate"],
            "Room_Occupancy_Count": [0, 1, 2],
        }
    )


def test_gestisci_nulli_dataset_pulito_non_tocca_nulla():
    df = dataset_base()
    assert gestisci_nulli(df) is df


def test_gestisci_nulli_riempie_con_mediana_e_butta_target_nullo():
    df = dataset_base()
    df.loc[1, "S1_Temp"] = None
    df.loc[2, COLONNA_TARGET] = None
    pulito = gestisci_nulli(df)
    assert pulito["S1_Temp"].isnull().sum() == 0
    assert pulito[COLONNA_TARGET].isnull().sum() == 0
    assert len(pulito) == 2


def test_encoding_categoriche_fa_one_hot():
    df = dataset_base()
    encodato = encoding_categoriche(df)
    assert "Stagione" not in encodato.columns
    assert "Stagione_estate" in encodato.columns
    assert encodato["Stagione_estate"].tolist() == [1, 0, 1]


def test_encoding_categoriche_con_solo_numeriche_restituisce_stesso_df():
    df = dataset_base().drop(columns=["Stagione"])
    assert encoding_categoriche(df) is df


def test_feature_engineering_deriva_ora_e_giorno():
    df = pd.DataFrame(
        {
            "Date": ["2017/12/22", "2018/01/11"],
            "Time": ["10:49:41", "08:59:39"],
            "S1_Temp": [24.0, 25.0],
            COLONNA_TARGET: [1, 0],
        }
    )
    risultato = feature_engineering(df)
    assert "Date" not in risultato.columns
    assert "Ora" in risultato.columns
    assert "GiornoSettimana" in risultato.columns
    assert risultato["Ora"].tolist() == [10, 8]
    assert risultato["GiornoSettimana"].tolist() == [4, 3]


def test_feature_engineering_senza_colonne_temporali_passa_oltre():
    df = pd.DataFrame({"S1_Temp": [24.0], COLONNA_TARGET: [0]})
    assert feature_engineering(df) is df


def test_standardizza_porta_media_a_zero():
    df = encoding_categoriche(dataset_base())
    risultato, scaler = standardizza(df)
    feature = risultato.drop(columns=[COLONNA_TARGET])
    valori = feature.to_numpy()
    assert abs(float(valori.mean())) < 1e-9
    assert abs(float(valori.std()) - 1.0) < 1e-9
    assert scaler.n_features_in_ == len(feature.columns)
