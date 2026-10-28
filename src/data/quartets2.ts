import type { Quartet } from './quartets';

/** More Quartets puzzles. Each set is a truth about the Bible or the Church; a few tiles tempt you into the wrong set. */
export const MORE_QUARTETS: Quartet[] = [
  { id: 'q14', title: 'Who is Jesus?', groups: [
    { name: 'Around the manger', level: 0, words: ['Manger', 'Star', 'Shepherds', 'Magi'] },
    { name: '“I am…” sayings', level: 1, words: ['Bread of life', 'Light of the world', 'True vine', 'The gate'] },
    { name: 'Names given by Isaiah', level: 2, words: ['Emmanuel', 'Prince of Peace', 'Wonderful Counselor', 'Mighty God'] },
    { name: 'Titles in John and Revelation', level: 3, words: ['Lamb of God', 'Alpha and Omega', 'Lion of Judah', 'Morning Star'] } ] },
  { id: 'q15', title: 'Living the faith', groups: [
    { name: 'Beatitudes', level: 0, words: ['Poor in spirit', 'Meek', 'Merciful', 'Peacemakers'] },
    { name: 'Corporal works of mercy', level: 1, words: ['Feed the hungry', 'Visit the sick', 'Bury the dead', 'Shelter the homeless'] },
    { name: 'Spiritual works of mercy', level: 2, words: ['Counsel the doubtful', 'Instruct the ignorant', 'Admonish sinners', 'Comfort the sorrowful'] },
    { name: 'Precepts of the Church', level: 3, words: ['Attend Mass', 'Confess yearly', 'Receive Easter Communion', 'Fast and abstain'] } ] },
  { id: 'q16', title: 'Councils and heresies', groups: [
    { name: 'Prayers every Catholic knows', level: 0, words: ['Our Father', 'Hail Mary', 'Glory Be', 'Act of Contrition'] },
    { name: 'Early councils', level: 1, words: ['Nicaea', 'Constantinople', 'Ephesus', 'Chalcedon'] },
    { name: 'Later councils', level: 2, words: ['Trent', 'Lateran IV', 'Vatican I', 'Vatican II'] },
    { name: 'Heresies', level: 3, words: ['Arianism', 'Pelagianism', 'Nestorianism', 'Docetism'] } ] },
  { id: 'q17', title: 'Books of the Bible', groups: [
    { name: 'Gospels', level: 0, words: ['Matthew', 'Mark', 'Luke', 'John'] },
    { name: 'First books of the Law', level: 1, words: ['Genesis', 'Exodus', 'Leviticus', 'Numbers'] },
    { name: 'Wisdom books', level: 2, words: ['Proverbs', 'Job', 'Ecclesiastes', 'Sirach'] },
    { name: 'Found in Catholic Bibles, not Protestant ones', level: 3, words: ['Tobit', 'Judith', 'Baruch', 'Maccabees'] } ] },
  { id: 'q18', title: 'Signs and symbols', groups: [
    { name: 'Found in a church', level: 0, words: ['Altar', 'Pew', 'Font', 'Pulpit'] },
    { name: 'Animals in Bible stories', level: 1, words: ['Serpent', 'Donkey', 'Raven', 'Great fish'] },
    { name: 'The four evangelists’ symbols', level: 2, words: ['Lion', 'Ox', 'Eagle', 'Winged man'] },
    { name: 'Saints and their emblems', level: 3, words: ['Keys', 'Wheel', 'Arrows', 'Gridiron'] } ] },
  { id: 'q19', title: 'The Church’s calendar and its people', groups: [
    { name: 'Holy days of obligation', level: 0, words: ['Christmas', 'Assumption', 'All Saints', 'Mary, Mother of God'] },
    { name: 'Popes who are saints', level: 1, words: ['Peter', 'Pius X', 'John XXIII', 'John Paul II'] },
    { name: 'Doctors of the Church', level: 2, words: ['Augustine', 'Thomas Aquinas', 'Jerome', 'Teresa of Avila'] },
    { name: 'Feasts of the Lord', level: 3, words: ['Epiphany', 'Ascension', 'Transfiguration', 'Corpus Christi'] } ] },
  { id: 'q20', title: 'Fathers and mothers of Israel', groups: [
    { name: 'Patriarchs', level: 0, words: ['Abraham', 'Isaac', 'Jacob', 'Joseph'] },
    { name: 'Matriarchs', level: 1, words: ['Sarah', 'Rebekah', 'Leah', 'Rachel'] },
    { name: 'Prophets of the northern kingdom', level: 2, words: ['Elijah', 'Elisha', 'Amos', 'Hosea'] },
    { name: 'Lived in exile', level: 3, words: ['Daniel', 'Ezekiel', 'Tobit', 'Esther'] } ] },
  { id: 'q21', title: 'Wonders in the Gospels', groups: [
    { name: 'Food and drink', level: 0, words: ['Five loaves', 'Water into wine', 'Great catch of fish', 'Four thousand fed'] },
    { name: 'Healings', level: 1, words: ['Blind Bartimaeus', 'Ten lepers', 'The paralytic', 'Centurion’s servant'] },
    { name: 'Raised from the dead', level: 2, words: ['Lazarus', 'Jairus’s daughter', 'Widow’s son at Nain', 'Jesus himself'] },
    { name: 'Power over nature', level: 3, words: ['Calming the storm', 'Walking on water', 'Withered fig tree', 'Coin in the fish'] } ] },
  { id: 'q22', title: 'Parables', groups: [
    { name: 'Parables of mercy', level: 0, words: ['Good Samaritan', 'Prodigal son', 'Unforgiving servant', 'Lost sheep'] },
    { name: 'Seeds and growth', level: 1, words: ['Sower', 'Mustard seed', 'Wheat and weeds', 'Growing seed'] },
    { name: 'Be ready for the judgment', level: 2, words: ['Ten virgins', 'Talents', 'Sheep and goats', 'Wedding feast'] },
    { name: 'Parables about money', level: 3, words: ['Rich fool', 'Dishonest steward', 'Rich man and Lazarus', 'Workers in the vineyard'] } ] },
  { id: 'q23', title: 'The New Testament writings', groups: [
    { name: 'Letters of Paul', level: 0, words: ['Romans', 'Galatians', 'Philippians', 'Colossians'] },
    { name: 'Catholic letters', level: 1, words: ['James', '1 Peter', '2 Peter', 'Jude'] },
    { name: 'Writings of John', level: 2, words: ['Gospel of John', '1 John', '2 John', 'Revelation'] },
    { name: 'People in Acts', level: 3, words: ['Stephen', 'Philip', 'Barnabas', 'Lydia'] } ] },
  { id: 'q24', title: 'The parts of the Mass', groups: [
    { name: 'Liturgy of the Word', level: 0, words: ['First reading', 'Psalm', 'Gospel', 'Homily'] },
    { name: 'Liturgy of the Eucharist', level: 1, words: ['Offertory', 'Preface', 'Consecration', 'Communion'] },
    { name: 'Opening and closing rites', level: 2, words: ['Sign of the cross', 'Penitential act', 'Final blessing', 'Dismissal'] },
    { name: 'Postures at Mass', level: 3, words: ['Stand', 'Sit', 'Kneel', 'Genuflect'] } ] },
  { id: 'q25', title: 'Vestments, books and buildings', groups: [
    { name: 'Priest’s vestments', level: 0, words: ['Alb', 'Stole', 'Chasuble', 'Cincture'] },
    { name: 'Books of worship', level: 1, words: ['Missal', 'Lectionary', 'Breviary', 'Gospel book'] },
    { name: 'Sacramentals', level: 2, words: ['Holy water', 'Rosary', 'Scapular', 'Blessed ashes'] },
    { name: 'Parts of a church building', level: 3, words: ['Nave', 'Apse', 'Transept', 'Narthex'] } ] },
  { id: 'q26', title: 'Saints by country', groups: [
    { name: 'Italian saints', level: 0, words: ['Francis of Assisi', 'Clare', 'Catherine of Siena', 'Padre Pio'] },
    { name: 'Spanish saints', level: 1, words: ['Teresa of Avila', 'John of the Cross', 'Ignatius of Loyola', 'Dominic'] },
    { name: 'French saints', level: 2, words: ['Joan of Arc', 'Bernadette', 'Thérèse of Lisieux', 'Vincent de Paul'] },
    { name: 'Polish saints', level: 3, words: ['John Paul II', 'Faustina', 'Maximilian Kolbe', 'Stanislaus'] } ] },
  { id: 'q27', title: 'Ways to be a saint', groups: [
    { name: 'Martyrs', level: 0, words: ['Stephen', 'Lawrence', 'Perpetua', 'Polycarp'] },
    { name: 'Kings and queens', level: 1, words: ['Louis IX', 'Elizabeth of Hungary', 'Edward the Confessor', 'Wenceslaus'] },
    { name: 'Converts', level: 2, words: ['Paul', 'Augustine', 'Edith Stein', 'John Henry Newman'] },
    { name: 'Founders of orders', level: 3, words: ['Benedict', 'Bruno', 'Norbert', 'Dominic'] } ] },
  { id: 'q28', title: 'Latin in the Church', groups: [
    { name: 'Everyday prayers in Latin', level: 0, words: ['Pater Noster', 'Ave Maria', 'Gloria Patri', 'Credo'] },
    { name: 'Hymns', level: 1, words: ['Tantum Ergo', 'Pange Lingua', 'Veni Creator', 'Te Deum'] },
    { name: 'The Mass for the dead', level: 2, words: ['Requiem', 'Dies Irae', 'Libera Me', 'In Paradisum'] },
    { name: 'Marian antiphons', level: 3, words: ['Salve Regina', 'Regina Caeli', 'Alma Redemptoris Mater', 'Ave Regina Caelorum'] } ] },
  { id: 'q29', title: 'Sacred places', groups: [
    { name: 'Sites in Jerusalem', level: 0, words: ['Holy Sepulchre', 'Mount of Olives', 'Western Wall', 'Via Dolorosa'] },
    { name: 'Papal basilicas in Rome', level: 1, words: ['St Peter’s', 'St John Lateran', 'St Paul Outside the Walls', 'St Mary Major'] },
    { name: 'Marian shrines', level: 2, words: ['Lourdes', 'Fatima', 'Guadalupe', 'Knock'] },
    { name: 'Pilgrim destinations', level: 3, words: ['Santiago', 'Assisi', 'Canterbury', 'Czestochowa'] } ] },
  { id: 'q30', title: 'Fathers of the Church', groups: [
    { name: 'Latin Fathers', level: 0, words: ['Ambrose', 'Jerome', 'Augustine', 'Gregory the Great'] },
    { name: 'Greek Fathers', level: 1, words: ['Basil', 'Gregory Nazianzen', 'John Chrysostom', 'Athanasius'] },
    { name: 'Early Christian writers', level: 2, words: ['Justin Martyr', 'Irenaeus', 'Tertullian', 'Origen'] },
    { name: 'Apostolic Fathers', level: 3, words: ['Clement of Rome', 'Ignatius of Antioch', 'Polycarp', 'Papias'] } ] },
  { id: 'q31', title: 'On the road', groups: [
    { name: 'Stops on the Exodus', level: 0, words: ['Red Sea', 'Marah', 'Rephidim', 'Sinai'] },
    { name: 'Places in the childhood of Jesus', level: 1, words: ['Bethlehem', 'Egypt', 'Nazareth', 'Jerusalem'] },
    { name: 'Abraham’s journey', level: 2, words: ['Ur', 'Haran', 'Shechem', 'Moriah'] },
    { name: 'Paul’s voyage to Rome', level: 3, words: ['Crete', 'Malta', 'Syracuse', 'Puteoli'] } ] },
  { id: 'q32', title: 'Through the year', groups: [
    { name: 'Advent candles', level: 0, words: ['Hope', 'Peace', 'Joy', 'Love'] },
    { name: 'The three pillars of Lent', level: 1, words: ['Prayer', 'Fasting', 'Almsgiving', 'Abstinence'] },
    { name: 'Christmas season', level: 2, words: ['Holy Family', 'Epiphany', 'Baptism of the Lord', 'Holy Innocents'] },
    { name: 'Easter season', level: 3, words: ['Divine Mercy Sunday', 'Ascension', 'Pentecost', 'Good Shepherd Sunday'] } ] },
  { id: 'q33', title: 'What the Church teaches', groups: [
    { name: 'Marks of the Church', level: 0, words: ['One', 'Holy', 'Catholic', 'Apostolic'] },
    { name: 'The four last things', level: 1, words: ['Death', 'Judgment', 'Heaven', 'Hell'] },
    { name: 'Senses of Scripture', level: 2, words: ['Literal', 'Allegorical', 'Moral', 'Anagogical'] },
    { name: 'Kinds of papal document', level: 3, words: ['Encyclical', 'Apostolic exhortation', 'Papal bull', 'Motu proprio'] } ] },
  { id: 'q34', title: 'Kingdom of Israel', groups: [
    { name: 'Sons of David', level: 0, words: ['Solomon', 'Absalom', 'Adonijah', 'Amnon'] },
    { name: 'Women in the stories of David', level: 1, words: ['Bathsheba', 'Michal', 'Abigail', 'Tamar'] },
    { name: 'David’s mighty men and friends', level: 2, words: ['Jonathan', 'Joab', 'Abishai', 'Uriah'] },
    { name: 'Prophets and priests in David’s time', level: 3, words: ['Samuel', 'Nathan', 'Gad', 'Abiathar'] } ] },
  { id: 'q35', title: 'The rosary and its prayers', groups: [
    { name: 'Luminous mysteries', level: 0, words: ['Baptism of Jesus', 'Wedding at Cana', 'Proclamation of the Kingdom', 'Transfiguration'] },
    { name: 'Prayers of the rosary', level: 1, words: ['Apostles’ Creed', 'Our Father', 'Hail Mary', 'Hail Holy Queen'] },
    { name: 'Joyful mysteries', level: 2, words: ['Annunciation', 'Visitation', 'Nativity', 'Finding in the Temple'] },
    { name: 'Glorious mysteries', level: 3, words: ['Resurrection', 'Ascension', 'Descent of the Holy Spirit', 'Coronation of Mary'] } ] },
];
