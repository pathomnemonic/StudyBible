/** Themes for the Bible wordsearch. Words are single words, letters only. */
export interface WsTheme { id: string; title: string; words: string[] }
export const WS_THEMES: WsTheme[] = [
  { id: 'apostles', title: 'The Twelve', words: ['PETER', 'ANDREW', 'JAMES', 'JOHN', 'PHILIP', 'BARTHOLOMEW', 'MATTHEW', 'THOMAS', 'THADDEUS', 'SIMON', 'JUDAS', 'MATTHIAS'] },
  { id: 'plagues', title: 'Plagues of Egypt', words: ['BLOOD', 'FROGS', 'GNATS', 'FLIES', 'LIVESTOCK', 'BOILS', 'HAIL', 'LOCUSTS', 'DARKNESS', 'FIRSTBORN'] },
  { id: 'sacraments', title: 'The Seven Sacraments', words: ['BAPTISM', 'CONFIRMATION', 'EUCHARIST', 'PENANCE', 'ANOINTING', 'ORDERS', 'MATRIMONY', 'GRACE', 'SIGN', 'OIL'] },
  { id: 'mass', title: 'At Mass', words: ['ALTAR', 'AMBO', 'CHALICE', 'PATEN', 'HOMILY', 'CREED', 'GLORIA', 'OFFERTORY', 'COMMUNION', 'BLESSING', 'INCENSE', 'CANDLE'] },
  { id: 'prophets', title: 'Prophets', words: ['ISAIAH', 'JEREMIAH', 'EZEKIEL', 'DANIEL', 'HOSEA', 'JOEL', 'AMOS', 'JONAH', 'MICAH', 'ELIJAH', 'ELISHA', 'NAHUM'] },
  { id: 'virtues', title: 'Virtues', words: ['FAITH', 'HOPE', 'CHARITY', 'PRUDENCE', 'JUSTICE', 'COURAGE', 'TEMPERANCE', 'HUMILITY', 'PATIENCE', 'MERCY'] },
  { id: 'places', title: 'Holy Land', words: ['JERUSALEM', 'BETHLEHEM', 'NAZARETH', 'GALILEE', 'JORDAN', 'JERICHO', 'CAPERNAUM', 'BETHANY', 'CANA', 'SAMARIA', 'HEBRON'] },
  { id: 'christmas', title: 'Christmas', words: ['MANGER', 'SHEPHERDS', 'ANGELS', 'STAR', 'MAGI', 'GOLD', 'MYRRH', 'JOSEPH', 'MARY', 'BETHLEHEM', 'EMMANUEL'] },
  { id: 'lent', title: 'Lent and Easter', words: ['ASHES', 'FASTING', 'PRAYER', 'ALMSGIVING', 'CROSS', 'TOMB', 'RISEN', 'EASTER', 'PALMS', 'VIGIL', 'CANDLE', 'ALLELUIA'] },
  { id: 'gospels', title: 'In the Gospels', words: ['PARABLE', 'SOWER', 'SAMARITAN', 'PRODIGAL', 'LAZARUS', 'ZACCHAEUS', 'LEPER', 'BLIND', 'LOAVES', 'FISHES', 'DISCIPLE', 'PHARISEE'] },
  { id: 'genesis', title: 'Genesis', words: ['ADAM', 'EVE', 'CAIN', 'ABEL', 'NOAH', 'ABRAHAM', 'SARAH', 'ISAAC', 'JACOB', 'ESAU', 'JOSEPH', 'EDEN'] },
  { id: 'women', title: 'Women of the Bible', words: ['RUTH', 'ESTHER', 'SARAH', 'REBEKAH', 'RACHEL', 'LEAH', 'HANNAH', 'DEBORAH', 'MIRIAM', 'ELIZABETH', 'MARTHA', 'LYDIA'] },
  { id: 'church', title: 'In the Church', words: ['NAVE', 'APSE', 'PEW', 'FONT', 'PULPIT', 'TABERNACLE', 'SACRISTY', 'CHOIR', 'SPIRE', 'BELLS', 'CRYPT'] },
  { id: 'saints', title: 'Saints', words: ['FRANCIS', 'CLARE', 'AUGUSTINE', 'MONICA', 'BENEDICT', 'DOMINIC', 'TERESA', 'IGNATIUS', 'AQUINAS', 'JEROME', 'BERNADETTE', 'PATRICK'] },
  { id: 'psalms', title: 'In the Psalms', words: ['SHEPHERD', 'ROCK', 'FORTRESS', 'REFUGE', 'MERCY', 'ZION', 'HARP', 'SONG', 'PRAISE', 'MOUNTAIN', 'WATERS'] },
  { id: 'paul', title: 'Paul’s World', words: ['DAMASCUS', 'ANTIOCH', 'EPHESUS', 'CORINTH', 'ROME', 'PHILIPPI', 'GALATIA', 'TIMOTHY', 'SILAS', 'BARNABAS', 'LETTERS'] },
  { id: 'liturgy', title: 'Church Year', words: ['ADVENT', 'LENT', 'EASTER', 'PENTECOST', 'EPIPHANY', 'TRIDUUM', 'ORDINARY', 'VIOLET', 'GREEN', 'WHITE', 'RED', 'ROSE'] },
  { id: 'prayer', title: 'Prayer', words: ['ROSARY', 'ANGELUS', 'NOVENA', 'LITANY', 'VESPERS', 'COMPLINE', 'LAUDS', 'MATINS', 'PSALM', 'AMEN', 'GLORIA'] },
  { id: 'sins', title: 'Seven Deadly Sins', words: ['PRIDE', 'ENVY', 'WRATH', 'SLOTH', 'GREED', 'LUST', 'GLUTTONY', 'HUMILITY', 'KINDNESS', 'DILIGENCE'] },
  { id: 'exodus', title: 'Exodus', words: ['MOSES', 'AARON', 'PHARAOH', 'PASSOVER', 'MANNA', 'SINAI', 'COMMANDMENTS', 'QUAIL', 'MIRIAM', 'JOSHUA', 'REDSEA'] },
];
