import { MORE_QUARTETS } from './quartets2';
import { MORE_QUARTETS_3 } from './quartets3';

/** Sixteen tiles, four sets of four. Each set is a truth about the Bible or the Church; some tiles tempt you into the wrong set on purpose. */
export interface QuartetGroup { name: string; level: 0 | 1 | 2 | 3; words: [string, string, string, string] }
export interface Quartet { id: string; title: string; groups: [QuartetGroup, QuartetGroup, QuartetGroup, QuartetGroup] }

const BASE: Quartet[] = [
  { id: 'q1', title: 'Gifts and plagues', groups: [
    { name: 'Plagues of Egypt', level: 0, words: ['Frogs', 'Locusts', 'Darkness', 'Boils'] },
    { name: 'Fruits of the Spirit', level: 1, words: ['Joy', 'Peace', 'Patience', 'Kindness'] },
    { name: 'Gifts of the Holy Spirit', level: 2, words: ['Wisdom', 'Fortitude', 'Piety', 'Counsel'] },
    { name: 'Capital sins', level: 3, words: ['Pride', 'Envy', 'Sloth', 'Gluttony'] } ] },
  { id: 'q2', title: 'Women of the Bible', groups: [
    { name: 'Women in Matthew’s genealogy of Jesus', level: 2, words: ['Tamar', 'Rahab', 'Ruth', 'Bathsheba'] },
    { name: 'Queens', level: 1, words: ['Esther', 'Jezebel', 'Athaliah', 'Vashti'] },
    { name: 'Mothers after long waiting', level: 0, words: ['Sarah', 'Hannah', 'Elizabeth', 'Rebekah'] },
    { name: 'Women who followed Jesus', level: 3, words: ['Mary Magdalene', 'Joanna', 'Susanna', 'Salome'] } ] },
  { id: 'q3', title: 'Holy objects', groups: [
    { name: 'In or beside the Ark of the Covenant', level: 2, words: ['Stone tablets', 'Jar of manna', 'Aaron’s staff', 'Book of the Law'] },
    { name: 'In the Tabernacle', level: 1, words: ['Menorah', 'Altar of incense', 'Showbread table', 'Bronze basin'] },
    { name: 'Garments of the high priest', level: 3, words: ['Ephod', 'Breastplate', 'Turban', 'Sash'] },
    { name: 'Eucharistic vessels', level: 0, words: ['Chalice', 'Paten', 'Ciborium', 'Pyx'] } ] },
  { id: 'q4', title: 'Letters and journeys', groups: [
    { name: 'Places Paul preached', level: 1, words: ['Damascus', 'Philippi', 'Ephesus', 'Corinth'] },
    { name: 'Churches in Revelation', level: 3, words: ['Smyrna', 'Pergamum', 'Thyatira', 'Laodicea'] },
    { name: 'Towns in Jesus’ ministry', level: 0, words: ['Bethlehem', 'Nazareth', 'Capernaum', 'Jericho'] },
    { name: 'Mountains', level: 2, words: ['Sinai', 'Tabor', 'Carmel', 'Nebo'] } ] },
  { id: 'q5', title: 'Mysteries and Mass', groups: [
    { name: 'Joyful mysteries', level: 0, words: ['Annunciation', 'Visitation', 'Nativity', 'Presentation'] },
    { name: 'Sorrowful mysteries', level: 1, words: ['Scourging', 'Crowning with thorns', 'Carrying the cross', 'Crucifixion'] },
    { name: 'Glorious mysteries', level: 2, words: ['Resurrection', 'Ascension', 'Assumption', 'Coronation'] },
    { name: 'Chants of the Mass', level: 3, words: ['Gloria', 'Kyrie', 'Sanctus', 'Agnus Dei'] } ] },
  { id: 'q6', title: 'Sacred signs', groups: [
    { name: 'Sacraments', level: 0, words: ['Baptism', 'Confirmation', 'Matrimony', 'Holy Orders'] },
    { name: 'Cardinal virtues', level: 2, words: ['Prudence', 'Justice', 'Fortitude', 'Temperance'] },
    { name: 'Liturgical colors', level: 1, words: ['Violet', 'Rose', 'Green', 'Red'] },
    { name: 'Seasons of the year', level: 3, words: ['Advent', 'Lent', 'Easter', 'Ordinary Time'] } ] },
  { id: 'q7', title: 'Old Testament leaders', groups: [
    { name: 'Sons of Jacob', level: 0, words: ['Reuben', 'Levi', 'Judah', 'Benjamin'] },
    { name: 'Judges of Israel', level: 2, words: ['Gideon', 'Samson', 'Deborah', 'Jephthah'] },
    { name: 'Kings', level: 1, words: ['David', 'Solomon', 'Josiah', 'Hezekiah'] },
    { name: 'Prophets', level: 3, words: ['Isaiah', 'Jeremiah', 'Amos', 'Hosea'] } ] },
  { id: 'q8', title: 'In the Gospels', groups: [
    { name: 'Parables', level: 0, words: ['The Sower', 'Mustard seed', 'Prodigal son', 'Good Samaritan'] },
    { name: 'Miracles', level: 1, words: ['Wedding at Cana', 'Loaves and fishes', 'Raising of Lazarus', 'Calming the storm'] },
    { name: 'Places of the Passion', level: 2, words: ['Gethsemane', 'Golgotha', 'Cenacle', 'Praetorium'] },
    { name: 'Beatitudes', level: 3, words: ['The meek', 'The merciful', 'Pure in heart', 'Peacemakers'] } ] },
  { id: 'q9', title: 'Church history', groups: [
    { name: 'Popes’ names', level: 0, words: ['Leo', 'Pius', 'Gregory', 'Innocent'] },
    { name: 'Councils', level: 1, words: ['Nicaea', 'Trent', 'Chalcedon', 'Lateran'] },
    { name: 'Doctors of the Church', level: 2, words: ['Augustine', 'Jerome', 'Ambrose', 'Aquinas'] },
    { name: 'Religious orders', level: 3, words: ['Jesuits', 'Dominicans', 'Franciscans', 'Carmelites'] } ] },
  { id: 'q10', title: 'Mary', groups: [
    { name: 'Marian prayers and hymns', level: 1, words: ['Memorare', 'Angelus', 'Salve Regina', 'Magnificat'] },
    { name: 'Marian apparitions', level: 0, words: ['Lourdes', 'Fatima', 'Guadalupe', 'Knock'] },
    { name: 'Pilgrim destinations', level: 2, words: ['Santiago', 'Assisi', 'Jerusalem', 'Rome'] },
    { name: 'Titles of Mary', level: 3, words: ['Theotokos', 'Stella Maris', 'Mater Dolorosa', 'Queen of Heaven'] } ] },
  { id: 'q11', title: 'The New Testament', groups: [
    { name: 'Gospel writers', level: 0, words: ['Matthew', 'Mark', 'Luke', 'John'] },
    { name: 'Symbols of the evangelists', level: 1, words: ['Lion', 'Eagle', 'Ox', 'Winged man'] },
    { name: 'Letters to churches', level: 2, words: ['Romans', 'Galatians', 'Ephesians', 'Philippians'] },
    { name: 'Letters to individuals', level: 3, words: ['Timothy', 'Titus', 'Philemon', '3 John'] } ] },
  { id: 'q12', title: 'After Easter', groups: [
    { name: 'Met the Risen Jesus', level: 1, words: ['Mary Magdalene', 'Thomas', 'Cleopas', 'Peter'] },
    { name: 'Where they met him', level: 2, words: ['Emmaus', 'Upper Room', 'Sea of Tiberias', 'Mount of Olives'] },
    { name: 'Easter symbols', level: 0, words: ['Lamb', 'Paschal candle', 'Lily', 'Empty tomb'] },
    { name: 'Days of Holy Week', level: 3, words: ['Palm Sunday', 'Holy Thursday', 'Good Friday', 'Holy Saturday'] } ] },
];

export const QUARTETS: Quartet[] = [...BASE, ...MORE_QUARTETS, ...MORE_QUARTETS_3];
