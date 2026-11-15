#!/usr/bin/env bash
# E2E test for SDCC pipeline: BFF + LocalStack S3 + Lambda pipeline
set -uo pipefail

export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_DEFAULT_REGION=eu-south-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

BFF="http://localhost:3000"
CSV="/Users/lele872/Personal_Work/training/data/raw/Occupancy_Estimation.csv"
TOKEN=""
PASS=0
FAIL=0
RESULTS=()

report() { # $1 name, $2 ok(0/1), $3 detail
  if [ "$2" -eq 0 ]; then
    echo "PASS $1"
    PASS=$((PASS+1)); RESULTS+=("PASS $1")
  else
    echo "FAIL $1 $3"
    FAIL=$((FAIL+1)); RESULTS+=("FAIL $1 :: $3")
  fi
}

wait_for() { # $1 desc, $2 max_wait, $3 check command (returns 0 when condition met)
  local waited=0
  while [ $waited -lt "$2" ]; do
    if bash -c "$3"; then return 0; fi
    sleep 5; waited=$((waited+5))
  done
  return 1
}

jsonget() { python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('$1',''))" 2>/dev/null; }

# 1. health
step_health() {
  local body code
  body=$(curl -s -w '\n%{http_code}' "$BFF/healthz")
  code=$(echo "$body" | tail -1)
  local status; status=$(echo "$body" | head -1 | jsonget status)
  [[ "$code" == 2* ]] && [ "$status" = "ok" ]
  report health $? "code=$code status=$status body=$(echo "$body"|head -1)"
}

# 2. swagger
step_swagger() {
  local code; code=$(curl -s -o /dev/null -w '%{http_code}' "$BFF/api/docs")
  [[ "$code" == 2* ]]
  report swagger $? "code=$code"
}

# 3. login ok
step_login_ok() {
  local body code
  body=$(curl -s -w '\n%{http_code}' -X POST "$BFF/api/login" -H 'Content-Type: application/json' -d '{"username":"admin","password":"Admin123!"}')
  code=$(echo "$body" | tail -1)
  TOKEN=$(echo "$body" | head -1 | jsonget token)
  [[ "$code" == 2* ]] && [ -n "$TOKEN" ]
  report login-ok $? "code=$code token='${TOKEN:0:20}...' body=$(echo "$body"|head -1|head -c 200)"
}

# 4. login ko
step_login_ko() {
  local code; code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BFF/api/login" -H 'Content-Type: application/json' -d '{"username":"admin","password":"Sbagliata1!"}')
  [ "$code" = "401" ]
  report login-ko $? "code=$code (expected 401)"
}

# 5. predici senza token
step_auth_ko() {
  local code; code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BFF/api/predici" -H 'Content-Type: application/json' -d '{}')
  [ "$code" = "401" ]
  report auth-ko $? "code=$code (expected 401)"
}

