import json,glob,re,collections
ok=set("and of to the a in for but by with on from as at or nor so that who he his she it they them their you your my me let not no if when then do all is are was were will shall may have has had which what how since because until before after while though yet lest even only also out up down into upon over under through these those there here now surely therefore behold lo i an be been am we us our thy thee thou thine one two three whose where whom whoever whatever each every both either neither more most many some any such than till unless seeing for-as how-long within without among between against toward towards about above below beside besides near far like unlike nor whether once again still never ever always yea nay amen alas ah oh o hear give go come take make put set bring send keep see look say speak tell let lift turn rise arise sing praise bless offer open save deliver remember forgive create".split())
def scan():
    bad=[]
    for f in sorted(glob.glob('public/data/bible/rsv2ce/*.json')):
        d=json.load(open(f))
        for c in d['chapters']:
            for bl in c['blocks']:
                if isinstance(bl[1],str): continue
                for r in bl[1]:
                    t=r[1]
                    if r[0]>0 and t and t[0].islower():
                        w=re.match(r"[a-z']+",t); w=w.group(0) if w else ''
                        if w not in ok: bad.append((f.split('/')[-1][:-5],c['n'],r[0],t[:45]))
    return bad
if __name__=='__main__':
    b=scan(); print(len(b))
    for x in b[:80]: print(x)
