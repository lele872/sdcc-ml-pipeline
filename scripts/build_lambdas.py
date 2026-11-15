import argparse
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / ".build"
LAMBDAS = ROOT / "lambdas"
PIP = ROOT / ".venv" / ("Scripts" if sys.platform == "win32" else "bin") / "pip"

DIPENDENZE = ["pandas", "scikit-learn", "joblib"]
DIPENDENZE_LAMBDA = {
    "scan": [],
}
PIATTAFORMMA_LAMBDA = "manylinux2014_aarch64"
PYTHON_LAMBDA = "3.12"
PRUNE_TESTS = ("scipy", "sklearn", "pandas")


def installa_librerie(dest: Path, nome: str) -> None:
    dipendenze = DIPENDENZE_LAMBDA.get(nome, DIPENDENZE)
    if not dipendenze:
        return
    subprocess.run(
        [
            str(PIP),
            "install",
            "-q",
            "--no-compile",
            "--target",
            str(dest),
            "--platform",
            PIATTAFORMMA_LAMBDA,
            "--python-version",
            PYTHON_LAMBDA,
            "--implementation",
            "cp",
            "--only-binary=:all:",
            *dipendenze,
        ],
        check=True,
    )


def pulisci_pacchetto(dest: Path) -> None:
    da_rimuovere = []
    for file in dest.rglob("*"):
        nome = file.as_posix()
        in_prune = any(f"/{lib}/" in nome or file.name == lib for lib in PRUNE_TESTS)
        if (in_prune and "/tests/" in nome) or nome.endswith(".pyc"):
            da_rimuovere.append(file)
    for file in da_rimuovere:
        if file.is_dir():
            shutil.rmtree(file, ignore_errors=True)
        else:
            file.unlink(missing_ok=True)


def comprimi(dest: Path, zip_path: Path) -> None:
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in dest.rglob("*"):
            if file.is_file():
                zf.write(file, file.relative_to(dest))


def build_lambda(nome: str) -> None:
    dest = BUILD / nome
    zip_path = BUILD / f"{nome}.zip"

    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)

    installa_librerie(dest, nome)

    for file in (LAMBDAS / nome).glob("*.py"):
        shutil.copy(file, dest)
    pulisci_pacchetto(dest)
    comprimi(dest, zip_path)

    print(
        f"Creato {zip_path.relative_to(ROOT)}: "
        f"{zip_path.stat().st_size / 1_048_576:.0f} MB"
    )


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Build dei pacchetti lambda")
    parser.add_argument(
        "--only", metavar="NOME", help="build solo della cartella lambdas/NOME"
    )
    args = parser.parse_args(argv)

    if args.only:
        if not (LAMBDAS / args.only).is_dir():
            parser.error(f"cartella lambdas/{args.only} non trovata")
        BUILD.mkdir(parents=True, exist_ok=True)
        zip_path = BUILD / f"{args.only}.zip"
        if zip_path.exists():
            zip_path.unlink()
        build_lambda(args.only)
        return

    if BUILD.exists():
        shutil.rmtree(BUILD)
    BUILD.mkdir(parents=True)

    for cartella in sorted(LAMBDAS.iterdir()):
        if cartella.is_dir():
            build_lambda(cartella.name)


if __name__ == "__main__":
    main()
