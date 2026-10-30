// Location data for the Castlevania (2017–2021) and Castlevania: Nocturne (2023–2025) atlas.
// Every claim here was checked against episode dialogue or summaries (see README › Sources).
//
// Place fields
//   id, name, alt          identifier, display name, alternative name
//   series                 'cv' (Castlevania) | 'noc' (Nocturne)
//   kind                   'city' | 'village' | 'castle' | 'region'  (chooses the marker glyph)
//   lat, lon               WGS84 position of the marker (omitted for unplaced)
//   r                      uncertainty radius in km, drawn as a dashed ring (inferred and region tiers)
//   markAt, labelAngle     'edge' puts the marker on the ring at labelAngle degrees instead of its centre
//   seasons                seasons the place appears in
//   events                 [episode code, what happens, options?]; options: { ord, sort, group } order the story mode
//   characters, summary, real, placement, check (optional distance check), sites (optional)
// tier: exact    = a real place at its real coordinates
//       inferred = position reasoned from on-screen clues (r = uncertainty radius in km)
//       region   = only a country/region is given (r = rough extent in km)
//       unplaced = fictional site with no geographic clue (drawn in the "unrevealed" vignette)
// view: 'main' (every place is on the map; far-off ones carry offmap)
// offmap: { from }  the place lies beyond the map frame. Its marker is pinned to the frame's edge in its
//         real direction from the place `from`, and its card adds the world inset showing where it is.
// journeys: route ids (data/routes.js) drawn whenever this place is selected or shown in story mode

