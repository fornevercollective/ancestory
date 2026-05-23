/**
 * World name directory, etymology index, tribal registry, and hominin skull cross-links.
 * Seeded reference data — extend via localStorage overlays (see worldDirectoryStorage.ts).
 * Turner-style ancient names: https://archive.org/details/dictionaryofanci0000turn
 */

export type NameEntry = {
  id: string;
  name: string;
  /** ISO 639-3 or BCP-47 when known */
  lang?: string;
  langLabel: string;
  meaning: string;
  etymology: string;
  period?: string;
  region: string;
  /** Turner / similar dictionary sense keys */
  turnerRef?: string;
  tribalIds?: string[];
  spoken?: string;
  ipa?: string;
};

export type DawRollRef = {
  label: string;
  year?: string;
  agency?: string;
  note?: string;
};

export type TribalBranch = {
  id: string;
  label: string;
  status: "active" | "historical" | "merged" | "federally-recognized" | "state-recognized";
  eldersNote?: string;
  location?: string;
};

export type MigrationLeg = {
  era: string;
  from: string;
  to: string;
  note?: string;
};

export type TribalEntry = {
  id: string;
  endonym: string;
  exonyms?: string[];
  languageFamily: string;
  languageBranch?: string;
  /** ISO 639-3 primary language */
  iso639?: string;
  macroRegion: string;
  originalHomeland: string;
  earlyLocations: string[];
  migrations: MigrationLeg[];
  dawRolls: DawRollRef[];
  branches: TribalBranch[];
  elderLines?: string[];
  homininLinks?: string[];
  nameIds?: string[];
  archiveRefs?: { label: string; url: string }[];
};

export type HomininEntry = {
  id: string;
  taxon: string;
  commonName: string;
  dateRange: string;
  region: string;
  skullSet?: string;
  note: string;
  tribalIds?: string[];
};

export const TURNER_ARCHIVE = {
  label: "Dictionary of Ancient Names (Turner, 1903)",
  url: "https://archive.org/details/dictionaryofanci0000turn",
  cite: "Turner, J. R. Dictionary of Ancient Names. Philadelphia, 1903.",
};

