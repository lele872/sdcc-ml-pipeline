resource "aws_s3_bucket" "raw" {
  bucket = "sdcc-raw"

  tags = {
    Progetto = "sdcc-ml-pipeline"
    Fase     = "1-trigger"
  }
}

resource "aws_s3_bucket" "processed" {
  bucket = "sdcc-processed"

  tags = {
    Progetto = "sdcc-ml-pipeline"
    Fase     = "2-preprocessing"
  }
}

resource "aws_s3_bucket" "models" {
  bucket = "sdcc-models"

  tags = {
    Progetto = "sdcc-ml-pipeline"
    Fase     = "3-training"
  }
}

resource "aws_s3_bucket" "quarantine" {
  bucket = "sdcc-quarantine"

  tags = {
    Progetto = "sdcc-ml-pipeline"
    Uso      = "file-rifiutati"
  }
}
