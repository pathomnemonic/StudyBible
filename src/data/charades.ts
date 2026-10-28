import { MORE_DECKS } from './charades2';

/** Word lists for the charades game: things a group of Catholics can act out or describe without a word of the answer. */
export interface CharadesDeck { id: string; name: string; blurb: string; words: string[] }

const BASE: CharadesDeck[] = [
  { id: 'saints', name: 'Saints', blurb: 'Famous saints, from fishermen to doctors of the Church.', words: [
    'St Francis of Assisi', 'St Patrick', 'Joan of Arc', 'St Thomas Aquinas', 'Mother Teresa', 'St Thérèse of Lisieux', 'St Augustine', 'St Monica', 'St Ignatius of Loyola', 'St Peter', 'St Paul', 'St Joseph',
    'St Michael the Archangel', 'St Nicholas', 'St Valentine', 'St Anthony of Padua', 'St Jude', 'St Cecilia', 'St Lucy', 'St Catherine of Siena', 'St Teresa of Avila', 'St John Paul II', 'St Maximilian Kolbe',
    'Padre Pio', 'St Benedict', 'St Dominic', 'St Bernadette', 'St Juan Diego', 'St Francis Xavier', 'St Christopher', 'St George', 'St Stephen', 'St Sebastian', 'St Agnes', 'St Rose of Lima', 'St John Vianney',
    'St Martin de Porres', 'St Kateri Tekakwitha', 'St Elizabeth of Hungary', 'St Louis of France', 'St Thomas More', 'St Pier Giorgio Frassati', 'St Faustina', 'St Gianna Molla'] },
  { id: 'bible-people', name: 'Bible people', blurb: 'Patriarchs, prophets, kings, apostles and friends of Jesus.', words: [
    'Adam', 'Eve', 'Noah', 'Abraham', 'Sarah', 'Isaac', 'Jacob', 'Joseph and his coat', 'Moses', 'Aaron', 'Joshua', 'Samson', 'Ruth', 'David', 'Goliath', 'Solomon', 'Elijah', 'Jonah', 'Daniel', 'Esther', 'Job',
    'Mary', 'Elizabeth', 'John the Baptist', 'Zacchaeus', 'Lazarus', 'Martha', 'Mary Magdalene', 'Judas', 'Pontius Pilate', 'King Herod', 'Nicodemus', 'Doubting Thomas', 'Peter', 'Paul', 'Barnabas', 'Timothy',
    'Gideon', 'Deborah', 'Hannah', 'Isaiah', 'Ezekiel'] },
  { id: 'bible-stories', name: 'Bible stories', blurb: 'Scenes anyone can act out.', words: [
    'Creation', 'Noah’s ark', 'Tower of Babel', 'The burning bush', 'The ten plagues', 'Crossing the Red Sea', 'The Ten Commandments', 'The walls of Jericho', 'David and Goliath', 'Jonah and the big fish',
    'Daniel in the lions’ den', 'The fiery furnace', 'The Annunciation', 'The Nativity', 'The three wise men', 'The flight into Egypt', 'The Baptism of Jesus', 'The wedding at Cana', 'Feeding the five thousand',
    'Jesus walks on water', 'The Good Samaritan', 'The Prodigal Son', 'The lost sheep', 'Raising of Lazarus', 'The Last Supper', 'Agony in the garden', 'The Crucifixion', 'The Resurrection', 'The road to Emmaus',
    'Doubting Thomas', 'The Ascension', 'Pentecost', 'The conversion of Paul', 'Zacchaeus in the tree', 'The Transfiguration', 'The Sermon on the Mount', 'Jacob’s ladder', 'The Garden of Eden', 'The manna in the desert'] },
  { id: 'mass', name: 'At Mass', blurb: 'Things you see and do in church.', words: [
    'Altar', 'Chalice', 'Paten', 'The Host', 'Priest', 'Deacon', 'Altar server', 'Incense', 'Holy water', 'Lectionary', 'Homily', 'The Creed', 'Offertory', 'Consecration', 'Holy Communion', 'Sign of peace', 'Tabernacle',
    'Sanctuary lamp', 'Crucifix', 'Vestments', 'Chasuble', 'Stole', 'Altar bells', 'Collection basket', 'Processional cross', 'Book of the Gospels', 'Genuflecting', 'Kneeler', 'Sign of the Cross', 'Responsorial psalm',
    'Baptismal font', 'Confessional', 'Paschal candle', 'Ambo', 'Thurible', 'Choir', 'Stained glass window', 'Statue of Mary'] },
  { id: 'sacraments', name: 'Sacraments and life', blurb: 'The seven sacraments and what goes with them.', words: [
    'Baptism', 'Confirmation', 'The Eucharist', 'Confession', 'Anointing of the Sick', 'Holy Orders', 'Marriage', 'Godparents', 'First Communion', 'Holy oil', 'Wedding ring', 'The bishop’s mitre', 'Absolution',
    'Penance', 'Ordination', 'White baptismal gown', 'Baptismal candle', 'Laying on of hands', 'Last rites', 'Wedding vows', 'Confirmation sponsor', 'Pouring water', 'Examining your conscience', 'Saying sorry',
    'Receiving Communion', 'A priest blessing', 'Altar boy', 'Bride and groom', 'Rosary at a wake', 'Funeral Mass'] },
  { id: 'prayer', name: 'Prayer and devotion', blurb: 'Ways Catholics pray.', words: [
    'The Rosary', 'Hail Mary', 'Our Father', 'Glory Be', 'The Angelus', 'Divine Mercy Chaplet', 'Stations of the Cross', 'A novena', 'A litany', 'Eucharistic adoration', 'Benediction', 'A holy hour', 'Lectio Divina',
    'The Examen', 'Act of Contrition', 'Hail, Holy Queen', 'The Magnificat', 'The Memorare', 'Prayer to St Michael', 'Grace before meals', 'Liturgy of the Hours', 'Brown scapular', 'A holy card', 'Lighting a candle',
    'A pilgrimage', 'Fasting', 'Giving alms', 'Meditation', 'Praying with beads', 'Kneeling in a pew', 'Bedtime prayers', 'Praying for the dead'] },
  { id: 'year', name: 'Feasts and seasons', blurb: 'The Church’s year, with its customs.', words: [
    'Advent', 'Christmas', 'Epiphany', 'Ash Wednesday', 'Lent', 'Palm Sunday', 'Holy Thursday', 'Good Friday', 'The Easter Vigil', 'Easter Sunday', 'Pentecost', 'Trinity Sunday', 'Corpus Christi', 'All Saints’ Day',
    'All Souls’ Day', 'The Assumption', 'The Immaculate Conception', 'Candlemas', 'The Ascension', 'Christ the King', 'Advent wreath', 'Palm branches', 'Easter eggs', 'The nativity scene', 'Pancake Tuesday', 'Holy Week',
    'Divine Mercy Sunday', 'Our Lady of Guadalupe', 'Midnight Mass', 'Giving up something for Lent', 'Blessing of animals', 'Burning of the palms', 'Fish on Friday', 'Christmas carols'] },
  { id: 'church', name: 'Church and Rome', blurb: 'People, places and things of the wider Church.', words: [
    'The Pope', 'A cardinal', 'A bishop', 'Vatican City', 'The Sistine Chapel', 'St Peter’s Basilica', 'The Swiss Guard', 'A conclave', 'White smoke', 'A cathedral', 'A monastery', 'A nun', 'A monk', 'A friar',
    'The Jesuits', 'The Franciscans', 'The Dominicans', 'The Benedictines', 'The Catechism', 'An encyclical', 'The Council of Nicaea', 'The Holy Land', 'Jerusalem', 'Bethlehem', 'Nazareth', 'Rome', 'Lourdes', 'Fatima',
    'Assisi', 'The Camino de Santiago', 'The Holy Door', 'A papal blessing', 'The Nicene Creed', 'The Ten Commandments', 'Michelangelo', 'The Last Judgment'] },
];

export const CHARADES_DECKS: CharadesDeck[] = [...BASE, ...MORE_DECKS];