export const NAME_ENTRIES: NameEntry[] = [
  {
    id: "n-akita",
    name: "Akita",
    lang: "oj",
    langLabel: "Ojibwe",
    meaning: "Earth, land (place sense)",
    etymology: "From *aki* 'earth, land' + locative; cognate with Cree *askiy*.",
    period: "colonial–present",
    region: "Great Lakes",
    turnerRef: "Turner — place/earth roots (cf. Algonquian *aki*)",
    tribalIds: ["ojibwe", "cree"],
    spoken: "aki",
    ipa: "/ɑːkiː/",
  },
  {
    id: "n-tallulah",
    name: "Tallulah",
    lang: "mus",
    langLabel: "Muscogee (Creek)",
    meaning: "Leaping waters",
    etymology: "Muscogee *talófa* 'water' + *lási* 'town' — 'town of leaping water'.",
    region: "Southeast US",
    turnerRef: "Turner — hydronym cluster (SE)",
    tribalIds: ["muscogee", "choctaw"],
    spoken: "talófa lási",
  },
  {
    id: "n-seattle",
    name: "Sealth / Seattle",
    lang: "lut",
    langLabel: "Lushootseed (Coast Salish)",
    meaning: "Sealth — personal name; city from chief",
    etymology: "Chief Si'ahl (c. 1780–1866); anglicized Seattle. Duwamish / Suquamish leadership name.",
    period: "19th c.",
    region: "Puget Sound",
    tribalIds: ["duwamish", "suquamish"],
  },
  {
    id: "n-manitou",
    name: "Manitou / Manido",
    lang: "alg",
    langLabel: "Algonquian",
    meaning: "Spirit, mystery, great spirit",
    etymology: "Proto-Algonquian *maneto·wa; widespread in Anishinaabe, Cree, Ojibwe ritual speech.",
    period: "ancient–present",
    region: "Northeast / Great Lakes",
    turnerRef: "Turner — spiritual theonym list",
    tribalIds: ["ojibwe", "cree", "lenape"],
    spoken: "manidoo",
    ipa: "/məˈnɪdoː/",
  },
  {
    id: "n-cheyenne",
    name: "Tsétsêhéstâhese",
    lang: "chy",
    langLabel: "Cheyenne",
    meaning: "The people (red speakers)",
    etymology: "Endonym; exonym 'Cheyenne' from French *Gens du Chiens* via Dakota *šahíyena*.",
    region: "Great Plains",
    tribalIds: ["cheyenne"],
    spoken: "Tsétsêhéstâhese",
  },
  {
    id: "n-dine",
    name: "Diné",
    lang: "nav",
    langLabel: "Navajo (Diné bizaad)",
    meaning: "The people",
    etymology: "Diné 'people' + bizaad 'language'; exonym Navajo from Tewa *Navahu* 'large field'.",
    region: "Southwest",
    tribalIds: ["navajo"],
    spoken: "Diné",
    ipa: "/tìːné/",
  },
  {
    id: "n-lakota",
    name: "Lakȟóta",
    lang: "lkt",
    langLabel: "Lakota",
    meaning: "Allies, friends",
    etymology: "From *lakȟóta* 'feeling affection, allied'; Oceti Sakowin (Seven Council Fires) division.",
    region: "Northern Plains",
    tribalIds: ["lakota", "dakota"],
    spoken: "Lakȟóta",
  },
  {
    id: "n-iroquois",
    name: "Haudenosaunee",
    lang: "moh",
    langLabel: "Mohawk / Rotinonshón:ni",
    meaning: "People of the longhouse",
    etymology: "Haudenosaunee 'they build an extended house'; exonym Iroquois from French *Iroquois* (uncertain).",
    region: "Northeast",
    turnerRef: "Turner — confederacy placenames",
    tribalIds: ["haudenosaunee", "mohawk", "seneca"],
    spoken: "Haudenosaunee",
  },
  {
    id: "n-cherokee",
    name: "Tsalagi / Aniyunwiya",
    lang: "chr",
    langLabel: "Cherokee (Tsalagi)",
    meaning: "Principal people",
    etymology: "Aniyunwiya 'principal people'; Tsalagi from Creek *Tchalaque* folk etymology.",
    region: "Southeast → Oklahoma",
    tribalIds: ["cherokee"],
  },
  {
    id: "n-inuit",
    name: "Inuit / Inuk",
    lang: "iku",
    langLabel: "Inuktitut",
    meaning: "The people (singular Inuk)",
    etymology: "Inuit plural of Inuk 'person'; replaces exonym Eskimo in Canada (preferred endonym).",
    region: "Arctic",
    tribalIds: ["inuit"],
    spoken: "Inuit",
  },
  {
    id: "n-maori",
    name: "Māori",
    lang: "mri",
    langLabel: "Te Reo Māori",
    meaning: "Normal, ordinary (self-designation)",
    etymology: "Māori 'normal' — distinguished from supernatural; Waka migration traditions from Hawaiki.",
    region: "Aotearoa",
    tribalIds: ["maori"],
  },
  {
    id: "n-sami",
    name: "Sámi",
    lang: "sme",
    langLabel: "Northern Sámi",
    meaning: "The Sámi people",
    etymology: "Endonym Sámi; exonyms Lapp (deprecated). Uralic family; coastal and interior branches.",
    region: "Sápmi (Fennoscandia)",
    tribalIds: ["sami"],
  },
  {
    id: "n-basque",
    name: "Euskaldunak",
    lang: "eus",
    langLabel: "Euskara (Basque)",
    meaning: "Basque speakers",
    etymology: "Euskara language isolate; Euskaldun 'Basque speaker'. Pre-Indo-European European survival.",
    region: "Basque Country",
    tribalIds: ["basque"],
  },
  {
    id: "n-ainu",
    name: "Ainu",
    lang: "ain",
    langLabel: "Ainu",
    meaning: "Human, person (Utari)",
    etymology: "Ainu 'human' in contrast to kamuy (spirits); Hokkaido, Sakhalin, Kurils.",
    region: "North Pacific",
    tribalIds: ["ainu"],
  },
  {
    id: "n-zulu",
    name: "amaZulu",
    lang: "zul",
    langLabel: "isiZulu",
    meaning: "People of the heavens",
    etymology: "From *zulu* 'heaven'; Nguni Bantu; Shaka-era consolidation.",
    region: "Southern Africa",
    tribalIds: ["zulu"],
  },
];

