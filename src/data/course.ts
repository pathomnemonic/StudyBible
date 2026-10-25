/** A twelve-lesson walk through salvation history in the order of the story, each with a passage and a short quiz. */
export interface Quiz { q: string; options: string[]; answer: number; why: string }
export interface Lesson { id: string; title: string; era: string; intro: string; refs: string; quiz: Quiz[] }

export const COURSE: Lesson[] = [
  { id: 'creation', title: 'Creation and the Fall', era: 'The beginning', intro: 'The Bible opens with God making everything good and making man and woman in his image, then with the first sin and the first promise of a victory over the serpent.', refs: 'Genesis 1:26-31; Genesis 3:1-15', quiz: [
    { q: 'On which day does Genesis say God made man and woman?', options: ['The third day', 'The fifth day', 'The sixth day', 'The seventh day'], answer: 2, why: 'Genesis 1:26-31 places the creation of man and woman on the sixth day. On the seventh God rested.' },
    { q: 'What did the serpent say would happen if they ate the fruit?', options: ['They would be like God, knowing good and evil', 'They would live in the garden forever', 'They would rule the animals', 'They would see God face to face'], answer: 0, why: 'Genesis 3:5.' },
    { q: 'The Church Fathers read Genesis 3:15 as a first hint of what?', options: ['The flood', 'The coming victory of the woman’s offspring, Christ', 'The Ten Commandments', 'The building of the Temple'], answer: 1, why: 'The “seed of the woman” who crushes the serpent has traditionally been read as Christ, with Mary the new Eve.' } ] },
  { id: 'noah', title: 'Noah and the first covenant', era: 'The early world', intro: 'After the flood God makes a covenant with Noah and with every living creature, sealed with the rainbow.', refs: 'Genesis 6:9-22; Genesis 9:8-17', quiz: [
    { q: 'What was the sign of the covenant with Noah?', options: ['Circumcision', 'The rainbow', 'The Sabbath', 'A burning bush'], answer: 1, why: 'Genesis 9:12-13.' },
    { q: 'How many of each clean animal did Genesis 7:2 first tell Noah to take?', options: ['One pair', 'Two pairs', 'Seven pairs', 'Twelve pairs'], answer: 2, why: 'Seven pairs of clean animals, and one pair of unclean (Genesis 7:2).' },
    { q: 'The Church sees Noah’s ark as a figure of what?', options: ['The Temple', 'Baptism and the Church', 'The Exodus', 'The Ark of the Covenant'], answer: 1, why: '1 Peter 3:20-21 links the saving of Noah through water with baptism.' } ] },
  { id: 'abraham', title: 'Abraham: promise and faith', era: 'The patriarchs', intro: 'God calls Abraham to leave his country and promises him land, descendants and blessing for all nations. Abraham believes, and it is counted to him as righteousness.', refs: 'Genesis 12:1-4; Genesis 15:1-6; Genesis 22:1-14', quiz: [
    { q: 'What was Abraham’s original name?', options: ['Abram', 'Isaac', 'Jacob', 'Eber'], answer: 0, why: 'He was Abram until God renamed him in Genesis 17.' },
    { q: 'God promised that through Abraham what would be blessed?', options: ['Only his family', 'Only Israel', 'All the families of the earth', 'The land of Canaan only'], answer: 2, why: 'Genesis 12:3.' },
    { q: 'In Genesis 22 whom does God ask Abraham to offer?', options: ['Ishmael', 'Isaac', 'Lot', 'Jacob'], answer: 1, why: 'God asks for his son Isaac, and then provides a ram. The Fathers saw Isaac as a figure of Christ.' } ] },
  { id: 'exodus', title: 'The Exodus and the Passover', era: 'Slavery and freedom', intro: 'God hears his people in Egypt, sends Moses, and frees them on the night of the Passover, passing them through the sea.', refs: 'Exodus 12:1-14; Exodus 14:21-31', quiz: [
    { q: 'What was spread on the doorposts on the Passover night?', options: ['Oil', 'Water', 'The blood of a lamb', 'Ashes'], answer: 2, why: 'Exodus 12:7, 13.' },
    { q: 'Which Christian sacrament does the crossing of the Red Sea foreshadow, according to St Paul?', options: ['Baptism', 'Marriage', 'Holy Orders', 'Anointing of the Sick'], answer: 0, why: '1 Corinthians 10:1-2 says our fathers were “baptized into Moses in the cloud and in the sea.”' },
    { q: 'Jesus is called the “Lamb of God” by whom?', options: ['Peter', 'John the Baptist', 'Paul', 'Moses'], answer: 1, why: 'John 1:29.' } ] },
  { id: 'sinai', title: 'Sinai: the Law and the covenant', era: 'The wilderness', intro: 'At Sinai God binds Israel to himself, giving the Ten Commandments and the pattern of worship.', refs: 'Exodus 19:3-8; Exodus 20:1-17', quiz: [
    { q: 'How many commandments were given at Sinai?', options: ['Seven', 'Ten', 'Twelve', 'Thirteen'], answer: 1, why: 'The Ten Commandments (Exodus 20).' },
    { q: 'Which mountain is the Law given on?', options: ['Sinai', 'Carmel', 'Zion', 'Nebo'], answer: 0, why: 'Exodus 19:11. Deuteronomy calls it Horeb.' },
    { q: 'What did Israel promise at Sinai?', options: ['“All that the Lord has spoken we will do.”', '“We will build a king.”', '“We will not enter the land.”', '“We will make a calf.”'], answer: 0, why: 'Exodus 19:8.' } ] },
  { id: 'david', title: 'David and the kingdom', era: 'The kings', intro: 'God promises David that his house and throne will endure for ever, a promise the New Testament sees fulfilled in Jesus.', refs: '2 Samuel 7:8-16; Psalm 89:3-4', quiz: [
    { q: 'Which prophet brought God’s promise to David in 2 Samuel 7?', options: ['Elijah', 'Nathan', 'Samuel', 'Isaiah'], answer: 1, why: '2 Samuel 7:4 ff.' },
    { q: 'Who built the Temple in Jerusalem?', options: ['David', 'Solomon', 'Hezekiah', 'Zerubbabel'], answer: 1, why: 'David planned it; his son Solomon built it (1 Kings 6).' },
    { q: 'In which town was Jesus born, the city of David?', options: ['Nazareth', 'Jerusalem', 'Bethlehem', 'Capernaum'], answer: 2, why: 'Luke 2:4-11.' } ] },
  { id: 'prophets', title: 'The prophets and the exile', era: 'Exile', intro: 'Israel is carried off to Babylon, and the prophets speak of both judgment and a new covenant written on the heart.', refs: 'Jeremiah 31:31-34; Isaiah 53:4-6', quiz: [
    { q: 'Which prophet speaks of a “new covenant”?', options: ['Amos', 'Jeremiah', 'Jonah', 'Hosea'], answer: 1, why: 'Jeremiah 31:31.' },
    { q: 'Which empire carried Judah into exile in the sixth century BC?', options: ['Egypt', 'Assyria', 'Babylon', 'Rome'], answer: 2, why: 'Babylon destroyed Jerusalem in 587/586 BC.' },
    { q: 'At the Last Supper Jesus calls his blood the blood of what?', options: ['The old covenant', 'The new covenant', 'The Law', 'The Passover'], answer: 1, why: 'Luke 22:20; 1 Corinthians 11:25.' } ] },
  { id: 'return', title: 'Return, waiting and hope', era: 'After the exile', intro: 'The exiles return and rebuild, and Israel waits for the promised Messiah through years of foreign rule.', refs: 'Ezra 1:1-4; Daniel 7:13-14', quiz: [
    { q: 'Which Persian king let the exiles return?', options: ['Nebuchadnezzar', 'Cyrus', 'Xerxes', 'Darius III'], answer: 1, why: 'Ezra 1:1-4.' },
    { q: 'In Daniel 7 the vision is of one like a what coming on the clouds?', options: ['Lion', 'Son of man', 'Shepherd', 'Angel'], answer: 1, why: 'Daniel 7:13. Jesus used the title “Son of Man” of himself.' },
    { q: 'Which books record the Maccabean revolt?', options: ['1 and 2 Maccabees', 'Ezra and Nehemiah', '1 and 2 Kings', 'Judith and Tobit'], answer: 0, why: 'They are in the Catholic canon (deuterocanonical).' } ] },
  { id: 'incarnation', title: 'The Word made flesh', era: 'The Gospels', intro: 'The Son of God becomes man, born of the Virgin Mary, and begins to proclaim the kingdom.', refs: 'Luke 1:26-38; John 1:1-14', quiz: [
    { q: 'Who announced to Mary that she would conceive?', options: ['Michael', 'Raphael', 'Gabriel', 'An unnamed angel'], answer: 2, why: 'Luke 1:26.' },
    { q: 'John 1:14 says the Word did what?', options: ['Spoke to the prophets', 'Became flesh and dwelt among us', 'Came down as a dove', 'Wrote the Law'], answer: 1, why: 'John 1:14.' },
    { q: 'Where did Jesus grow up?', options: ['Bethlehem', 'Nazareth', 'Jericho', 'Cana'], answer: 1, why: 'Luke 2:39-40.' } ] },
  { id: 'passion', title: 'The Passion and Resurrection', era: 'The Gospels', intro: 'Jesus gives himself at the Last Supper, dies on the cross and rises on the third day.', refs: 'Luke 22:14-20; Luke 24:1-12', quiz: [
    { q: 'On what day of the week did the women find the tomb empty?', options: ['Friday', 'Saturday', 'The first day of the week', 'Thursday'], answer: 2, why: 'Luke 24:1.' },
    { q: 'What did Jesus say over the bread at the Last Supper (Luke 22:19)?', options: ['“This is my body, given for you.”', '“This is my word.”', '“This is the Law.”', '“Eat and forget.”'], answer: 0, why: 'Luke 22:19.' },
    { q: 'Who denied Jesus three times?', options: ['Judas', 'Thomas', 'Peter', 'James'], answer: 2, why: 'Luke 22:54-62.' } ] },
  { id: 'church', title: 'Pentecost and the early Church', era: 'Acts', intro: 'The Holy Spirit comes on the apostles at Pentecost, and the Church begins to preach and baptize.', refs: 'Acts 2:1-4; Acts 2:36-42', quiz: [
    { q: 'The word “Pentecost” comes from a Greek word meaning what?', options: ['Spirit', 'Fiftieth', 'Harvest', 'Tongues'], answer: 1, why: 'Pentecost is the “fiftieth” day, counted from Passover.' },
    { q: 'Who preached to the crowd at Pentecost?', options: ['Peter', 'Paul', 'Stephen', 'James'], answer: 0, why: 'Acts 2:14.' },
    { q: 'What did the new believers devote themselves to in Acts 2:42?', options: ['Only fasting', 'The apostles’ teaching, fellowship, the breaking of bread and prayers', 'Temple sacrifices', 'Travel'], answer: 1, why: 'Acts 2:42.' } ] },
  { id: 'fulfilment', title: 'The new heavens and the new earth', era: 'Revelation', intro: 'The story ends with God dwelling with his people, and the tree of life returning.', refs: 'Revelation 21:1-5; Revelation 22:1-5', quiz: [
    { q: 'What does Revelation 21 say will no longer be?', options: ['The sea', 'Death, mourning, crying and pain', 'Both of these', 'Neither'], answer: 2, why: 'Revelation 21:1, 4: no more sea, no more death or mourning.' },
    { q: 'What stands in the city by the river of life in Revelation 22?', options: ['The tree of life', 'The altar', 'A temple', 'A vineyard'], answer: 0, why: 'Revelation 22:2, echoing Genesis 2-3.' },
    { q: 'Which book of the Bible is the last?', options: ['Jude', 'Revelation', 'Acts', 'Hebrews'], answer: 1, why: 'Revelation (the Apocalypse) closes the New Testament.' } ] },
];
