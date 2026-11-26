import type { DeepAnswer, DeepPrompt, DeepTheme } from './deepWaters';

/**
 * The sixth hand-written batch: broad, easy categories (a sin, a virtue, a way to pray, something at a baptism). There is no such thing as a question that is too
 * easy: nearly everyone can answer at once, and the climb is thinking of the rare answer. Each line is `Answer|tier|alias;alias`. Tiers are editorial judgement of
 * how many players would think of the answer (1 nearly everyone, 6 only a specialist), not survey data. Written from memory of the standard references named in
 * each `basis`; none of it has been reviewed by a person (see src/data/deepWaters.review.json). Open lists say "not on our list" for an unlisted answer, never "wrong".
 */
const rows = (t: string): DeepAnswer[] => t.trim().split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const [answer, tier, al] = l.split('|');
  const aliases = al ? al.split(';').map((x) => x.trim()).filter(Boolean) : [];
  return { answer: answer.trim(), tier: Number(tier) as DeepAnswer['tier'], ...(aliases.length ? { aliases } : {}) };
});
const L = (id: string, theme: DeepTheme, prompt: string, context: string, basis: string, list: string, extra: Partial<DeepPrompt> = {}): DeepPrompt => ({ id: `authored6-${id}`, theme, basis, prompt, context, answers: rows(list), ...extra });
const BIBLE = 'Hand-authored from the Bible.';
const CUSTOM = 'Hand-authored from the Catechism of the Catholic Church and common Catholic practice.';