export const TRIBAL_ENTRIES: TribalEntry[] = [
  {
    id: "ojibwe",
    endonym: "Anishinaabe (Ojibwe)",
    exonyms: ["Chippewa", "Ojibwa"],
    languageFamily: "Algic",
    languageBranch: "Ojibwe–Potawatomi",
    iso639: "oj",
    macroRegion: "North America — Great Lakes",
    originalHomeland: "Atlantic coast (migration traditions) → Great Lakes",
    earlyLocations: ["Sault Ste. Marie", "Lake Superior", "Lake Huron", "Manitoulin Island"],
    migrations: [
      { era: "pre-contact", from: "St. Lawrence / Atlantic (oral history)", to: "Upper Great Lakes", note: "Seven Fires prophecy migration" },
      { era: "treaty era", from: "Great Lakes", to: "US reservations / Canadian reserves", note: "1837, 1854, 1866 treaties" },
    ],
    dawRolls: [
      { label: "Dawes Rolls (not applicable — most Ojibwe in US via allotment elsewhere)", note: "Use BIA annuity rolls, 1880-1900 Great Lakes" },
      { label: "1880-1900 US Indian Census (Great Lakes agencies)", agency: "L'Anse, Red Lake, White Earth" },
    ],
    branches: [
      { id: "oj-cr", label: "Lake Superior Chippewa", status: "federally-recognized", location: "MN, WI, MI" },
      { id: "oj-mille", label: "Mille Lacs Band", status: "federally-recognized", eldersNote: "Active Band Assembly + District I–III" },
      { id: "oj-red", label: "Red Lake Nation", status: "federally-recognized", location: "Red Lake, MN" },
      { id: "oj-sault", label: "Sault Ste. Marie Tribe", status: "federally-recognized", location: "Michigan" },
    ],
    elderLines: ["Hereditary chiefs (doodem/clan)", "Tribal council (elected)", "Mide / Midewiwin ceremonial leadership"],
    homininLinks: ["archaic-americas"],
    nameIds: ["n-akita", "n-manitou"],
    archiveRefs: [TURNER_ARCHIVE],
  },
  {
    id: "cherokee",
    endonym: "Tsalagi (Cherokee Nation)",
    exonyms: ["Cherokee"],
    languageFamily: "Iroquoian",
    languageBranch: "Southern Iroquoian",
    iso639: "chr",
    macroRegion: "North America — Southeast",
    originalHomeland: "Southern Appalachians",
    earlyLocations: ["Great Smoky Mountains", "Tennessee River", "Little Tennessee", "Etowah"],
    migrations: [
      { era: "1838–1839", from: "Southeast US", to: "Indian Territory (Oklahoma)", note: "Trail of Tears" },
      { era: "present", from: "Oklahoma", to: "Diaspora — EBCI Qualla Boundary NC", note: "Eastern Band remained" },
    ],
    dawRolls: [
      { label: "Dawes Roll (1898–1914)", year: "1898", agency: "Cherokee Nation", note: "Citizenship roll — Cherokee Freedmen debates" },
      { label: "Guion Miller Roll (1909)", year: "1909", note: "Eastern Cherokee payment roll" },
      { label: "Baker Roll (1924)", year: "1924", note: "Eastern Band membership" },
    ],
    branches: [
      { id: "ch-ok", label: "Cherokee Nation (Oklahoma)", status: "federally-recognized" },
      { id: "ch-uc", label: "United Keetoowah Band", status: "federally-recognized" },
      { id: "ch-eb", label: "Eastern Band of Cherokee Indians", status: "federally-recognized", location: "Qualla Boundary, NC" },
    ],
    elderLines: ["Keetoowah tradition", "Tribal Council", "Clan mothers (historical matriline)"],
    homininLinks: ["archaic-americas"],
    nameIds: ["n-cherokee"],
  },
  {
    id: "navajo",
    endonym: "Diné",
    exonyms: ["Navajo"],
    languageFamily: "Na-Dené",
    languageBranch: "Athabaskan (Southwestern)",
    iso639: "nav",
    macroRegion: "North America — Southwest",
    originalHomeland: "Dinetah (Four Corners)",
    earlyLocations: ["Canyon de Chelly", "Chaco periphery", "Shiprock", "Black Mesa"],
    migrations: [
      { era: "1400s–1700s", from: "Canadian Athabaskan (linguistic)", to: "Four Corners", note: "Athabaskan migration south" },
      { era: "1864", from: "Dinetah", to: "Bosque Redondo", note: "Long Walk — return 1868" },
    ],
    dawRolls: [
      { label: "Navajo Indian Census rolls", agency: "Navajo Agency" },
      { label: "Allotment records — largely not Dawes (sovereign land base)", note: "Check BIA Navajo Agency" },
    ],
    branches: [
      { id: "nv-nn", label: "Navajo Nation", status: "federally-recognized", location: "AZ, NM, UT — largest US reservation" },
      { id: "nv-ch", label: "Chapters (110+)", status: "active", eldersNote: "Chapter houses — local governance" },
    ],
    elderLines: ["Hataałii (singers)", "Chapter officials", "Navajo Nation Council"],
    homininLinks: ["archaic-americas"],
    nameIds: ["n-dine"],
  },
  {
    id: "lakota",
    endonym: "Lakȟóta / Očhéthi Šakówiŋ",
    exonyms: ["Sioux", "Teton"],
    languageFamily: "Siouan",
    languageBranch: "Dakotan",
    iso639: "lkt",
    macroRegion: "North America — Northern Plains",
    originalHomeland: "Woodlands → Plains (post-horse)",
    earlyLocations: ["Black Hills (Paha Sapa)", "Powder River", "Missouri River", "Standing Rock"],
    migrations: [
      { era: "1700s", from: "Minnesota woodlands", to: "Dakota plains", note: "Horse culture expansion" },
      { era: "1868–present", from: "Treaty lands", to: "Reservations", note: "Fort Laramie Treaty, gold rush, Wounded Knee era" },
    ],
    dawRolls: [
      { label: "Dawes-style rolls — Lakota via Sioux agencies", agency: "Pine Ridge, Rosebud, Cheyenne River, Standing Rock" },
      { label: "1885-1940 Sioux census rolls", note: "Essential for lineages" },
    ],
    branches: [
      { id: "lk-ogl", label: "Oglála Lakȟóta", status: "federally-recognized", location: "Pine Ridge, SD" },
      { id: "lk-sic", label: "Sičháŋǧu (Brulé)", status: "federally-recognized", location: "Rosebud" },
      { id: "lk-hun", label: "Húŋkpapȟa", status: "federally-recognized", location: "Standing Rock" },
      { id: "lk-min", label: "Mnikȟówožu", status: "federally-recognized", location: "Cheyenne River" },
    ],
    elderLines: ["Itáŋcaŋ (chiefs)", "Tiyóspaye kinship", "Tribal councils"],
    nameIds: ["n-lakota"],
    homininLinks: ["archaic-americas"],
  },
  {
    id: "haudenosaunee",
    endonym: "Haudenosaunee (Iroquois Confederacy)",
    exonyms: ["Iroquois", "Six Nations"],
    languageFamily: "Iroquoian",
    iso639: "moh",
    macroRegion: "North America — Northeast",
    originalHomeland: "Mohawk Valley / Finger Lakes",
    earlyLocations: ["Onondaga", "Seneca Lake", "Mohawk River", "Grand River (Canada)"],
    migrations: [
      { era: "colonial", from: "New York", to: "Six Nations Reserve (Ontario)", note: "Loyalist migration" },
      { era: "present", from: "Reserves / territories", to: "Urban diaspora", note: "Rotinonshón:ni throughout NA" },
    ],
    dawRolls: [{ label: "New York Indian rolls — not Dawes (treaty lands)", note: "Use NY state + BIA historical files" }],
    branches: [
      { id: "hd-moh", label: "Mohawk (Kanienʼkehá꞉ka)", status: "active", location: "Akwesasne, Kahnawà:ke" },
      { id: "hd-one", label: "Oneida", status: "federally-recognized" },
      { id: "hd-ond", label: "Onondaga", status: "federally-recognized" },
      { id: "hd-sen", label: "Seneca", status: "federally-recognized" },
      { id: "hd-cay", label: "Cayuga", status: "active" },
      { id: "hd-tus", label: "Tuscarora", status: "active" },
    ],
    elderLines: ["Clan mothers", "Council of chiefs", "Haudenosaunee Confederacy Grand Council"],
    nameIds: ["n-iroquois"],
    homininLinks: ["archaic-americas"],
  },
  {
    id: "inuit",
    endonym: "Inuit",
    exonyms: ["Eskimo (deprecated in Canada)"],
    languageFamily: "Eskimo–Aleut",
    iso639: "iku",
    macroRegion: "Arctic — North America",
    originalHomeland: "Thule expansion from Alaska",
    earlyLocations: ["Baffin Island", "Kitikmeot", "Kivalliq", "Nunavik", "Greenland"],
    migrations: [
      { era: "Thule ~1000 CE", from: "Alaska", to: "Arctic Canada / Greenland", note: "Whale-bow technology" },
    ],
    dawRolls: [{ label: "Canadian Inuit registrations — RCM police, HUDSON'S BAY journals", note: "Not US Dawes" }],
    branches: [
      { id: "in-nun", label: "Nunavut Inuit", status: "active" },
      { id: "in-nunavik", label: "Nunavik Inuit", status: "active" },
      { id: "in-inuv", label: "Inuvialuit", status: "active" },
    ],
    nameIds: ["n-inuit"],
    homininLinks: ["denisova-arctic"],
  },
  {
    id: "maori",
    endonym: "Māori",
    languageFamily: "Austronesian",
    languageBranch: "Eastern Polynesian",
    iso639: "mri",
    macroRegion: "Oceania — Aotearoa",
    originalHomeland: "Hawaiki (tradition) — East Polynesia",
    earlyLocations: ["North Island", "South Island", "Waikato", "Bay of Plenty"],
    migrations: [
      { era: "~1200–1300 CE", from: "East Polynesia", to: "Aotearoa", note: "Waka fleet traditions" },
    ],
    dawRolls: [],
    branches: [
      { id: "m-iwi-nz", label: "Iwi (tribes) — Ngāpuhi, Ngāti Porou, Tūhoe, Waikato-Tainui…", status: "active", eldersNote: "Kaumātua per iwi" },
    ],
    elderLines: ["Kaumātua", "Iwi rūnanga"],
    nameIds: ["n-maori"],
    homininLinks: ["homo-erectus-asia", "denisova"],
  },
  {
    id: "sami",
    endonym: "Sámi",
    exonyms: ["Lapp (offensive)"],
    languageFamily: "Uralic",
    languageBranch: "Finno-Samic",
    iso639: "sme",
    macroRegion: "Europe — Sápmi",
    originalHomeland: "Fennoscandia interior",
    earlyLocations: ["Finnmark", "Lapland", "Kola Peninsula"],
    migrations: [
      { era: "long-term", from: "Uralic homeland (debated)", to: "Sápmi", note: "Reindeer pastoralism north" },
    ],
    dawRolls: [],
    branches: [
      { id: "sa-n", label: "Northern Sámi", status: "active" },
      { id: "sa-l", label: "Lule Sámi", status: "active" },
      { id: "sa-sk", label: "Skolt Sámi", status: "active" },
    ],
    elderLines: ["Sámediggi (parliaments)", "Siida elders"],
    nameIds: ["n-sami"],
    homininLinks: ["neanderthal-europe"],
  },
  {
    id: "zulu",
    endonym: "amaZulu",
    languageFamily: "Niger–Congo",
    languageBranch: "Bantu (Nguni)",
    iso639: "zul",
    macroRegion: "Africa — Southern",
    originalHomeland: "Nguni migrations from Great Lakes region",
    earlyLocations: ["KwaZulu-Natal", "Zululand", "Drakensberg"],
    migrations: [
      { era: "Mfecane era", from: "Ntungwa heartland", to: "Natal consolidation", note: "Shaka Zulu — 1816+" },
    ],
    dawRolls: [],
    branches: [
      { id: "zu-royal", label: "Zulu royal house", status: "active", eldersNote: "Inkosi, traditional leadership" },
      { id: "zu-clans", label: "Clan lineages (izithakazelo)", status: "active" },
    ],
    nameIds: ["n-zulu"],
    homininLinks: ["homo-naledi", "archaic-africa"],
  },
  {
    id: "ainu",
    endonym: "Ainu (Utari)",
    languageFamily: "Ainu (isolate)",
    iso639: "ain",
    macroRegion: "Asia — North Pacific",
    originalHomeland: "Hokkaido, Sakhalin, Kurils",
    earlyLocations: ["Hokkaido", "Sakhalin", "Kuril Islands"],
    migrations: [{ era: "Jōmon contact", from: "Paleo-Siberian networks", to: "Hokkaido", note: "Distinct from Yamato expansion" }],
    dawRolls: [],
    branches: [
      { id: "ai-hok", label: "Hokkaido Ainu", status: "active", location: "Nibutani, Shiraoi" },
    ],
    elderLines: ["Ekashi oral tradition", "Ainu Association leadership"],
    nameIds: ["n-ainu"],
    homininLinks: ["denisova", "jomon"],
  },
];

