"""Proposed alignment for every chapter a numbering table still lists as unverified.

  python3 scripts/versification/survey.py webc english            all books
  python3 scripts/versification/survey.py nabre nabre JON,HOS     some books

Lines marked ** are joins (two verses for one, or a verse with no partner) and must be read in both texts.
"""
import json, sys
from align import run, fmt
import os
V=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','public','data','versification.json')))
def groups(chs):
    chs=sorted(chs); out=[]; cur=[chs[0]]
    for c in chs[1:]:
        if c==cur[-1]+1: cur.append(c)
        else: out.append(cur); cur=[c]
    out.append(cur); return out
def segments(rows):
    """compress into segments: ('run', n_start, n_end, a_start, a_end, minsim) | ('merge', ns, es, sim)"""
    segs=[]
    for ns,es,s in rows:
        if len(ns)==1 and len(es)==1:
            n=ns[0][:2]; a=es[0][:2]
            if segs and segs[-1][0]=='run':
                _,n0,n1,a0,a1,ms=segs[-1]
                if n[0]==n1[0] and a[0]==a1[0] and n[1]==n1[1]+1 and a[1]==a1[1]+1:
                    segs[-1]=('run',n0,n,a0,a,min(ms,s)); continue
            segs.append(('run',n,n,a,a,s))
        else: segs.append(('merge',ns,es,s))
    return segs
if __name__=='__main__':
    native=sys.argv[1]; scheme=sys.argv[2]; only=sys.argv[3].split(',') if len(sys.argv)>3 else None
    unv=V['schemes'][scheme]['unverifiedChapters']
    for book,chs in unv.items():
        if book=='PSA' or (only and book not in only): continue
        for g in groups(chs):
            try: rows=run(native,book,g)
            except Exception as e: print(book,g,'ERR',e); continue
            segs=segments(rows)
            print(f'## {book} {g}')
            for s in segs:
                if s[0]=='run':
                    _,n0,n1,a0,a1,ms=s
                    tag='' if n0==a0 else '  <-- shift'
                    print(f'   {n0[0]}:{n0[1]}-{n1[1]} = {a0[0]}:{a0[1]}-{a1[1]}  (min {ms:.2f}){tag}')
                else:
                    _,ns,es,sm=s
                    print(f'   ** {fmt(ns)} = {fmt(es)} ({sm:.2f})\n        N: {" / ".join(x[2] for x in ns)[:230]}\n        A: {" / ".join(x[2] for x in es)[:230]}')