# 6. upload file buono
UPLOAD_KEY=""
step_upload_buono() {
  local body code
  body=$(curl -s -w '\n%{http_code}' -X POST "$BFF/api/upload" -H "Authorization: Bearer $TOKEN" -F "file=@$CSV;filename=buono_e2e.csv")
  code=$(echo "$body" | tail -1)
  UPLOAD_KEY=$(echo "$body" | head -1 | jsonget key)
  [[ "$code" == 2* ]] && [[ "$UPLOAD_KEY" == incoming/* ]]
  report upload-buono $? "code=$code key='$UPLOAD_KEY' body=$(echo "$body"|head -1|head -c 200)"
}

# 7. pipeline scan
step_pipeline_scan() {
  local fname; fname=$(basename "${UPLOAD_KEY:-incoming/e2e_test.csv}")
  wait_for approved 60 "aws s3 ls s3://sdcc-raw/approved/ 2>/dev/null | grep -q '$fname'"
  local incoming_empty; incoming_empty=$(aws s3 ls s3://sdcc-raw/incoming/ 2>/dev/null | grep -c "$fname" || true)
  [ "$incoming_empty" = "0" ]
  report pipeline-scan $? "approved check ok; incoming still contains '$fname' ($incoming_empty rows)"
}

# 8. pipeline modello
step_pipeline_modello() {
  local ok1=0 ok2=0
  wait_for model 120 "aws s3 ls s3://sdcc-models/ 2>/dev/null | grep -q '_modello.joblib'" && ok1=1
  wait_for processed 120 "aws s3 ls s3://sdcc-processed/ 2>/dev/null | grep -q 'e2e_test_processed.csv'" && ok2=1
  [ $ok1 -eq 1 ] && [ $ok2 -eq 1 ]
  report pipeline-modello $? "modello trovato=$ok1 processed trovato=$ok2; models: $(aws s3 ls s3://sdcc-models/ 2>/dev/null | tail -2 | tr '\n' ' '); processed: $(aws s3 ls s3://sdcc-processed/ 2>/dev/null | grep e2e_test | tail -1)"
}

# 9. upload infetto EICAR
step_upload_infetto() {
  printf 'X5O!P%%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > /tmp/eicar_e2e.csv
  local body code
  body=$(curl -s -w '\n%{http_code}' -X POST "$BFF/api/upload" -H "Authorization: Bearer $TOKEN" -F "file=@/tmp/eicar_e2e.csv;filename=eicar_mascherato.csv")
  code=$(echo "$body" | tail -1)
  if [[ "$code" != 2* ]]; then report upload-infetto 1 "upload failed code=$code body=$(echo "$body"|head -1|head -c 200)"; return; fi
  wait_for quarantine 60 "aws s3 ls s3://sdcc-quarantine/ 2>/dev/null | grep -q 'eicar_mascherato.csv'"
  local in_approved; in_approved=$(aws s3 ls s3://sdcc-raw/approved/ 2>/dev/null | grep -c 'eicar_mascherato.csv' || true)
  [ "$in_approved" = "0" ]
  report upload-infetto $? "quarantine ok; eicar_mascherato.csv presente in approved ($in_approved rows)"
}

# 10. predici ok
step_predici() {
  local body code
  body=$(curl -s -w '\n%{http_code}' -X POST "$BFF/api/predici" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
    -d '{"S1_Temp":25.6,"S2_Temp":25.5,"S3_Temp":25.4,"S4_Temp":25.8,"S1_Light":120,"S2_Light":95,"S3_Light":110,"S4_Light":88,"S1_Sound":0.85,"S2_Sound":0.79,"S3_Sound":0.81,"S4_Sound":0.74,"S5_CO2":1290,"S5_CO2_Slope":1.8,"S6_PIR":1,"S7_PIR":1,"Ora":10,"GiornoSettimana":4}')
  code=$(echo "$body" | tail -1)
  local pred; pred=$(echo "$body" | head -1 | jsonget persone_predette)
  [[ "$code" == 2* ]] && [ -n "$pred" ]
  report predici $? "code=$code persone_predette='$pred' body=$(echo "$body"|head -1|head -c 200)"
}

# 11. predici ko
step_predici_ko() {
  local code; code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BFF/api/predici" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"S1_Temp":"abc"}')
  [ "$code" = "400" ]
  report predici-ko $? "code=$code (expected 400)"
}

# 12. logs
step_logs() {
  local body code
  body=$(curl -s -w '\n%{http_code}' -G "$BFF/api/logs" --data-urlencode "group=/aws/lambda/sdcc-scan" --data-urlencode "limit=10" -H "Authorization: Bearer $TOKEN")
  code=$(echo "$body" | tail -1)
  [[ "$code" == 2* ]]
  report logs $? "code=$code body=$(echo "$body"|head -1|head -c 200)"
}

echo "=== E2E TEST START $(date '+%F %T') ==="
step_health
step_swagger
step_login_ok
step_login_ko
step_auth_ko
step_upload_buono
step_pipeline_scan
step_pipeline_modello
step_upload_infetto
step_predici
step_predici_ko
step_logs

echo ""
echo "=== RIEPILOGO ==="
for r in "${RESULTS[@]}"; do echo "$r"; done
echo "TOTALE: $((PASS+FAIL)) | PASS: $PASS | FAIL: $FAIL"
[ $FAIL -eq 0 ] && exit 0 || exit 1
