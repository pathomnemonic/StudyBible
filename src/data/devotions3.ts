import type { Devotion, Step } from './devotions';

/**
 * More litanies in the public domain: the Sacred Heart (approved 1899), the Holy Name of Jesus, the Precious Blood (1960 form, whose
 * invocations are older) and the Litany of Humility (Cardinal Merry del Val, 1913).
 */
const litany = (title: string, rows: string[], reply: string, note?: string): Step => ({ title, text: rows.map((r) => `${r}, ${reply}`).join('\n'), note });
const OPENING: Step = { title: 'Opening', text: 'Lord, have mercy. (Lord, have mercy.)\nChrist, have mercy. (Christ, have mercy.)\nLord, have mercy. (Lord, have mercy.)\nChrist, hear us. (Christ, graciously hear us.)\nGod the Father of heaven, have mercy on us.\nGod the Son, Redeemer of the world, have mercy on us.\nGod the Holy Spirit, have mercy on us.\nHoly Trinity, one God, have mercy on us.' };
const LAMB: Step = { title: 'Lamb of God', text: 'Lamb of God, who takest away the sins of the world, spare us, O Lord.\nLamb of God, who takest away the sins of the world, graciously hear us, O Lord.\nLamb of God, who takest away the sins of the world, have mercy on us.' };

export const SACRED_HEART: Devotion = {
  id: 'litany-sacred-heart', name: 'Litany of the Sacred Heart', blurb: 'Thirty-three titles of the Heart of Jesus, one for each year of his life. About six minutes.',
  steps: [
    OPENING,
    litany('The Heart of Jesus', ['Heart of Jesus, Son of the Eternal Father', 'Heart of Jesus, formed by the Holy Spirit in the womb of the Virgin Mother', 'Heart of Jesus, substantially united to the Word of God', 'Heart of Jesus, of infinite majesty', 'Heart of Jesus, holy temple of God', 'Heart of Jesus, tabernacle of the Most High', 'Heart of Jesus, house of God and gate of heaven', 'Heart of Jesus, burning furnace of charity', 'Heart of Jesus, abode of justice and love', 'Heart of Jesus, full of goodness and love', 'Heart of Jesus, abyss of all virtues', 'Heart of Jesus, most worthy of all praise'], 'have mercy on us'),
    litany('King and treasure', ['Heart of Jesus, king and center of all hearts', 'Heart of Jesus, in whom are all the treasures of wisdom and knowledge', 'Heart of Jesus, in whom dwells all the fullness of the Godhead', 'Heart of Jesus, in whom the Father was well pleased', 'Heart of Jesus, of whose fullness we have all received', 'Heart of Jesus, desire of the everlasting hills', 'Heart of Jesus, patient and rich in mercy', 'Heart of Jesus, rich to all who invoke thee'], 'have mercy on us'),
    litany('Source and offering', ['Heart of Jesus, fountain of life and holiness', 'Heart of Jesus, propitiation for our sins', 'Heart of Jesus, saturated with revilings', 'Heart of Jesus, bruised for our iniquities', 'Heart of Jesus, made obedient unto death', 'Heart of Jesus, pierced with a lance', 'Heart of Jesus, source of all consolation', 'Heart of Jesus, our life and resurrection', 'Heart of Jesus, our peace and reconciliation', 'Heart of Jesus, victim for sin', 'Heart of Jesus, salvation of those who hope in thee', 'Heart of Jesus, hope of those who die in thee', 'Heart of Jesus, delight of all the saints'], 'have mercy on us'),
    LAMB,
    { title: 'Closing', text: 'V. Jesus, meek and humble of heart.\nR. Make our hearts like unto thine.\n\nLet us pray. Almighty and eternal God, look upon the Heart of thy well-beloved Son, and upon the praises and satisfaction he offers thee on behalf of sinners; and, appeased, grant pardon to those who seek thy mercy, in the name of the same Jesus Christ, thy Son, who lives and reigns with thee, in the unity of the Holy Spirit, God, for ever and ever. Amen.' },
  ],
};

