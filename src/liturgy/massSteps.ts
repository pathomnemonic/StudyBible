/**
 * The Order of Mass (Ordinary Form), for following along. It gives the parts, what the people do, and the usual posture in the United States.
 * The long prayers of the Roman Missal are under ICEL copyright and are not printed; the short responses are the ones everyone says.
 * Postures follow the US Conference's adaptations of the General Instruction (Roman Missal, GIRM 43). Your parish or country may differ.
 */
export type Posture = 'stand' | 'sit' | 'kneel' | 'move';
export type Slot = 'first_reading' | 'responsorial_psalm' | 'second_reading' | 'gospel_acclamation' | 'gospel';

export interface MassStep {
  id: string;
  part: string;
  title: string;
  posture: Posture;
  what: string;
  /** what the people say or do, in the order they say it */
  people?: string[];
  /** today’s text goes here */
  fill?: Slot;
  /** show only when: sunday/solemnity-only parts, or parts omitted in Advent and Lent */
  only?: 'creed' | 'gloria' | 'second' | 'sunday';
  note?: string;
}

export const OF_STEPS: MassStep[] = [
  { id: 'entrance', part: 'Introductory Rites', title: 'Entrance', posture: 'stand', what: 'The priest and ministers enter while the people sing. The priest kisses the altar and goes to his chair.', people: ['Sing the entrance hymn', 'Make the Sign of the Cross with the priest: “In the name of the Father, and of the Son, and of the Holy Spirit. Amen.”'] },
  { id: 'greeting', part: 'Introductory Rites', title: 'Greeting', posture: 'stand', what: 'The priest greets the people in the name of the Lord.', people: ['“And with your spirit.”'] },
  { id: 'penitential', part: 'Introductory Rites', title: 'Penitential Act', posture: 'stand', what: 'We call to mind our sins and ask for God’s mercy, usually with the Confiteor and then “Lord, have mercy.”', people: ['The Confiteor, or a short litany', '“Lord, have mercy. Christ, have mercy. Lord, have mercy.”'], note: 'The text is in the missalette or on the screen at your parish.' },
  { id: 'gloria', part: 'Introductory Rites', title: 'Gloria', posture: 'stand', what: 'An ancient hymn of praise to the Trinity and to Christ. Sung or said on Sundays outside Advent and Lent, on solemnities and on feasts.', only: 'gloria', people: ['Sing or say the Gloria'] },
  { id: 'collect', part: 'Introductory Rites', title: 'Collect (Opening Prayer)', posture: 'stand', what: 'The priest says, “Let us pray,” pauses in silence, then prays the collect for the day.', people: ['Pray silently during the pause', '“Amen.”'] },
  { id: 'first', part: 'Liturgy of the Word', title: 'First Reading', posture: 'sit', what: 'Usually from the Old Testament (in Easter, from the Acts of the Apostles).', fill: 'first_reading', people: ['“Thanks be to God.” after “The word of the Lord.”'] },
  { id: 'psalm', part: 'Liturgy of the Word', title: 'Responsorial Psalm', posture: 'sit', what: 'The psalm is sung or said, with a refrain the people repeat.', fill: 'responsorial_psalm', people: ['Sing or say the refrain'] },
  { id: 'second', part: 'Liturgy of the Word', title: 'Second Reading', posture: 'sit', what: 'From the letters of the apostles or Revelation, on Sundays and solemnities.', fill: 'second_reading', only: 'second', people: ['“Thanks be to God.”'] },
  { id: 'alleluia', part: 'Liturgy of the Word', title: 'Gospel Acclamation', posture: 'stand', what: 'We stand to welcome Christ in his Gospel. In Lent the Alleluia is replaced with another acclamation.', fill: 'gospel_acclamation', people: ['Sing the Alleluia (or the Lenten acclamation)'] },
  { id: 'gospel', part: 'Liturgy of the Word', title: 'Gospel', posture: 'stand', what: 'The deacon or priest proclaims the Gospel. Trace a small cross on forehead, lips and heart.', fill: 'gospel', people: ['“And with your spirit.”', '“Glory to you, O Lord.”', '“Praise to you, Lord Jesus Christ.” after “The Gospel of the Lord.”'] },
  { id: 'homily', part: 'Liturgy of the Word', title: 'Homily', posture: 'sit', what: 'The priest or deacon explains the readings and applies them to life.', people: ['Listen. A moment of silence follows.'] },
  { id: 'creed', part: 'Liturgy of the Word', title: 'Profession of Faith (Creed)', posture: 'stand', what: 'On Sundays and solemnities we profess the faith with the Nicene Creed or the Apostles’ Creed. At the words “and by the Holy Spirit was incarnate of the Virgin Mary” we bow (on Christmas and the Annunciation, we kneel).', only: 'creed', people: ['The Creed. Words below.'] },
  { id: 'faithful', part: 'Liturgy of the Word', title: 'Prayer of the Faithful', posture: 'stand', what: 'We pray for the Church, the world, those in need and the dead.', people: ['Answer each petition together'] },
  { id: 'gifts', part: 'Liturgy of the Eucharist', title: 'Preparation of the Gifts', posture: 'sit', what: 'Gifts of bread and wine are brought to the altar, with the collection for the Church and the poor. The priest prepares the chalice and washes his hands.', people: ['Sing the offertory hymn', 'Give your gift'] },
  { id: 'orate', part: 'Liturgy of the Eucharist', title: 'Pray, brethren', posture: 'stand', what: 'The priest invites us to pray that the sacrifice will be acceptable to God. Then he prays over the gifts.', people: ['Stand, and answer the priest’s invitation', '“Amen.”'] },
  { id: 'preface', part: 'Liturgy of the Eucharist', title: 'Preface', posture: 'stand', what: 'The Eucharistic Prayer begins with a dialogue and a thanksgiving.', people: ['“And with your spirit.”', '“We lift them up to the Lord.”', '“It is right and just.”'] },
  { id: 'sanctus', part: 'Liturgy of the Eucharist', title: 'Holy, Holy, Holy', posture: 'stand', what: 'We join the angels in singing the Sanctus.', people: ['Sing or say the Sanctus. Then kneel (US).'] },
  { id: 'consecration', part: 'Liturgy of the Eucharist', title: 'Eucharistic Prayer: the Consecration', posture: 'kneel', what: 'The priest prays over the bread and wine, and by the Holy Spirit and Christ’s words they become the Body and Blood of Christ. The priest elevates the Host and the chalice.', people: ['Adore in silence', 'Sing or say the memorial acclamation'], note: 'Many people bow the head at the elevation.' },
  { id: 'amen', part: 'Liturgy of the Eucharist', title: 'Doxology and Great Amen', posture: 'kneel', what: 'The priest lifts the Host and chalice: “Through him, and with him, and in him…”', people: ['The Great Amen, sung or said with full voice'] },
  { id: 'ourfather', part: 'Communion Rite', title: 'The Lord’s Prayer', posture: 'stand', what: 'We pray the prayer Jesus taught, the Our Father.', people: ['Pray the Our Father together. The priest adds, “For the kingdom, the power and the glory are yours, now and for ever.”'] },
  { id: 'peace', part: 'Communion Rite', title: 'Sign of Peace', posture: 'stand', what: 'The priest prays for peace and unity. We offer a sign of peace to those near us.', people: ['“And with your spirit.”', '“Peace be with you.” to neighbours'] },
  { id: 'agnus', part: 'Communion Rite', title: 'Lamb of God', posture: 'kneel', what: 'During the breaking of the Host we sing or say the Agnus Dei. The priest holds up the Host: “Behold the Lamb of God…”', people: ['“Lord, I am not worthy that you should enter under my roof, but only say the word and my soul shall be healed.”'] },
  { id: 'communion', part: 'Communion Rite', title: 'Holy Communion', posture: 'move', what: 'We go forward in procession. To receive: bow before you receive, say “Amen” to “The Body of Christ,” and receive in the hand or on the tongue. Those who cannot receive may come forward with arms crossed for a blessing.', people: ['Sing the communion hymn', 'Return to your place and pray'], note: 'Receive only if you are a Catholic in a state of grace and have fasted for one hour.' },
  { id: 'thanks', part: 'Communion Rite', title: 'Thanksgiving', posture: 'sit', what: 'A time of silence or a hymn of thanks. Then the priest prays the prayer after Communion.', people: ['Pray your thanks to Jesus', '“Amen.”'] },
  { id: 'announce', part: 'Concluding Rites', title: 'Announcements', posture: 'sit', what: 'Notices for the parish.' },
  { id: 'blessing', part: 'Concluding Rites', title: 'Blessing', posture: 'stand', what: 'The priest blesses the people.', people: ['“And with your spirit.”', 'Make the Sign of the Cross', '“Amen.”'] },
  { id: 'dismissal', part: 'Concluding Rites', title: 'Dismissal', posture: 'stand', what: 'The deacon or priest sends us out to live what we have celebrated.', people: ['“Thanks be to God.”', 'Sing the closing hymn'] },
];

export const POSTURE: Record<Posture, { label: string; icon: string; hint: string }> = {
  stand: { label: 'Stand', icon: '🧍', hint: 'We stand to pray and to honour the Gospel.' },
  sit: { label: 'Sit', icon: '🪑', hint: 'We sit to listen and reflect.' },
  kneel: { label: 'Kneel', icon: '🙏', hint: 'We kneel in adoration. If you cannot, bow or sit.' },
  move: { label: 'Move', icon: '🚶', hint: 'We go forward in procession.' },
};
