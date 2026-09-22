#!/usr/bin/env python3
"""pull_engagement.py - extract a client's consulting hours + weekly notes from the
Consulting Command Centre AppDB (domo.domo.com) for the /consulting-report skill.

Data source (AppDB collections on domo.domo.com):
  timesheets     07ab0050-bb16-4d32-b042-8265aafd94aa
  weeklyUpdates  69f2dbad-b94f-4eeb-ab20-d0d5d3b81840

Auth: reads DOMO_DOMO_DEVELOPER_TOKEN from the project .env (never printed).

Usage:
  python3 pull_engagement.py --list                 # list all account names
  python3 pull_engagement.py "Independent"          # pull one account (substring, case-insensitive)
  python3 pull_engagement.py "Independent" --json out.json   # also write structured JSON

Data-shape notes (do not re-learn these each run):
  - App fields are nested under doc["content"]; id/updatedOn are top-level.
  - The app APPENDS a new doc on each edit, so dedupe by latest updatedOn per key.
  - timesheet `hours` is a mon-fri dict, e.g. {"mon":0,"tue":2,...}; sum the values.
  - projectId carries a workstream prefix: `ace:` (ACE Accelerate), `named:` (named /
    discovery), `update:` (ongoing managed / Update service).
  - weeklyUpdates has no accountName; it links by projectId. `updateText` is the
    AI-polished note (use this), `quickNotes` is the raw consultant note.
"""
import sys, json, argparse, urllib.request
from collections import defaultdict

HOST = "https://domo.domo.com"
TS = "07ab0050-bb16-4d32-b042-8265aafd94aa"   # timesheets
WU = "69f2dbad-b94f-4eeb-ab20-d0d5d3b81840"   # weeklyUpdates


def load_token(env_path):
    for line in open(env_path):
        if line.startswith("DOMO_DOMO_DEVELOPER_TOKEN="):
            return line.strip().split("=", 1)[1]
    sys.exit("DOMO_DOMO_DEVELOPER_TOKEN not found in " + env_path)


def page(cid, tok):
    out, off = [], 0
    H = {"X-DOMO-Developer-Token": tok, "Accept": "application/json"}
    while True:
        u = f"{HOST}/api/datastores/v1/collections/{cid}/documents/?limit=200&offset={off}"
        raw = urllib.request.urlopen(urllib.request.Request(u, headers=H)).read().decode("utf-8", "replace")
        arr = json.loads(raw, strict=False)   # strict=False: notes contain raw newlines
        if not arr:
            break
        out.extend(arr)
        off += len(arr)
        if len(arr) < 200:
            break
    return out


def sumh(h):
    return sum(float(v or 0) for v in h.values()) if isinstance(h, dict) else float(h or 0)


def wsclass(pid):
    return (pid or "").split(":")[0] or "?"


def dedupe(docs, keyf, timef):
    best = {}
    for d in docs:
        k = keyf(d)
        t = timef(d)
        if k not in best or t >= best[k][0]:
            best[k] = (t, d)
    return [v[1] for v in best.values()]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("account", nargs="?", help="account name substring (case-insensitive)")
    ap.add_argument("--list", action="store_true", help="list all account names and exit")
    ap.add_argument("--env", default=".env", help="path to .env (default: ./.env)")
    ap.add_argument("--json", help="also write structured result to this path")
    args = ap.parse_args()

    tok = load_token(args.env)
    ts_all = page(TS, tok)

    if args.list or not args.account:
        accts = defaultdict(int)
        for d in ts_all:
            a = (d.get("content", {}).get("accountName") or "").strip()
            if a:
                accts[a] += 1
        print("Accounts in timesheets (name : timesheet-doc count):")
        for a in sorted(accts):
            print(f"  {accts[a]:4d}  {a}")
        return

    q = args.account.lower()
    matches = sorted({(d["content"].get("accountName") or "").strip()
                      for d in ts_all
                      if q in (d["content"].get("accountName") or "").lower()})
    matches = [m for m in matches if m]
    if not matches:
        sys.exit(f"No account matches '{args.account}'. Run --list to see options.")
    if len(matches) > 1:
        sys.exit("Ambiguous account, matches: " + "; ".join(matches) + ". Be more specific.")
    acct = matches[0]

    ts = [d for d in ts_all if (d["content"].get("accountName") or "") == acct]
    pids = {d["content"].get("projectId") for d in ts}
    wu = [d for d in page(WU, tok) if d["content"].get("projectId") in pids]

    tsd = dedupe(ts,
                 lambda d: (d["content"].get("userName"), d["content"].get("projectId"), d["content"].get("weekStartDate")),
                 lambda d: d.get("updatedOn", ""))
    byclass = defaultdict(float)
    byweek = defaultdict(float)
    total = 0.0
    weekly_by_class = defaultdict(lambda: defaultdict(float))
    for d in tsd:
        c = d["content"]
        h = sumh(c.get("hours"))
        total += h
        cls = wsclass(c.get("projectId"))
        byclass[cls] += h
        if h > 0:
            byweek[c.get("weekStartDate")] += h
            weekly_by_class[cls][c.get("weekStartDate")] += h

    wud = dedupe(wu,
                 lambda d: (d["content"].get("projectId"), d["content"].get("weekStartDate")),
                 lambda d: d.get("updatedOn", "") or d["content"].get("submittedAt", ""))
    wud = sorted(wud, key=lambda d: d["content"].get("weekStartDate") or "")

    print(f"ACCOUNT: {acct}")
    print(f"TOTAL BILLABLE HOURS: {total:.1f}  (deduped timesheet rows: {len(tsd)})")
    print("BY WORKSTREAM:", {k: round(v, 1) for k, v in sorted(byclass.items(), key=lambda x: -x[1])})
    print("\nWEEKS WITH HOURS (week : hours):")
    for w in sorted(byweek):
        print(f"   {w}  {byweek[w]:5.1f}")
    print(f"\nWEEKLY NOTES (updateText), {len(wud)} weeks with a note:")
    for d in wud:
        c = d["content"]
        cls = wsclass(c.get("projectId"))
        wk = c.get("weekStartDate")
        hrs = weekly_by_class.get(cls, {}).get(wk, 0.0)
        print(f"\n--- {wk} | {cls} | {hrs:.1f}h | RAG {c.get('ragStatus')} ---")
        print((c.get("updateText") or "").strip())

    if args.json:
        result = {
            "account": acct,
            "totalHours": round(total, 1),
            "byWorkstream": {k: round(v, 1) for k, v in byclass.items()},
            "weeks": [{"week": w, "hours": round(byweek[w], 1)} for w in sorted(byweek)],
            "notes": [{
                "week": d["content"].get("weekStartDate"),
                "workstream": wsclass(d["content"].get("projectId")),
                "hours": round(weekly_by_class.get(wsclass(d["content"].get("projectId")), {}).get(d["content"].get("weekStartDate"), 0.0), 1),
                "ragStatus": d["content"].get("ragStatus"),
                "updateText": (d["content"].get("updateText") or "").strip(),
                "quickNotes": (d["content"].get("quickNotes") or "").strip(),
            } for d in wud],
        }
        with open(args.json, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\n[wrote structured JSON to {args.json}]")


if __name__ == "__main__":
    main()