export const HOLY_NAME: Devotion = {
  id: 'litany-holy-name', name: 'Litany of the Holy Name of Jesus', blurb: 'The name above every name, with a prayer to be kept from every evil. About eight minutes.',
  steps: [
    OPENING,
    litany('Who he is', ['Jesus, Son of the living God', 'Jesus, splendor of the Father', 'Jesus, brightness of eternal light', 'Jesus, king of glory', 'Jesus, sun of justice', 'Jesus, son of the Virgin Mary', 'Jesus, most amiable', 'Jesus, most admirable', 'Jesus, mighty God', 'Jesus, father of the world to come', 'Jesus, angel of great counsel', 'Jesus, most powerful', 'Jesus, most patient', 'Jesus, most obedient', 'Jesus, meek and humble of heart', 'Jesus, lover of chastity', 'Jesus, lover of us', 'Jesus, God of peace', 'Jesus, author of life', 'Jesus, model of virtues'], 'have mercy on us'),
    litany('Our help', ['Jesus, zealous for souls', 'Jesus, our God', 'Jesus, our refuge', 'Jesus, father of the poor', 'Jesus, treasure of the faithful', 'Jesus, good shepherd', 'Jesus, true light', 'Jesus, eternal wisdom', 'Jesus, infinite goodness', 'Jesus, our way and our life', 'Jesus, joy of angels', 'Jesus, king of patriarchs', 'Jesus, master of apostles', 'Jesus, teacher of evangelists', 'Jesus, strength of martyrs', 'Jesus, light of confessors', 'Jesus, purity of virgins', 'Jesus, crown of all saints'], 'have mercy on us'),
    { title: 'Be merciful', text: 'Be merciful, spare us, O Jesus.\nBe merciful, graciously hear us, O Jesus.' },
    litany('Deliver us', ['From all evil', 'From all sin', 'From thy wrath', 'From the snares of the devil', 'From the spirit of impurity', 'From everlasting death', 'From the neglect of thine inspirations'], 'deliver us, O Jesus'),
    litany('Through the mysteries of your life', ['Through the mystery of thy holy Incarnation', 'Through thy birth', 'Through thy infancy', 'Through thy most divine life', 'Through thy labors', 'Through thine agony and passion', 'Through thy cross and dereliction', 'Through thy sufferings', 'Through thy death and burial', 'Through thy resurrection', 'Through thine ascension', 'Through thine institution of the most holy Eucharist', 'Through thy joys', 'Through thy glory'], 'deliver us, O Jesus'),
    LAMB,
    { title: 'Closing', text: 'V. Jesus, hear us.\nR. Jesus, graciously hear us.\n\nLet us pray. O Lord Jesus Christ, who hast said, “Ask, and you shall receive; seek, and you shall find; knock, and it shall be opened to you,” grant, we beseech thee, to us who ask the gift of thy most divine love, that we may ever love thee with all our heart, and in all our words and actions, and never cease from praising thee. Make us, O Lord, to have a perpetual fear and love of thy holy name, for thou never failest to govern those whom thou dost solidly establish in thy love, who livest and reignest for ever and ever. Amen.' },
  ],
};

export const PRECIOUS_BLOOD: Devotion = {
  id: 'litany-precious-blood', name: 'Litany of the Precious Blood', blurb: 'Praise for the blood of Christ, shed for us. Especially in July and on Fridays. About five minutes.',
  steps: [
    OPENING,
    litany('The blood of Christ', ['Blood of Christ, only-begotten Son of the eternal Father', 'Blood of Christ, Incarnate Word of God', 'Blood of Christ, of the New and Eternal Testament', 'Blood of Christ, falling upon the earth in the Agony', 'Blood of Christ, flowing forth in the Scourging', 'Blood of Christ, dripping forth in the Crowning with Thorns', 'Blood of Christ, poured out on the Cross', 'Blood of Christ, price of our salvation', 'Blood of Christ, without which there is no forgiveness', 'Blood of Christ, Eucharistic drink and refreshment of souls', 'Blood of Christ, stream of mercy'], 'save us'),
    litany('Strength and comfort', ['Blood of Christ, victor over demons', 'Blood of Christ, courage of martyrs', 'Blood of Christ, strength of confessors', 'Blood of Christ, bringing forth virgins', 'Blood of Christ, steadfastness of those in trial', 'Blood of Christ, relief of the burdened', 'Blood of Christ, solace in sorrow', 'Blood of Christ, hope of the penitent', 'Blood of Christ, consolation of the dying', 'Blood of Christ, peace and tenderness of hearts', 'Blood of Christ, pledge of eternal life', 'Blood of Christ, freeing souls from purgatory', 'Blood of Christ, most worthy of all glory and honor'], 'save us'),
    LAMB,
    { title: 'Closing', text: 'V. You have redeemed us, Lord, with your blood.\nR. And made us a kingdom for our God.\n\nLet us pray. Almighty and eternal God, you have appointed your only-begotten Son the Redeemer of the world, and willed to be reconciled to us by his blood. Grant us, we beg you, so to value the price of our salvation, and so to be defended by its power from the evils of this present life, that we may enjoy its fruits for ever in heaven. Through the same Christ our Lord. Amen.' },
  ],
};

export const HUMILITY: Devotion = {
  id: 'litany-humility', name: 'Litany of Humility', blurb: 'A short, searching prayer to be freed from the need for praise. About three minutes.',
  steps: [
    { title: 'The prayer', text: 'O Jesus, meek and humble of heart, hear me.' },
    litany('From the desire of…', ['From the desire of being esteemed', 'From the desire of being loved', 'From the desire of being extolled', 'From the desire of being honored', 'From the desire of being praised', 'From the desire of being preferred to others', 'From the desire of being consulted', 'From the desire of being approved'], 'deliver me, Jesus'),
    litany('From the fear of…', ['From the fear of being humiliated', 'From the fear of being despised', 'From the fear of suffering rebukes', 'From the fear of being calumniated', 'From the fear of being forgotten', 'From the fear of being ridiculed', 'From the fear of being wronged', 'From the fear of being suspected'], 'deliver me, Jesus'),
    litany('That others may be…', ['That others may be loved more than I', 'That others may be esteemed more than I', 'That, in the opinion of the world, others may increase and I may decrease', 'That others may be chosen and I set aside', 'That others may be praised and I unnoticed', 'That others may be preferred to me in everything', 'That others may become holier than I, provided that I become as holy as I should'], 'Jesus, grant me the grace to desire it'),
  ],
};
