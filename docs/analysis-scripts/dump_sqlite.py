# -*- coding: utf-8 -*-
import sqlite3, sys
sys.stdout.reconfigure(encoding="utf-8")
db = sqlite3.connect('work/jsb_copy.sqlite')
cur = db.cursor()
tables = [r[0] for r in cur.execute("select name from sqlite_master where type='table'")]
print("tables:", tables)
for t in tables:
    try:
        n = cur.execute('select count(*) from "%s"' % t).fetchone()[0]
        print("table %s rows=%d" % (t, n))
        cols = [c[1] for c in cur.execute('PRAGMA table_info("%s")' % t)]
        print("   cols:", cols)
        for row in cur.execute('select * from "%s" limit 10' % t):
            print("   ", str(row)[:300])
    except Exception as e:
        print("table %s ERR %s" % (t, e))