export const places = [
  // ───────────────────────── CASTLEVANIA ─────────────────────────
  {
    id: 'targoviste', name: 'Târgoviște', alt: 'Targoviste', series: 'cv', kind: 'city', tier: 'exact',
    lat: 44.9255, lon: 25.4570, seasons: ['S1', 'S4'], view: 'main',
    summary: 'Seat of the Wallachian princes and the city where the whole story begins. Lisa Tepes is burned here as a witch in 1475, and a year later Dracula\'s army of night creatures empties it.',
    events: [
      ['S1E1', 'Lisa of Lupu is burned at the stake in the city square on the Bishop\'s order. Dracula gives Wallachia one year, then unleashes his army on Târgoviște first.', { ord: 2 }],
      ['S4E1', 'Trevor and Sypha return to "where everything began", hunting cultists who want Dracula back. Trevor recovers an enchanted dagger.'],
      ['S4E2–E8', 'Zamfir\'s Underground Court, the last organised survivors, recruit the pair. The court falls; Zamfir and the vampire Ratko both die here.'],
      ['S4E9', 'Varney\'s magic mirror, a key piece of the plot to resurrect Dracula, turns up in the city.'],
    ],
    characters: ['Lisa Tepes', 'Dracula', 'The Bishop', 'Trevor Belmont', 'Sypha Belnades', 'Zamfir', 'Ratko'],
    real: 'Târgoviște was the princely capital of Wallachia through the 15th century. The ruins of the Princely Court and the Chindia Tower still stand in the city.',
    placement: 'Real city, placed at the Princely Court.'
  },
  {
    id: 'gresit', name: 'Gresit', series: 'cv', kind: 'city', tier: 'inferred',
    lat: 45.1390, lon: 24.6790, r: 45, labelAngle: -140, markAt: 'edge', seasons: ['S1', 'S2'], view: 'main',
    summary: 'Fictional Wallachian city where Trevor Belmont is drawn back into the fight. Its catacombs hide the sleeping Alucard. The name is Romanian for "wrong" or "mistaken" (greșit).',
    events: [
      ['S1E1', 'Dracula names Gresit among the cities of Wallachia his army will take.', { group: 'roll' }],
      ['S1E2', 'Trevor drifts into a panicked Gresit, defends the Speakers from a mob and agrees to search for the Elder\'s grandchild.'],
      ['S1E3', 'In the catacombs beneath the city Trevor frees Sypha Belnades from a cyclops\' petrifying gaze.'],
      ['S1E4', 'Night creatures pour into Gresit. The Bishop dies in his church. Trevor finds and duels Alucard below the city.'],
      ['S2E1–E2', 'The town is rebuilding. Dracula\'s council believes Alucard slept here and that a Belmont was recently seen.'],
    ],
    characters: ['Trevor Belmont', 'Sypha Belnades', 'The Elder', 'The Bishop', 'Alucard'],
    real: 'No real town of this name. Greșit is an ordinary Romanian adjective, so the name works like calling a town "Wrong".',
    placement: 'Never shown on a map. In S2E2 Dracula\'s generals agree that Argeș is near their castle and Isaac adds "But Arges is close to Gresit." The ring marks that neighbourhood around Argeș (today Curtea de Argeș).'
  },
  {
    id: 'arges', name: 'Argeș', alt: 'Curtea de Argeș', series: 'cv', kind: 'city', tier: 'exact',
    lat: 45.1390, lon: 24.6790, seasons: ['S1', 'S2'], view: 'main',
    summary: 'A Wallachian city Dracula marks for destruction, and the nearest town to his castle at the start of Season 2.',
    events: [
      ['S1E1', 'First name on Dracula\'s list of Wallachian cities to purge.', { group: 'roll' }],
      ['S2E2', 'The war council notes Argeș is the closest town to the castle. A raiding party sent there is lost, and Carmilla argues the city is not worth taking.'],
    ],
    characters: ['Dracula', 'Carmilla', 'Godbrand', 'Hector', 'Isaac'],
    real: 'Argeș, now called Curtea de Argeș, was the older princely seat of Wallachia before Târgoviște. Its 14th-century princely church still stands.',
    placement: 'Real town. The show only says "Arges"; the city of that name in the period is today\'s Curtea de Argeș.'
  },
  {
    id: 'braila', name: 'Brăila', alt: 'Braila', series: 'cv', kind: 'city', tier: 'exact',
    lat: 45.2692, lon: 27.9575, seasons: ['S2', 'S3'], view: 'main',
    summary: 'The great Danube river port of Wallachia and the site of the battle that breaks Dracula\'s army.',
    events: [
      ['S2E2–E3', 'Carmilla pushes the council to attack Brăila: the biggest river port in the region, and taking it closes off one side of Wallachia.'],
      ['S2E6', 'Dracula moves his castle to the city. Hector has resurrected the Bishop to bless the river, and Carmilla\'s troops bring down the bridge while Dracula\'s army crosses, drowning it in holy water.'],
      ['S2E8', 'With Dracula dead and the castle gone, Carmilla regroups her survivors at Brăila and leaves for Styria with Hector as her prisoner.'],
      ['S3E1', 'The Styrian army is said to have camped within a day\'s ride of Brăila before the long march home.'],
    ],
    characters: ['Carmilla', 'Hector', 'The Bishop', 'Dracula', 'Godbrand'],
    real: 'Brăila was Wallachia\'s main Danube port in the 15th century, trading across the river into Ottoman-held Dobruja.',
    placement: 'Real city on the left bank of the Danube.'
  },
  {
    id: 'severin', name: 'Severin', alt: 'Drobeta-Turnu Severin', series: 'cv', kind: 'city', tier: 'exact',
    lat: 44.6316, lon: 22.6566, seasons: ['S1'], view: 'main',
    summary: 'Named in Dracula\'s roll call of cities to be purged.',
    events: [['S1E1', 'One of five cities Dracula sends his army against: "Arges, Severin, Gresit, Chilia, Enisara".', { group: 'roll' }]],
    characters: ['Dracula'],
    real: 'Turnu Severin guards the Danube below the Iron Gates. In 1476 its fortress belonged to the Hungarian Banate of Severin; the ruins of Trajan\'s Roman bridge lie beside it.',
    placement: 'Real town, today Drobeta-Turnu Severin.'
  },
  {
    id: 'chilia', name: 'Chilia', alt: 'Kiliya / Chilia Veche', series: 'cv', kind: 'city', tier: 'exact',
    lat: 45.430, lon: 29.280, seasons: ['S1'], view: 'main',
    summary: 'Danube-delta fortress named in Dracula\'s roll call of cities.',
    events: [['S1E1', 'Listed by Dracula among "the cities of Wallachia" his army will take.', { group: 'roll' }]],
    characters: ['Dracula'],
    real: 'Chilia controlled the northern mouth of the Danube. It had been Wallachian earlier in the century, but Stephen the Great of Moldavia captured it in 1465.',
    placement: 'Real place on the Chilia branch of the Danube delta (Chilia Veche in Romania faces Kiliya in Ukraine across the river).'
  },
  {
    id: 'enisala', name: 'Enisala', alt: '"Enisara" in the show', series: 'cv', kind: 'castle', tier: 'exact',
    lat: 44.884, lon: 28.832, seasons: ['S1'], view: 'main',
    summary: 'The last name in Dracula\'s roll call, given as "Enisara".',
    events: [['S1E1', 'Named by Dracula as a target alongside Argeș, Severin, Gresit and Chilia.', { group: 'roll' }]],
    characters: ['Dracula'],
    real: 'Enisala (Heracleea) is a hilltop fortress above Lake Razim in Dobruja. It had passed to the Ottomans decades before 1476.',
    placement: 'The show\'s "Enisara" matches no other place; Enisala is the closest real name and sits beside the other Danube-region targets. Treat the identification as likely, not certain.'
  },
  {
    id: 'lindenfeld', name: 'Lindenfeld', series: 'cv', kind: 'village', tier: 'inferred',
    lat: 45.383, lon: 22.150, r: 18, labelAngle: 200, seasons: ['S3'], view: 'main',
    summary: 'A remote minster town under its priory, where Trevor and Sypha spend all of Season 3 and a cult tries to open a door to Hell.',
    events: [
      ['S3E1', 'Trevor and Sypha arrive by the road and meet the Judge and Prior Sala.'],
      ['S3E2', 'Saint Germain asks what brought them to "remote Lindenfeld".'],
      ['S3E2–E8', 'They investigate the priory, its alchemical carvings and the night creature the monks claim to have burned.'],
      ['S3E9–E10', 'The monks\' ritual opens a portal from the Infinite Corridor toward Hell. Trevor and Sypha fight through the priory, Saint Germain enters the Corridor, and the pair burn the Judge\'s house.'],
    ],
    characters: ['Trevor Belmont', 'Sypha Belnades', 'Saint Germain', 'Prior Sala', 'The Judge', 'The Visitor'],
    real: 'A real Lindenfeld exists on the Semenic massif in the Banat (Caraș-Severin). It was founded in 1828 by Bohemian German settlers and has been empty since its last resident died in 1998, so the name is an anachronism in 1476.',
    placement: 'The show places nothing near it. The marker sits on the real namesake village, which the town appears to be named after; the in-show Lindenfeld is treated as Wallachian, while the real one lay in the Kingdom of Hungary at the time.'
  },
  {
    id: 'styria', name: 'Carmilla\'s Castle', alt: 'Styria, seat of the Council of Sisters', series: 'cv', kind: 'castle', tier: 'inferred',
    lat: 47.25, lon: 15.05, r: 70, labelAngle: 150, seasons: ['S2', 'S3', 'S4'], view: 'main',
    summary: 'Vampire nation ruled by the Council of Sisters: Carmilla, Lenore, Striga and Morana. Hector is held prisoner in their castle and Isaac finally storms it.',
    events: [
      ['S2E2', 'Carmilla introduces herself to Dracula\'s court as come "from far Styria".'],
      ['S3E1', 'Carmilla returns after an 800-mile, 30-day march from Brăila; Hector is locked in a cell.'],
      ['S3E2', 'Over a cartographer\'s map the sisters plan a corridor of conquered land "from here to Braila".'],
      ['S3E9', 'Lenore tricks Hector into a binding ring that makes him a slave.'],
      ['S4E6', 'The Battle of Styria: Isaac\'s night-creature army attacks; Carmilla dies in her throne room.'],
    ],
    characters: ['Carmilla', 'Lenore', 'Striga', 'Morana', 'Hector', 'Isaac'],
    real: 'Styria was a Habsburg duchy with its capital at Graz; in 1476 it reached south into today\'s Slovenia. It is also where Sheridan Le Fanu set his 1872 vampire novella "Carmilla", the source of the character.',
    placement: 'Styria itself is real (outline shows today\'s state). The castle\'s position inside it is never shown, so the marker only says "somewhere in Styria".',
    check: 'The show says the march from Brăila took 800 miles. Brăila to Graz is 611 miles in a straight line, so 800 miles on the road is realistic for an army going around the Carpathians.'
  },
  {
    id: 'castle', name: 'Dracula\'s Castle', series: 'cv', kind: 'castle', tier: 'unplaced',
    seasons: ['S1', 'S2', 'S3', 'S4'], view: 'main',
    summary: 'Dracula\'s mobile fortress. It can appear at a new location instantly, which is why it has no single home on any map.',
    events: [
      ['S1E1', '1455: Lisa walks to the castle across a field of impaled corpses and asks Dracula to teach her medicine.', { ord: 1 }],
      ['S2E1–E5', 'The war council meets inside. Its generals place the castle close to Argeș.'],
      ['S2E6', 'Dracula moves the castle to Brăila for the assault.'],
      ['S2E6', 'From the Belmont Hold, Sypha\'s spell pulls the castle away from Brăila and pins it on top of the Hold.'],
      ['S2E7', 'Alucard kills his father in his own childhood room.'],
      ['S3–S4', 'The castle never moves again. Alucard lives there alone, then shelters the Danesti refugees in and around it.', { sort: 'S3E1', ord: 9 }],
      ['S4E8–E10', 'Saint Germain and Varney try to resurrect Dracula through the Infinite Corridor; the last battle is fought in its halls.'],
    ],
    characters: ['Dracula', 'Lisa Tepes', 'Alucard', 'Carmilla', 'Hector', 'Isaac', 'Godbrand', 'Saint Germain', 'Varney'],
    real: 'Entirely fictional. The impaled corpses outside it borrow from the reputation of the historical Vlad III Dracula, prince of Wallachia.',
    placement: 'Three positions are known: near Argeș (S2 start), at Brăila (S2 battle), and finally over the Belmont Hold, whose own location is never revealed.'
  },
  {
    id: 'belmont', name: 'The Belmont Hold', alt: 'Belmont estate', series: 'cv', kind: 'castle', tier: 'unplaced',
    seasons: ['S1', 'S2', 'S3', 'S4'], view: 'main',
    summary: 'The ruined Belmont family estate and, beneath it, the sealed underground library of generations of monster hunters. It becomes the castle\'s final resting place.',
    events: [
      ['S1', 'The Church excommunicated the Belmonts and burned their house; Trevor saw it happen.', { sort: 'S1E2', ord: 0 }],
      ['S2E2–E3', 'Trevor, Sypha and Alucard ride to the ruins looking for weapons and lore. The family came from the Kingdom of France; Leon Belmont was the first to come east.'],
      ['S2E3', 'They open the warded door to the Hold, the family\'s sealed underground library and armoury.'],
      ['S2E4–E5', 'Trevor finds a magic mirror that can look into the castle, and Sypha a spell that can lock its movement, as night creatures attack.'],
      ['S3E2', 'Alucard: "Under our feet is the Belmont Hold." He trains Taka and Sumi there.'],
    ],
    characters: ['Trevor Belmont', 'Sypha Belnades', 'Alucard', 'Taka', 'Sumi', 'Leon Belmont (mentioned)'],
    real: 'Fictional. The display cabinet of monster trophies numbers its exhibits after the enemy list in the 1997 game "Symphony of the Night".',
    placement: 'Not revealed. All that is known: it is in Wallachia, in forest, and about 20 miles from Danesti.'
  },
  {
    id: 'danesti', name: 'Danesti', series: 'cv', kind: 'village', tier: 'unplaced',
    seasons: ['S4'], view: 'main',
    summary: 'A village in the woods, Alucard\'s nearest human neighbours. Its headwoman Greta leads its people into the shelter of the castle.',
    events: [
      ['S4E1', 'A horse carries a dead rider to the castle with Danesti\'s plea for help.'],
      ['S4E4', 'Alucard arrives; Greta notes he has lived "20-odd miles away" for months without visiting. Refugees come in from Lasa, a burned village about ten miles off, and from five other villages.'],
      ['S4E5', 'Under attack, Alucard, Greta and Saint Germain evacuate the village through the forest to the castle.'],
    ],
    characters: ['Alucard', 'Greta', 'Saint Germain', 'Varney'],
    real: 'The name recalls the House of Dănești, the rival branch of the Wallachian ruling family that fought Vlad III\'s Drăculești for the throne.',
    placement: 'Not revealed. Known only relative to the castle: about 20 miles away (the series wiki says south).'
  },
  {
    id: 'tunis', name: 'Tunis', series: 'cv', kind: 'city', tier: 'exact',
    lat: 36.8065, lon: 10.1815, seasons: ['S3'], view: 'main',
    summary: 'The North African port where Isaac, alone after Dracula\'s death, finds a ship.',
    events: [
      ['S3E2', 'Refused passage and threatened, Isaac massacres his attackers, then accepts the Captain\'s offer to sail him to Genoa.'],
    ],
    characters: ['Isaac', 'The Captain'],
    real: 'In the 15th century Tunis was the capital of the Hafsid sultanate and a major Mediterranean port.',
    placement: 'Real city.'
  },
  {
    id: 'desert', name: 'Isaac\'s Desert', series: 'cv', kind: 'region', tier: 'region',
    lat: 33.2, lon: 9.2, r: 230, labelAngle: 210, seasons: ['S2', 'S3'], view: 'main',
    summary: 'The distant desert where Dracula\'s mirror throws Isaac to save him from the fall of the castle.',
    events: [
      ['S2E7', 'As the end comes, Dracula sends Isaac through a mirror to a distant desert to spare him.'],
      ['S2E8', 'Isaac kills a band of raiders who mean to sell him, and starts forging a new army of night creatures from them.'],
    ],
    characters: ['Isaac'],
    real: 'The desert is never named.',
    placement: 'Unnamed. The next city Isaac reaches is Tunis, so the zone is drawn over the Tunisian Sahara. Low confidence.'
  },
  {
    id: 'genoa', name: 'Genoa', series: 'cv', kind: 'city', tier: 'exact',
    lat: 44.4056, lon: 8.9463, seasons: ['S3'], view: 'main',
    summary: 'Isaac\'s landfall in Europe on the road to Styria.',
    events: [
      ['S3E2', 'The Captain\'s crew sail Isaac from Tunis to Genoa.'],
      ['S3E4', 'Isaac is told he will not enter Genoa; violence follows at the gates.'],
      ['S3E7', 'Leaving Genoa, he meets Miranda in an abandoned one-woman village.'],
    ],
    characters: ['Isaac', 'The Captain', 'Miranda'],
    real: 'In 1476 Genoa was a maritime republic, at that moment under Milanese overlordship.',
    placement: 'Real city.'
  },
  {
    id: 'magician', name: 'The Magician\'s City', series: 'cv', kind: 'city', tier: 'inferred',
    lat: 44.76, lon: 8.86, r: 40, labelAngle: 20, seasons: ['S3', 'S4'], view: 'main',
    summary: 'A town turned prison by a sorcerer who enslaved the surrounding villages. Isaac kills him and makes it his base.',
    events: [
      ['S3E7', 'Isaac learns of a town "thirty miles up the road" ruled by a magician; Styria is still "a good two weeks\' ride" away.'],
      ['S3E9', 'Isaac kills the Magician and frees the town.'],
      ['S4E3–E5', 'His night creatures rebuild the city while he readies the march on Styria.'],
    ],
    characters: ['Isaac', 'The Magician', 'Miranda'],
    real: 'Fictional and unnamed.',
    placement: 'About 30 miles beyond a village just outside Genoa, on Isaac\'s road toward Styria. That puts it across the Apennine passes north of Genoa. Moderate confidence.',
    check: 'The show says Styria is "a good two weeks\' ride" from here. The marker is 354 miles from Graz in a straight line, about 25 miles a day for 14 days, a normal pace for a rider on medieval roads.'
  },
  {
    id: 'rhodes', name: 'Rhodes', series: 'cv', kind: 'region', tier: 'exact',
    lat: 36.25, lon: 28.05, seasons: ['S2'], view: 'main',
    summary: 'Where Hector was living quietly when Dracula found him and made him a Forgemaster.',
    events: [['S2E3', 'Hector tells Carmilla he was "living in the east of Rhodes" when Dracula, travelling, met him.']],
    characters: ['Hector', 'Dracula'],
    real: 'In 1476 Rhodes was held by the Knights Hospitaller, who beat off an Ottoman siege in 1480.',
    placement: 'Real island; marker on its eastern side, as Hector says.'
  },
  {
    id: 'london', name: 'London', alt: 'Lundenwic', series: 'cv', kind: 'city', tier: 'exact',
    lat: 51.512, lon: -0.12, seasons: ['S4'], view: 'main',
    summary: 'Home town claimed by Varney, the guise Death wears in Season 4.',
    events: [['S4E4', 'He introduces himself as "Varney of London" and is mocked with London\'s old Saxon name, Lundenwic.']],
    characters: ['Varney', 'Saint Germain'],
    real: 'Lundenwic was the Anglo-Saxon trading town around today\'s Aldwych and Covent Garden, west of the old Roman city.',
    placement: 'Real place, mentioned only. Marker on the site of Lundenwic.'
  },
  {
    id: 'whitby', name: 'Whitby', series: 'cv', kind: 'city', tier: 'exact',
    lat: 54.4858, lon: -0.6206, seasons: ['S4'], view: 'main',
    summary: 'Where Dracula and Lisa, restored to life, plan to start again.',
    events: [['S4E10', 'In the epilogue Dracula and Lisa talk of travelling to Whitby, England.']],
    characters: ['Dracula', 'Lisa Tepes'],
    real: 'A nod to Bram Stoker\'s 1897 novel "Dracula", in which the Count comes ashore in England at Whitby.',
    placement: 'Real town, mentioned only.'
  },
  {
    id: 'japan', name: 'Northern Japan', series: 'cv', kind: 'region', tier: 'region',
    lat: 39.7, lon: 140.6, r: 250, seasons: ['S3'], view: 'main', offmap: { from: 'targoviste' },
    summary: 'Where Taka and Sumi were enslaved at a vampire queen\'s court before escaping to Europe to learn to hunt.',
    events: [['S3E2–E4', 'They describe her secret fortress in northern Japan, "far from anywhere", and the other vampires who rule there.']],
    characters: ['Taka', 'Sumi'],
    real: 'In the 1470s Japan was torn by the Ōnin War (1467–1477).',
    placement: 'Only "northern Japan" is given.'
  },

  // ───────────────────────── NOCTURNE ─────────────────────────
  {
    id: 'machecoul', name: 'Machecoul', series: 'noc', kind: 'city', tier: 'exact',
    lat: 46.9936, lon: -1.8228, seasons: ['S1', 'S2'], view: 'main',
    summary: 'Maria Renard\'s home town in the Vendée, 1792. Its abbot is secretly the Forgemaster building Night Creatures for Erzsebet, and nearly all of Season 1 happens in and around it.',
    events: [
      ['S1E1', 'Maria and Richter, at a revolutionaries\' meeting in the woods, ask Abbot Emmanuel for help against the vampire nobles. Annette and Edouard arrive from Saint-Domingue looking for Richter.'],
      ['S1E2', 'Drolta comes as Erzsebet\'s envoy to win the Abbot over. Tera tells how Drolta raided her Speaker community in Russia. The group raids the Marquis\'s château; Annette recognises the slaver Vaublanc, and Edouard is killed and turned into a Night Creature.'],
      ['S1E3', 'Night Creatures attack the revolutionaries, and the one made from Edouard turns on the others to save Annette.'],
      ['S1E4', 'Through Tera\'s secret passage the group reaches the catacombs under the abbey and finds the Abbot\'s machine. Richter kills the Marquis, then flees when Olrox appears.'],
      ['S1E5', 'Annette leaves Vaublanc to burn at sunrise after learning that Erzsebet drank Sekhmet\'s blood. The Abbot tells Tera and Maria he is Maria\'s father. In a tavern Richter meets his grandfather, Juste.'],
      ['S1E6', 'At his cottage in the woods Juste tells how the vampire Lord Ruthven killed his wife and his closest friend. Drolta\'s vampires attack, and Richter\'s magic returns.'],
      ['S1E7', 'The Abbot seizes Maria for sacrifice. Olrox brings his book of infernal script: the machine cannot be destroyed, only sent back to Hell. Erzsebet blots out the sun and the vampires overrun the town.'],
      ['S1E8', 'Erzsebet takes the form of Sekhmet and beats the group. Tera gives herself in Maria\'s place and becomes Erzsebet\'s servant. As Drolta chases the survivors across a field, Alucard arrives and kills her.'],
      ['S2E1', 'With Erzsebet weakened, Alucard takes Richter and Annette to look for Sekhmet\'s body. Maria refuses to go and Mizrak stays to guard her. Erzsebet makes the Abbot raise Drolta from the dead.'],
      ['S2E2', 'The National Guard comes to retake the town; Erzsebet\'s followers drive it out and Drolta massacres the soldiers.'],
      ['S2E3', 'The Abbot turns the dead soldiers into Night Creatures. Tera teaches Maria dark magic until Juste intervenes.'],
      ['S2E4', 'At the abbey Maria summons a dragon that burns her father alive; Juste pulls her back. A shadowy figure takes the Abbot\'s remains.'],
      ['S2E5', 'Maria asks Tera to make her a vampire. Juste talks her out of it, and Tera leaves, asking him to watch over her daughter.'],
      ['S2E6', 'Juste helps Maria recover her light magic.'],
    ],
    characters: ['Richter Belmont', 'Maria Renard', 'Tera', 'Abbot Emmanuel', 'Annette', 'Edouard', 'Juste Belmont', 'Erzsebet Báthory', 'Drolta Tzuentes', 'Olrox', 'Mizrak', 'Vaublanc', 'Alucard'],
    sitesTitle: 'Sites in and around the town',
    sites: [
      ['The abbey, with the catacombs where the Abbot\'s machine makes Night Creatures', ''],
      ['The Marquis\'s château, a few hills away, where the vampire nobility gathers', ''],
      ['Tera and Maria\'s house, with Tera\'s secret way into the abbey', ''],
      ['Juste\'s cottage in the woods, burned during the eclipse', ''],
    ],
    real: 'Machecoul is a small town in the Pays de Retz, south-west of Nantes. In March 1793 the massacre of local Republicans there opened the War in the Vendée, the counter-revolution that frames the series.',
    placement: 'Real town. The show never places the abbey, the château or Tera\'s house more precisely than in or near the town; the château is a few hills away.'
  },
  {
    id: 'paris', name: 'Paris', series: 'noc', kind: 'city', tier: 'exact',
    lat: 48.8566, lon: 2.3522, seasons: ['S1', 'S2'], view: 'main',
    summary: 'Revolutionary Paris. The vampire nobility hails Erzsebet here as its messiah in 1792; in January 1793 the last piece of Sekhmet\'s power is traced to the city, and Erzsebet brings her army to take it.',
    events: [
      ['S1E6', 'Erzsebet is celebrated as the vampires\' messiah.', { ord: 2 }],
      ['S2E1', 'Sekhmet\'s missing mummy is traced to Paris, and Erzsebet resolves to conquer the city.', { ord: 3 }],
      ['S2E3', 'Alucard, Richter and Annette arrive in time to see Louis XVI guillotined; Annette senses spirits around her.', { ord: 6 }],
      ['S2E4', 'In the Louvre Palace they find Sekhmet\'s mummy, but Drolta steals it.', { ord: 3 }],
      ['S2E5', 'Alucard goes alone to the National Convention to warn of the coming attack.', { ord: 3 }],
      ['S2E7', 'Erzsebet\'s vampires and Night Creatures attack. Alucard and Robespierre lead the defence while Edouard turns Night Creatures against her. Drolta betrays Erzsebet and kills her.'],
      ['S2E8', 'Richter, with Olrox and Alucard, destroys Drolta and the eclipse ends. Maria, Juste and Alucard stay as the Revolution executes the vampires\' collaborators; Tera watches Maria from the crowd.'],
    ],
    characters: ['Alucard', 'Richter Belmont', 'Annette', 'Edouard', 'Maria Renard', 'Juste Belmont', 'Erzsebet Báthory', 'Drolta Tzuentes', 'Olrox', 'Mizrak', 'Tera', 'Robespierre'],
    sitesTitle: 'Sites in the city',
    sites: [
      ['Louvre Palace, where Sekhmet\'s mummy is hidden', '48.8606° N, 2.3376° E'],
      ['Place de la Révolution (now Place de la Concorde), where Louis XVI was guillotined on 21 January 1793', '48.8656° N, 2.3212° E'],
      ['Salle du Manège beside the Tuileries, where the National Convention sat until May 1793', '48.865° N, 2.328° E'],
    ],
    real: 'The king\'s execution dates the Paris arc to 21 January 1793. That winter the National Convention still met in the Salle du Manège, the old riding school beside the Tuileries; it moved into the palace in May 1793.',
    placement: 'Real city.'
  },
  {
    id: 'egypt', name: 'Egypt', alt: 'Tomb of Sekhmet', series: 'noc', kind: 'region', tier: 'region',
    lat: 27.2, lon: 31.0, r: 260, labelAngle: 200, seasons: ['S2'], view: 'main',
    summary: 'Home of the lion goddess Sekhmet, whose power Erzsebet carries. Drolta was her priestess here before she became a vampire, and Alucard later searched her tomb.',
    events: [
      ['S2E1', 'Three years before the series, Alucard searches Sekhmet\'s tomb and finds the sarcophagus empty. Her soul is split between her blood, her heart and her body.', { ord: 1 }],
      ['S2E2', '1199 CE: vampires massacre Sekhmet\'s priestesses. Drolta kills one, drinks its blood and becomes a vampire, vowing to bring the goddess back.', { ord: 1 }],
    ],
    characters: ['Alucard', 'Drolta Tzuentes', 'Sekhmet'],
    real: 'Sekhmet was worshipped above all at Memphis. Hundreds of her statues were set up at Thebes under Amenhotep III, many found at the Temple of Mut in Karnak.',
    placement: 'The tomb is never named, so the zone covers the Nile valley rather than one site.'
  },
  {
    id: 'cachtice', name: 'Csejte Castle', alt: 'Čachtice', series: 'noc', kind: 'castle', tier: 'inferred',
    lat: 48.7239, lon: 17.7614, r: 0, seasons: ['S2'], view: 'main',
    summary: 'Where Erzsebet Báthory was walled up for her crimes, and where Drolta found her.',
    events: [['S2E4', '1614: Drolta finds Erzsebet imprisoned for her murders and vows to make her a goddess.', { ord: 1 }]],
    characters: ['Erzsebet Báthory', 'Drolta Tzuentes'],
    real: 'The historical Countess Erzsébet Báthory was confined in Csejte Castle in the Kingdom of Hungary and died there on 21 August 1614. The ruin stands above Čachtice in today\'s Slovakia. Her servant Dorottya Szentes appears to inspire Drolta.',
    placement: 'The show only says "Hungary", 1614. The marker uses the historical place of her imprisonment, which matches the year exactly.'
  },
  {
    id: 'boston', name: 'Boston', series: 'noc', kind: 'city', tier: 'exact',
    lat: 42.3601, lon: -71.0500, seasons: ['S1'], view: 'main', offmap: { from: 'machecoul' }, journeys: ['richter1783'],
    summary: 'Prologue, 1783: Julia Belmont dies fighting Olrox at the harbour, and her son Richter is shipped to France.',
    events: [['S1E1', 'Under fireworks in 1783, the year the American War of Independence ended, Julia gets ten-year-old Richter to the harbour. Olrox kills her and spares the boy, who sails to Tera in France.', { ord: 1 }]],
    characters: ['Richter Belmont', 'Julia Belmont', 'Olrox'],
    real: 'The Treaty of Paris ended the war in 1783.',
    placement: 'Real city; the scene is set at the harbour.'
  },
  {
    id: 'saintdomingue', name: 'Saint-Domingue', alt: 'Haiti', series: 'noc', kind: 'region', tier: 'region',
    lat: 19.1, lon: -72.6, r: 120, seasons: ['S1', 'S2'], view: 'main', offmap: { from: 'machecoul' }, journeys: ['annette'],
    summary: 'Annette\'s homeland, the French slave colony where she was enslaved, found her powers and fought in the uprising. The series ends with her sailing home.',
    events: [
      ['S1E3', '1780: Annette sees the slaver Vaublanc kill her mother, and her power over earth and metal wakes. Edouard, a free-born opera singer who hides runaways, takes her to the Maroons, where the seer Cécile teaches her. After the uprising, Cécile\'s vision of the Vampire Messiah sends Annette and Edouard to France.', { ord: 1 }],
      ['S2E8', 'Richter, Annette and Edouard set sail for Saint-Domingue.', { ord: 9 }],
    ],
    characters: ['Annette', 'Edouard', 'Cécile Fatiman', 'Vaublanc', 'Richter Belmont'],
    real: 'Saint-Domingue was France\'s richest colony. The uprising of August 1791 began the Haitian Revolution; Haiti declared independence in 1804. Cécile Fatiman is drawn from a historical mambo (Vodou priestess) remembered for presiding over the Bois Caïman ceremony that preceded the uprising.',
    placement: 'Colony-level only; no specific plantation or town is named.'
  },
  {
    id: 'aztec', name: 'Olrox\'s Homeland', alt: 'Aztec Mexico', series: 'noc', kind: 'region', tier: 'region',
    lat: 19.4326, lon: -99.1332, r: 220, seasons: ['S1'], view: 'main', offmap: { from: 'machecoul' },
    summary: 'Olrox is an Aztec vampire who lived through the Spanish conquest of his people. His grudge against the Belmonts began when Julia Belmont killed the one he loved.',
    events: [['S1E6', 'Olrox tells how the conquistadors destroyed his homeland, and how Julia Belmont killed the one he loved.', { ord: 6 }]],
    characters: ['Olrox', 'Julia Belmont'],
    real: 'The Aztec capital Tenochtitlan fell to Cortés and his allies in 1521; Mexico City is built on its ruins.',
    placement: 'The show names his people, not a city. The zone is centred on the Valley of Mexico.'
  },
];

