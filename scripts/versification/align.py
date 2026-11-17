"""Verse aligner used to verify numbering rules (docs/CYCLE4_LOG.md section 6).

Aligns one edition against the Douay anchor, chapter by chapter, by shared wording, allowing one verse for one,
one for two, two for one, and a verse with no partner. It proposes; a person reads every join before a rule is added to
`verifiedExtra` in scripts/ingest/bible.ts.

  python3 scripts/versification/align.py webc JHN 6            only the joins
  python3 scripts/versification/align.py nabre JON 1,2 --full  every verse
"""
import json, re, sys
import os
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','public','data','bible','')
STOP=set('the a an and of to in for with on at by from as or not his her their your my our he she it they we you i me him them us is are was were be been am will shall may would should could do did does have has had that this these those there then when which who whom what but if so no nor into unto upon out up all one thou thee thy ye hath said saith say says'.split())
def stem(w):
    w=re.sub('[^a-z]','',w.lower())
    for s in ('eth','est','ing','ed','es','s'):
        if len(w)>4 and w.endswith(s) and len(w)-len(s)>=3: return w[:-len(s)]
    return w
def toks(t): return set(x for x in (stem(w) for w in t.split()) if len(x)>2 and x not in STOP)
def verses(ed, book, chapters):
    d=json.load(open(f'{D}{ed}/{book}.json'))
    out=[]
    for ch in d['chapters']:
        if ch['n'] not in chapters: continue
        byv={}; last=0
        for b in ch['blocks']:
            if isinstance(b[1],str): continue
            for v,t in b[1]:
                if v==0:
                    if last: byv[last]+= ' '+t
                    continue
                byv[v]=(byv.get(v,'')+' '+t).strip(); last=v
        for v in sorted(byv): out.append((ch['n'],v,byv[v]))
    return out
def sim(a,b):
    if not a or not b: return 0
    n=len(a&b); return 0.5*n/min(len(a),len(b))+0.5*n/len(a|b)
def align(N,E):
    # N native, E anchor. moves: (1,1),(1,2),(2,1),(1,0),(0,1)
    n,m=len(N),len(E); NT=[toks(x[2]) for x in N]; ET=[toks(x[2]) for x in E]
    NEG=-1e9; S=[[NEG]*(m+1) for _ in range(n+1)]; F=[[None]*(m+1) for _ in range(n+1)]
    S[0][0]=0
    for i in range(n+1):
        for j in range(m+1):
            if S[i][j]==NEG: continue
            def upd(di,dj,sc):
                if i+di<=n and j+dj<=m and S[i][j]+sc>S[i+di][j+dj]: S[i+di][j+dj]=S[i][j]+sc; F[i+di][j+dj]=(di,dj)
            if i<n and j<m: upd(1,1,sim(NT[i],ET[j])-0.08)
            if i<n and j+1<m: upd(1,2,sim(NT[i],ET[j]|ET[j+1])-0.16)
            if i+1<n and j<m: upd(2,1,sim(NT[i]|NT[i+1],ET[j])-0.16)
            if i<n: upd(1,0,-0.25)
            if j<m: upd(0,1,-0.25)
    path=[]; i,j=n,m
    while (i,j)!=(0,0):
        di,dj=F[i][j]; path.append((i-di,j-dj,di,dj)); i-=di; j-=dj
    return path[::-1],NT,ET
def run(native, book, chapters, show=True, achapters=None):
    N=verses(native,book,chapters); E=verses('dra',book,achapters or chapters)
    path,NT,ET=align(N,E)
    rows=[]
    for (i,j,di,dj) in path:
        ns=N[i:i+di]; es=E[j:j+dj]
        s=sim(set().union(*[NT[k] for k in range(i,i+di)]) if di else set(), set().union(*[ET[k] for k in range(j,j+dj)]) if dj else set())
        rows.append((ns,es,s))
    return rows
def fmt(vs): return '+'.join(f'{c}:{v}' for c,v,_ in vs) or '—'
if __name__=='__main__':
    native,book=sys.argv[1],sys.argv[2]; chs=[int(x) for x in sys.argv[3].split(',')]
    ach=[int(x) for x in sys.argv[4].split(',')] if len(sys.argv)>4 else None
    rows=run(native,book,chs,achapters=ach)
    full='--full' in sys.argv
    for k,(ns,es,s) in enumerate(rows):
        ident = len(ns)==1 and len(es)==1 and ns[0][:2]==es[0][:2]
        near = any(not(len(r[0])==1 and len(r[1])==1 and r[0][0][:2]==r[1][0][:2]) for r in rows[max(0,k-1):k+2])
        shifted = len(ns)==1 and len(es)==1 and not ident
        prevshift = k>0 and len(rows[k-1][0])==1 and len(rows[k-1][1])==1 and len(ns)==1 and len(es)==1 and (rows[k-1][0][0][0]-rows[k-1][1][0][0], rows[k-1][0][0][1]-rows[k-1][1][0][1])==(ns[0][0]-es[0][0], ns[0][1]-es[0][1])
        nextshift = k+1<len(rows) and len(rows[k+1][0])==1 and len(rows[k+1][1])==1 and len(ns)==1 and len(es)==1 and (rows[k+1][0][0][0]-rows[k+1][1][0][0], rows[k+1][0][0][1]-rows[k+1][1][0][1])==(ns[0][0]-es[0][0], ns[0][1]-es[0][1])
        if full or not (prevshift and nextshift) or s<0.12:
            print(f'{fmt(ns):>12} = {fmt(es):<12} {s:.2f} | N: {" / ".join(x[2] for x in ns)[:110]}\n{"":>36}| A: {" / ".join(x[2] for x in es)[:110]}')
    print('min sim', min(r[2] for r in rows), 'pairs', len(rows))
