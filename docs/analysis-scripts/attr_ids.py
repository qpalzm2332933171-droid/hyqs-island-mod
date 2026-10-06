import collections, io, re
c = collections.Counter(); idx = collections.defaultdict(list)
for ln in io.open(r"C:\path\to\workwspace\work\notes\attr_ids_raw.txt", encoding="utf-8-sig"):
    ln = ln.strip()
    if not ln: continue
    m = re.match(r"^(?:.*?:)?(\d+):(\d+)$", ln)
    if m:
        c[m.group(2)] += 1; idx[m.group(2)].append(int(m.group(1)))
for k, v in sorted(c.items(), key=lambda kv: int(kv[0])):
    print(k, v, "line:", idx[k][:8])