export const HOMININ_ENTRIES: HomininEntry[] = [
  {
    id: "sahelanthropus",
    taxon: "Sahelanthropus tchadensis",
    commonName: "Toumaï",
    dateRange: "c. 7–6 Ma",
    region: "Chad",
    skullSet: "TM 266-01-060 (holotype cranium)",
    note: "Possible early hominin; bipedalism debated. Links to African tribal origin narratives (deep time).",
    tribalIds: ["zulu"],
  },
  {
    id: "archaic-africa",
    taxon: "Homo ergaster / erectus (Africa)",
    commonName: "African erectus",
    dateRange: "c. 1.9 Ma – 600 ka",
    region: "East / Southern Africa",
    skullSet: "KNM-ER 3733, KNM-WT 15000 (Turkana Boy)",
    note: "Out-of-Africa 1; connects to Bantu expansion homelands linguistically.",
    tribalIds: ["zulu"],
  },
  {
    id: "homo-naledi",
    taxon: "Homo naledi",
    commonName: "Naledi",
    dateRange: "c. 335–236 ka",
    region: "Rising Star Cave, South Africa",
    skullSet: "Dinaledi Chamber assemblage (1500+ elements)",
    note: "Small-brained hominin; contemporary with early sapiens in region.",
    tribalIds: ["zulu"],
  },
  {
    id: "neanderthal-europe",
    taxon: "Homo neanderthalensis",
    commonName: "Neanderthal",
    dateRange: "c. 400–40 ka",
    region: "Europe, West Asia",
    skullSet: "La Chapelle-aux-Saints, Amud, Tabun",
    note: "Admixture with sapiens; Sámi region later Upper Paleolithic.",
    tribalIds: ["sami", "basque"],
  },
  {
    id: "denisova",
    taxon: "Homo denisova",
    commonName: "Denisovan",
    dateRange: "c. 200–50 ka",
    region: "Siberia, Denisova Cave",
    skullSet: "Denisova 2, 3, 4, 8 (fragmentary)",
    note: "Widespread archaic admixture in Oceania, Tibet, Americas debate.",
    tribalIds: ["ainu", "maori", "inuit"],
  },
  {
    id: "denisova-arctic",
    taxon: "Denisovan / archaic (Arctic)",
    commonName: "Arctic archaic signal",
    dateRange: "Pleistocene",
    region: "Beringia",
    skullSet: "— (genomic signal)",
    note: "Inuit Thule migration crossed Beringia — deep population history.",
    tribalIds: ["inuit"],
  },
  {
    id: "homo-erectus-asia",
    taxon: "Homo erectus (Asia)",
    commonName: "Asian erectus",
    dateRange: "c. 1.8 Ma – 100 ka",
    region: "Java, China",
    skullSet: "Trinil, Zhoukoudian",
    note: "Polynesian migration paths overlap Austronesian expansion.",
    tribalIds: ["maori", "ainu"],
  },
  {
    id: "jomon",
    taxon: "Homo sapiens (Jōmon)",
    commonName: "Jōmon hunter-gatherers",
    dateRange: "c. 14,000 – 300 BCE",
    region: "Japan",
    skullSet: "Jōmon crania (distinct metrics)",
    note: "Ainu genetic/cultural continuity debated; North Pacific network.",
    tribalIds: ["ainu"],
  },
  {
    id: "archaic-americas",
    taxon: "Paleoamericans / archaic",
    commonName: "First Peoples (Americas)",
    dateRange: "c. 23+ ka – present",
    region: "Americas",
    skullSet: "Kennewick (spiritual custody), Luzia, Naia (Hoyo Negro)",
    note: "Multiple migration waves; tribal nations tie oral history to deep time.",
    tribalIds: ["ojibwe", "cherokee", "navajo", "lakota", "haudenosaunee"],
  },
];

export function tribeById(id: string): TribalEntry | undefined {
  return TRIBAL_ENTRIES.find((t) => t.id === id);
}

export function nameById(id: string): NameEntry | undefined {
  return NAME_ENTRIES.find((n) => n.id === id);
}

export function homininById(id: string): HomininEntry | undefined {
  return HOMININ_ENTRIES.find((h) => h.id === id);
}

export function namesForTribe(tribeId: string): NameEntry[] {
  return NAME_ENTRIES.filter((n) => n.tribalIds?.includes(tribeId));
}

export function tribesForHominin(homininId: string): TribalEntry[] {
  const h = homininById(homininId);
  if (!h?.tribalIds) return [];
  return h.tribalIds.map((id) => tribeById(id)).filter(Boolean) as TribalEntry[];
}