// Places the series names but never puts anywhere on the earth's surface
export const unmapped = [
  { name: 'Lupu', series: 'cv', text: 'Lisa\'s home village ("Lisa of Lupu", S1E1). Dracula later finds her cottage burned. No clue to its location is given; lup is Romanian for "wolf".' },
  { name: 'Lasa', series: 'cv', text: 'Burned village about ten miles from Danesti whose people flee there (S4E4).' },
  { name: 'The Infinite Corridor', series: 'cv', text: 'A realm of doors between worlds. Reached through the Lindenfeld priory (S3) and travelled by Saint Germain.' },
  { name: 'Hell', series: 'cv', text: 'Where Lisa\'s soul waits; glimpsed through the portal at Lindenfeld (S3E9) and reached through the Corridor in S4.' },
  { name: 'The spirit world and the Duat', series: 'noc', text: 'Annette\'s spirit crosses over, where Cécile and her mother guide her and Ogun gives her a shield. Possessed by Sekhmet, she duels Ammit in the Duat (Nocturne S2E6–E8).' },
  { name: 'Russia', series: 'noc', text: 'Tera grew up in a Speaker community there until Drolta raided it for Erzsebet; she could not save her younger sister and fled west (Nocturne S1E2). No place is named.' },
];

// Label priority when markers compete for space on the map, most important first.
// Places missing from this list keep their labels but yield to every listed one
// (see scripts/project.js, which warns when a mappable place is absent).
export const labelRank = [
  'targoviste', 'gresit', 'braila', 'styria', 'lindenfeld', 'machecoul', 'paris', 'tunis', 'genoa', 'magician',
  'desert', 'egypt', 'arges', 'severin', 'chilia', 'enisala', 'rhodes', 'whitby', 'london', 'cachtice',
  'boston', 'saintdomingue', 'aztec', 'japan',
];
