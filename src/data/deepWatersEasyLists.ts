import type { DeepAnswer, DeepPrompt, DeepTheme } from './deepWaters';

/**
 * The fourth hand-written batch: long open lists chosen to be easy to think of (names, towns, countries) with a plain question and no letter rule, so that the
 * derived questions that follow from them can be single-rule ones ("with the letter X"). Each line is `Answer|tier|alias;alias`. Tiers are editorial judgement of
 * how many players would think of the answer (1 nearly everyone, 6 only a specialist), not survey data. Written from memory of standard references named in each
 * `basis`; none of it has been reviewed by a person (see src/data/deepWaters.review.json). Open lists say "not on our list" for an unlisted answer, never "wrong".
 */
const rows = (t: string): DeepAnswer[] => t.trim().split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const [answer, tier, al] = l.split('|');
  const aliases = al ? al.split(';').map((x) => x.trim()).filter(Boolean) : [];
  return { answer: answer.trim(), tier: Number(tier) as DeepAnswer['tier'], ...(aliases.length ? { aliases } : {}) };
});
const L = (id: string, theme: DeepTheme, prompt: string, context: string, basis: string, list: string, extra: Partial<DeepPrompt> = {}): DeepPrompt => ({ id: `authored4-${id}`, theme, basis, prompt, context, answers: rows(list), ...extra });