export const BROAD_PROMPTS: DeepPrompt[] = [
  L('book-of-bible', 'scripture', 'Name a book of the Bible.', 'The Catholic Bible has 73 books, 46 in the Old Testament and 27 in the New. Any one of them counts.', BIBLE, `
Genesis|1
Exodus|1
Leviticus|2
Numbers|2
Deuteronomy|2
Joshua|2
Judges|2
Ruth|1
1 Samuel|3|First Samuel;Samuel
2 Samuel|3|Second Samuel
1 Kings|3|First Kings;Kings
2 Kings|3|Second Kings
1 Chronicles|4|First Chronicles;Chronicles
2 Chronicles|4|Second Chronicles
Ezra|3
Nehemiah|3
Tobit|2
Judith|2
Esther|1
1 Maccabees|3|First Maccabees;Maccabees
2 Maccabees|3|Second Maccabees
Job|1
Psalms|1|Psalm;Book of Psalms
Proverbs|1
Ecclesiastes|2
Song of Songs|2|Song of Solomon;Canticle of Canticles
Wisdom|2|Book of Wisdom
Sirach|3|Ecclesiasticus
Isaiah|1
Jeremiah|2
Lamentations|3
Baruch|4
Ezekiel|2
Daniel|1
Hosea|3
Joel|3
Amos|3
Obadiah|4
Jonah|1
Micah|3
Nahum|4
Habakkuk|4
Zephaniah|4
Haggai|4
Zechariah|3
Malachi|3
Matthew|1
Mark|1
Luke|1
John|1
Acts|1|Acts of the Apostles
Romans|1
1 Corinthians|2|First Corinthians;Corinthians
2 Corinthians|3|Second Corinthians
Galatians|2
Ephesians|2
Philippians|2
Colossians|3
1 Thessalonians|3|First Thessalonians;Thessalonians
2 Thessalonians|4|Second Thessalonians
1 Timothy|3|First Timothy;Timothy
2 Timothy|3|Second Timothy
Titus|3
Philemon|3
Hebrews|2
James|2
1 Peter|3|First Peter;Peter
2 Peter|3|Second Peter
1 John|3|First John
2 John|4|Second John
3 John|4|Third John
Jude|3
Revelation|1|Apocalypse;Book of Revelation
`, { closed: 73 }),
  L('angels', 'doctrine', 'Name an angel, an archangel, or a choir of angels in Catholic tradition.', 'Scripture names three angels, and tradition names others. Angels are messengers and servants of God. This list is not complete.', 'Hand-authored from Scripture and Catholic tradition.', `
Michael|1|Saint Michael;Michael the Archangel
Gabriel|1|Saint Gabriel;Gabriel the Archangel
Raphael|1|Saint Raphael;Raphael the Archangel
Lucifer|1|Satan;The devil
Uriel|3
Guardian angel|1|Guardian angels;My guardian angel
Seraphim|2|Seraph
Cherubim|2|Cherub
Thrones|3
Dominions|3|Dominations
Virtues|4
Powers|4
Principalities|3
Archangels|3
Angels|1
`),
  L('sins', 'doctrine', 'Name a sin.', 'The Church teaches that sin is an offense against God and neighbor. Any sin counts: a deadly sin, a sin against a commandment, or a sin of everyday life. This list is long but not complete.', CUSTOM, `
Pride|1
Greed|1|Avarice;Covetousness
Lust|1
Envy|1|Jealousy
Gluttony|1
Anger|1|Wrath
Sloth|1|Laziness
Murder|1|Killing
Stealing|1|Theft;Thievery;Robbery
Lying|1|Telling lies;Lies
Adultery|1
Blasphemy|2|Taking the Lord's name in vain
Cursing|2|Swearing
Cheating|2
Gossip|2|Gossiping
Hatred|2|Hate
Missing Mass|2|Skipping Mass;Not going to Mass
Idolatry|2|Worshiping idols
Coveting|2|Covet
Disobedience|3|Disobeying parents
Dishonoring parents|3|Not honoring parents
Slander|3|Calumny
Detraction|4
Perjury|4|False witness;Bearing false witness
Fornication|3
Abortion|2
Contraception|4
Despair|4
Presumption|5
Sacrilege|3
Simony|4
Heresy|3
Apostasy|4
Schism|4
Suicide|3
Drunkenness|3
Pornography|3
Vanity|3
Unkindness|3
Neglecting the poor|3
Revenge|3
Betrayal|3
Hypocrisy|3
Selfishness|2
Violence|2
Rash judgment|4
Scandal|4
Impurity|3
Fraud|3
Racism|3
Not praying|3
`),
  L('virtues-broad', 'doctrine', 'Name a virtue.', 'A virtue is a habit of doing good. The Church speaks of the three theological virtues and four cardinal virtues, and the saints name many more. Any virtue counts. This list is long but not complete.', CUSTOM, `
Faith|1
Hope|1
Charity|1|Love
Prudence|2
Justice|2
Fortitude|2|Courage;Bravery
Temperance|2|Self-control
Humility|1
Patience|1
Kindness|1
Chastity|2
Generosity|1|Liberality;Generosity of spirit
Obedience|2
Gratitude|2|Thankfulness
Honesty|1|Truthfulness
Mercy|1
Diligence|3
Meekness|3|Gentleness
Joy|2
Peace|1
Forgiveness|1
Compassion|1
Purity|2
Modesty|3
Wisdom|2
Poverty of spirit|4
Faithfulness|2|Fidelity
Loyalty|3
Perseverance|3
Self-sacrifice|3|Sacrifice
Zeal|4
Piety|3
Simplicity|4
Detachment|4
Trust|2
Respect|3
Service|2
Hospitality|3
Contentment|4
Mildness|5
Magnanimity|5
Fear of the Lord|4
Reverence|3
`),
  L('ways-to-pray', 'devotion', 'Name a way to pray.', 'Catholics pray alone and together, with set words. Any way of praying counts. This list is long but not complete.', CUSTOM, `
The rosary|1|Rosary;Praying the rosary
The Mass|1|Mass
Silent prayer|1|Silence;Praying silently
Prayer before meals|1|Grace before meals;Saying grace;Grace
Night prayer|2|Evening prayer;Bedtime prayer
Morning prayer|2|Lauds
Novena|2
The Stations of the Cross|2|Stations of the Cross;Way of the Cross
Adoration|2|Eucharistic adoration;Holy hour
Meditation|2|Meditating
Contemplation|3
Lectio divina|3|Praying with Scripture
The Liturgy of the Hours|3|Liturgy of the Hours;Divine Office;Breviary
The Angelus|2|Angelus
Litany|3|Litanies
Chaplet|3|Divine Mercy chaplet;Chaplet of Divine Mercy
Praying the psalms|3|Psalms
Intercession|3|Praying for others
Thanksgiving|3|Prayer of thanks
Praise|3|Prayer of praise
Petition|3|Asking for help
Spontaneous prayer|3|Talking to God;Praying in your own words
Examination of conscience|3|Examen
Benediction|3
Taizé prayer|5|Taize
Jesus Prayer|4
Walking pilgrimage|4|Pilgrimage
Praying with icons|5
Fasting|3
Making the sign of the cross|1|Sign of the cross
Genuflecting|3|Genuflection
Kneeling|2
Singing|2|Hymns
Reciting the Our Father|1|Our Father
Reciting the Hail Mary|1|Hail Mary
Bible reading|2|Reading the Bible
`),
  L('baptism-things', 'liturgy', 'Name something you see or hear at a baptism.', 'Baptism begins a person\'s life in the Church. This list is not complete.', 'Hand-authored from the Rite of Baptism.', `
Water|1|Holy water
Baptismal font|1|Font
The priest|1|Priest;Deacon
Godparents|1|Godmother;Godfather
Baby|1|The baby;Infant
White garment|2|White gown;Christening gown;Baptismal gown
Candle|2|Baptismal candle;Paschal candle
Oil|2|Chrism;Holy oil;Oil of catechumens
Sign of the cross|2
Parents|1
Name|2|Naming the child;Giving a name
Trinity|2|In the name of the Father and of the Son and of the Holy Spirit
Pouring water|2|Pouring;Immersion
Renouncing Satan|3|Renunciation of sin;Renounce evil
Profession of faith|3|Creed;I do
Anointing|3
Family|1
Celebration|3|Party
Crying|3
Prayers|2
Original sin|4
Welcome to the Church|3
Dove|4
Photographs|3
Gifts|3
`),
  L('wedding-things', 'liturgy', 'Name something you see or hear at a Catholic wedding.', 'A Catholic wedding is a sacrament celebrated with the community gathered. This list is not complete.', 'Hand-authored from the Rite of Marriage.', `
Bride|1
Groom|1|Bridegroom
Rings|1|Wedding rings;Exchange of rings
Vows|1|I do;Exchange of vows
Priest|1|Deacon
Altar|1
Bridesmaids|2|Maid of honor
Groomsmen|2|Best man
Witnesses|2
Wedding dress|1|Dress;Gown;Wedding gown
Veil|2
Bouquet|2|Flowers
Unity candle|3
Readings|2|Scripture readings
Homily|2
Blessing|2|Nuptial blessing
Communion|2|Mass
Kiss|2|The kiss
Organ|2|Music;Hymns
Guests|2
Procession|2|Walking down the aisle;Aisle
Father walks bride|3|Giving away the bride
Consent|3|Declaration of consent
Prayers of the faithful|3|Intercessions
Marriage license|3|Marriage certificate;Signing the register
Confetti|3|Rice
Photographs|2|Photos
Flower girl|3
Ring bearer|3
Reception|2|Party;Dance
Wedding cake|2|Cake
Candles|3
Sign of peace|3
Bells|4
`),
  L('funeral-things', 'liturgy', 'Name something you see or hear at a Catholic funeral.', 'A Catholic funeral commends the person to God. This list is not complete.', 'Hand-authored from the Order of Christian Funerals.', `
Coffin|1|Casket
Priest|1|Deacon
Flowers|1
Prayers|1
Hymns|1|Music;Singing
Eulogy|2|Words of remembrance
Pall|2|White cloth;Funeral pall
Paschal candle|2|Easter candle
Holy water|2|Sprinkling with holy water
Incense|2
Readings|2
Homily|2
Communion|2|Mass
Burial|1|Graveside
Pallbearers|2
Procession|2
Rosary|2|Wake prayers
Vigil|2|Wake
Mourners|1|Family;Friends
Tears|1
Candles|2
Grave|1|Plot
Cemetery|1
Committal|3
Eternal rest|2|Eternal rest grant unto them
In Paradisum|4
Ave Maria|3
Amazing Grace|3
On Eagle's Wings|3|On Eagles Wings
Cremation|3|Ashes;Urn
Reception|3|Gathering
White vestments|3|Vestments
Cross|2|Crucifix
Memorial card|3|Prayer card
Funeral home|3
`),
  L('confessional-things', 'liturgy', 'Name something connected with Confession.', 'One of the sacraments of healing in the Church. This list is not complete.', 'Hand-authored from the Rite of Penance.', `
Priest|1
Confessional|1|Confession booth;Booth
Sins|1|Sin
Penance|1
Absolution|2
Forgiveness|1
Act of Contrition|2
Kneeler|2|Kneeling
Screen|2
Examination of conscience|2|Examen
Sorrow|2|Contrition
Sign of the cross|2
Bless me Father|2|Bless me Father for I have sinned
Our Father|2|Hail Mary;Prayers
Saturday|3
Lent|3
Advent|3
Line|3|Waiting
Curtain|3
Seal|3|Seal of confession
Mercy|2
Reconciliation|2
Examination|3
Grace|2
God|1
Guilt|2
Relief|3
Counsel|3|Advice
Face to face|3
Anonymous|3
Priest's stole|4|Stole
Confess|1
`),
  L('moses-story', 'scripture', 'Name something from the story of Moses and the Exodus.', 'The Book of Exodus tells how God freed Israel from Egypt through Moses. This list is not complete.', 'Hand-authored from Exodus.', `
Burning bush|1
Red Sea|1|Parting of the Red Sea
Ten Commandments|1
Mount Sinai|1|Sinai
Manna|1
Passover|1
Golden calf|1
Pharaoh|1
Aaron|1
Miriam|2
Staff|1|Rod;Moses' staff
Stone tablets|1|Tablets;Tablets of the Law
Quail|2
Water from the rock|2
Egypt|1
The Promised Land|2|Promised Land;Canaan
Wilderness|2|Desert
Pillar of fire|2|Pillar of cloud
Tabernacle|3
Ark of the Covenant|2|Ark
Basket|2|Baby in a basket;Bulrushes
Plague of frogs|2|Frogs
Plague of locusts|2|Locusts
Death of the firstborn|2|Firstborn
Unleavened bread|3
Lamb|2|Passover lamb
Blood on the doorposts|3|Doorposts
Jethro|4
Zipporah|4
Joshua|3
Amalek|5
Aaron's staff|4
Moses|1
Midian|4
Mount Nebo|4|Nebo
Bitter water|4|Marah
Slavery|2
Taskmasters|3
Bricks|3
`),
  L('passion-story', 'scripture', 'Name something from the Passion of Jesus.', 'The Passion is the story of Jesus\' suffering and death, told in all four Gospels. This list is not complete.', 'Hand-authored from the four Gospels.', `
Cross|1|Crucifix
Crown of thorns|1|Thorns
Judas|1|Judas Iscariot
Thirty pieces of silver|1|30 pieces of silver;Silver
Last Supper|1
Garden of Gethsemane|1|Gethsemane
Pontius Pilate|1|Pilate
Peter's denial|1|Peter denies Jesus;Denial
Rooster|1|Cock crow;Cock;Rooster crows
Nails|1
Scourging|1|Whipping;Flogging
Barabbas|1
Simon of Cyrene|2
Veronica|2|Veil of Veronica
Spear|2|Lance
Sponge|3|Vinegar
Soldiers|1|Roman soldiers
Mary|1|Our Lady
John|2
Mary Magdalene|2
Betrayal|1|Kiss of Judas;Judas' kiss
Arrest|1
Sanhedrin|3
Caiaphas|2
Herod|2
Purple robe|3
King of the Jews|2|INRI
Tomb|1
Joseph of Arimathea|2
Nicodemus|3
Linen cloth|3|Shroud
Good thief|2
Darkness|2
Earthquake|3
Veil of the Temple torn|3|Temple veil
Wine|2
Casting lots|3|Dice;Garments
Seamless garment|3|Tunic
Bread|2
Cup|2|Chalice
Washing of feet|2
Palm Sunday|2|Palms
Hosanna|2
Golgotha|2|Calvary
Skull|3
Mockery|3
Spitting|3
Water and blood|3
It is finished|2
Father forgive them|2
Why have you forsaken me|3
`),
  L('easter-story', 'scripture', 'Name something from the Resurrection of Jesus.', 'The Gospels tell how the tomb was found empty and how the risen Jesus appeared to his disciples. This list is not complete.', 'Hand-authored from the four Gospels.', `
Empty tomb|1|Tomb
Stone|1|Stone rolled away
Angel|1|Angels
Mary Magdalene|1
Linen cloths|2|Burial cloths;Shroud
Garden|2
Peter|2
John|2
Thomas|1|Doubting Thomas
Wounds|2|Nail marks;Hands and side
Road to Emmaus|1|Emmaus
Breaking of bread|2
Fish|2|Grilled fish;Breakfast on the shore
Sea of Galilee|2|Galilee
Upper Room|2|Locked room
Peace be with you|2|Peace
Ascension|2
Great Commission|3|Go and make disciples
Sunrise|3|Early morning
Earthquake|3
Guards|3|Soldiers
Spices|3|Ointments
Salome|4
Mary the mother of James|4
Cleopas|3
Gardener|3
Rabboni|3
Do not touch me|3|Noli me tangere
Joseph of Arimathea|3
Easter Sunday|1|Sunday;The first day of the week
`),
  L('jesus-places', 'places', 'Name a place where Jesus went or lived.', 'The Gospels follow Jesus through his life and ministry. This list is long but not complete.', 'Hand-authored from the four Gospels.', `
Bethlehem|1
Nazareth|1
Jerusalem|1
Capernaum|1
Galilee|1
Jordan River|1|Jordan
Sea of Galilee|1
Cana|1
Bethany|2
Jericho|2
Gethsemane|1|Garden of Gethsemane
Calvary|1|Golgotha
Emmaus|2
Mount of Olives|2
Samaria|2
Egypt|2
Judea|2
Temple|1|The Temple
Mount of Transfiguration|2|Mount Tabor;Tabor
Caesarea Philippi|3
Bethsaida|3
Tyre|3
Sidon|3
Nain|3
Magdala|3
Chorazin|4
Decapolis|3
Gennesaret|3
Sychar|3|Jacob's well;Well of Jacob
Gerasa|4|Gerasenes
Bethphage|4
Ephraim|5
Wilderness|2|Desert
Mountain of the Beatitudes|3|Sermon on the Mount
Upper Room|2
Pool of Bethesda|3|Bethesda
Pool of Siloam|3|Siloam
Herod's palace|4
Pilate's praetorium|4|Praetorium
`),
  L('bible-cities', 'places', 'Name a city or town in the Bible.', 'Hundreds of cities appear in the Bible. Any city or town named in the Old or New Testament counts. This list is long but not complete.', BIBLE, `
Jerusalem|1
Bethlehem|1
Nazareth|1
Babylon|1
Nineveh|1
Jericho|1
Damascus|1
Rome|1
Corinth|1
Ephesus|1
Antioch|1
Sodom|1
Gomorrah|1
Tyre|2
Sidon|2
Hebron|2
Shechem|2
Samaria|2
Athens|1
Capernaum|1
Bethany|2
Cana|1
Emmaus|2
Philippi|2
Thessalonica|2
Colossae|3
Laodicea|3
Smyrna|3
Pergamum|3|Pergamon
Thyatira|3
Sardis|3
Philadelphia|3
Joppa|3|Jaffa
Caesarea|3
Tarsus|2
Lystra|3
Derbe|4
Iconium|3
Ur|2
Haran|3|Harran
Bethel|2
Beersheba|3
Gaza|2
Ashkelon|3
Ashdod|3
Gath|3
Jezreel|3
Megiddo|2
Shiloh|3
Gibeon|3
Hazor|4
Ai|3
Dan|3
Tirzah|5
Susa|4|Shushan
Memphis|4
Thebes|4
On|5
Troas|4
Berea|4
Cyrene|3
Nain|3
Bethsaida|3
Chorazin|4
Magdala|3
`),
  L('bible-lands', 'places', 'Name a country or land in the Bible.', 'The Bible names many lands, from Egypt and Israel to Persia and Rome. This list is long but not complete.', BIBLE, `
Egypt|1
Israel|1
Judah|2|Judea
Babylon|1|Babylonia
Assyria|2
Persia|2
Greece|2
Rome|1|Roman Empire
Canaan|1|The Promised Land
Moab|2
Edom|3
Ammon|3
Philistia|3
Syria|2|Aram
Ethiopia|2|Cush
Arabia|3
Macedonia|3
Galatia|3
Asia|3|Asia Minor
Cyprus|3
Crete|3
Malta|3
Lydia|5
Phoenicia|3
Midian|3
Sheba|3
Samaria|3
Galilee|2
Eden|1|Garden of Eden
Goshen|3
Gilead|3
Ur of the Chaldeans|3
Lebanon|3
Gaul|5
Spain|3
Illyricum|5
Italy|3
Cappadocia|4
Pontus|4
Bithynia|4
Phrygia|4
Pamphylia|4
Libya|4
Mesopotamia|3
Elam|4
Media|4
`),
  L('vatican-things', 'church-history', 'Name something connected with the Vatican.', 'The Vatican is the center of the Catholic Church and the smallest country in the world. This list is long but not complete.', 'Hand-authored from the Vatican City State and the Holy See.', `
Saint Peter's Basilica|1|St. Peter's;Saint Peter's;Basilica of Saint Peter
Sistine Chapel|1
Swiss Guard|1|Swiss Guards
Saint Peter's Square|1|St. Peter's Square
Cardinals|1|Cardinal
Conclave|1
Vatican Museums|2|Vatican Museum
Pietà|2|Pieta
Michelangelo|2
Raphael|3
Vatican Library|3
Vatican City|1
Papal apartments|3|Apostolic Palace
Obelisk|3
Colonnade|3|Bernini's colonnade
Bernini|3
Baldacchino|4
Tomb of Saint Peter|3|Saint Peter's tomb
Papal Mass|2
Urbi et Orbi|3
Angelus|2
White smoke|1
Black smoke|1
Holy See|2
Vatican Radio|3
Vatican Observatory|4
Vatican Bank|3
Vatican Gardens|3
Sistine Chapel ceiling|2
Creation of Adam|2
The Last Judgment|3
Vatican Secret Archives|3|Apostolic Archive
Castel Gandolfo|3
Papal tiara|4|Tiara
Fisherman's ring|4|Ring of the Fisherman
Papal throne|3
Rome|1
Papal audience|2|General audience
Pope mobile|2|Popemobile
`),
  L('conclave-things', 'church-history', 'Name something connected with choosing a new pope.', 'When a pope dies or resigns, the cardinals meet in a conclave to elect his successor. This list is not complete.', 'Hand-authored from Universi Dominici Gregis and recent conclaves.', `
White smoke|1|Smoke
Black smoke|1
Cardinals|1|Cardinal
Sistine Chapel|1
Conclave|1
Voting|1|Ballot;Vote;Ballots
Habemus papam|1|We have a pope
New name|2|Papal name;Choosing a name
Balcony|2|Loggia
Cardinal protodeacon|3|Cardinal deacon
Two-thirds majority|3|Two thirds
Locked in|2|Locked doors;Cum clave
Secrecy|2|Oath of secrecy
Cassock|3
Red robes|2|Red
Swiss Guard|3
Chimney|2
Dean of the College of Cardinals|3|College of Cardinals
Camerlengo|3
Funeral of the pope|3|Novemdiales
Sede vacante|3|Vacant see
Ring of the Fisherman destroyed|4
Prayer|2|Veni Creator
Mass for the election|3|Pro eligendo pontifice
Sealed|3
Crowds|2
Bells|3
Election|1
Acceptance|3|Acceptio
Urbi et orbi|3
Papal blessing|2
`),
  L('catholic-groups', 'church-history', 'Name a Catholic charity, lay group, or religious order.', 'Many Catholic groups serve the poor and build up the Church. This list is not complete.', 'Hand-authored from the Annuario Pontificio and the groups\' own descriptions.', `
Knights of Columbus|1
Catholic Relief Services|1|CRS
Caritas|2
Society of Saint Vincent de Paul|2|Saint Vincent de Paul Society;Saint Vincent de Paul
Legion of Mary|2
Catholic Charities|1
Catholic Worker|3|Catholic Worker Movement
Opus Dei|2
Sant'Egidio|4|Community of Sant'Egidio
Missionaries of Charity|1
Little Sisters of the Poor|2
Catholic Daughters of the Americas|3|Catholic Daughters
Ladies of Charity|4
Holy Name Society|3
Sodality|3|Sodality of Our Lady
Focus|3|FOCUS
Catholic Youth Organization|3|CYO
Marian Movement|4
Cursillo|3
Communion and Liberation|4
Focolare|3
Neocatechumenal Way|3
Pax Christi|3
Aid to the Church in Need|4
Catholic Extension|4
Order of Malta|3|Knights of Malta
Knights of the Holy Sepulchre|4
Catholic Rural Life|5
Teams of Our Lady|5
Schoenstatt|5
Couples for Christ|5
`),
  L('angel-names-gospel', 'scripture', 'Name something that an angel did in the Bible.', 'Angels deliver messages, protect God\'s people and announce great events. This list is not complete.', BIBLE, `
Announced Jesus' birth to Mary|1|Annunciation;Told Mary she would have a son
Appeared to the shepherds|1|Told the shepherds
Appeared to Joseph in a dream|1|Warned Joseph
Rolled away the stone|2|Rolled the stone
Announced the Resurrection|1|Said he is risen
Strengthened Jesus in the garden|2
Wrestled with Jacob|3
Stopped Abraham from sacrificing Isaac|2|Stopped the sacrifice of Isaac
Guarded the Garden of Eden|2|Flaming sword
Told Zechariah about John|2|Appeared to Zechariah
Freed Peter from prison|2|Released Peter
Fed Elijah|3
Shut the lions' mouths|3|Protected Daniel
Walked in the furnace|3|Fiery furnace
Led Lot out of Sodom|2|Rescued Lot
Appeared to Gideon|3
Appeared to Hagar|3
Appeared to Moses in the burning bush|2|Burning bush
Healed at the pool|4|Troubled the water
Struck down the Assyrians|4|Destroyed Sennacherib's army
Led Tobias|3|Accompanied Tobias
Carried messages|2|Delivered messages
Sang Glory to God|1|Glory to God in the highest
Stood at the tomb|2
Appeared to Paul on the ship|4
Opened the prison doors|3
Announced Samson's birth|4
Touched Isaiah's lips|4|Coal on Isaiah's lips
Showed visions to John|3|Revelation
Blew the trumpets|3|Trumpets
Poured out the bowls|5
Fought the dragon|3|Michael fought the dragon
`),
  L('holy-spirit-symbols', 'doctrine', 'Name a symbol of the Holy Spirit.', 'The Catechism lists many biblical signs of the Holy Spirit. This list is not complete.', 'Hand-authored from the Catechism of the Catholic Church, nos. 694 to 701.', `
Dove|1
Fire|1|Flame
Wind|1|Rushing wind
Water|2
Oil|2|Chrism
Cloud|3
Seal|3
Hand|3|Laying on of hands
Finger|4|Finger of God
Light|3
Tongues of fire|1
Breath|2
Living water|3
Red|3|Red vestments
Temple|4
Advocate|3|Paraclete
Counselor|3|Comforter
`),
  L('creation-things', 'scripture', 'Name something God made in the Creation story.', 'The Book of Genesis tells how God created the world in six days and rested on the seventh. This list is long but not complete.', 'Hand-authored from Genesis 1 to 2.', `
Light|1
Sky|1|Heavens;Firmament
Sea|1|Oceans;Seas;Water
Land|1|Earth;Dry land
Plants|1|Trees;Grass
Sun|1
Moon|1
Stars|1
Fish|1
Birds|1
Animals|1
Man|1|Adam
Woman|1|Eve
Day|2|Day and night
Night|2
Seeds|3
Fruit trees|2|Fruit
Whales|3|Sea monsters;Great sea creatures
Cattle|2|Livestock
Creeping things|3|Reptiles;Insects
Wild animals|2|Beasts of the earth
Garden|2|Garden of Eden;Eden
Rivers|3
Tree of life|2
Tree of the knowledge of good and evil|2|Tree of knowledge
Rest|2|Sabbath;Seventh day
Evening and morning|3
Image of God|3
Clay|4|Dust
`),
  L('liturgical-colors', 'liturgy', 'Name a liturgical color.', 'The priest\'s vestments change color with the season or feast. This list is complete: the colors used in the Roman Rite.', 'Hand-authored from the General Instruction of the Roman Missal, no. 346.', `
Green|1
White|1
Red|1
Purple|1|Violet
Rose|2|Pink
Black|3
Gold|3|Gold vestments
`, { closed: 7 }),
  L('bible-seas-waters', 'places', 'Name a sea, river or body of water in the Bible.', 'Water runs through the Bible, from the rivers of Eden to the sea of glass in Revelation. This list is not complete.', BIBLE, `
Jordan River|1|Jordan
Sea of Galilee|1|Lake of Gennesaret;Lake Tiberias;Galilee
Red Sea|1|Sea of Reeds
Dead Sea|1|Salt Sea
Mediterranean Sea|2|Mediterranean;Great Sea
Nile|1|Nile River
Euphrates|2
Tigris|2|Hiddekel
Pool of Bethesda|3
Pool of Siloam|3
Jabbok|4|Jabbok River
Arnon|4|Arnon River
Kidron|3|Kidron Valley
Kishon|4
Pishon|4
Gihon|4
Abana|5
River of Egypt|4
Chebar|4|Chebar canal
Spring of Harod|5
Sea of glass|3
Waters of Marah|3|Marah
Waters of Meribah|4|Meribah
`),
  L('nt-letters-writers', 'scripture', 'Name someone who wrote part of the New Testament.', 'Traditionally the New Testament has eight different authors, and many more are named in the letters. This list is complete for traditional authorship.', 'Hand-authored from the traditional attributions.', `
Paul|1
Matthew|1
Mark|1
Luke|1
John|1
Peter|1
James|2
Jude|3
`, { closed: 8 }),
  L('catholic-sacramentals', 'liturgy', 'Name a sacramental or religious object Catholics use.', 'Sacramentals are blessed objects and actions that help Catholics pray. This list is long but not complete.', 'Hand-authored from the Catechism of the Catholic Church, nos. 1667 to 1679.', `
Rosary|1|Rosary beads
Crucifix|1|Cross
Holy water|1
Medal|1|Saint medal;Miraculous Medal;Saint Christopher medal
Scapular|2
Candle|1|Votive candle
Palm|2|Blessed palm
Holy card|2|Prayer card
Statue|1|Holy statue
Icon|2
Incense|2
Holy oil|3|Blessed oil
Ashes|2
Blessed salt|4
Crucifix necklace|2|Cross necklace
Medal of Saint Benedict|3|Benedict medal
Nativity set|2|Crèche;Creche;Nativity scene
Chaplet|3
Agnus Dei|5
Blessed bread|3|Saint Anthony's bread
Holy water font|2
Image of Mary|2|Mary statue
Prayer book|2
Bell|3
`),
  L('mass-vessels', 'liturgy', 'Name something a priest uses at Mass.', 'The priest uses a number of vessels and books. This list is long but not complete.', 'Hand-authored from the General Instruction of the Roman Missal.', `
Chalice|1
Paten|2
Host|1|Hosts;Bread
Wine|1
Vestments|1
Chasuble|1
Stole|2
Alb|2
Cincture|3
Amice|3
Missal|2|Roman Missal;Sacramentary
Lectionary|2
Gospel book|2|Book of the Gospels
Ciborium|2
Cruet|3|Cruets
Water|2
Altar cloth|3
Corporal|3
Purificator|3
Lavabo|3|Lavabo bowl
Bell|2|Sanctus bell
Incense|2
Thurible|2|Censer
Crucifix|2|Cross
Candles|1
Ambo|3|Pulpit;Lectern
Chair|3|Presider's chair
Paschal candle|3
Aspergillum|3|Holy water sprinkler
Monstrance|2
Pyx|4
Humeral veil|4
Chalice veil|4
Holy water|2
Oils|3|Chrism
Mitre|3|Bishop's mitre
Crosier|3|Staff
Dalmatic|4
Cope|3
Maniple|5
`),
  L('catholic-holidays-simple', 'liturgy', 'Name a Catholic holiday.', 'The Church keeps many holidays, from the great feasts of the Lord to the days of the saints. Any one counts. This list is long but not complete.', 'Hand-authored from the General Roman Calendar.', `
Christmas|1
Easter|1
Pentecost|1
Ash Wednesday|1
Palm Sunday|1
Good Friday|1
Holy Thursday|1|Maundy Thursday
Holy Saturday|2
Ascension|1|Ascension Thursday
All Saints' Day|1|All Saints Day;All Saints
All Souls' Day|1|All Souls Day;All Souls
Epiphany|1|Three Kings' Day;Dia de los Reyes
Assumption|1|Feast of the Assumption
Immaculate Conception|1
Annunciation|2
Corpus Christi|2
Trinity Sunday|2
Candlemas|2|Presentation of the Lord
Transfiguration|3
Christ the King|2|Feast of Christ the King
Divine Mercy Sunday|2
Mary, Mother of God|2|Solemnity of Mary;New Year's Day
Saint Joseph's Day|2|Feast of Saint Joseph
Saint Patrick's Day|1
Saint Valentine's Day|2
Saint Nicholas Day|2
Saint Francis' feast|3|Feast of Saint Francis
Birth of Mary|3|Nativity of Mary
Our Lady of Guadalupe|2
Visitation|3
Holy Family|2|Feast of the Holy Family
Baptism of the Lord|2
Advent|1
Lent|1
Triduum|2|Easter Triduum
Rogation days|5
Michaelmas|3|Feast of Saint Michael
Saint John's Day|3|Feast of Saint John the Baptist
Saints Peter and Paul|2
Saint Stephen's Day|3|Feast of Stephen
Holy Innocents|3|Feast of the Holy Innocents
Saint Lucy's Day|3
Mardi Gras|2|Shrove Tuesday;Fat Tuesday
Laetare Sunday|3
Gaudete Sunday|3
Our Lady of Fatima|2
Our Lady of Lourdes|2
Sacred Heart|2|Feast of the Sacred Heart
Day of the Dead|3|Dia de los Muertos;Día de los Muertos
Las Posadas|3
`),
];
