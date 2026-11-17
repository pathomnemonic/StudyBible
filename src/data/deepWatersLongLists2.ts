import type { DeepAnswer, DeepPrompt, DeepTheme } from './deepWaters';

/**
 * The third hand-written batch: more long open lists (and a few complete closed ones) written one answer at a time, chosen to give questions that are not
 * letter rules. Each line is `Answer|tier|alias;alias`. Tiers are editorial judgement of how many players would think of the answer (1 nearly everyone, 6 only
 * a specialist), not survey data. Everything here is written from memory of standard references named in each `basis`, and none of it has been reviewed by a
 * person (see src/data/deepWaters.review.json). Open lists say "not on our list" for an unlisted answer, never "wrong".
 */
const rows = (t: string): DeepAnswer[] => t.trim().split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const [answer, tier, al] = l.split('|');
  const aliases = al ? al.split(';').map((x) => x.trim()).filter(Boolean) : [];
  return { answer: answer.trim(), tier: Number(tier) as DeepAnswer['tier'], ...(aliases.length ? { aliases } : {}) };
});
const L = (id: string, theme: DeepTheme, prompt: string, context: string, basis: string, list: string, extra: Partial<DeepPrompt> = {}): DeepPrompt => ({ id: `authored2-${id}`, theme, basis, prompt, context, answers: rows(list), ...extra });

