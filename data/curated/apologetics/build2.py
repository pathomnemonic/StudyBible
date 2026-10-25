"""Append the topics in a6.py (and later files) to data/curated/apologetics.json, with video reading links taken from the checked catalogue."""
import json, a1, a6
ROOT='/home/user/StudyBible/'
cat={v['id']:v for v in json.load(open(ROOT+'data/curated/videos.json'))['videos']}
SLUG={'Catholic Productions':'catholic-productions','St. Paul Center':'st-paul-center','Jimmy Akin':'jimmy-akin','Catholic Answers Live':'catholic-answers','Bishop Robert Barron':'word-on-fire','Augustine Institute':'augustine-institute','EWTN':'ewtn','The Thomistic Institute':'thomistic-institute','Breaking In The Habit':'breaking-in-the-habit','Matt Fradd':'pints-with-aquinas','Godsplaining | Catholic Podcast':'godsplaining','ACTS XXIX':'acts-xxix','Shameless Popery':'shameless-popery','Ascension Presents':'ascension','Ascension Press':'ascension','The Catholic Talk Show':'catholic-talk-show'}
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
json.dump(d,open(ROOT+'data/curated/apologetics.json','w'),ensure_ascii=False,indent=1)
json.dump(d,open(ROOT+'public/data/apologetics.json','w'),ensure_ascii=False,indent=1)
print(len(old),'+',len(new),'=',len(d['topics']))
