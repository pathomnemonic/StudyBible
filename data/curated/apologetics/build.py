import json, a1, a2, a3, a4, a5
T=a1.T
ids={x['id'] for x in T}
for x in T:
    for r in x['related']: assert r in ids,(x['id'],r)
cats=[]
for x in T:
    if x['category'] not in cats: cats.append(x['category'])
json.dump({'_about':'Short answers to common questions about the Catholic faith, written for this app from Scripture and the Catechism. Each points to the Bible passages and Catechism paragraphs behind it; further reading links to Catholic Answers and other reviewed resources.','categories':cats,'topics':T},open('/home/user/StudyBible/data/curated/apologetics.json','w'),ensure_ascii=False,indent=1)
print(len(T))