export const LONG_LIST_2_PROMPTS: DeepPrompt[] = [
  L('nt-people', 'people', 'Name a person in the New Testament other than Jesus.', 'The Gospels, Acts and the letters name well over a hundred people, from the Holy Family and the apostles to Paul\'s co-workers and the officials who judged him. This list is long but not complete.', 'Hand-authored from the Gospels, Acts and the New Testament letters.', `
Mary|1|Virgin Mary;Blessed Virgin Mary;Mary the mother of Jesus;Mother Mary
Joseph|1|Saint Joseph;Joseph the carpenter;Joseph husband of Mary
Peter|1|Simon Peter;Simon;Cephas
Paul|1|Saul;Saul of Tarsus;Saint Paul
John|1|John the Apostle;John the Evangelist;John son of Zebedee
James|2|James the Greater;James son of Zebedee
Andrew|2
Matthew|2|Levi
Philip|3
Thomas|1|Doubting Thomas;Didymus
Judas Iscariot|1|Judas
John the Baptist|1|the Baptist
Mary Magdalene|1|Magdalene;Mary of Magdala
Martha|2
Lazarus|1
Mary of Bethany|3
Pontius Pilate|1|Pilate
Herod|1|Herod the Great
Herod Antipas|2
Herodias|3
Salome|3
Caiaphas|2
Annas|3
Barabbas|2
Elizabeth|2
Zechariah|2|Zacharias
Simeon|3
Anna the prophetess|3|Anna the prophet
Nicodemus|2
Joseph of Arimathea|2|Joseph of Arimathaea
Zacchaeus|2
Bartimaeus|3
Jairus|3
Simon of Cyrene|3|Simon the Cyrenian
Cleopas|4
Stephen|1|Saint Stephen
Barnabas|2
Silas|3
Timothy|2
Titus|3
Luke|1|Saint Luke
Mark|1|John Mark;Saint Mark
Apollos|4
Priscilla|3|Prisca
Aquila|3
Lydia|3
Cornelius|3
Ananias|3
Sapphira|3
Tabitha|3|Dorcas
Eutychus|4
Gamaliel|3
Felix|3
Festus|3
Agrippa|3|Herod Agrippa
Bernice|5|Berenice
Drusilla|5
Sergius Paulus|4
Elymas|5|Bar-Jesus
Philemon|3
Onesimus|3
Epaphroditus|5
Epaphras|6
Tychicus|5
Phoebe|4
Aristarchus|6
Gaius|5
Demas|5
Trophimus|6
Archippus|6
Euodia|6|Evodia
Syntyche|6
Clement|5
Junia|5|Junias
Andronicus|6
Rufus|6
Stephanas|6
Crispus|6
Sosthenes|6
Chloe|6
Erastus|6
Diotrephes|6
Jude|3|Judas the brother of James
Bartholomew|3|Nathanael|Nathaniel
Simon the Zealot|3|Simon the Canaanite
Thaddaeus|3|Thaddeus;Jude Thaddaeus;Lebbaeus
James the Less|3|James son of Alphaeus
Matthias|3
Zebedee|4
Malchus|4
Simon the Pharisee|5
Simon the Leper|5
Simon Magus|4|Simon the Sorcerer
Jason|6
Damaris|6
Dionysius the Areopagite|5|Dionysius
Publius|6
Ethiopian eunuch|3|Eunuch;Candace's treasurer
Lois|5
Eunice|5
Hymenaeus|6
Alexander the coppersmith|6|Alexander
Tertius|6
Quartus|6
Nympha|6
Mnason|6
Judas Barsabbas|6|Barsabbas
Demetrius|5
Philip the evangelist|4
Philip the Tetrarch|5
Archelaus|4
Widow of Nain|4
Rhoda|5
Mary the mother of James|5
Mary of Clopas|5|Mary the wife of Clopas
Eubulus|6
Linus|5
Claudia|6
Pudens|6
Urbanus|6
Claudius|4|Emperor Claudius
Tiberius|3|Tiberius Caesar
Caesar Augustus|2|Augustus
Quirinius|4
Gallio|4
Claudius Lysias|6|Lysias
Tertullus|6
`),
  L('catholic-songs', 'art-music', 'Name a hymn or song sung in Catholic churches.', 'Latin chant and hymns, Marian songs, and the English hymns Catholics sing at Mass, in Advent and Christmas, Lent and Easter, in the Rosary tradition and at May crowning.', 'Hand-authored; Graduale Romanum, Liber Usualis, the Westminster Hymnal and common Catholic hymnals.', `
Silent Night|1|Stille Nacht
O Come All Ye Faithful|1|Adeste Fideles;O Come All You Faithful
Ave Maria|1|Hail Mary
Amazing Grace|1
Joy to the World|1
O Come O Come Emmanuel|1|O Come Emmanuel;Veni Veni Emmanuel
Hark the Herald Angels Sing|1
The First Noel|1|First Noel
O Holy Night|1
Away in a Manger|2
O Little Town of Bethlehem|2
Angels We Have Heard on High|2
What Child Is This|2
Good Christian Men Rejoice|3
Holy Holy Holy|2
How Great Thou Art|2
On Eagle's Wings|2
Be Not Afraid|2
Here I Am Lord|2
Lord of the Dance|2
Holy God We Praise Thy Name|2|Holy God We Praise Your Name
Faith of Our Fathers|3
Immaculate Mary|3|Lourdes Hymn;Ave Ave Ave Maria
Hail Holy Queen|2
Salve Regina|2
Regina Caeli|2|Regina Coeli;Queen of Heaven Rejoice
Alma Redemptoris Mater|4
Ave Regina Caelorum|4|Ave Regina Coelorum
Tantum Ergo|2
O Salutaris Hostia|3|O Salutaris
Pange Lingua|2|Pange Lingua Gloriosi
Adoro Te Devote|3
Panis Angelicus|2
Ave Verum Corpus|2
Veni Creator Spiritus|2|Veni Creator
Veni Sancte Spiritus|3
Come Holy Ghost|3
Dies Irae|2
Stabat Mater|2
Te Deum|2|We Praise Thee O God
Ubi Caritas|2
Lauda Sion|5
Victimae Paschali Laudes|4
Vexilla Regis|4
Ave Maris Stella|3
O Filii et Filiae|5
Jesus Christ Is Risen Today|3
Christ the Lord Is Risen Today|3
Alleluia Sing to Jesus|4
Lift High the Cross|3
Soul of My Savior|4|Anima Christi
Crown Him with Many Crowns|3
Let All Mortal Flesh Keep Silence|4
Of the Father's Love Begotten|4|Corde Natus
Conditor Alme Siderum|6
Rorate Caeli|4|Rorate Coeli
Gaudete|3
Be Thou My Vision|3
Praise to the Lord the Almighty|4
Now Thank We All Our God|4
All Creatures of Our God and King|3
The Church's One Foundation|4
Sing of Mary|4
Mother Dearest Mother Fairest|5
Bring Flowers of the Rarest|3|Crown of May
Hail Mary Gentle Woman|4
Gather Us In|3
Sing a New Song|4
One Bread One Body|3
Eat This Bread|3
Taste and See|3
I Am the Bread of Life|3
You Are Mine|3
Table of Plenty|4
Pescador de Hombres|4|Lord You Have Come to the Lakeshore
Companions on the Journey|5
O Sacred Head Surrounded|3|O Sacred Head Sore Wounded
When I Survey the Wondrous Cross|3
Were You There|3
Jesu Dulcis Memoria|5
Gloria in Excelsis Deo|2|Gloria
Sanctus|3|Holy Holy Holy Lord God of Hosts
Agnus Dei|3|Lamb of God
Kyrie Eleison|3|Kyrie
Pater Noster|3
Missa de Angelis|5
Mass of Creation|4
Holy Is His Name|4
Canticle of the Sun|4
Prayer of Saint Francis|3|Make Me a Channel of Your Peace;Lord Make Me an Instrument of Your Peace
Come Thou Fount of Every Blessing|5
O God Our Help in Ages Past|4
Abide with Me|3
Mary Did You Know|3
It Came Upon the Midnight Clear|3
Once in Royal David's City|4
We Three Kings|2
O Come Little Children|5
Lo How a Rose E'er Blooming|4
Hail Queen of Heaven|4
Hail Redeemer King Divine|6
Sweet Sacrament Divine|5
Jesus My Lord My God My All|4
`),
  L('catholic-authors', 'church-history', 'Name a Catholic author or poet.', 'Novelists, poets, essayists and thinkers who were Catholic, from Dante to Flannery O\'Connor, including converts. Someone who wrote about Catholicism without being Catholic is not on the list.', 'Hand-authored; standard literary histories and biographies. Only writers who were baptized or received into the Catholic Church, whether or not they stayed observant.', `
G. K. Chesterton|1|Chesterton;GK Chesterton
J. R. R. Tolkien|1|Tolkien;JRR Tolkien
Dante Alighieri|1|Dante
Thomas More|2|Saint Thomas More
John Henry Newman|2|Newman;Cardinal Newman
Graham Greene|2
Evelyn Waugh|2
Flannery O'Connor|2
Hilaire Belloc|3|Belloc
Thomas Merton|2
Dorothy Day|3
Gerard Manley Hopkins|3|Hopkins
Francis Thompson|4
Alexander Pope|3
John Dryden|5
Alessandro Manzoni|4|Manzoni
Paul Claudel|5
Charles Péguy|5|Charles Peguy;Peguy
Georges Bernanos|4|Bernanos
François Mauriac|4|Francois Mauriac;Mauriac
Sigrid Undset|4|Undset
Shusaku Endo|4|Endo
Walker Percy|3
J. F. Powers|6
Muriel Spark|3
Anthony Burgess|4
Alice Thomas Ellis|6
Ronald Knox|4|Knox
Edith Sitwell|5
Robert Hugh Benson|5|Hugh Benson
Compton Mackenzie|6
Maurice Baring|6
Christopher Dawson|5
Rumer Godden|5
Mary Gordon|5
Andre Dubus|5
Ron Hansen|6
Paul Horgan|6
Allen Tate|6
Caryll Houselander|5
Oscar Wilde|3
Robert Southwell|5
Richard Crashaw|5
Miguel de Cervantes|3|Cervantes
Lope de Vega|4
Pedro Calderón de la Barca|5|Calderon
Luís de Camões|6|Camoes
Giovanni Boccaccio|4|Boccaccio
Francesco Petrarca|3|Petrarch
Torquato Tasso|5|Tasso
Ludovico Ariosto|5|Ariosto
Giovannino Guareschi|5|Guareschi
Czesław Miłosz|4|Czeslaw Milosz;Milosz
Karol Wojtyla|4
Henryk Sienkiewicz|4|Sienkiewicz
Adam Mickiewicz|5|Mickiewicz
Seamus Heaney|3|Heaney
James Joyce|2|Joyce
Patrick Kavanagh|6
Brian Moore|6
Flann O'Brien|5
Fulton Sheen|3|Fulton J. Sheen
Peter Kreeft|4|Kreeft
Scott Hahn|4
Joseph Pearce|5
`),
  L('sacred-composers', 'art-music', 'Name a composer who wrote sacred music for the Church.', 'Writers of Masses, motets, chant settings, hymns and oratorios, from the Middle Ages to the present, whether or not the composer was Catholic.', 'Hand-authored; standard music histories (Grove, Oxford History of Western Music).', `
Johann Sebastian Bach|1|Bach;J. S. Bach
Wolfgang Amadeus Mozart|1|Mozart
George Frideric Handel|1|Handel;Georg Friedrich Händel
Ludwig van Beethoven|2|Beethoven
Joseph Haydn|2|Haydn
Franz Schubert|2|Schubert
Giuseppe Verdi|2|Verdi
Antonio Vivaldi|2|Vivaldi
Giovanni Pierluigi da Palestrina|2|Palestrina
Gabriel Fauré|3|Faure
Charles Gounod|3|Gounod
César Franck|3|Cesar Franck;Franck
Franz Liszt|3|Liszt
Gioachino Rossini|3|Rossini
Claudio Monteverdi|3|Monteverdi
Thomas Tallis|3|Tallis
William Byrd|3|Byrd
Tomás Luis de Victoria|4|Victoria;Tomas Luis de Victoria
Gregorio Allegri|3|Allegri
Josquin des Prez|4|Josquin
Orlande de Lassus|4|Lassus;Orlando di Lasso
Anton Bruckner|3|Bruckner
Maurice Duruflé|4|Durufle
Francis Poulenc|4|Poulenc
Johannes Brahms|3|Brahms
Felix Mendelssohn|3|Mendelssohn
Hector Berlioz|4|Berlioz
Antonín Dvořák|3|Dvorak
Igor Stravinsky|4|Stravinsky
Benjamin Britten|3|Britten
Edward Elgar|3|Elgar
Arvo Pärt|3|Arvo Part
John Tavener|4|Tavener
Morten Lauridsen|4|Lauridsen
James MacMillan|4|MacMillan
John Rutter|3|Rutter
Giovanni Gabrieli|4|Gabrieli
Heinrich Schütz|4|Schutz
Dieterich Buxtehude|4|Buxtehude
Henry Purcell|3|Purcell
Giovanni Battista Pergolesi|3|Pergolesi
Alessandro Scarlatti|4|Scarlatti
Domenico Scarlatti|5
Olivier Messiaen|4|Messiaen
Henryk Górecki|4|Gorecki
Krzysztof Penderecki|5|Penderecki
Zoltán Kodály|4|Kodaly
Leoš Janáček|5|Janacek
Perotin|5|Pérotin
Léonin|6|Leonin
Guillaume de Machaut|4|Machaut
Guillaume Dufay|4|Dufay
Johannes Ockeghem|5|Ockeghem
Jacob Obrecht|6|Obrecht
Heinrich Isaac|6
Ludwig Senfl|6
Cristóbal de Morales|5|Morales
Francisco Guerrero|6
Antonio de Cabezón|6|Cabezon
Jan Dismas Zelenka|6|Zelenka
Heinrich Biber|6|Biber
Marc-Antoine Charpentier|5|Charpentier
Jean-Baptiste Lully|5|Lully
François Couperin|5|Couperin
Jean-Philippe Rameau|6|Rameau
Thomas Weelkes|6
Orlando Gibbons|4|Gibbons
John Taverner|5
Robert White|6
Thomas Tomkins|6
William Walton|5|Walton
Ralph Vaughan Williams|3|Vaughan Williams
Gustav Holst|4|Holst
Charles Villiers Stanford|5|Stanford
Hubert Parry|5|Parry
Samuel Barber|4|Barber
Leonard Bernstein|4|Bernstein
Randall Thompson|5
Ola Gjeilo|5|Gjeilo
Paul Mealor|6
Kim André Arnesen|6|Arnesen
Giacomo Puccini|4|Puccini
Luigi Cherubini|5|Cherubini
Camille Saint-Saëns|4|Saint-Saens;Saint Saens
Charles-Marie Widor|5|Widor
Louis Vierne|6|Vierne
Jehan Alain|6
Michael Haydn|6
Antonio Lotti|6
Antonio Caldara|6
Johann Adolph Hasse|6
Georg Philipp Telemann|4|Telemann
Franz Xaver Gruber|2|Gruber
John Francis Wade|5|Wade
Hildegard of Bingen|3
`),
  L('old-masters', 'art-music', 'Name an artist who painted or sculpted works for the Church before 1800.', 'Painters, sculptors and architects of the Middle Ages, Renaissance and Baroque whose altarpieces, frescoes, statues and churches fill Catholic Europe.', 'Hand-authored; standard art histories (Vasari, Janson, Gombrich).', `
Michelangelo|1|Michelangelo Buonarroti
Leonardo da Vinci|1|Leonardo;Da Vinci
Raphael|1|Raffaello Sanzio;Raffaello
Caravaggio|1|Michelangelo Merisi
Giotto|2|Giotto di Bondone
Fra Angelico|2|Beato Angelico
Botticelli|2|Sandro Botticelli
Titian|2|Tiziano Vecellio
Tintoretto|3|Jacopo Tintoretto
Veronese|3|Paolo Veronese
Giovanni Bellini|3|Bellini
Duccio|3|Duccio di Buoninsegna
Cimabue|3
Masaccio|3
Pietro Perugino|3|Perugino
Piero della Francesca|3
Andrea Mantegna|3|Mantegna
Jan van Eyck|3|Van Eyck
Rogier van der Weyden|4|Van der Weyden
Hieronymus Bosch|3|Bosch
Pieter Bruegel the Elder|3|Bruegel;Brueghel
Albrecht Dürer|3|Albrecht Durer;Durer
Hans Holbein|4|Holbein
Matthias Grünewald|4|Grunewald
El Greco|2|Domenikos Theotokopoulos
Diego Velázquez|2|Velazquez;Diego Velazquez
Bartolomé Esteban Murillo|3|Murillo
Francisco de Zurbarán|4|Zurbaran
Jusepe de Ribera|4|Ribera
Peter Paul Rubens|2|Rubens
Anthony van Dyck|3|Van Dyck;Anthony Van Dyck
Rembrandt|2|Rembrandt van Rijn
Nicolas Poussin|4|Poussin
Georges de La Tour|4|La Tour
Gian Lorenzo Bernini|2|Bernini
Francesco Borromini|4|Borromini
Guido Reni|4|Reni
Annibale Carracci|4|Carracci
Guercino|5
Giovanni Battista Tiepolo|4|Tiepolo
Filippo Lippi|4|Fra Filippo Lippi
Filippino Lippi|5
Domenico Ghirlandaio|4|Ghirlandaio
Luca Signorelli|5|Signorelli
Pontormo|5
Bronzino|5
Correggio|4
Giorgione|4
Lorenzo Lotto|5
Artemisia Gentileschi|3|Gentileschi
Lucas Cranach the Elder|4|Cranach
Hans Memling|4|Memling
Gerard David|6
Quentin Matsys|6
Domenichino|6
Sassoferrato|6
Carlo Dolci|6
Alonso Cano|6
Luca della Robbia|5|Della Robbia
Donatello|2
Lorenzo Ghiberti|3|Ghiberti
Filippo Brunelleschi|3|Brunelleschi
Andrea del Verrocchio|5|Verrocchio
Andrea del Sarto|5
Sebastiano del Piombo|6
Parmigianino|5
Paolo Uccello|4|Uccello
Antonello da Messina|5
Carlo Crivelli|6|Crivelli
Gentile da Fabriano|6
Simone Martini|4
Lorenzetti|5|Pietro Lorenzetti;Ambrogio Lorenzetti
Giovanni Pisano|6
Nicola Pisano|6
Arnolfo di Cambio|6
Cosimo Rosselli|6
Pinturicchio|5
Benozzo Gozzoli|5|Gozzoli
Fra Bartolomeo|6
Giulio Romano|6
Carlo Maratta|6|Maratta
Pietro da Cortona|5|Cortona
Andrea Pozzo|5|Pozzo
Giovanni Lanfranco|6
Jacob Jordaens|5|Jordaens
Philippe de Champaigne|5|Champaigne
Simon Vouet|6
Francisco de Goya|4|Goya
Juan de Juanes|6
Pedro de Mena|6
Juan Martínez Montañés|6
Gregorio Fernández|6
Tilman Riemenschneider|5|Riemenschneider
Veit Stoss|6
Albrecht Altdorfer|6|Altdorfer
Michael Pacher|6
Stefan Lochner|5|Lochner
Hugo van der Goes|5|Van der Goes
Dieric Bouts|5|Bouts
Robert Campin|6
Jean Fouquet|6|Fouquet
Limbourg brothers|5|Limbourg
Rublev|4|Andrei Rublev
`),
  L('women-saints', 'saints', 'Name a woman who is a canonized saint.', 'Virgins, martyrs, mothers, widows, queens, mystics and foundresses from the early Church to the present, canonized by the Church or long honored as saints. Blesseds who are not yet canonized are not on the list.', 'Hand-authored; Roman Martyrology, General Roman Calendar and the canonization lists of the Holy See.', `
Mary Magdalene|1|Mary of Magdala
Catherine of Siena|1
Teresa of Avila|1|Teresa of Ávila;Saint Teresa
Thérèse of Lisieux|1|Therese of Lisieux;Little Flower;Saint Therese
Clare of Assisi|1|Clare
Agnes|1
Agatha|2
Cecilia|1
Lucy|1
Margaret of Antioch|3
Monica|2
Scholastica|2
Bernadette|1|Bernadette Soubirous
Rita of Cascia|2|Rita
Faustina|2|Faustina Kowalska;Maria Faustina Kowalska
Elizabeth of Hungary|2
Brigid of Ireland|2|Brigid;Bridget of Kildare
Hildegard of Bingen|2|Hildegard
Joan of Arc|1
Gianna Beretta Molla|3|Gianna Molla
Josephine Bakhita|2|Bakhita
Edith Stein|2|Teresa Benedicta of the Cross
Katharine Drexel|2
Elizabeth Ann Seton|2
Frances Xavier Cabrini|2|Mother Cabrini;Frances Cabrini
Rose of Lima|2
Perpetua|2
Felicity|3
Anastasia|3
Barbara|2
Ursula|2
Helena|2|Helen
Bridget of Sweden|3|Birgitta
Catherine Labouré|3|Catherine Laboure
Marguerite Bourgeoys|5
Kateri Tekakwitha|2
Mother Teresa|1|Teresa of Calcutta
Zélie Martin|4|Zelie Martin
Louise de Marillac|4
Jane Frances de Chantal|4
Angela Merici|4
Gertrude the Great|4
Frances of Rome|5
Catherine of Alexandria|2
Dymphna|3
Martha|2
Anne|1|Saint Anne;Anna
Elizabeth|2
Mary|1|Virgin Mary
Veronica|3
Emerentiana|6
Genevieve|3
Clotilde|4
Radegund|5
Margaret of Scotland|4
Margaret of Cortona|5
Margaret Clitherow|5
Margaret Mary Alacoque|3
Colette|5
Catherine of Genoa|5
Catherine of Bologna|6
Clare of Montefalco|5
Rose of Viterbo|5
Rose Philippine Duchesne|5
Madeleine Sophie Barat|5
Julie Billiart|5
Jeanne Jugan|5
Mary MacKillop|3
Maria Goretti|2
Thérèse Couderc|6
Teresa of the Andes|4
Elizabeth of Portugal|5
Hedwig|5
Kinga|5
Jadwiga|5
Ludmilla|5|Ludmila
Olga|4
Monegundis|6
Macrina|5
Nonna|6
Emmelia|6
Paula|5
Marcella|6
Melania|5|Melania the Younger
Fabiola|6
Eustochium|6
Leoba|6
Walburga|5
Gertrude of Nivelles|6
Juliana of Liège|6|Juliana of Liege
Gemma Galgani|3
Veronica Giuliani|5
Maria Maddalena de' Pazzi|5|Mary Magdalene de' Pazzi
Catherine of Ricci|6
Angela of Foligno|5
Elizabeth of the Trinity|5
Teresa Margaret Redi|6
Lydia|4
Phoebe|5
Priscilla|5
Tabitha|4
Rhoda|6
Marina|6
Eugenia|6
Euphemia|4
Pelagia|5
Thecla|3
Apollonia|3
Blandina|4
Eulalia|4
Justina|5
Christina|5
Cyriaca|6
Flavia Domitilla|6
Prisca|5
Pudentiana|5
Praxedes|5
Bibiana|5
Susanna of Rome|6
Martina|6
Aurea|6
Afra|5
Regina|5
Reparata|6
Rosalia|5
Agnes of Bohemia|6
Agnes of Montepulciano|6
`),

  L('famous-churches', 'places', 'Name a famous Catholic church building.', 'Cathedrals, basilicas and abbey churches of the world, including great churches that were built as Catholic and are now used by other communities.', 'Hand-authored; standard architectural histories and the lists of minor basilicas of the Holy See.', `
Saint Peter's Basilica|1|Saint Peter's;St Peter's;Vatican Basilica
Notre-Dame de Paris|1|Notre Dame;Notre-Dame Cathedral;Notre Dame de Paris
Sagrada Família|1|Sagrada Familia
Chartres Cathedral|2|Chartres
Cologne Cathedral|2|Cologne
Milan Cathedral|2|Duomo di Milano;Il Duomo;Milan Duomo
Florence Cathedral|2|Santa Maria del Fiore;Duomo di Firenze;Florence Duomo
Saint Patrick's Cathedral|1|Saint Patrick's Cathedral New York;St Patrick's Cathedral
Westminster Cathedral|2
Reims Cathedral|3|Reims
Amiens Cathedral|3|Amiens
Rouen Cathedral|4|Rouen
Strasbourg Cathedral|3|Strasbourg
Burgos Cathedral|4|Burgos
Seville Cathedral|3|Seville
Toledo Cathedral|4|Toledo
Santiago de Compostela Cathedral|2|Santiago Cathedral
Salamanca Cathedral|5
Barcelona Cathedral|5
Mezquita of Córdoba|4|Mezquita;Cordoba Mosque Cathedral
Mont-Saint-Michel Abbey|3|Mont Saint Michel
Basilica of the Sacred Heart|2|Sacré-Cœur;Sacre Coeur
Lourdes Basilica|2|Basilica of Our Lady of the Rosary
Basilica of Saint Francis of Assisi|2|Assisi Basilica
Saint Mark's Basilica|2|San Marco;Saint Mark's Venice
Basilica of Saint Anthony of Padua|3|Il Santo
Santa Maria della Salute|4|La Salute
Pisa Cathedral|3
Siena Cathedral|3
Orvieto Cathedral|4
Monreale Cathedral|5
Saint John Lateran|2|Lateran Basilica
Santa Maria Maggiore|2|Saint Mary Major
Saint Paul Outside the Walls|3
Il Gesù|4|Church of the Gesù
Sant'Ignazio|5
Saint Stephen's Cathedral Vienna|3|Stephansdom
Salzburg Cathedral|5
Melk Abbey|4
Cathedral of Saint Vitus|3|Saint Vitus Cathedral;Prague Cathedral
Wawel Cathedral|4
Kraków Basilica of Saint Mary|5|Saint Mary's Basilica Krakow
Esztergom Basilica|5
Aachen Cathedral|3|Aachen
Speyer Cathedral|4|Speyer
Mainz Cathedral|5
Trier Cathedral|4
Ulm Minster|5
Freiburg Minster|5
Bamberg Cathedral|5
Altötting Chapel|5
Einsiedeln Abbey|4
Cathedral of Saint Michael and Saint Gudula|6|Brussels Cathedral
Antwerp Cathedral|5|Our Lady's Cathedral Antwerp
Canterbury Cathedral|2
York Minster|3
Westminster Abbey|2
Durham Cathedral|3
Salisbury Cathedral|3
Lincoln Cathedral|4
Wells Cathedral|4
Ely Cathedral|4
Winchester Cathedral|4
Saint Paul's Cathedral|2
Glastonbury Abbey|3
Basilica of the National Shrine of the Immaculate Conception|2|National Shrine
Saint Louis Cathedral Basilica|4|Cathedral Basilica of Saint Louis
Cathedral of Our Lady of the Angels|3|Los Angeles Cathedral
Basilica of Our Lady of Guadalupe|1|Guadalupe Basilica
Mexico City Metropolitan Cathedral|3|Mexico City Cathedral
Metropolitan Cathedral of Brasília|4|Brasilia Cathedral
Basilica of Our Lady of Aparecida|3|Aparecida
Notre-Dame Basilica Montreal|3|Notre-Dame Basilica
Saint Joseph's Oratory|3
Saint Anne de Beaupré Basilica|3|Sainte-Anne-de-Beaupre
Cathedral of Havana|5
Church of the Holy Sepulchre|1|Holy Sepulchre
Church of the Nativity|1
Basilica of the Annunciation|2
Basilica of Saint Sernin|6|Saint-Sernin
Basilica of Saint Denis|4|Saint-Denis
Sainte-Chapelle|3
La Madeleine|5
Saint-Sulpice|5
Notre-Dame de la Garde|5
Vézelay Abbey|5
Cluny Abbey|3|Cluny
Cîteaux Abbey|5|Citeaux
Clairvaux Abbey|5|Clairvaux
Monte Cassino|3|Montecassino
Subiaco|5
`),
  L('universities', 'church-history', 'Name a Catholic university or college.', 'Schools founded or run by the Catholic Church, its dioceses or its religious orders, in the United States and around the world.', 'Hand-authored; Association of Catholic Colleges and Universities membership and the Holy See\'s list of pontifical universities.', `
University of Notre Dame|1|Notre Dame
Georgetown University|1|Georgetown
Boston College|1
Fordham University|2|Fordham
Villanova University|2|Villanova
Marquette University|2|Marquette
Loyola University Chicago|3|Loyola Chicago
DePaul University|2|DePaul
Santa Clara University|3|Santa Clara
Gonzaga University|2|Gonzaga
Creighton University|3|Creighton
Catholic University of America|2|CUA
Providence College|3
Saint John's University|3|St John's
Seton Hall University|3|Seton Hall
Xavier University|3
University of Dayton|3
Duquesne University|3|Duquesne
Saint Louis University|3
College of the Holy Cross|3|Holy Cross
Fairfield University|4
Le Moyne College|5
Canisius College|5
Manhattan College|5
Iona College|5
Niagara University|5
Stonehill College|5
Merrimack College|5
Assumption University|6
Regis University|5
Seattle University|4
Saint Mary's College of California|5
University of San Francisco|3
Loyola Marymount University|3
University of Portland|4
University of San Diego|4
John Carroll University|5
Franciscan University of Steubenville|3|Steubenville
Christendom College|4
Thomas Aquinas College|4
Benedictine College|4
University of Mary|5
Ave Maria University|4
Saint Anselm College|5
Saint Joseph's University|3
La Salle University|4
Saint Vincent College|5
Saint Michael's College|5
Saint Norbert College|6
Marymount University|6
Loyola University New Orleans|4
Loyola University Maryland|4
Saint Mary's University of Minnesota|6
University of Saint Thomas|4
Gannon University|6
Lewis University|6
Barry University|6
Saint Leo University|5
Belmont Abbey College|6
Mount Saint Mary's University|5
Saint Bonaventure University|4
Siena College|4
Sacred Heart University|4
Salve Regina University|5
Rockhurst University|6
Saint Edward's University|5
Trinity Washington University|6
Pontifical Gregorian University|2|Gregorian
Pontifical University of Saint Thomas Aquinas|3|Angelicum
Pontifical Lateran University|4|Lateran University
Pontifical Biblical Institute|4|Biblicum
Pontifical Oriental Institute|5
Pontifical North American College|3|North American College
Pontifical Urbaniana University|6
Pontifical University of Saint Bonaventure|6|Seraphicum
Pontifical Athenaeum Regina Apostolorum|6
Pontifical University of the Holy Cross|5
Catholic University of Leuven|2|KU Leuven;Louvain
University of Salamanca|3
University of Navarra|3
Pontifical Catholic University of Chile|5
Pontifical Catholic University of Peru|5
Pontifical Xavierian University|6
Pontifical Catholic University of Rio de Janeiro|5
University of Santo Tomas|4
Ateneo de Manila University|4|Ateneo de Manila
Sophia University|4
Catholic University of Eichstätt-Ingolstadt|6
Catholic University of Milan|4|Università Cattolica
Catholic University of Lublin|5
University of Notre Dame Australia|4
Australian Catholic University|4
Saint Francis Xavier University|4|StFX
Université Laval|5
Université Catholique de Louvain|4
Institut Catholique de Paris|5
Catholic University of Lille|6
Catholic University of Portugal|6
Maynooth|3|Saint Patrick's College Maynooth
Saint Mary's University Twickenham|6
Ushaw College|6
Oscott College|6
`),
  L('denominations', 'church-history', 'Name a Christian church, denomination or tradition.', 'Churches and traditions that confess Christ, from the ancient Eastern churches to the Reformation churches and modern movements. Naming one does not say the Catholic Church recognizes its sacraments or orders.', 'Hand-authored; standard directories such as the World Christian Encyclopedia and the Handbook of Denominations.', `
Catholic Church|1|Roman Catholic Church;Catholic;Roman Catholic
Eastern Orthodox Church|1|Orthodox;Eastern Orthodox;Greek Orthodox
Lutheran Church|1|Lutheran;Lutheranism
Anglican Church|1|Anglican;Church of England;Episcopal Church;Episcopalian
Baptist|1|Baptists;Southern Baptist Convention;Baptist Church
Methodist|1|Methodists;United Methodist Church;Wesleyan
Presbyterian|1|Presbyterians;Presbyterian Church
Pentecostal|1|Pentecostalism;Assemblies of God;Pentecostals
Calvinist|2|Reformed Church;Reformed;Calvinism;Reformed Tradition
Mormon|3|Latter-day Saints;Church of Jesus Christ of Latter-day Saints
Jehovah's Witnesses|3|Jehovah's Witness
Seventh-day Adventist|3|Adventist;Seventh Day Adventists
Quaker|3|Quakers;Society of Friends;Friends
Mennonite|3|Mennonites
Amish|3
Congregationalist|4|Congregational Church;United Church of Christ
Evangelical|2|Evangelicals;Evangelicalism
Coptic Orthodox Church|3|Coptic;Copts
Armenian Apostolic Church|4|Armenian Church
Ethiopian Orthodox Church|4|Ethiopian Orthodox Tewahedo Church
Russian Orthodox Church|2|Russian Orthodox
Greek Orthodox Church|2
Serbian Orthodox Church|4|Serbian Orthodox
Romanian Orthodox Church|5
Bulgarian Orthodox Church|5
Ukrainian Orthodox Church|4
Syriac Orthodox Church|5|Syrian Orthodox
Assyrian Church of the East|5|Nestorian Church
Maronite Church|3|Maronite Catholic
Melkite Church|5|Melkite Greek Catholic
Chaldean Catholic Church|5|Chaldean
Ukrainian Greek Catholic Church|4
Syro-Malabar Church|5|Syro-Malabar Catholic Church
Old Catholic Church|5|Old Catholics
Society of Saint Pius X|5|SSPX
Salvation Army|3
Christian Science|4
Unitarian|4|Unitarians;Unitarian Universalism
Disciples of Christ|5|Christian Church
Church of Christ|4|Churches of Christ
Church of the Nazarene|5|Nazarene
Moravian Church|5|Moravians
Waldensian|6|Waldensians
Hussite|6|Hussites
Anabaptist|4|Anabaptists
Hutterite|6|Hutterites
Brethren|5|Plymouth Brethren
Christian Reformed Church|6
Church of Scotland|3|Kirk
Church of Ireland|3
Church in Wales|6
Scottish Episcopal Church|6
Free Church of Scotland|6
Orthodox Church in America|6
Oriental Orthodox|4|Oriental Orthodoxy
Eastern Catholic Churches|3
Seventh Day Baptist|6
Foursquare Church|6
Vineyard Church|6
Coptic Catholic Church|6
Armenian Catholic Church|6
Syro-Malankara Catholic Church|6
Ethiopian Catholic Church|6
Greek Catholic Church|5
`),
  L('bible-objects', 'scripture', 'Name an object or item mentioned in the Bible.', 'Things people made, carried, wore and used in Scripture: sacred furniture, tools, weapons, clothing, musical instruments and household goods. Foods and animals are not on this list.', 'Hand-authored from the Old and New Testaments.', `
Ark of the Covenant|1|Ark
Ark of Noah|1|Noah's Ark
Cross|1
Crown of thorns|1
Manger|1
Sling|1|Slingshot
Staff|2|Rod;Shepherd's staff
Tablets of the Law|1|Ten Commandments;Stone tablets
Golden calf|1
Bronze serpent|2|Brass serpent;Serpent on a pole;Nehushtan
Menorah|2|Lampstand;Golden lampstand
Altar|1
Altar of incense|3|Incense altar
Table of showbread|4|Table of the Presence
Mercy seat|4
Veil of the Temple|2|Temple veil;Curtain of the Temple
Ephod|3
Breastplate|2|Breastplate of the high priest
Urim and Thummim|4
Harp|2|Lyre
Trumpet|2|Shofar;Ram's horn
Tambourine|3|Timbrel
Cymbals|4
Flute|4|Pipe
Sword|1
Spear|2|Lance
Shield|2
Helmet|3|Helmet of salvation
Armor|2|Armour;Armor of God
Bow|3
Arrow|3
Chariot|2
Sandals|2
Cloak|2|Mantle
Robe|2|Coat of many colors;Coat of many colours;Tunic
Purple robe|3
Seamless garment|4|Seamless tunic
Veil|3
Sackcloth|3
Linen cloth|3|Shroud;Linen wrappings
Sponge|3
Nails|2
Lamp|2|Oil lamp
Jar|3|Water jar;Stone jars
Water pot|3|Waterpots
Wineskin|3|Wineskins;Wine skin
Basket|3
Net|2|Fishing net
Boat|2|Ship
Anchor|4
Oar|5
Plow|3|Plough
Yoke|3
Sickle|4
Threshing floor|3
Millstone|3
Scroll|2
Pen|5
Ink|5
Seal|3|Signet ring
Ring|3
Crown|2
Scepter|3|Sceptre
Throne|2
Bed|4|Pallet
Mat|3
Pillow|5
Lantern|4|Torches
Torch|4
Censer|4|Thurible
Basin|3|Washbasin
Towel|3
Cup|2|Chalice
Pitcher|5
Pot|5|Cooking pot
Coin|3|Silver coin;Denarius
Talent|3|Talents
Mite|3|Widow's mite
Pearl|2|Pearl of great price
Treasure|3|Hidden treasure
Pillar of cloud|3
Pillar of fire|3
Cornerstone|2
Tent|2|Tent of Meeting
Tabernacle|2
Curtain|4
Ladder|2|Jacob's ladder
Coffin|5
Tomb|2|Sepulcher;Sepulchre
Stone|2|Rolling stone
Rock|3
Hammer|5
Axe|3|Ax
Saw|6
Anvil|6
Fishhook|5|Hook
Dagger|4
Knife|4
Spindle|6|Distaff
Loom|6
Needle|3|Eye of a needle
Mirror|4
`),
  L('martyrs', 'saints', 'Name a martyr of the early Church.', 'Christians killed for the faith in the first centuries, up to about the year 400, whose feasts the Church keeps in the Roman Martyrology.', 'Hand-authored; Roman Martyrology and Butler\'s Lives of the Saints.', `
Stephen|1|Saint Stephen;Protomartyr Stephen
Peter|1|Saint Peter
Paul|1|Saint Paul
James the Greater|3|James son of Zebedee
Polycarp|2|Polycarp of Smyrna
Ignatius of Antioch|2|Ignatius
Justin Martyr|2|Justin
Perpetua|2
Felicity|3|Felicitas
Agnes|1
Agatha|2
Lucy|1|Lucia
Cecilia|2
Sebastian|1
Lawrence|1|Laurence of Rome
Cyprian|3|Cyprian of Carthage
Pope Sixtus II|3|Sixtus II
Pope Fabian|4|Fabian
Pope Stephen I|5
Pope Callistus I|4|Callistus
Pope Clement I|3|Clement of Rome
Pope Telesphorus|6|Telesphorus
Pope Pontian|6|Pontian
Pothinus|5
Blandina|3
Irenaeus|3|Irenaeus of Lyons
Alban|3
George|1|Saint George
Catherine of Alexandria|2
Barbara|2
Margaret of Antioch|3
Vitus|3
Pancras|4
Valentine|2
Cosmas and Damian|3|Cosmas;Damian
Maurice|3|Mauritius
Eulalia of Mérida|4|Eulalia
Eulalia of Barcelona|5
Justa and Rufina|6|Justa;Rufina
Hippolytus|3
Pionius|6
Carpus|6
Papylus|6
Apollonia|3
Tarcisius|3
Genesius|5
Gordian|6
Chrysanthus and Daria|6|Chrysanthus;Daria
Marcellinus and Peter|5|Marcellinus
John and Paul|4|Saints John and Paul
Nereus and Achilleus|5|Nereus;Achilleus
Processus and Martinian|6|Processus;Martinian
Crispin and Crispinian|4|Crispin;Crispinian
Felix and Adauctus|6
Victor of Marseille|6
Florian|4
Afra|5
Maximilian|6|Maximilian of Tebessa
Phocas|6
Theodore Tiro|6
Procopius|6
Demetrius of Thessalonica|4|Demetrius
Mennas|6|Menas
Febronia|6
Anastasia|3
Irene|4
Euphemia|4
Pelagia|6
Quirinus|5
Boniface of Tarsus|6
Basil of Ancyra|6
Gervasius and Protasius|5|Gervase;Protase
Januarius|3|Gennaro
Eustace|4|Eustachius
Christopher|3
Blaise|2
Pope Marcellus I|6
Pope Urban I|6
Pope Anterus|6
Pope Pius I|6
Alexander|6
Hermes|6
Basilides|6
Cyrinus|6
Theodotus of Ancyra|6
Bonosus and Maximilian|6
Julian of Brioude|6
Symphorian|6
Ferréol|6|Ferreolus
Saturninus|5|Sernin;Saturnin
Cyricus and Julitta|6|Cyricus;Julitta
Eugenia|6
Agricola and Vitalis|6
Vincent of Saragossa|3|Vincent
Fructuosus|6
Emeterius and Celedonius|6
Cucuphas|6
Justus and Pastor|6
Acisclus|6
Pantaleon|4|Panteleimon
Nicander and Marcian|6
Bartholomew|2
Thomas|2|Thomas the Apostle
Andrew|2|Andrew the Apostle
Philip|3
Matthias|3
Jude|3|Jude Thaddaeus
Simon|3|Simon the Zealot
Matthew|3
Mark|3
Barnabas|3
`),
  L('rome-churches', 'places', 'Name a church in Rome.', 'The basilicas and parish churches of the city, from the four papal basilicas to small ancient churches built over the houses of the early martyrs.', 'Hand-authored; Rome\'s lists of titular churches and the Vicariate of Rome\'s parish directory.', `
Saint Peter's Basilica|1|Saint Peter's;St Peter's;San Pietro
Saint John Lateran|1|San Giovanni in Laterano;Lateran Basilica
Santa Maria Maggiore|1|Saint Mary Major
Saint Paul Outside the Walls|2|San Paolo fuori le Mura
Santa Croce in Gerusalemme|4|Holy Cross in Jerusalem
San Lorenzo fuori le Mura|4|Saint Lawrence Outside the Walls
San Sebastiano fuori le Mura|4|Saint Sebastian Outside the Walls
Il Gesù|3|Gesù;Church of the Gesù
Sant'Ignazio|5|Saint Ignatius
Santa Maria sopra Minerva|4|Minerva
Santa Maria in Trastevere|4
Santa Maria del Popolo|4
Santa Maria della Vittoria|5
San Pietro in Vincoli|3|Saint Peter in Chains
Santa Prassede|5|Saint Praxedes
Santa Pudenziana|5|Saint Pudentiana
Santa Sabina|5|Saint Sabina
Santa Cecilia in Trastevere|4|Saint Cecilia in Trastevere
San Clemente|4|Saint Clement
Santi Quattro Coronati|6
Sant'Agnese fuori le Mura|5|Saint Agnes Outside the Walls
Sant'Agnese in Agone|4|Saint Agnes in Agony
San Luigi dei Francesi|4|Saint Louis of the French
Sant'Andrea della Valle|5
Santa Maria in Aracoeli|5|Aracoeli
Santa Maria in Cosmedin|4|Mouth of Truth
San Carlo alle Quattro Fontane|5|San Carlino
Sant'Ivo alla Sapienza|6
Trinità dei Monti|4|Trinita dei Monti
Santa Susanna|6
Chiesa Nuova|5|Santa Maria in Vallicella
San Giorgio in Velabro|6
Santo Stefano Rotondo|6
San Marco|5|Saint Mark
San Crisogono|6
Pantheon|2|Santa Maria ad Martyres;Santa Maria Rotonda
Sant'Eustachio|6
San Pietro in Montorio|5|Tempietto
Domine Quo Vadis|5|Quo Vadis
Santa Francesca Romana|6
Santi Cosma e Damiano|6
Santi Giovanni e Paolo|6
San Gregorio Magno al Celio|6
Sant'Anastasia|6
Santa Maria in Domnica|6
Santa Balbina|6
Sant'Alessio|6
San Bartolomeo all'Isola|6
Sant'Agostino|5|Saint Augustine
Sant'Apollinare|6
San Lorenzo in Lucina|6
San Lorenzo in Damaso|6
Santa Maria della Pace|6
Santa Maria dell'Anima|6
Sant'Andrea al Quirinale|5
Santa Bibiana|6
Santa Maria della Scala|6
San Silvestro in Capite|6
San Nicola in Carcere|6
Santa Maria in Via Lata|6
Sacro Cuore del Suffragio|6
San Teodoro|6
San Saba|6
Santi XII Apostoli|5|Holy Apostles
San Vitale|6
San Martino ai Monti|6
San Giovanni a Porta Latina|6
San Giovanni dei Fiorentini|6
San Paolo alla Regola|6
Santa Maria in Campitelli|6
San Salvatore in Lauro|6
Santi Ambrogio e Carlo|6
Sant'Antonio dei Portoghesi|6
`),
  L('catholic-prayers', 'devotion', 'Name a Catholic prayer.', 'Prayers learned at home, said at Mass or taught in the Catechism, including prayers of the Rosary, the Angelus, the Divine Mercy and the great saints.', 'Hand-authored; Compendium of the Catechism of the Catholic Church, Roman Missal, Liturgy of the Hours and the Manual of Indulgences.', `
Our Father|1|Lord's Prayer;Pater Noster;Our Father Who Art in Heaven
Hail Mary|1|Ave Maria
Glory Be|1|Glory Be to the Father;Gloria Patri
Apostles' Creed|1|Apostles Creed
Nicene Creed|1
Act of Contrition|1
Memorare|2|Prayer of Saint Bernard
Angelus|2
Regina Caeli|3|Regina Coeli;Queen of Heaven
Hail Holy Queen|2|Salve Regina
Prayer to Saint Michael|1|Saint Michael Prayer;Saint Michael the Archangel
Guardian Angel Prayer|2|Angel of God;Angel of God My Guardian Dear
Come Holy Spirit|2|Veni Sancte Spiritus;Veni Creator Spiritus
Anima Christi|3|Soul of Christ
Divine Mercy Chaplet|2|Chaplet of Divine Mercy;Chaplet of the Divine Mercy
Rosary|1|Holy Rosary
Litany of the Saints|2|Litany of Saints
Litany of Loreto|3|Litany of the Blessed Virgin Mary;Litany of the Blessed Virgin
Litany of the Sacred Heart|4|Litany of the Sacred Heart of Jesus
Litany of Saint Joseph|5
Litany of the Holy Name|5
Jesus Prayer|3|Lord Jesus Christ Son of God Have Mercy on Me
Prayer of Saint Francis|2|Make Me an Instrument of Your Peace
Grace Before Meals|1|Bless Us O Lord;Grace Before Meals
Grace After Meals|3|We Give Thee Thanks
Morning Offering|2
Prayer Before Communion|3|Lord I Am Not Worthy
Act of Faith|3
Act of Hope|3
Act of Love|3|Act of Charity
Magnificat|2|Canticle of Mary;My Soul Magnifies the Lord
Benedictus|4|Canticle of Zechariah
Nunc Dimittis|4|Canticle of Simeon
Te Deum|3
Confiteor|3|I Confess
Gloria|2|Gloria in Excelsis;Glory to God in the Highest
Sanctus|3|Holy Holy Holy
Agnus Dei|2|Lamb of God
Kyrie|3|Kyrie Eleison;Lord Have Mercy
Eternal Rest|3|Eternal Rest Grant Unto Them;Requiem Aeternam
Stations of the Cross|2|Way of the Cross
Novena|2
Prayer to Saint Joseph|3|To Saint Joseph
Prayer to Saint Jude|4
Prayer to Saint Anthony|4|Saint Anthony Prayer
Prayer to Saint Therese|5
Prayer of Consecration to Mary|4|Total Consecration
Prayer for Vocations|4
Prayer for the Pope|5|Let Us Pray for Pope
Prayer for Peace|4
Sub Tuum Praesidium|4|We Fly to Thy Patronage
Ave Regina Caelorum|5
Alma Redemptoris Mater|5
O Sacrament Most Holy|4
Divine Praises|4|Blessed Be God
Prayer of Abandonment|5|Prayer of Charles de Foucauld;Father I Abandon Myself
Suscipe|4|Take Lord and Receive;Prayer of Saint Ignatius
Prayer of Saint Thomas Aquinas|5
Prayer of Saint Patrick|4|Saint Patrick's Breastplate;Lorica
Prayer of Saint Teresa of Avila|4|Let Nothing Disturb You
Prayer to the Holy Spirit|3
Prayer to the Sacred Heart|4
Prayer to Our Lady of Guadalupe|5
Fatima Prayer|3|O My Jesus Forgive Us Our Sins
Prayer to the Immaculate Heart|5
Prayer for the Dead|3|Prayer for the Faithful Departed
Prayer for the Sick|4
Prayer for Priests|4
Prayer for Families|4
Chaplet of Saint Michael|5
Chaplet of the Holy Wounds|6
Seven Sorrows Chaplet|5|Servite Rosary
Brigittine Rosary|6
Saint Michael Novena|6
Immaculate Conception Novena|6
Christmas Novena|6
Prayer of the Faithful|3|General Intercessions
Eucharistic Prayer|3|Eucharistic Prayer I;Roman Canon
Collect|4|Opening Prayer
Prayer over the Offerings|5|Secret
Preface|4
Prayer for Spiritual Communion|4|Spiritual Communion
Prayer Before Mass|5
Prayer After Mass|5
Prayer of Thanksgiving After Communion|5|Thanksgiving After Mass
Prayer to the Blessed Sacrament|5
Prayer to Our Lady of Perpetual Help|5
Prayer to Saint Rita|5
Prayer to Saint Francis|4
Prayer to Saint Padre Pio|5
Prayer for the Dying|4|Commendation of the Dying
`),

  L('vatican-ii-documents', 'church-history', 'Name one of the sixteen documents of the Second Vatican Council.', 'The Council (1962 to 1965) issued four constitutions, nine decrees and three declarations. You can answer with the Latin title or the English one.', 'The sixteen documents promulgated by the Second Vatican Council, as listed on vatican.va.', `
Lumen Gentium|1|Dogmatic Constitution on the Church
Dei Verbum|2|Dogmatic Constitution on Divine Revelation;Divine Revelation
Sacrosanctum Concilium|1|Constitution on the Sacred Liturgy;Sacred Liturgy
Gaudium et Spes|1|Pastoral Constitution on the Church in the Modern World;Church in the Modern World
Inter Mirifica|5|Decree on the Media of Social Communications;Social Communications
Orientalium Ecclesiarum|5|Decree on the Eastern Catholic Churches;Eastern Catholic Churches
Unitatis Redintegratio|3|Decree on Ecumenism;Ecumenism
Christus Dominus|5|Decree on the Pastoral Office of Bishops;Pastoral Office of Bishops
Perfectae Caritatis|5|Decree on the Adaptation and Renewal of Religious Life;Renewal of Religious Life
Optatam Totius|5|Decree on Priestly Training;Priestly Training
Gravissimum Educationis|5|Declaration on Christian Education;Christian Education
Nostra Aetate|2|Declaration on the Relation of the Church to Non-Christian Religions;Non-Christian Religions
Apostolicam Actuositatem|5|Decree on the Apostolate of the Laity;Apostolate of the Laity
Dignitatis Humanae|3|Declaration on Religious Freedom;Religious Freedom
Ad Gentes|4|Decree on the Church's Missionary Activity;Missionary Activity
Presbyterorum Ordinis|5|Decree on the Ministry and Life of Priests;Ministry and Life of Priests
`, { closed: 16 }),
  L('stations-of-the-cross', 'devotion', 'Name one of the fourteen Stations of the Cross.', 'The traditional Way of the Cross has fourteen stations, from the condemnation by Pilate to the burial.', 'The traditional fourteen stations as prayed in the Roman Catholic Church.', `
Jesus is condemned to death|2|Condemned to death;Jesus is condemned
Jesus takes up his cross|2|Jesus takes the cross;Takes up the cross;Jesus carries his cross
Jesus falls the first time|1|First fall;Jesus falls
Jesus meets his mother|1|Jesus meets Mary;Meets his mother
Simon of Cyrene helps Jesus|2|Simon helps Jesus carry the cross;Simon of Cyrene
Veronica wipes the face of Jesus|1|Veronica;Veronica wipes his face
Jesus falls the second time|2|Second fall
Jesus meets the women of Jerusalem|2|Women of Jerusalem
Jesus falls the third time|2|Third fall
Jesus is stripped of his garments|2|Stripped of his garments;Jesus is stripped
Jesus is nailed to the cross|1|Nailed to the cross;Crucifixion
Jesus dies on the cross|1|Death of Jesus;Jesus dies
Jesus is taken down from the cross|2|Taken down from the cross;Deposition
Jesus is laid in the tomb|1|Laid in the tomb;Jesus is buried;Burial
`, { closed: 14 }),

  L('roman-emperors', 'church-history', 'Name a Roman emperor.', 'Rulers of the Roman Empire from Augustus to the last emperor of the West, including the emperors who persecuted Christians and the first to favor them.', 'Hand-authored; standard lists of Roman emperors (Oxford Classical Dictionary).', `
Augustus|1|Caesar Augustus;Octavian
Tiberius|1
Caligula|1|Gaius;Gaius Caesar
Claudius|1
Nero|1
Galba|4
Otho|4
Vitellius|4
Vespasian|2
Titus|2
Domitian|2
Nerva|3
Trajan|2
Hadrian|1
Antoninus Pius|3
Marcus Aurelius|1
Lucius Verus|4
Commodus|2
Pertinax|4
Didius Julianus|5
Septimius Severus|3
Caracalla|2
Geta|4
Macrinus|5
Elagabalus|3|Heliogabalus
Severus Alexander|4
Maximinus Thrax|4|Maximinus
Gordian I|6
Gordian II|6
Gordian III|5
Pupienus|6
Balbinus|6
Philip the Arab|4
Decius|3
Trebonianus Gallus|6
Aemilian|6
Valerian|4
Gallienus|4
Claudius Gothicus|5|Claudius II
Quintillus|6
Aurelian|3
Tacitus|5
Florian|6
Probus|5
Carus|6
Carinus|6
Numerian|6
Diocletian|1
Maximian|4
Constantius Chlorus|4|Constantius I
Galerius|4
Severus II|6
Maxentius|3
Maximinus Daia|5
Licinius|4
Constantine|1|Constantine the Great
Constantine II|5
Constans|5
Constantius II|4
Julian|2|Julian the Apostate
Jovian|5
Valentinian I|4
Valens|4
Gratian|4
Valentinian II|6
Theodosius I|2|Theodosius;Theodosius the Great
Arcadius|4
Honorius|3
Theodosius II|5
Valentinian III|5
Petronius Maximus|6
Avitus|6
Majorian|6
Libius Severus|6
Anthemius|6
Olybrius|6
Glycerius|6
Julius Nepos|6
Romulus Augustulus|3
Marcian|5
Leo I|5
Zeno|5
Justinian|2|Justinian I;Justinian the Great
Heraclius|4
`),
  L('us-cities-saints', 'places', 'Name a city or town in the United States named for a saint or a Catholic term.', 'Many American places were named by Spanish, French and Catholic settlers for saints, feasts and sacraments, from San Francisco to Saint Louis.', 'Hand-authored; the United States Board on Geographic Names and standard place-name dictionaries.', `
San Francisco|1
Saint Louis|1|St. Louis
San Diego|1
San Antonio|1
San Jose|1|San José
Los Angeles|1
Sacramento|2
Santa Fe|1
Santa Barbara|2
Santa Cruz|2
Santa Monica|2
Santa Clara|3
Santa Rosa|3
Santa Ana|2
Santa Maria|4
Santa Clarita|4
San Bernardino|2
San Mateo|3
San Rafael|3
San Luis Obispo|3
San Clemente|3
San Marcos|3
San Angelo|3
San Leandro|4
San Carlos|4
San Pablo|5
San Gabriel|4
San Fernando|4
San Juan Capistrano|2
San Pedro|3
San Ramon|4
San Marino|4
San Bruno|4
San Dimas|4
San Anselmo|5
San Juan|2
Saint Paul|1|St. Paul
Saint Petersburg|2|St. Petersburg
Saint Augustine|1|St. Augustine
Saint Charles|3|St. Charles
Saint Joseph|3|St. Joseph
Saint Cloud|3|St. Cloud
Saint George|3|St. George
Saint Albans|5|St. Albans
Saint Helena|5|St. Helena
Saint Marys|5|St. Marys
Saint Peters|5|St. Peters
Saint Michael|5
Saint Francis|5
Saint Clair Shores|5
Saint Johns|5|St. Johns
Saint Ignace|5
Saint Martinville|6
Saint Genevieve|5|Ste. Genevieve
Saint Anthony|5
Saint Bernard|6
Saint Gabriel|6
Corpus Christi|1
Las Cruces|3
Santa Teresa|6
Santa Paula|5
Santa Fe Springs|5
Port Saint Lucie|3|Port St. Lucie
Santa Claus|4
`),
  L('abbeys', 'church-history', 'Name a famous monastery or abbey.', 'Houses of monks and nuns that shaped Christian history, in Europe and in America, whether or not they are still in use.', 'Hand-authored; standard histories of monasticism.', `
Monte Cassino|1|Montecassino
Subiaco|3
Cluny|2|Cluny Abbey
Cîteaux|3|Citeaux
Clairvaux|3
Fontenay|5|Fontenay Abbey
Mont-Saint-Michel|2|Mont Saint Michel
Solesmes|3
Einsiedeln|3
Melk|3
Saint Gall|3|Sankt Gallen;Saint Gallen
Reichenau|5
Beuron|5
Maria Laach|4
Montserrat|2
Poblet|5
Santo Domingo de Silos|4|Silos
Yuste|6
Lindisfarne|2
Iona|2
Glastonbury|2|Glastonbury Abbey
Whitby|3|Whitby Abbey
Jarrow|4
Westminster Abbey|2
Fountains Abbey|3
Rievaulx|4
Tintern Abbey|3|Tintern
Downside|4|Downside Abbey
Ampleforth|3|Ampleforth Abbey
Buckfast|3|Buckfast Abbey
Mount Melleray|5
Glenstal|5|Glenstal Abbey
Clonmacnoise|3
Skellig Michael|3
Gethsemani|2|Abbey of Gethsemani;Our Lady of Gethsemani
New Melleray|5
Spencer|5|Saint Joseph's Abbey Spencer
Conception Abbey|5
Saint John's Abbey|3|Collegeville
Saint Meinrad|4|Saint Meinrad Archabbey
Saint Vincent Archabbey|4|Latrobe
Mepkin|5|Mepkin Abbey
Mount Saviour|6
Christ in the Desert|5
Tre Fontane|5|Three Fountains
Camaldoli|4
Vallombrosa|5
Grande Chartreuse|2|La Grande Chartreuse;Chartreuse
Sept-Fons|6
Lérins|4|Lerins
Marmoutier|6
Fleury|5|Saint-Benoît-sur-Loire
Saint-Denis|3
Moissac|5
Vézelay|4|Vezelay
Conques|5
Bec|5|Le Bec;Bec Abbey
Jumièges|6|Jumieges
Fulda|4
Corvey|6
Lorsch|6
Bobbio|4
Nonantola|6
Pomposa|6
Farfa|6
Casamari|6
Fossanova|6
Chiaravalle|5
Mount Athos|2|Athos
Saint Catherine's Monastery|2|Saint Catherine's;Mount Sinai Monastery
Mar Saba|4
Studion|6|Stoudios
Meteora|3
Kykkos|6
Valaam|6
Troitse-Sergiyeva Lavra|5|Holy Trinity Lavra;Sergiev Posad
Kiev Pechersk Lavra|5|Pechersk Lavra
Pannonhalma|5
Tyniec|6
Alcobaça|5|Alcobaca
Batalha|6
Mosteiro dos Jerónimos|5|Jeronimos Monastery;Jeronimos
Escorial|3|El Escorial
Las Huelgas|6
`),
  L('ot-stories', 'scripture', 'Name a story from the Old Testament.', 'Well-known episodes of the Old Testament: from creation and the patriarchs to the Exodus, the judges and kings, the prophets and the exile.', 'Hand-authored from the Catholic Old Testament.', `
Creation|1|Creation of the world;The Seven Days of Creation
Adam and Eve|1|The Fall;The Garden of Eden;Garden of Eden;Eve and the serpent
Cain and Abel|1
Noah's Ark|1|Noah and the Flood;The Flood;Noah and the Ark
Tower of Babel|1|Babel
Call of Abraham|3|God calls Abraham
Sodom and Gomorrah|1|Destruction of Sodom
Lot's wife|2|Lot's wife turned to salt
Hagar and Ishmael|3
Binding of Isaac|2|Sacrifice of Isaac;Abraham and Isaac;Akedah
Rebekah at the well|4|Rebecca at the well;Isaac and Rebekah
Jacob and Esau|1|Esau sells his birthright;Esau's birthright
Jacob's ladder|1|Jacob's dream
Jacob wrestles with the angel|2|Jacob wrestles with God
Rachel and Leah|3
Joseph and his brothers|1|Joseph sold into slavery;Joseph's coat;Coat of many colors
Joseph in Egypt|2|Joseph interprets Pharaoh's dreams
Moses in the bulrushes|1|Baby Moses;Moses in the basket
Burning bush|1|The burning bush
The ten plagues|1|Plagues of Egypt
Passover|1|The first Passover
Crossing of the Red Sea|1|Parting of the Red Sea;Red Sea
Manna in the desert|2|Manna from heaven
Water from the rock|3|Moses strikes the rock
Ten Commandments|1|Moses receives the commandments;Moses on Mount Sinai
Golden calf|1
Bronze serpent|3|Moses and the bronze serpent
Balaam's donkey|2|Balaam and the donkey
Spies in Canaan|4|Twelve spies
Fall of Jericho|1|Battle of Jericho;Walls of Jericho
Rahab|3|Rahab and the spies
Achan's sin|5
Deborah and Jael|4|Deborah and Barak
Gideon and the three hundred|2|Gideon;Gideon's three hundred
Jephthah's daughter|5|Jephthah's vow
Samson and Delilah|1|Samson
Ruth and Naomi|1|Ruth
Hannah's prayer|3|Hannah
Samuel called by God|3|Samuel in the temple;Call of Samuel
Saul anointed king|4|Samuel anoints Saul
David anointed|3|Samuel anoints David
David and Goliath|1
David and Jonathan|3
David and Bathsheba|1|Bathsheba
Nathan's parable|4|Nathan rebukes David
Absalom's rebellion|3|Absalom
Judgment of Solomon|1|Solomon's judgment;Two women and the baby
Solomon builds the Temple|2|Building of the Temple
Queen of Sheba visits Solomon|3|Queen of Sheba
Elijah and the prophets of Baal|2|Elijah on Mount Carmel
Elijah and the widow of Zarephath|4|Widow of Zarephath
Naboth's vineyard|4
Elijah taken up in a chariot of fire|2|Elijah's chariot of fire;Elijah taken to heaven
Elisha and Naaman|3|Naaman the leper
Elisha and the Shunammite woman|5
Josiah finds the Book of the Law|5
Hezekiah's illness|5
Jonah and the whale|1|Jonah and the big fish;Jonah
Daniel in the lions' den|1|Daniel and the lions
Shadrach, Meshach and Abednego|1|Fiery furnace;The fiery furnace
Writing on the wall|2|Belshazzar's feast
Nebuchadnezzar's dream|3
Susanna and the elders|3|Susanna
Esther saves her people|1|Esther;Queen Esther
Job's suffering|1|Job
Tobit and Tobias|2|Tobias and the angel;Tobit
Judith and Holofernes|2|Judith
Ezekiel's dry bones|2|Valley of dry bones
Isaiah's call|4|Isaiah's vision in the Temple
Jeremiah and the potter|5
Jeremiah in the cistern|6
Fall of Jerusalem|3|Babylonian exile
Return from exile|3|Cyrus lets the Jews return
Rebuilding the walls|4|Nehemiah rebuilds the walls
Maccabean revolt|3|Judas Maccabeus
Seven brothers and their mother|4|Maccabean martyrs
Eleazar's martyrdom|6
Jacob blesses his sons|4|Jacob's blessing
Judah and Tamar|4
Joseph's dreams|3
Melchizedek|3|Abraham and Melchizedek
Abraham and the three visitors|3|Abraham's visitors;Oaks of Mamre
Aaron's rod|4|Aaron's staff
Korah's rebellion|5
Moses sees the Promised Land|4|Death of Moses
Crossing the Jordan|3|Crossing of the Jordan
The sun stands still|4|Joshua's long day
Saul and the witch of Endor|4|Witch of Endor
Ark taken by the Philistines|5|Ark captured
Ark brought to Jerusalem|4|David dances before the ark
Uzzah and the ark|5
Dedication of the Temple|4
Elijah on Mount Horeb|4|Still small voice
`),
  L('genesis-people', 'people', 'Name a person in the Book of Genesis.', 'Genesis names the first humans, the families of Noah and Abraham and the twelve sons of Jacob. Gods and angels are not counted.', 'Hand-authored from Genesis.', `
Adam|1
Eve|1
Cain|1
Abel|1
Seth|3
Enoch|3
Methuselah|3
Lamech|5
Noah|1
Shem|3
Ham|3
Japheth|4
Nimrod|4
Terah|5
Abraham|1|Abram
Sarah|1|Sarai
Lot|2
Hagar|2
Ishmael|2
Isaac|1
Rebekah|2|Rebecca
Esau|1
Jacob|1|Israel
Laban|3
Rachel|2
Leah|2
Bilhah|5
Zilpah|5
Reuben|2
Simeon|3
Levi|3
Judah|2
Dan|4
Naphtali|4
Gad|4
Asher|4
Issachar|4
Zebulun|4
Joseph|1
Benjamin|2
Dinah|3
Tamar|3
Potiphar|3
Pharaoh|2
Manasseh|3
Ephraim|3
Melchizedek|3
Abimelech|4
Keturah|5
Eliezer|5
Midian|5
Ishbak|6
Zimran|6
Jokshan|6
Medan|6
Shuah|6
Basemath|6
Adah|5
Zillah|5
Jabal|5
Jubal|4
Tubal-cain|4
Naamah|5
Enosh|5
Kenan|6
Mahalalel|6
Jared|5
Arpachshad|6
Shelah|6
Eber|5
Peleg|5
Joktan|6
Reu|6
Serug|6
Nahor|4
Haran|5
Milcah|5
Iscah|6
Bethuel|5
Ephron|5
Hamor|5
Shechem|4
Judith|6
Oholibamah|6
Timna|6
Eliphaz|6
Reuel|6
Jobab|6
Hadad|6
Asenath|4
Potiphera|6
Hirah|6
Shua|6
Er|5
Onan|3
Perez|4
Zerah|5
Hezron|6
Hamul|6
Machir|6
`),
  L('british-isles-saints', 'saints', 'Name a saint of England, Ireland, Scotland or Wales.', 'Missionaries, monks, bishops, martyrs and kings of the British Isles, from the first centuries to the Reformation martyrs, whether or not they were born there.', 'Hand-authored; Butler\'s Lives of the Saints and the calendars of the dioceses of England, Wales, Scotland and Ireland.', `
Patrick|1|Saint Patrick
Brigid of Kildare|1|Brigid;Bridget of Ireland
Columba|2|Colmcille;Columcille
Columbanus|3
Aidan|3|Aidan of Lindisfarne
Cuthbert|2|Cuthbert of Lindisfarne
Bede|2|Venerable Bede;Bede the Venerable
Hilda|3|Hilda of Whitby
Alban|2
Augustine of Canterbury|2
David|2|David of Wales;Dewi Sant
Dunstan|3
Edmund|3|Edmund the Martyr
Edward the Confessor|2
Thomas Becket|1|Thomas à Becket
Thomas More|1
John Fisher|2
Margaret Clitherow|3
Edmund Campion|2
Oliver Plunkett|3
Wilfrid|4
Chad|3
Cedd|5
Oswald|3|Oswald of Northumbria
Ninian|3
Kentigern|4|Mungo
Margaret of Scotland|2
Kevin|3|Kevin of Glendalough
Brendan|2|Brendan the Navigator
Ciarán|4|Ciaran;Ciaran of Clonmacnoise
Finnian|4|Finnian of Clonard
Comgall|6
Malachy|3
Laurence O'Toole|4
Enda|5
Declan|4
Ita|5
Dympna|3
Gall|5
Kilian|4
Willibrord|4
Boniface|2
Swithun|4|Swithin
Alphege|5
Aldhelm|6
Guthlac|5
Etheldreda|4|Audrey
Frideswide|4
Werburgh|5
Edith of Wilton|6
Ethelbert|5
Birinus|6
Benedict Biscop|5
Ceolfrith|6
Edmund Rich|5
Hugh of Lincoln|3
Richard of Chichester|5
Wulfstan|5
Osmund|6
Gilbert of Sempringham|4
John of Beverley|5
Anselm|2|Anselm of Canterbury
Dyfrig|6
Illtud|5
Teilo|5
Winefride|3|Winefride of Holywell
Beuno|6
Asaph|6
Cadoc|6
Samson of Dol|6
Piran|5
Petroc|5
Nectan|6
Neot|6
Austell|6
Ia|6
Mawes|6
Germanus of Auxerre|5
Magnus|5
Ronan|6
Fintan|6
Fiacre|3
Maedoc|6
Aengus|6
Colman|5
Eanswythe|6
Botolph|5
Felix of Burgundy|6
Edwin|5
Oswin|6
Egbert|6
Cuthburga|6
Thomas Cantilupe|6
William of York|6
John Ogilvie|4
Philip Howard|4
Cuthbert Mayne|4
Ralph Sherwin|6
Alexander Briant|6
Robert Southwell|3
Henry Walpole|6
John Houghton|4
Anne Line|4
Nicholas Owen|4
John Almond|6
Forty Martyrs of England and Wales|2
`),

  L('christmas-songs', 'art-music', 'Name a Christmas carol or Christmas song.', 'Carols sung in church and songs heard in shops and on the radio, old and new, in English and other languages.', 'Hand-authored; standard carol books (Oxford Book of Carols) and popular Christmas song charts.', `
Silent Night|1|Stille Nacht
Jingle Bells|1
Joy to the World|1
O Come All Ye Faithful|1|Adeste Fideles
Hark the Herald Angels Sing|1
The First Noel|1|First Noel
Away in a Manger|1
O Little Town of Bethlehem|1
White Christmas|1
Rudolph the Red-Nosed Reindeer|1|Rudolph
Frosty the Snowman|1
Santa Claus Is Comin' to Town|1|Santa Claus Is Coming to Town
Deck the Halls|1
We Wish You a Merry Christmas|1
Twelve Days of Christmas|1|The Twelve Days of Christmas
Jingle Bell Rock|2
Let It Snow|2
Winter Wonderland|2
Silver Bells|2
The Little Drummer Boy|2|Little Drummer Boy
Do You Hear What I Hear|2
Carol of the Bells|2
Ding Dong Merrily on High|3
Coventry Carol|4
Good King Wenceslas|2
We Three Kings|2
Angels We Have Heard on High|2
It Came Upon the Midnight Clear|3
I Saw Three Ships|4
O Holy Night|1
O Christmas Tree|2|O Tannenbaum
Once in Royal David's City|3
In the Bleak Midwinter|3
Lo How a Rose E'er Blooming|4
The Holly and the Ivy|3
Here We Come A-Wassailing|4
God Rest Ye Merry Gentlemen|2
What Child Is This|2
Mary Did You Know|3
Have Yourself a Merry Little Christmas|2
I'll Be Home for Christmas|2
The Christmas Song|2|Chestnuts Roasting on an Open Fire
Sleigh Ride|2
It's the Most Wonderful Time of the Year|2
All I Want for Christmas Is You|1
Last Christmas|1
Rockin' Around the Christmas Tree|2
Blue Christmas|2
Feliz Navidad|2
Wonderful Christmastime|3
Fairytale of New York|3
Happy Xmas|3|War Is Over
Do They Know It's Christmas|3
Santa Baby|3
Baby It's Cold Outside|3
A Holly Jolly Christmas|2|Holly Jolly Christmas
Up on the Housetop|3
Jolly Old Saint Nicholas|3
Go Tell It on the Mountain|3
Gaudete|4
Personent Hodie|6
Wexford Carol|5
Huron Carol|5|Jesous Ahatonhia
Il Est Né|6
Les Anges dans nos campagnes|6
Noël Nouvelet|6
Sussex Carol|5
The Cherry Tree Carol|5
Tomorrow Shall Be My Dancing Day|6
Masters in This Hall|6
While Shepherds Watched Their Flocks|3
Rise Up Shepherd and Follow|5
Mary's Boy Child|3
Breath of Heaven|4
Joseph's Lullaby|6
Little Saint Nick|3
Christmas Time Is Here|3
Merry Christmas Everyone|4
Step into Christmas|4
Christmas Wrapping|5
Mistletoe|4
Please Come Home for Christmas|4
Run Rudolph Run|4
Driving Home for Christmas|4
I Wish It Could Be Christmas Everyday|4
O Come O Come Emmanuel|2
Veni Veni Emmanuel|5
Of the Father's Love Begotten|5
Good Christian Men Rejoice|3
Sing We Now of Christmas|6
Shepherds Shake Off Your Drowsy Sleep|6
`),
  L('patron-occupations', 'saints', 'Name a job, group or condition that has a patron saint.', 'The Church honors saints as patrons of trades, causes and conditions: farmers, musicians, travelers, nurses, students and many more. Name the job or group, not the saint.', 'Hand-authored; Butler\'s Lives of the Saints and Catholic patron-saint directories (for example Catholic Online and the Catholic Encyclopedia).', `
Farmers|1|Farming;Farmer
Musicians|1|Music;Musician
Travelers|1|Travellers;Traveler;Travelers
Nurses|1|Nurse
Students|1|Student;Scholars
Teachers|1|Teacher;Educators
Doctors|1|Physicians;Doctor;Physician
Soldiers|1|Soldier
Sailors|1|Mariners;Seamen;Sailor
Fishermen|1|Fisherman;Fishers
Carpenters|1|Carpenter;Woodworkers
Lawyers|1|Lawyer;Attorneys
Writers|1|Authors;Writer
Artists|1|Painters;Artist
Children|1|Child
Animals|2|Pets
Pilots|2|Aviators;Airmen;Pilot
Cooks|2|Chefs;Cook
Bakers|2|Baker
Brewers|3|Brewer
Butchers|3|Butcher
Blacksmiths|4|Blacksmith;Smiths
Tailors|3|Tailor
Shoemakers|3|Shoemaker;Cobblers
Weavers|4|Weaver
Miners|3|Mining;Miner
Firefighters|2|Firemen;Firefighter
Police officers|2|Police;Policemen;Police
Judges|3|Judge
Accountants|2|Accountant;Bookkeepers
Bankers|3|Banker
Merchants|3|Merchant;Traders
Architects|3|Architect
Builders|3|Builder;Masons;Stonemasons
Engineers|3|Engineer
Scientists|3|Scientist
Astronomers|4|Astronomer
Philosophers|3|Philosopher
Librarians|3|Librarian
Booksellers|4|Bookseller
Printers|4|Printer
Journalists|2|Journalist;Reporters
Editors|4|Editor
Translators|3|Translator
Secretaries|4|Secretary
Actors|2|Actor;Entertainers
Comedians|3|Comedian
Dancers|3|Dancer
Singers|2|Singer
Poets|3|Poet
Athletes|2|Athlete;Sportsmen
Archers|4|Archer
Hunters|3|Hunter
Gardeners|3|Gardener
Florists|3|Florist
Beekeepers|4|Beekeeper
Shepherds|2|Shepherd
Cattle|5|Cattle breeders
Horses|4|Horsemen
Veterinarians|3|Vets
Pharmacists|3|Pharmacist;Druggists
Dentists|3|Dentist
Surgeons|3|Surgeon
Midwives|3|Midwife
Barbers|3|Barber;Hairdressers
Jewelers|4|Jeweler
Goldsmiths|4
Watchmakers|5|Clockmakers
Tanners|4|Tanner
Fullers|6
Potters|4|Potter
Glassmakers|5
Sculptors|4|Sculptor
Organists|5|Organist
Postal workers|3|Postal Workers;Mail carriers
Taxi drivers|3|Cab drivers;Drivers
Truck drivers|4
Undertakers|3|Funeral directors
Prisoners|2|Prisoner;Captives
Thieves|3|Thief
Lepers|3|Leprosy;Lepers
The sick|2|Sick people;Invalids
The dying|2
The poor|2
Orphans|2|Orphan
Widows|3|Widow
Mothers|2|Mother
Fathers|2|Father
Expectant mothers|2|Pregnant women
Unborn children|3
Families|2|Family
Workers|1|Laborers;Workmen;Working people
Immigrants|2|Migrants;Immigrant
Refugees|3|Refugee
Missionaries|2|Missionary
Priests|1|Priest
Bishops|3|Bishop
Seminarians|4|Seminarian
Confessors|5
Catechists|3|Catechist
Altar servers|3|Altar boys;Servers
Choirs|4
Church musicians|3
Parish priests|3|Parish Priests
Lost things|2|Lost articles;Lost items
Impossible causes|2|Desperate cases;Lost causes
Headaches|4
Toothaches|4
Eye diseases|3|Eyes;Blind people
Epilepsy|4
Plague victims|4|Plague
Skin diseases|5
Mental illness|3|Mental health
Depression|5
Addiction|4|Alcoholics
Victims of abuse|3|Abuse victims
Peace|3
Engaged couples|3|Fiancés;Engaged people
Marriage|2|Married couples
Young girls|4|Girls
Young boys|4|Boys
Youth|2|Young people;Teenagers
Boy Scouts|5|Scouts
Seafarers|3
Cyclists|5|Bicyclists
Computer programmers|4|Programmers;Internet
Television|3|Broadcasters
Radio|4
Photographers|4|Photographer
Tax collectors|3|Tax collector
Gravediggers|5
Tentmakers|4|Tentmaker
`),
  L('church-titles', 'church-history', 'Name a title, office or role in the Catholic Church.', 'Offices of clergy and bishops, ranks in religious life, and roles in a parish and the Vatican, from pope to altar server.', 'Hand-authored; Code of Canon Law and the Annuario Pontificio.', `
Pontiff|2|Bishop of Rome;Holy Father;Supreme Pontiff
Cardinal|1
Archbishop|1
Bishop|1
Priest|1|Father
Deacon|1
Monsignor|2
Abbot|2
Abbess|3
Prior|3
Prioress|4
Mother Superior|2
Nun|1|Sister
Monk|1
Friar|2
Brother|2
Novice|3
Postulant|4
Oblate|4
Hermit|3
Anchorite|5
Acolyte|3
Lector|3|Reader
Altar server|2|Altar boy;Altar girl;Server
Usher|3
Cantor|3
Organist|3
Sacristan|3
Cathedral canon|5
Canon|4
Dean|4
Vicar|3
Vicar general|4
Auxiliary bishop|3
Coadjutor bishop|5|Coadjutor
Diocesan bishop|4
Metropolitan|5
Primate|5
Patriarch|3
Major archbishop|6
Eparch|6
Exarch|6
Archimandrite|6
Pastor|2
Parochial vicar|4|Associate pastor
Curate|4
Chaplain|2
Rector|3
Provost|6
Prelate|3
Nuncio|3|Apostolic nuncio
Legate|4|Papal legate
Camerlengo|3
Dean of the College of Cardinals|5
Prefect|4
Secretary of State|3
Cardinal bishop|6
Cardinal priest|6
Cardinal deacon|6
Protonotary apostolic|6
Chancellor|5
Judicial vicar|6
Defender of the bond|6
Promoter of justice|6
Master of ceremonies|4
Thurifer|5|Incense bearer
Crucifer|5|Cross bearer
Extraordinary minister of Holy Communion|3|Eucharistic minister
Catechist|3
Lay minister|3
Youth minister|4
Seminarian|2
Superior general|4
Provincial|5|Provincial superior
Master of novices|6|Novice master
Abbot general|6
Procurator general|6
Postulator|6
Devil's advocate|3|Promoter of the faith
Swiss Guard|2|Papal Swiss Guard
Papal gentleman|6
Penitentiary|6
Grand Penitentiary|6
Almoner|4|Papal almoner
Sub-deacon|5|Subdeacon
Porter|5|Doorkeeper
Exorcist|3
Pastoral associate|6
Director of religious education|6|DRE
Religious sister|3
Consecrated virgin|4
Titular bishop|5
Emeritus pope|4|Pope emeritus
Antipope|3
Pro-nuncio|6
Apostolic delegate|5
Apostolic administrator|6
Prefect apostolic|6
Vicar apostolic|5
Archpriest|5
Dean of a cathedral chapter|6
Domestic prelate|6
Honorary prelate|6
Chaplain of His Holiness|5
`),
  L('church-architecture', 'places', 'Name a part or feature of a church or cathedral building.', 'Parts of the building, from the floor plan (nave, transept) to the windows, vaults, towers, doors and furnishings of great medieval and Renaissance churches.', 'Hand-authored; standard architectural glossaries (for example Banister Fletcher).', `
Nave|1
Altar|1
Aisle|1
Pew|1|Pews
Steeple|1
Bell tower|1|Campanile;Belfry
Stained glass|1|Stained glass window
Pulpit|1|Ambo
Crypt|2
Apse|2
Transept|2
Choir|2|Quire
Chancel|3
Sanctuary|2
Sacristy|3
Narthex|3|Vestibule
Baptistery|2|Baptistry
Font|2|Baptismal font
Tabernacle|2
Confessional|2|Confession booth
Rose window|2|Rose
Flying buttress|2|Buttress
Pointed arch|3|Gothic arch
Ribbed vault|3|Rib vault
Barrel vault|4|Tunnel vault
Groin vault|5
Fan vault|5
Dome|1|Cupola
Lantern|5
Clerestory|3
Triforium|4
Ambulatory|3
Chapter house|4
Cloister|2
Gargoyle|2
Grotesque|5
Pinnacle|4
Finial|5
Crocket|6
Tracery|4
Lancet window|4|Lancet
Oculus|5
Tympanum|4
Portal|3|Doorway
Trumeau|6
Rood screen|4|Rood
Choir stalls|4|Stalls
Misericord|5
Sedilia|5
Piscina|5
Aumbry|6
Reredos|4|Retable
Altarpiece|2|Altar piece
Triptych|3
Predella|6
Baldachin|3|Baldacchino;Ciborium
Altar rail|3|Communion rail
Lady chapel|3
Side chapel|2|Chapel
Chantry|5
Mausoleum|3
Ossuary|5
Catacomb|3
Galilee|6
Lych gate|5|Lychgate
Churchyard|3
Graveyard|2|Cemetery
Rectory|2
Presbytery|3
Vestry|3
Choir loft|3|Organ loft;Gallery
Organ|2|Pipe organ
Bell|1|Bells
Lectern|3
Credence table|5
Sanctuary lamp|3
Paschal candlestick|5|Paschal candle stand
Holy water stoup|3|Stoup
Holy water font|2
Stations of the Cross|2
Crucifix|1
Statues|2|Statue
Icon|2|Icons
Mosaic|3
Fresco|3
Pier|5
Column|2|Pillar
Capital|4
Arcade|4
Bay|5
Boss|6|Roof boss
Corbel|6
Squinch|6
Pendentive|6
Drum|5
Spire|2
Tower|1
Weathervane|4|Weathercock
Parvis|6
Bishop's throne|3|Cathedra
Kneeler|2|Kneelers
Hymn board|5
`),
  L('catholic-films', 'art-music', 'Name a film or TV series about the Bible, Jesus, a saint or Catholic life.', 'Movies and shows that tell the story of Christ, the saints, priests and nuns, the popes or the Church, from silent films to recent releases.', 'Hand-authored; standard film histories and the Vatican Film List.', `
The Passion of the Christ|1
Ben-Hur|1
The Ten Commandments|1
The Prince of Egypt|1
The Song of Bernadette|2|Song of Bernadette
A Man for All Seasons|2
Becket|3
The Mission|2
Of Gods and Men|3
Silence|3
Jesus of Nazareth|2
The Gospel According to St. Matthew|4|Gospel According to Saint Matthew
King of Kings|3
The Robe|3
The Greatest Story Ever Told|2
Quo Vadis|3
Sister Act|1
The Sound of Music|1
The Nun's Story|3
Going My Way|2
The Bells of St. Mary's|2|Bells of Saint Mary's
Boys Town|3
Dead Man Walking|2
Doubt|2
Calvary|3
Spotlight|2
The Exorcist|1
Francesco|4
Brother Sun, Sister Moon|3|Brother Sun Sister Moon
Joan of Arc|2
The Passion of Joan of Arc|4
Romero|4
Marcelino Pan y Vino|4|Marcelino
Padre Pio|3
Monsieur Vincent|5
The Miracle of Our Lady of Fatima|3|Miracle of Our Lady of Fatima
Fatima|3
Bernadette|4
Mother Teresa|3
Restless Heart|5
Karol: A Man Who Became Pope|4|Karol
Pope Francis: A Man of His Word|4
The Two Popes|1
Conclave|1
Angels and Demons|2|Angels & Demons
The Da Vinci Code|2
Risen|3
Son of God|2
The Chosen|1
Paul, Apostle of Christ|3
The Nativity Story|1
Jesus Christ Superstar|1
Godspell|2
Monty Python's Life of Brian|2|Life of Brian
The Last Temptation of Christ|2
Noah|2
Exodus: Gods and Kings|3
Fr. Stu|3|Father Stu
Francis of Assisi|5
Lilies of the Field|3
Agnes of God|4
The Scarlet and the Black|3
Come to the Stable|5
The Cardinal|5
I Confess|3
The Keys of the Kingdom|3
The Trouble with Angels|4
Black Robe|4
The Name of the Rose|2
The Magdalene Sisters|3
Philomena|2
Sister Act 2|2
Entertaining Angels|5
The Young Pope|2
The New Pope|3
The Way|3
Thérèse|4
A Hidden Life|4
Barabbas|4
Samson and Delilah|3
David and Bathsheba|3
The Story of Ruth|5
The Bible: In the Beginning|4|The Bible
The Gospel of John|4
The Gospel of Luke|5|Jesus film
The Miracle Maker|3
`),
  L('christmas-customs', 'devotion', 'Name a Christmas custom or tradition.', 'Things people do, make, eat and decorate at Advent and Christmas, from church customs to family and national traditions.', 'Hand-authored; standard folklore and liturgical references.', `
Christmas tree|1
Nativity scene|1|Crèche;Creche;Manger scene
Advent calendar|1
Advent wreath|1
Santa Claus|1|Saint Nicholas;Father Christmas
Christmas stockings|1|Stockings
Christmas lights|1
Wreath|1
Christmas cards|1
Midnight Mass|1
Caroling|1|Carols;Christmas carols
Gift giving|1|Presents;Gifts
Candy cane|2
Gingerbread house|2|Gingerbread
Fruitcake|3
Eggnog|2
Yule log|3
Mistletoe|2
Holly|2
Poinsettia|2
Tinsel|3
Star on the tree|2|Tree topper
Angel on the tree|3
Ornaments|2|Baubles
Christmas Eve vigil|3
Christmas crackers|3
Panettone|3
Stollen|3
Kutia|6
Wigilia|4|Polish Christmas Eve supper
Oplatek|5|Christmas wafer
Empty chair at the table|5
Saint Nicholas Day|3|Feast of Saint Nicholas
Saint Lucy Day|3|Saint Lucia procession;Santa Lucia
Las Posadas|3|Posadas
Simbang Gabi|4
Three Kings Day|2|Epiphany;Feast of the Epiphany
King cake|3|Rosca de Reyes
Epiphany chalking|6|Chalking the door
Blessing of the crib|5
Christmas pageant|3|Nativity play
Christmas market|2|Christkindlmarkt
Christmas pudding|3|Plum pudding
Mince pies|3
Roast goose|4
Turkey dinner|2|Christmas dinner
Ham|3
Tamales|3
Feast of seven fishes|3|Seven fishes
Buñuelos|6
Bûche de Noël|4
Lebkuchen|4
Pierogi|5
Boxing Day|3
Secret Santa|3
Letters to Santa|3
Leaving cookies for Santa|3|Cookies and milk
Reindeer|2
Sleigh|2
Elf on the shelf|3
Jólabókaflóð|5|Yule book flood
Krampus|4
Belsnickel|6
Befana|4|La Befana
Julebukk|6
Yule|3
Wassailing|4|Wassail
Burning the Yule log|5
Candles in the window|3
Luminarias|4|Farolitos
Christmas Day Mass|2
Christmas novena|4
O Antiphons|4|Great Os
Christmas Eve|1
Christmas Day|1
Twelve days of Christmas|2
Advent|1
Christmas octave|5
Holy Family Sunday|4
`),

  L('english-monarchs', 'church-history', 'Name a king or queen of England.', 'Rulers of England from the Anglo-Saxon kings to the present, including those who defended the Pope, broke with Rome or returned to it.', 'Hand-authored; standard lists of English monarchs.', `
William the Conqueror|1|William I
William Rufus|3|William II
Henry I|3
Stephen|2|King Stephen
Matilda|3|Empress Matilda;Maud
Henry II|1
Richard I|1|Richard the Lionheart;Richard the Lionhearted;Richard Lionheart
John|1|King John;John Lackland
Henry III|2
Edward I|2|Longshanks
Edward II|2
Edward III|2
Richard II|2
Henry IV|2
Henry V|1
Henry VI|2
Edward IV|2
Edward V|3
Richard III|1
Henry VII|2
Henry VIII|1
Edward VI|2
Lady Jane Grey|2|Jane Grey;Jane
Mary I|1|Bloody Mary;Mary Tudor
Elizabeth I|1|Queen Elizabeth I;Good Queen Bess
James I|2|James VI
Charles I|1
Charles II|2
James II|2
William III|2|William of Orange
Mary II|3
Anne|2|Queen Anne
George I|3
George II|3
George III|1
George IV|3
William IV|3
Victoria|1|Queen Victoria
Edward VII|3
George V|3
Edward VIII|2
George VI|2
Elizabeth II|1|Queen Elizabeth II
Charles III|1|King Charles III
Alfred the Great|1|Alfred
Æthelstan|4|Athelstan
Edmund I|5|Edmund the Magnificent
Edgar|4|Edgar the Peaceful
Æthelred the Unready|3|Ethelred the Unready;Æthelred II
Cnut|2|Canute;Canute the Great
Harold Harefoot|5
Harthacnut|6|Hardicanute
Edward the Confessor|1
Harold Godwinson|1|Harold II
Edward the Elder|4
Edmund Ironside|4|Edmund II
Edred|6
Eadwig|6|Edwy
Edward the Martyr|4
Sweyn Forkbeard|4|Sweyn
Æthelwulf|6|Ethelwulf
`),

  L('kings-people', 'people', 'Name a person in the Books of Kings.', 'First and Second Kings follow Israel from Solomon to the exile: kings of Judah and Israel, prophets and their servants, queens, priests, and foreign rulers.', 'Hand-authored from 1 and 2 Kings.', `
Solomon|1
Elijah|1
Elisha|1
Ahab|1
Jezebel|1
Jeroboam|2
Rehoboam|2
Hezekiah|1
Josiah|2
Jehu|2
Athaliah|3
Joash|3
Ahaz|3
Manasseh|2
Nebuchadnezzar|2
Sennacherib|2
Isaiah|2
Naaman|2
Gehazi|3
Queen of Sheba|1|Sheba
Hiram|3
Zadok|3
Nathan|3
Adonijah|3
Abishag|4
Joab|3
Benaiah|4
Shimei|4
Naboth|2
Obadiah|4
Micaiah|4
Ben-hadad|4
Hazael|4
Jehoshaphat|3
Ahaziah|4
Jehoram|4
Omri|3
Baasha|5
Nadab|5
Elah|5
Zimri|4
Jehoiada|4
Amaziah|4
Uzziah|3|Azariah
Jotham|4
Jeroboam II|4
Menahem|5
Pekahiah|6
Pekah|5
Hoshea|4
Shalmaneser|4
Tiglath-pileser|4
Rezin|5
Rabshakeh|5
Tirhakah|6
Amon|5
Hilkiah|4
Huldah|3
Shaphan|5
Neco|4
Jehoahaz|5
Jehoiakim|4
Jehoiachin|4
Zedekiah|3
Nebuzaradan|6
Gedaliah|5
Evil-merodach|5
Mesha|5
Abijam|6
Asa|3
Abijah|5
Maacah|6
Ethbaal|6
Widow of Zarephath|2|Widow of Sarepta
Shunammite woman|3
Hadad|6
Rezon|6
Ahijah|5
Shishak|4
Mattan|6
Seraiah|6
Zephaniah the priest|6
Ahimaaz|6
Hamutal|6
Nehushta|6
Zeruiah|6
Tahpenes|6
Pharaoh's daughter|3
`),

  L('samuel-people', 'people', 'Name a person in the Books of Samuel.', 'First and Second Samuel tell of the prophet Samuel, King Saul and King David: judges and priests, soldiers and wives, enemies and friends.', 'Hand-authored from 1 and 2 Samuel.', `
David|1
Saul|1
Samuel|1
Goliath|1
Jonathan|1
Bathsheba|1
Absalom|1
Solomon|2
Nathan|2
Joab|2
Abner|3
Michal|3
Abigail|3
Nabal|4
Eli|2
Hannah|2
Elkanah|4
Peninnah|5
Phinehas|4
Hophni|4
Jesse|2
Eliab|4
Abinadab|5
Shammah|5
Ahimelech|4
Abiathar|4
Doeg|4
Abishai|4
Asahel|4
Ishbosheth|4|Ish-bosheth
Rizpah|5
Amnon|3
Tamar|3
Adonijah|4
Uriah|2|Uriah the Hittite
Ahithophel|4
Hushai|5
Shimei|4
Mephibosheth|3
Ziba|5
Barzillai|5
Amasa|5
Sheba|5
Araunah|5|Ornan
Achish|4
Agag|3
Benaiah|5
Ittai|6
Zadok|4
Jonadab|5
Hanun|5
Nahash|5
Merab|5
Joel|6
Abijah|6
Hiram|4
Toi|6
Hadadezer|6
Shobi|6
Machir|6
Obed-edom|5
Uzzah|3
Ahio|6
Ahimaaz|5
Jonathan son of Abiathar|6
Zeruiah|5
Maacah|6
Haggith|6
Abital|6
Eglah|6
Ahinoam|5
Chileab|6
Shammua|6
Shobab|6
Ibhar|6
Elishua|6
Nepheg|6
Japhia|6
Elishama|6
Eliada|6
Eliphelet|6
Medium of Endor|3|Witch of Endor
Rechab|6
Baanah|6
Paltiel|6
Ira|6
Eleazar son of Dodo|6
Josheb-basshebeth|6
Bichri|6
Ahijah|6
Chimham|6
Naharai|6
Zelek|6
`),
  L('acts-people', 'people', 'Name a person in the Acts of the Apostles.', 'Acts follows the first Christians from the upper room to Rome: apostles and deacons, converts, helpers and officials, and the rulers before whom Paul stood.', 'Hand-authored from the Acts of the Apostles.', `
Peter|1
Paul|1|Saul
John|1
James|2
Stephen|1
Philip|2
Barnabas|2
Silas|2
Timothy|2
Luke|2
Mark|3|John Mark
Matthias|2
Judas|2|Judas Iscariot
Ananias|2
Sapphira|2
Simon Magus|3|Simon the Sorcerer
Tabitha|3|Dorcas
Aeneas|4
Cornelius|2
Simon the tanner|4
Herod Agrippa|3|Herod Agrippa I
Rhoda|4
Manaen|6
Lucius of Cyrene|6|Lucius
Elymas|4|Bar-Jesus
Sergius Paulus|3
Lydia|2
Jason|5
Dionysius the Areopagite|4|Dionysius
Damaris|5
Priscilla|3
Aquila|3
Apollos|3
Crispus|5
Gallio|4
Sosthenes|6
Demetrius|4
Alexander|6
Gaius|5
Aristarchus|5
Sopater|6
Secundus|6
Tychicus|5
Trophimus|5
Eutychus|3
Agabus|4
Felix|3
Festus|3
Agrippa|3|Herod Agrippa II
Bernice|4|Berenice
Drusilla|5
Publius|4
Julius|4
Ananias the high priest|4
Tertullus|5
Claudius Lysias|4|Lysias
Gamaliel|2
Theudas|5
Judas the Galilean|5
Annas|3
Caiaphas|3
Joseph Barnabas|3
Judas Barsabbas|4|Barsabbas
Joseph called Barsabbas|6|Justus
Mnason|5
Ethiopian eunuch|2|Eunuch
Candace|4
Titius Justus|6
Thomas|4
Andrew|3
Bartholomew|4
Matthew|3
Simon the Zealot|4
Jude|4
James the son of Alphaeus|5
Mary the mother of Jesus|2|Mary
Mary the mother of John Mark|5
Nicanor|6
Prochorus|6
Parmenas|6
Timon|6
Nicolaus|5|Nicolas of Antioch
Sceva|6
Gaius of Derbe|6
Erastus|6
`),
];
