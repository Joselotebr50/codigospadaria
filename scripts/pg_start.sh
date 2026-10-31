#!/bin/bash
# Inicia PostgreSQL local persistente (dentro do projeto)
BIN=/home/z/.venv/lib/python3.12/site-packages/pgserver/pginstall/bin
PGDATA=/home/z/my-project/db/pgdata
export PATH="$BIN:$PATH"

if [ ! -f "$PGDATA/PG_VERSION" ]; then
  echo "Inicializando novo cluster..."
  mkdir -p "$PGDATA"
  "$BIN/initdb" -D "$PGDATA" -U postgres --auth=trust > /dev/null 2>&1
  cat >> "$PGDATA/postgresql.conf" << CONF
listen_addresses = '127.0.0.1'
port = 5432
CONF
  cat >> "$PGDATA/pg_hba.conf" << HBA
host all all 127.0.0.1/32 trust
HBA
fi

if ! ss -tln 2>/dev/null | grep -q 5432; then
  "$BIN/pg_ctl" start -D "$PGDATA" -l /home/z/my-project/db/pg.log -o "-k $PGDATA" > /dev/null 2>&1
  sleep 2
fi

ss -tln 2>/dev/null | grep -q 5432 && echo "PG OK em 127.0.0.1:5432" || { echo "PG FALHOU"; tail -5 /home/z/my-project/db/pg.log; exit 1; }
