/**
 * Follow a story through the whole Bible. Each step is a passage with a one-line caption. `link` says how the step is connected to the one
 * before: it continues the story in the text itself, a later writer explicitly recalls it, or it is a reading the Church has made.
 */
export type Link = 'story' | 'recalled' | 'tradition';
export interface Step { ref: string; caption: string; link: Link }
export interface Thread { id: string; title: string; blurb: string; steps: Step[] }

export const LINK_LABEL: Record<Link, string> = {
  story: 'The story continues in the text',
  recalled: 'A later biblical writer recalls it',
  tradition: 'A reading in the Church’s tradition',
};

export const THREADS: Thread[] = [
  { id: 'abraham', title: 'The promise to Abraham', blurb: 'One promise (land, descendants, blessing for all nations) followed from Genesis to the New Testament.', steps: [
    { ref: 'Genesis 12:1-4', caption: 'God calls Abram and promises to bless all the families of the earth through him.', link: 'story' },
    { ref: 'Genesis 15:1-6', caption: 'Abram believes the promise of descendants, and it is counted to him as righteousness.', link: 'story' },
    { ref: 'Genesis 17:1-8', caption: 'The covenant is sealed and Abram becomes Abraham, father of many nations.', link: 'story' },
    { ref: 'Genesis 22:1-18', caption: 'Abraham is asked to offer Isaac; God provides, and repeats the promise.', link: 'story' },
    { ref: 'Exodus 2:23-25', caption: 'In Egypt God remembers his covenant with Abraham, Isaac and Jacob.', link: 'recalled' },
    { ref: 'Luke 1:54-55', caption: 'Mary sings that God has helped Israel “as he spoke to our fathers, to Abraham.”', link: 'recalled' },
    { ref: 'Galatians 3:6-9', caption: 'Paul reads the promise as fulfilled in those who share Abraham’s faith, from every nation.', link: 'recalled' },
    { ref: 'Hebrews 11:8-19', caption: 'Abraham is held up as a model of faith, and Isaac’s rescue is called a figure of resurrection.', link: 'recalled' },
  ] },
  { id: 'exodus', title: 'Passover and Exodus', blurb: 'From the night in Egypt to the Lord’s Supper and the Church’s Easter.', steps: [
    { ref: 'Exodus 3:1-15', caption: 'God speaks from the burning bush and reveals his name to Moses.', link: 'story' },
    { ref: 'Exodus 12:1-14', caption: 'The Passover lamb, and the blood on the doorposts.', link: 'story' },
    { ref: 'Exodus 14:21-31', caption: 'Israel passes through the sea.', link: 'story' },
    { ref: 'Exodus 16:4-15', caption: 'Manna in the wilderness.', link: 'story' },
    { ref: 'Psalm 78:12-25', caption: 'A psalm retells the exodus as a lesson for later generations.', link: 'recalled' },
    { ref: 'John 6:30-35', caption: 'Jesus speaks of the bread from heaven, recalling the manna.', link: 'recalled' },
    { ref: '1 Corinthians 5:7-8', caption: '“Christ, our Passover lamb, has been sacrificed.”', link: 'recalled' },
    { ref: '1 Corinthians 10:1-4', caption: 'Paul sees the cloud, the sea, the manna and the rock as pointing to baptism and the Eucharist.', link: 'recalled' },
  ] },
  { id: 'david', title: 'The house of David', blurb: 'The promise of an everlasting throne, from David to the Son of David.', steps: [
    { ref: '1 Samuel 16:1-13', caption: 'Samuel anoints David, the youngest son of Jesse.', link: 'story' },
    { ref: '2 Samuel 7:8-16', caption: 'God promises David a house and a kingdom that will endure for ever.', link: 'story' },
    { ref: 'Psalm 89:3-4', caption: 'The psalmist holds God to the oath he swore to David.', link: 'recalled' },
    { ref: 'Isaiah 11:1-5', caption: 'A shoot will come from the stump of Jesse.', link: 'recalled' },
    { ref: 'Jeremiah 23:5-6', caption: 'God will raise up for David a righteous branch.', link: 'recalled' },
    { ref: 'Matthew 1:1-6', caption: 'Matthew opens his Gospel with Jesus as “son of David, son of Abraham.”', link: 'recalled' },
    { ref: 'Luke 1:30-33', caption: 'Gabriel tells Mary her son will be given the throne of his father David.', link: 'recalled' },
    { ref: 'Acts 2:29-36', caption: 'Peter says God swore to David that one of his descendants would sit on his throne, and that this is Jesus.', link: 'recalled' },
  ] },
  { id: 'exile', title: 'Exile and return', blurb: 'The fall of Jerusalem, the prophets’ hope, and the new covenant.', steps: [
    { ref: '2 Kings 25:1-12', caption: 'Jerusalem falls and the people are carried off to Babylon.', link: 'story' },
    { ref: 'Psalm 137:1-6', caption: 'By the rivers of Babylon, the exiles weep for Zion.', link: 'story' },
    { ref: 'Jeremiah 29:4-14', caption: 'Jeremiah tells the exiles to build lives in Babylon and promises a return.', link: 'story' },
    { ref: 'Ezekiel 37:1-14', caption: 'The valley of dry bones: God will raise his people and give them his Spirit.', link: 'story' },
    { ref: 'Isaiah 40:1-11', caption: '“Comfort, comfort my people.” A highway for the Lord in the wilderness.', link: 'story' },
    { ref: 'Ezra 1:1-4', caption: 'Cyrus lets the exiles go home to rebuild the temple.', link: 'story' },
    { ref: 'Jeremiah 31:31-34', caption: 'God promises a new covenant, written on the heart.', link: 'recalled' },
    { ref: 'Luke 22:19-20', caption: 'At the Last Supper Jesus speaks of the new covenant in his blood.', link: 'recalled' },
  ] },
  { id: 'peter', title: 'Simon Peter', blurb: 'The fisherman who becomes the rock, in his own failures and calls.', steps: [
    { ref: 'Luke 5:1-11', caption: 'A miraculous catch of fish; Simon is told, “from now on you will catch men.”', link: 'story' },
    { ref: 'Matthew 16:13-19', caption: 'Peter’s confession at Caesarea Philippi, and the keys of the kingdom.', link: 'story' },
    { ref: 'Matthew 14:28-33', caption: 'Peter walks on the water and begins to sink.', link: 'story' },
    { ref: 'Luke 22:31-34', caption: 'Jesus prays that Peter’s faith will not fail, and foretells his denial.', link: 'story' },
    { ref: 'Luke 22:54-62', caption: 'Peter denies Jesus three times, and the Lord looks at him.', link: 'story' },
    { ref: 'John 21:15-19', caption: 'By the lakeshore the risen Lord asks Peter three times, “Do you love me?” and says, “Feed my sheep.”', link: 'story' },
    { ref: 'Acts 2:14-41', caption: 'Peter preaches at Pentecost and three thousand are baptized.', link: 'story' },
    { ref: '1 Peter 5:1-4', caption: 'Peter writes as a fellow elder, and calls Christ the chief Shepherd.', link: 'story' },
  ] },
  { id: 'mary', title: 'Mary in Scripture', blurb: 'From the promise in Genesis to the woman of Revelation. The Church reads the earlier passages as pointing to her.', steps: [
    { ref: 'Genesis 3:15', caption: 'God promises that the woman’s offspring will crush the serpent’s head.', link: 'story' },
    { ref: 'Isaiah 7:14', caption: 'A virgin shall conceive and bear a son, Immanuel.', link: 'recalled' },
    { ref: 'Luke 1:26-38', caption: 'The Annunciation: “Behold, I am the handmaid of the Lord.”', link: 'recalled' },
    { ref: 'Luke 1:39-56', caption: 'The Visitation and the Magnificat.', link: 'story' },
    { ref: 'John 2:1-11', caption: 'At Cana Mary says, “Do whatever he tells you.”', link: 'story' },
    { ref: 'John 19:25-27', caption: 'At the cross Jesus gives Mary to the beloved disciple, and him to her.', link: 'story' },
    { ref: 'Acts 1:12-14', caption: 'Mary prays with the apostles awaiting the Spirit.', link: 'story' },
    { ref: 'Revelation 12:1-6', caption: 'A woman clothed with the sun. The Church reads this as both Mary and the Church.', link: 'tradition' },
  ] },
];
