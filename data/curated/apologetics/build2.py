"""Append the topics in a6.py (and later files) to data/curated/apologetics.json, with video reading links taken from the checked catalogue."""
import json, a1, a6
ROOT='/home/user/StudyBible/'
cat={v['id']:v for v in json.load(open(ROOT+'data/curated/videos.json'))['videos']}
SLUG={'Catholic Productions':'catholic-productions','St. Paul Center':'st-paul-center','Jimmy Akin':'jimmy-akin','Catholic Answers Live':'catholic-answers','Bishop Robert Barron':'word-on-fire','Augustine Institute':'augustine-institute','EWTN':'ewtn','The Thomistic Institute':'thomistic-institute','Breaking In The Habit':'breaking-in-the-habit','Matt Fradd':'pints-with-aquinas','Godsplaining | Catholic Podcast':'godsplaining','ACTS XXIX':'acts-xxix','Shameless Popery':'shameless-popery','Ascension Presents':'ascension','Ascension Press':'ascension','The Catholic Talk Show':'catholic-talk-show','CounselofTrent':'trent-horn'}
import sys; sys.path.insert(0,'/tmp/claude-0/yt')
from add import verify
def extra(vid):
    c=verify([vid]).get(vid)
    return dict(title=c['title'],channel=c['author']) if c else None
import subprocess
d=json.loads(subprocess.run(['git','show','HEAD:data/curated/apologetics.json'],cwd=ROOT,capture_output=True,text=True).stdout)  # always extend the committed base so the build can be re-run
old={t['id'] for t in d['topics']}
new=[t for t in a1.T if t['id'] not in old]
ids=old|{t['id'] for t in new}
for t in new:
    t['ccc']=sorted(set(t['ccc']))
    for r in t['related']: assert r in ids,(t['id'],r)
    reading=[]
    for vid in a6.V.get(t['id'],[]):
        v=cat.get(vid) or extra(vid)
        if not v: print('dropped',t['id'],vid); continue
        reading.append(dict(title=v['title'],url='https://www.youtube.com/watch?v='+vid,source=SLUG.get(v['channel'],v['channel']),type='video'))
    t['reading']=reading
d['topics']+=new
# videos added later to topics that already exist (ids are from the checked catalogue)
EXTRA={'purgatory':['Eh_PIwv42kk','Zhm5_AXcqcA','iEmA8QLSnV0'],'praying-for-the-dead':['DFUOesAuCvs'],'mary-mother-of-god':['HomoISXpLCo','Jh6F73lmuiI'],'assumption':['SCRKsDOU_VQ'],
 'papacy':['78x2z_Pd884','4IVEe66zUJA'],'sola-scriptura':['dFMDXhPnczU','q4DeTvPysW4','kn7qdPSHSJk'],'faith-and-works':['0LwEgFig00A'],'once-saved':['vH3DbAjsNcs'],
 'baptismal-regeneration':['4cp5ZWCDneo','jxDaUGNIdBM'],'infant-baptism':['YyD74bf0gHw','7JnELgrWyZs'],'resurrection':['sQkEbHqEv9o','qFpvBj9G8d4'],'divinity-of-christ':['TaoH4sjp58c'],
 'abortion':['mxLdUP44Nlg','mOeygtgkiK4'],'god-exists':['ASKqopLMt0c','S1-1Ltvrz_E','5PF1JgXOKDQ'],'predestination':['Zx-nWQpjjX4'],'mary-new-eve-ark':[],'reliability-gospels':['j4dCB0Bwskw']}
for t in d['topics']:
    have={r['url'] for r in t.get('reading',[])}
    for vid in EXTRA.get(t['id'],[]):
        v=cat.get(vid) or extra(vid)
        url='https://www.youtube.com/watch?v='+vid
        if v and url not in have:
            t.setdefault('reading',[]).append(dict(title=v['title'],url=url,source=SLUG.get(v['channel'],'trent-horn' if 'Counsel' in v['channel'] else v['channel']),type='video'))
json.dump(d,open(ROOT+'data/curated/apologetics.json','w'),ensure_ascii=False,indent=1)
json.dump(d,open(ROOT+'public/data/apologetics.json','w'),ensure_ascii=False,indent=1)
print(len(old),'+',len(new),'=',len(d['topics']))
