"""Grade 9 checks: faith, revelation, Scripture and Christ, with questions that ask for distinctions."""
R = {
'9-1-1': dict(quiz=[
 'Which claim does the Church make about reason and God?|Reason alone shows the Trinity|Reason can know that God exists as the source of all, while revelation tells us who he is (CCC 36, 50)|Reason is useless|Only the baptized can reason|1|CCC 36, 50–53.',
 'The “desire for God” (CCC 27) is best described as…|A passing mood|Written in the human heart because we are made by and for God|Cultural only|A trick|1|CCC 27–30.',
 'Paul’s speech in Acts 17 begins by…|Condemning idols|Noting the Athenians’ search for God and quoting their poets|Quoting Moses|Reading Scripture|1|Acts 17:22–28.']),
'9-1-2': dict(quiz=[
 'Aquinas’ “five ways” argue to God from…|Feelings|Features of the world such as motion, causation, contingency, degrees and order|Scripture|Miracles|1|CCC 34.',
 'What do the five ways NOT prove?|That God is the first cause|The Trinity or the Incarnation, which need revelation|That reason can reach God|That the world depends on another|1|CCC 50.',
 'Which objection do these arguments most directly face?|The world has no cause|“An infinite chain of causes needs no first cause”|God is love|Science exists|1|The reply distinguishes essentially ordered causes.']),
'9-1-3': dict(quiz=[
 'Faith in the Catechism is…|A feeling|A personal adherence to God and assent to all he has revealed, a gift of grace and a free act (CCC 150, 153–155)|Blind trust|Opinion|1|CCC 150, 153–155.',
 'The father in Mark 9:24 prays “I believe; help my unbelief.” What does this show?|Faith excludes doubt|Faith can coexist with difficulty and still ask for grace|He had no faith|Doubt is sin|1|Mark 9:24; CCC 2088.',
 'Voluntary doubt differs from involuntary doubt in that the former…|Is a difficulty|Is a deliberate refusal to hold what is revealed (CCC 2088)|Is harmless|Is rare|1|CCC 2088.']),
'9-2-1': dict(quiz=[
 'The “fullness” of revelation is…|Moses|Jesus Christ (Hebrews 1:1–2; CCC 65)|The Bible alone|The Church fathers|1|CCC 65–66.',
 'God reveals himself through…|Words only|Deeds and words intimately connected (CCC 53)|Dreams|Philosophers|1|CCC 53.',
 'Private revelations such as Fatima or Lourdes…|Add to the deposit of faith|Do not add to revelation but may help us live it (CCC 67)|Are required belief|Contradict Scripture|1|CCC 67.']),
'9-2-2': dict(quiz=[
 '“Sacred Tradition” in Catholic teaching is…|Old customs|The living handing on of the Gospel by the apostles and their successors (CCC 78)|A second Bible|Local habit|1|CCC 75–79.',
 'Which would NOT be part of the deposit of faith?|The Creed|A diocesan fasting rule (a changeable discipline)|The Real Presence|The Trinity|1|CCC 83.',
 '2 Thessalonians 2:15 matters in this lesson because it…|Rejects tradition|Commends both spoken and written apostolic teaching|Defines infallibility|Forbids writing|1|2 Thessalonians 2:15.']),
'9-2-3': dict(quiz=[
 'The Magisterium’s relation to the Word of God is that it…|Stands above it|Serves it, teaching only what has been handed on (CCC 86)|Replaces it|Competes with it|1|CCC 86.',
 'Which teaching calls for “the assent of faith”?|Prudential advice|A dogma defined as divinely revealed (CCC 88–89)|Local policies|Opinions|1|CCC 88–89, 891.',
 'Infallibility applies to…|Any statement|Definitive teaching on faith and morals by the Pope or the bishops with him (CCC 891)|Politics|Weather|1|CCC 891.']),
'9-3-1': dict(quiz=[
 'Inerrancy means…|Every sentence is a science fact|The Scriptures teach without error the truth God wished to put there for our salvation (CCC 107)|The Bible is a dictation|There is no human author|1|CCC 107.',
 'God and human authors of Scripture relate as…|God dictated and humans copied|God is author and humans are true authors who used their own faculties (CCC 106)|Humans only|Angels|1|CCC 105–106.',
 'To understand a biblical text we must ask…|What the author intended, considering literary form and time (CCC 109–110)|What we feel|Only the dates|Nothing|0|CCC 109–110.']),
'9-3-2': dict(quiz=[
 'Which is one of the three criteria for interpreting Scripture (CCC 112–114)?|The newest scholarship only|Attend to the unity of the whole Scripture|Individual intuition|The majority|0|CCC 112.',
 'The “anagogical” sense of Scripture points to…|Moral conduct|Our eternal destiny|The literal event|Allegory|1|CCC 117.',
 'The literal sense is…|The only sense|The meaning the words convey, on which the spiritual senses build (CCC 116)|Unimportant|Allegory|1|CCC 116.']),
'9-3-3': dict(quiz=[
 'The deuterocanonical books are…|Seven Old Testament books in the Greek Septuagint that Catholics keep (CCC 120)|New Testament letters|Apocrypha rejected by Catholics|Added at Trent without precedent|0|Tobit, Judith, Wisdom, Sirach, Baruch, 1–2 Maccabees.',
 'Which council in 393 listed the canon?|Hippo|Nicaea|Trent|Ephesus|0|Hippo 393, Carthage 397.',
 'A reply to “the Catholic Church added books” is that…|It did|They were part of the Greek Bible used by early Christians, and Luther moved them in 1534|They were invented|They are unimportant|1|Septuagint usage.']),
'9-4-1': dict(quiz=[
 '“The New is hidden in the Old and the Old is unveiled in the New” is from…|Augustine|Pius X|Aquinas|Luther|0|CCC 129.',
 'A type is…|A mistake|An Old Testament person, event or thing that foreshadows Christ|A symbol of nothing|A prophecy only|1|CCC 128–130.',
 'Which pairing is a type and fulfillment?|Adam and Christ (Romans 5:14)|Moses and Nero|David and Pilate|Noah and Herod|0|Romans 5:14.']),
'9-4-2': dict(quiz=[
 'The new covenant is promised in…|Jeremiah 31:31–34|Genesis 1|Psalm 1|Daniel 7|0|Fulfilled in Luke 22:20.',
 'Which covenant sign matches Noah?|Rainbow|Circumcision|Tablets|Throne|0|Genesis 9:12–17.',
 'Covenants in Scripture differ from contracts because they…|Create family bonds with oaths|Are only legal|Have no signs|Are private|0|CCC 56–64.']),
'9-4-3': dict(quiz=[
 'Micah 5:2 foretells…|The birthplace of the Messiah, Bethlehem|The flight into Egypt|The Passion|The Ascension|0|Matthew 2:5–6.',
 'A caution about messianic proofs is that…|Some fulfillments are typological or deeper meanings rather than literal predictions|There are none|All are literal|They are unimportant|0|e.g., Hosea 11:1 in Matthew 2:15.',
 'Isaiah 53 is read by the Church as…|A description of Cyrus|The Servant who suffers for sins (CCC 601)|A war song|A genealogy|1|CCC 601.']),
'9-5-1': dict(quiz=[
 'Which source outside Christianity mentions Jesus’ execution under Pilate?|Tacitus (Annals 15.44)|Homer|Plato|Virgil|0|Tacitus c. 116.',
 'The earliest New Testament manuscript fragments date from…|The second century (e.g., P52)|The tenth century|The Middle Ages|The Reformation|0|P52 c. 125.',
 'Luke 1:1–4 shows the Gospel’s method as…|Myth|Careful investigation of eyewitness testimony|Dream|Rumor|1|Luke 1:1–4.']),
'9-5-2': dict(quiz=[
 'Chalcedon taught that Christ is…|Two persons|One divine Person in two natures, divine and human|One nature|A creature|1|CCC 467.',
 'Docetism taught that Christ…|Was truly human|Only seemed to have a body|Was divine|Was a man|1|CCC 465.',
 'Why does it matter that Christ is truly human?|It does not|Because only a true man could save mankind from within (CCC 470–478)|He needed to learn|It is poetic|1|CCC 470–478.']),
'9-5-3': dict(quiz=[
 'In Mark 2, forgiving sins was a claim of divine authority because…|Only God can forgive sins (Mark 2:7)|Priests do it|It was routine|It was symbolic|0|Mark 2:5–10.',
 '“Son of Man” in Jesus’ usage evokes…|A mere human|Daniel 7’s figure given dominion by God, a title of glory|A simple phrase|A rabbi|1|Daniel 7:13–14.',
 'Which “I AM” saying echoes the divine name?|“Before Abraham was, I am” (John 8:58)|“Follow me”|“Blessed are the poor”|“Come and see”|0|John 8:58.']),
'9-6-1': dict(quiz=[
 'The Kingdom of God in Jesus’ preaching is…|A political state|God’s reign, present in Christ and still to come in fullness (CCC 541–546)|Only heaven|A philosophy|1|CCC 541–546.',
 'Parables use ordinary images to…|Hide the Gospel|Reveal and challenge, calling hearers to decide (CCC 546)|Entertain|Teach farming|1|CCC 546.',
 'The Sermon on the Mount is…|A parable|The charter of the New Law (CCC 1966)|A genealogy|A miracle|1|Matthew 5–7.']),
'9-6-2': dict(quiz=[
 'A “sign” in John’s Gospel is…|A magic trick|A work that points beyond itself to who Jesus is (John 2:11)|A hallucination|A prophecy|1|John 2:11.',
 'Hume’s argument against miracles has been criticized because it…|Is certainly right|Assumes in advance that miracles do not occur, so no testimony could be enough|Uses Scripture|Is scientific|1|Common critique.',
 'Which best describes the purpose of Jesus’ miracles?|To show off|To manifest the Kingdom and invite faith (CCC 547–550)|To cause fear|To pay debts|1|CCC 547–550.']),
'9-6-3': dict(quiz=[
 'Which is NOT one of the four reasons the Word became flesh (CCC 457–460)?|To save us by reconciling us with God|To show us God’s love|To be our model of holiness|To abolish the Old Testament|3|CCC 457–460.',
 'Athanasius’ line “God became man that man might become god” means…|We become God by nature|We share by grace in God’s life (CCC 460)|Humans are divine|Nothing|1|CCC 460.',
 'John 3:16 stresses that the Incarnation arises from…|God’s love|Human merit|Fate|Necessity|0|John 3:16.']),
'9-7-1': dict(quiz=[
 'Which model of the Cross appears in Mark 10:45?|Ransom|Moral example only|Magic|Exchange|0|Mark 10:45.',
 'The Catholic Church does not teach that…|Christ’s death is a sacrifice of love|The Father is cruel and demands a victim; the Father and Son act in one love (CCC 603–605)|Christ freely gave himself|Sin has consequences|1|CCC 603–605.',
 'Christus Victor emphasizes…|Christ’s victory over sin and death|Moral influence only|Satisfaction only|Nothing|0|One image among several.']),
'9-7-2': dict(quiz=[
 'Which line of evidence is strongest for the first witnesses being sincere?|They died for what they proclaimed|They gained wealth|They hid|They were soldiers|0|Martyrdom of apostles.',
 'The first witnesses being women is significant because…|It was typical|In that culture women’s testimony counted little, so it is unlikely to be invented|They were not present|It does not matter|1|Matthew 28; John 20.',
 'The Resurrection is both…|Historical and transcendent (CCC 639–647)|Only symbolic|Only legend|Only spiritual|0|CCC 639–647.']),
'9-7-3': dict(quiz=[
 'The Ascension is…|The end of Christ’s presence|His enthronement in glory, from which he remains with the Church (CCC 659–667)|A myth|A funeral|1|CCC 659–667.',
 'The Parousia is…|The Second Coming of Christ in glory (CCC 668–679)|His birth|His baptism|A feast|0|CCC 668–679.',
 'Jesus teaches about the day of his return that…|It is calculable|No one knows the day or hour (Matthew 24:36)|It is next year|It is yesterday|1|Matthew 24:36.']),
'9-8-1': dict(quiz=[
 'Luke 9:23 calls disciples to…|Comfort|Deny themselves, take up the cross daily and follow|Leave society|Obey law only|1|Luke 9:23.',
 'The cross in the Christian life is…|Self-hatred|Self-giving love united to Christ (CCC 618)|Seeking pain|A symbol only|1|CCC 618.',
 'All are called to…|Holiness (CCC 2013)|Only priesthood|Only marriage|Nothing|0|CCC 2013.']),
'9-8-2': dict(quiz=[
 'Which statement is Catholic?|We are saved by works alone|Justification is God’s free gift by grace, received through faith that works in love (CCC 1987–1995; Galatians 5:6)|Faith has no effect|Once saved always saved|1|CCC 1987–1995.',
 'Merit in Catholic teaching rests on…|Our own power|God’s grace enabling our good acts (CCC 2006–2011)|Luck|Law|1|CCC 2006–2011.',
 'The 1999 Joint Declaration on Justification was between…|Catholics and Lutherans|Catholics and Orthodox|Anglicans and Methodists|Jews and Christians|0|1999.']),
'9-8-3': dict(quiz=[
 'Lectio divina has movements of…|Read, meditate, pray, contemplate|Sing, dance, fast|Ask, seek, knock|Tell, listen, vote|0|CCC 2705–2708.',
 'Ignatian contemplation uses…|Imagination to enter a Gospel scene and speak with Christ|Statistics|Silence only|Memorization|0|Spiritual Exercises.',
 'The Emmaus story shows Jesus…|Hiding|Explaining Scripture and being known in the breaking of bread (Luke 24:13–35)|Teaching nothing|Leaving|1|Luke 24.']),
}