export const EASY_LIST_PROMPTS: DeepPrompt[] = [
  L('saint-first-names', 'saints', 'Name a first name that a canonized saint has had.', 'Many first names are the names of saints, because families have long named children after them. Any name that has belonged to a canonized saint counts. This list is long but not complete.', 'Hand-authored from the General Roman Calendar and Butler\'s Lives of the Saints.', `
Peter|1
Paul|1
John|1
James|1
Thomas|1
Francis|1
Anthony|1|Antony
Joseph|1
Michael|1
Mary|1
Catherine|1|Katherine;Katharine
Teresa|1|Theresa
Agnes|1
Cecilia|1
Lucy|1
Anne|1|Ann;Anna
Elizabeth|1
Margaret|1
Monica|1
Clare|1|Claire
Rose|1
Patrick|1
Matthew|1
Mark|1
Luke|1
Andrew|1
Philip|1
Bartholomew|2
Simon|2
Jude|1
Stephen|1|Steven
Nicholas|1
Christopher|1
George|1
Lawrence|1|Laurence
Vincent|1
Benedict|1
Augustine|1
Ambrose|2
Jerome|1
Gregory|1
Leo|1
Pius|2
Dominic|1
Ignatius|1
Bernard|1
Bernadette|1
Martin|1
Maximilian|2
Maria|1
Jane|1
Joan|1|Jeanne
Barbara|1
Helena|1|Helen
Cyril|2
Methodius|3
Damien|2|Damian
Edmund|2
Edward|2
Henry|2
Hubert|3
Hugh|2
Isidore|2|Isidor
Ita|5
Jacinta|3
Josephine|1
Julian|2
Justin|2
Kevin|2
Louis|1
Lucia|1
Mathilda|3|Matilda;Maud
Odilia|5
Olga|3
Pancras|4
Paula|2
Perpetua|2
Rita|1
Sebastian|1
Sylvester|2|Silvester
Tarcisius|4
Timothy|1
Titus|2
Ursula|1
Valentine|1
Veronica|1
Victor|2
Vitus|3
Zita|4
Aidan|2
Alban|3
Albert|2
Alexander|2
Alice|3
Aloysius|2
Angela|1
Anselm|2
Ansgar|4
Athanasius|2
Basil|1
Benedicta|4
Blaise|1
Boniface|1
Brendan|1
Bridget|1|Brigid;Brigit
Bruno|2
Camillus|2
Casimir|2
Charles|1
Clement|2
Colette|3
Columba|2
Columbanus|3
Cornelius|3
Cuthbert|2
Cyprian|2
David|1
Denis|2|Dennis
Dorothy|2
Dunstan|3
Eligius|4
Elias|3
Emily|3|Emilia
Eugene|2
Eusebius|3
Fabian|3
Felix|2
Fidelis|3
Frances|1
Gabriel|1
Genevieve|2
Gerard|2
Gertrude|2
Giles|2
Gianna|3
Hilary|2
Hildegard|1
Hippolytus|3
Irenaeus|2
Isaac|2
Jason|5
Joachim|1
Joshua|4
Kateri|2
Lazarus|2
Lea|4|Leah
Leonard|2
Louise|2
Lydia|2
Macrina|4
Magnus|4
Marcellus|4
Marcus|2
Marinus|5
Marta|2|Martha
Maurice|3
Maximus|3
Miguel|2
Narcissus|5
Nathaniel|3
Nina|3
Noel|4
Norbert|3
Olaf|3|Olav
Oswald|3
Pascal|3|Paschal
Pauline|3
Peregrine|3
Phoebe|3
Polycarp|2
Priscilla|3
Raphael|1
Raymond|2
Regina|3
Remigius|4
Richard|2
Robert|2
Roch|3|Rocco
Romuald|4
Sabina|3
Scholastica|2
Sergius|4
Silas|2
Sixtus|3
Sophia|2
Stanislaus|2
Susanna|3|Susan
Tabitha|3
Tatiana|4
Theodore|2
Theodora|3
Thecla|3
Tobias|3
Ulrich|3
Urban|2
Valerie|3
Walter|3
Wenceslaus|2
Wilfrid|4
William|1
Winifred|3
Zachary|2
Zeno|4
Zoe|3
`),
  L('cities-named-for-saints', 'places', 'Name a city or town in the world that is named after a saint.', 'From San Francisco to Saint Petersburg, thousands of places carry a saint\'s name, because explorers, settlers and missionaries named them for the saint on whose feast day they arrived or whom they trusted to protect them. This list is long but not complete.', 'Hand-authored from standard gazetteers (the town takes its name from the saint).', `
San Francisco|1
San Diego|1
San Jose|1|San José
San Antonio|1
Santa Barbara|1
Santa Monica|1
Santa Clara|1
Santa Ana|1
Santa Rosa|1
Santa Maria|2
San Bernardino|2
San Mateo|2
San Rafael|2
San Luis Obispo|2
San Juan|1
San Pedro|2
San Marino|2
San Clemente|2
San Leandro|3
San Carlos|3
San Gabriel|3
San Marcos|3
San Benito|4
San Lorenzo|3
Saint Louis|1|St. Louis;St Louis
Saint Paul|1|St. Paul;St Paul
Saint Petersburg|1|St. Petersburg;St Petersburg
Saint Augustine|1|St. Augustine;St Augustine
Saint Charles|3|St. Charles
Saint Joseph|2|St. Joseph
Saint Cloud|3|St. Cloud
Saint Helens|3|St. Helens
Saint Albans|2|St Albans;St. Albans
Saint Andrews|2|St Andrews;St. Andrews
Saint Davids|3|St Davids
Saint Ives|3|St Ives
Saint John|2|St. John;St John;Saint John's;St. John's;St John's
Saint Tropez|2|Saint-Tropez
Saint Malo|2|Saint-Malo
Saint Denis|3|Saint-Denis
Saint Etienne|3|Saint-Étienne;Saint-Etienne
Saint Nazaire|4|Saint-Nazaire
Saint Quentin|4|Saint-Quentin
Saint Omer|5|Saint-Omer
Saint Brieuc|5|Saint-Brieuc
Saint Gallen|4|Sankt Gallen;St. Gallen
Sankt Polten|5|Sankt Pölten
Sankt Moritz|3|St. Moritz;Saint Moritz
Saint Pierre|4|Saint-Pierre
Santiago|1
Santiago de Compostela|1
Santiago de Cuba|3
Santander|2
Sao Paulo|1|São Paulo
Sao Jose|3|São José
Sao Luis|3|São Luís
Sao Vicente|4|São Vicente
Sao Tome|3|São Tomé
Sao Bernardo do Campo|5|São Bernardo do Campo
San Sebastian|1|San Sebastián;Donostia
San Cristobal|3|San Cristóbal
San Miguel|2
San Miguel de Allende|2
San Nicolas|4|San Nicolás
San Isidro|3
San Felipe|3
San Fernando|3
San Pablo|3
San Ignacio|3
San Vicente|3
San Lucas|3
San Luis Potosi|3|San Luis Potosí
San Luis|2
Santa Lucia|3|Santa Lucía
Santa Teresa|3
Santa Marta|2
Santa Margherita Ligure|3
Santa Clarita|2
San Gimignano|2
San Giovanni Rotondo|1
San Remo|1|Sanremo
San Giorgio|4
San Felice|5
San Lorenzo de El Escorial|3
San Pedro Sula|2
San Juan Capistrano|2
San Juan del Sur|4
San Cristobal de las Casas|3
Sant Joan|5
Sant Cugat|5
Sankt Augustin|5
Sankt Andreasberg|6
Saint Gilles|5
Saint Germain|4|Saint-Germain
Saint Jean de Luz|4
Saint Jean Pied de Port|3
Saint Emilion|2|Saint-Émilion
Saint Remy|4|Saint-Rémy
Saint Paul de Vence|4
Saint Laurent|4
Saint Maur|5
Saint Cyr|5
Saint Dizier|5
Saint Ouen|5
Saint Lô|5|Saint-Lô
Mont Saint Michel|1|Mont-Saint-Michel
Saint Hubert|5
Sint Niklaas|5
Sint Truiden|6
Sao Gabriel|5
Sao Sebastiao|4
San Joaquin|4
San Anselmo|4
San Dimas|4
Santa Paula|4
`),
  L('catholic-countries', 'places', 'Name a country where Catholics are the largest religious group.', 'Catholics are a majority in dozens of countries across Europe, Latin America, Africa and the Pacific, and the largest single group in a few more. A country counts if its Catholics are a majority or the largest religious group. This list is long but not complete.', 'Hand-authored from the Pew Research Center and the Annuario Pontificio.', `
Italy|1
Spain|1
France|1
Portugal|1
Poland|1
Ireland|1
Mexico|1
Brazil|1
Argentina|1
Colombia|1
Peru|1
Chile|1
Philippines|1
Austria|2
Belgium|2
Croatia|2
Lithuania|2
Slovakia|2
Slovenia|3
Hungary|3
Malta|2
Luxembourg|3
Andorra|4
Monaco|3
San Marino|3
Liechtenstein|4
Vatican City|1|Holy See
Switzerland|3
Cuba|2
Dominican Republic|2
Haiti|3
Guatemala|3
El Salvador|3
Nicaragua|3
Costa Rica|3
Panama|3
Venezuela|2
Ecuador|2
Bolivia|3
Paraguay|3
East Timor|3|Timor-Leste
Kiribati|5
Palau|5
Angola|3
Democratic Republic of the Congo|3|DR Congo;Congo;DRC
Republic of the Congo|4
Gabon|5
Equatorial Guinea|4
Burundi|4
Rwanda|3
Uganda|3
Lesotho|5
Cape Verde|4
Sao Tome and Principe|5
Seychelles|5
Saint Lucia|5
Dominica|5
`),
  L('italian-cities', 'places', 'Name a city or town in Italy.', 'Italy holds the Vatican, the tombs of the apostles Peter and Paul, and the towns of Francis, Clare, Benedict, Catherine of Siena and Padre Pio, so almost every Catholic has met its towns in the lives of the saints. Any Italian city or town counts. This list is long but not complete.', 'Hand-authored from standard gazetteers and Butler\'s Lives of the Saints.', `
Rome|1
Milan|1
Venice|1
Florence|1
Naples|1
Turin|1
Bologna|1
Genoa|1
Verona|1
Pisa|1
Siena|1
Assisi|1
Padua|1
Palermo|1
Bari|1
Catania|2
Ravenna|2
Perugia|2
Parma|2
Modena|2
Lucca|2
Orvieto|2
Loreto|1
Pompeii|1
Amalfi|2
Sorrento|2
Capri|2
Salerno|2
Brindisi|3
Taranto|3
Lecce|3
Trieste|2
Bergamo|2
Brescia|3
Como|2
Cremona|3
Mantua|3
Ferrara|3
Rimini|2
Ancona|3
Urbino|2
Spoleto|2
Gubbio|2
Spello|4
Cortona|3
Arezzo|3
Pistoia|4
Prato|3
Livorno|3
Cassino|2
Subiaco|3
Norcia|2|Nursia
Lanciano|3
San Giovanni Rotondo|1
Monte Cassino|1|Montecassino
Viterbo|3
Tivoli|3
Frascati|3
Castel Gandolfo|1
Ostia|3
Anzio|3
Gaeta|4
Caserta|3
Benevento|3
Avellino|4
Potenza|4
Matera|3
Cosenza|4
Reggio Calabria|3
Messina|2
Syracuse|2|Siracusa
Agrigento|3
Trapani|3
Cagliari|3
Sassari|4
Aosta|3
Bolzano|3
Trento|2
Vicenza|3
Treviso|3
Udine|3
Aquileia|3
Piacenza|3
Alessandria|4
Asti|3
Cuneo|4
Novara|4
Pavia|2
Lodi|4
Monza|3
Varese|4
Imola|3
Forli|4
Cesena|4
Faenza|4
Pesaro|4
Fano|5
Macerata|4
Ascoli Piceno|4
Pescara|3
Chieti|4
L'Aquila|3
Teramo|5
Campobasso|4
Foggia|3
Andria|5
Trani|5
Otranto|3
Gallipoli|4
Pienza|4
Montepulciano|3
Montalcino|3
San Gimignano|2
Volterra|3
Fiesole|3
Empoli|5
Lerici|5
Portofino|2
La Spezia|3
Savona|3
Imperia|5
San Remo|2
Ventimiglia|4
Positano|3
Ravello|4
Paestum|3
Herculaneum|3
Cumae|5
Pozzuoli|4
Ischia|3
Bardonecchia|6
Susa|5
Ivrea|4
Biella|5
Vercelli|4
`),
  L('spanish-cities', 'places', 'Name a city or town in Spain.', 'Spain gave the Church Ignatius of Loyola, Teresa of Avila, John of the Cross, Dominic and Francis Xavier, and its pilgrim road ends at Santiago de Compostela. Any Spanish city or town counts. This list is long but not complete.', 'Hand-authored from standard gazetteers and Butler\'s Lives of the Saints.', `
Madrid|1
Barcelona|1
Seville|1|Sevilla
Valencia|1
Granada|1
Toledo|1
Cordoba|1|Córdoba
Malaga|1|Málaga
Bilbao|1
Pamplona|1
Santiago de Compostela|1
Salamanca|2
Avila|1|Ávila
Segovia|2
Burgos|2
Leon|2|León
Zaragoza|2
Loyola|2|Azpeitia
San Sebastian|1|San Sebastián;Donostia
Santander|2
Oviedo|3
Gijon|3|Gijón
Vigo|2
La Coruna|3|A Coruña;Corunna
Lugo|3
Ourense|4
Pontevedra|3
Palma|2|Palma de Mallorca
Ibiza|2
Cadiz|2|Cádiz
Jerez|3
Huelva|3
Almeria|3|Almería
Murcia|2
Cartagena|3
Alicante|2
Benidorm|3
Castellon|4
Tarragona|2
Girona|2|Gerona
Lleida|3|Lerida
Vic|4
Figueres|2
Manresa|2
Sitges|3
Logrono|3|Logroño
Vitoria|3|Vitoria-Gasteiz
Guernica|2
Soria|4
Teruel|3
Huesca|3
Jaca|3
Calatayud|5
Cuenca|2
Guadalajara|3
Albacete|4
Ciudad Real|3
Talavera|4
Merida|3|Mérida
Badajoz|3
Caceres|3|Cáceres
Guadalupe|2
Trujillo|4
Plasencia|4
Zamora|3
Valladolid|2
Palencia|4
Medina del Campo|4
Alcala de Henares|3|Alcalá de Henares
Aranjuez|3
El Escorial|2
Santillana del Mar|4
Covadonga|3
Ronda|2
Marbella|3
Torremolinos|4
Antequera|4
Ubeda|4|Úbeda
Baeza|4
Jaen|3|Jaén
Linares|5
Lorca|3
Elche|3
Las Palmas|2
Santa Cruz de Tenerife|3
La Laguna|4
Mahon|4|Mahón
Gandia|4|Gandía
Xativa|4|Játiva
Peniscola|4|Peñíscola
Sagunto|4
Cuellar|5
Arevalo|5
Fontiveros|5
Alba de Tormes|3
Medina Sidonia|5
Calahorra|5
Tudela|4
Estella|4
Sangüesa|5
Puente la Reina|4
Roncesvalles|3
Burgo de Osma|5
Astorga|3
Ponferrada|3
Sahagun|4
Carrion de los Condes|4
Villafranca del Bierzo|5
O Cebreiro|4
Sarria|4
Finisterre|3
Muxia|5
`),
];
