import subprocess, time
PGCTL = '/home/z/.venv/lib/python3.12/site-packages/pgserver/pginstall/bin/pg_ctl'
DATA = '/tmp/pgdata'
r = subprocess.run([PGCTL, 'status', '-D', DATA], capture_output=True, text=True)
if 'server is running' in r.stdout or 'PID' in r.stdout:
    subprocess.run([PGCTL, 'stop', '-D', DATA, '-m', 'fast'], capture_output=True)
    time.sleep(2)
subprocess.run([PGCTL, 'start', '-D', DATA, '-l', '/tmp/pglog.txt'], capture_output=True)
time.sleep(3)
print('postgres TCP started', flush=True)
time.sleep(28800)
