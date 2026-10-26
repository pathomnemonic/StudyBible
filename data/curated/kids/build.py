import json, importlib
import ot1
import ot2, nt1, nt2
S = ot1.S
import more
for after, story in more.ADD:
    i = next(k for k, x in enumerate(S) if x['id'] == after)
    j = i + 1
    while j < len(S) and S[j].get('_added'): j += 1
    story['_added'] = True
    S.insert(j, story)
for x in S: x.pop('_added', None)
# order: biblical order within testaments
order = {s['id']: i for i, s in enumerate(S)}
ot = [s for s in S if s['testament']=='OT']; nt = [s for s in S if s['testament']=='NT']
out = ot + nt
json.dump({'_about': 'Bible stories retold for children in three reading levels (4-6, 7-9, 10-12). Written for this app; each story points to the passage it retells.', 'stories': out}, open('/home/user/StudyBible/public/data/kids_stories.json','w'), ensure_ascii=False, indent=1)
print(len(out), 'stories')
