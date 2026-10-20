/** Words that act out their meaning: fire flickers, water ripples, light glows. Plain CSS, off for reduced motion, English text only. */
const FX: [string, RegExp][] = [
  ['fire', /^(?:fires?|flames?|flaming|fiery|burn(?:s|ed|t|ing)?|burnt|furnace|coals?|embers?|blaze|blazing|kindled|torch(?:es)?|incense|smoke|altar-fire|brimstone|sulfur|sulphur)$/i],
  ['water', /^(?:waters?|rivers?|seas?|floods?|rain|rains|dew|streams?|waves?|springs?|fountains?|deep|ocean|wells?|cisterns?|baptized?|baptism|drown(?:ed|ing)?|brook|torrent|tide|shore|lake|jordan)$/i],
  ['light', /^(?:light|lights|lamps?|lampstand|candlestick|shine[sd]?|shining|shone|dawn|daybreak|sun|sunrise|stars?|moon|bright|brightness|radiant|glory|glorious|lightning|morning|beacon|illuminat\w*|enlighten\w*|transfigured|splendor|splendour)$/i],
  ['dark', /^(?:darkness|dark|shadows?|night|nights|gloom|dusk|death|grave|tomb|pit|sheol|hades|abyss|dungeon|midnight|evening|blind|blindness)$/i],
  ['wind', /^(?:wind|winds|breath|breathed|breathe|breeze|storm|storms|tempest|whirlwind|gale|blew|blow|spirit-wind|chaff|cloud|clouds|mist)$/i],
  ['blood', /^(?:blood|bloody|bleeding|bled|bloodshed|wounds?|wounded|scarlet|crimson|slain|slaughter(?:ed)?|martyr|martyrs)$/i],
  ['gold', /^(?:gold|golden|silver|treasure|treasures|jewels?|crown|crowns|crowned|throne|thrones|scepter|sceptre|riches|pearl|pearls|gems?|diamond|ruby|emerald)$/i],
  ['quake', /^(?:tremble[sd]?|trembling|shake[sn]?|shaking|quake[sd]?|earthquake|thunder|thundered|thunders|roar(?:s|ed|ing)?|rumbl\w*|trumpet|trumpets|shout(?:s|ed|ing)?|cried|cry|cries|voice-of-thunder)$/i],
  ['tears', /^(?:tears?|weep|wept|weeping|mourn(?:s|ed|ing)?|sorrow|sorrows|grief|lament(?:s|ed|ing)?|wail(?:s|ed|ing)?|sigh(?:s|ed|ing)?)$/i],
  ['bread', /^(?:bread|loaf|loaves|manna|bake[sd]?|baker|wheat|grain|harvest|sheaves?|flour|feast|feasted|banquet)$/i],
  ['wine', /^(?:wine|wines|vine|vines|vineyard|vineyards|grapes?|cups?|chalice|new-wine|winepress|drunk|drink|drank)$/i],
  ['blade', /^(?:swords?|spears?|arrows?|bows?|battle|battles|shield|shields|dagger|armor|armour|warriors?|siege|weapon|weapons|slay|sling)$/i],
  ['wing', /^(?:doves?|birds?|eagles?|wings?|sparrows?|ravens?|fly|flew|flying|soar(?:s|ed|ing)?|swallow|quail|pigeons?)$/i],
  ['heart', /^(?:hearts?|beloved|compassion|mercy|merciful|tender|loved|kindness|lovingkindness)$/i],
  ['serpent', /^(?:serpents?|snakes?|vipers?|adders?|dragon|dragons|scorpions?|leviathan)$/i],
  ['stone', /^(?:stones?|rocks?|mountains?|mount|hills?|cliffs?|pillars?|tablets?|cornerstone|boulder|tomb-stone)$/i],
  ['snow', /^(?:snow|white|whiter|frost|hail|ice|pure|purified|clean|cleansed|spotless|lambs?|fleece|linen)$/i],
  ['calm', /^(?:peace|peaceful|rest|rested|still|quiet|calm|sabbath|sleep|slept|silence|silent|hush|repose|tranquil|refuge|pasture|pastures)$/i],
  ['thorn', /^(?:thorns?|thistles?|briers?|brambles?|nails?|scourge|scourged|whip|lash|cross|crucified|crucifixion)$/i],
  ['joy', /^(?:joy|joyful|joyfully|rejoice[sd]?|rejoicing|sing|sang|sung|song|songs|singing|dance[sd]?|dancing|gladness|glad|laugh(?:ed|ter)?|praise[sd]?|hosanna|alleluia|hallelujah)$/i],
  ['dust', /^(?:dust|ashes|ash|sand|desert|wilderness|wasteland|dry|parched|drought|thirst|thirsty|famine|barren|ruin|ruins)$/i],
  ['oil', /^(?:oil|oils|anoint(?:ed|s|ing)?|ointment|ointments|perfume|myrrh|frankincense|balm|nard|spikenard|chrism|unction)$/i],
  ['grow', /^(?:seed|seeds|sow|sowed|sower|sowing|grow|grew|growth|tree|trees|branch|branches|root|roots|fruit|fruits|fig|olive|olives|plant|planted|garden|gardens|flower|flowers|lilies|lily|blossom)$/i],
];
const WORD = /[A-Za-z]+/g;

export interface FxHit { start: number; end: number; kind: string }
/** Words in a stretch of text that have an effect (no overlap handling needed: each is a whole word). */
export function findFx(text: string): FxHit[] {
  const out: FxHit[] = [];
  WORD.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WORD.exec(text))) {
    const f = FX.find(([, re]) => re.test(m![0]));
    if (f) out.push({ start: m.index, end: m.index + m[0].length, kind: f[0] });
  }
  return out;
}
