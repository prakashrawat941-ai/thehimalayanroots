import type { Listing, ListingKind } from "./types";
import { PHOTOS } from "./photos";

/*
 * Sample editorial content. Prices, availability and facility figures are placeholders
 * to be replaced with verified, partner-confirmed data before launch.
 */
const villages: Listing[] = [
  {
    slug: "sari", kind: "villages", image: PHOTOS["sari"].src, title: "Sari", tagline: "Gateway to Deoria Tal and the Chaukhamba sunrise",
    region: "Garhwal", location: "Ukhimath, Rudraprayag",
    description: "A terraced Garhwali village above the Mandakini valley where mornings begin with woodsmoke and a view of the Chaukhamba range. Walk the village lanes, learn how millet and rajma are grown, and trek to Deoria Tal.",
    highlights: ["Terraced fields and slate-roofed houses", "Short walk to Deoria Tal", "Village kitchens and seasonal produce"],
    price: 0, priceUnit: "free", palette: "dawn", tags: ["Culture", "Lakes", "Photography"], featured: true,
  },
  {
    slug: "pangot", kind: "villages", image: PHOTOS["pangot"].src, title: "Pangot", tagline: "Oak forests, birdsong and Kumaoni calm",
    region: "Kumaon", location: "Near Nainital",
    description: "A forest hamlet known among birders for its oak and rhododendron woods. Slow walks, home-cooked Kumaoni meals and evenings by the fire.",
    highlights: ["Birdwatching trails", "Oak and rhododendron forest", "Quiet, low-traffic lanes"],
    price: 0, priceUnit: "free", palette: "pine", tags: ["Birding", "Nature", "Slow travel"], featured: true,
  },
  {
    slug: "gangi", kind: "villages", title: "Gangi", tagline: "A high Tehri village on the old Kedartal route",
    region: "Garhwal", location: "Bhilangana valley, Tehri Garhwal",
    description: "One of the higher inhabited villages of the Bhilangana valley, with stone houses, apple orchards and a living tradition of festivals and folk music.",
    highlights: ["Folk music evenings", "Orchard walks", "Trailhead for high-altitude treks"],
    price: 0, priceUnit: "free", palette: "meadow", tags: ["Folk culture", "Treks"],
  },
  {
    slug: "munsiyari", kind: "villages", image: PHOTOS["munsiyari"].src, title: "Munsiyari", tagline: "Panchachuli peaks and Johar valley heritage",
    region: "Kumaon", location: "Pithoragarh",
    description: "A mountain town and base for the Johar valley, with a rich trading heritage and uninterrupted views of the Panchachuli massif.",
    highlights: ["Panchachuli viewpoints", "Johar heritage and handloom", "Base for Milam and Khaliya Top treks"],
    price: 0, priceUnit: "free", palette: "snow", tags: ["Peaks", "Heritage", "Handloom"], featured: true,
  },
  {
    slug: "jageshwar", kind: "villages", image: PHOTOS["jageshwar"].src, title: "Jageshwar", tagline: "Cedar groves and ancient stone temples",
    region: "Kumaon", location: "Almora",
    description: "A valley of deodar forest sheltering a cluster of centuries-old stone temples. A place for slow mornings and quiet pilgrimage.",
    highlights: ["Temple complex in a deodar forest", "Short forest walks", "Aarti at dusk"],
    price: 0, priceUnit: "free", palette: "dusk", tags: ["Heritage", "Spiritual"],
  },
  {
    slug: "mana", kind: "villages", image: PHOTOS["mana"].src, title: "Mana", tagline: "The last village before the Tibetan frontier",
    region: "Garhwal", location: "Badrinath, Chamoli",
    description: "A high-altitude Bhotiya village near Badrinath with woollen-weaving traditions and stories of the Saraswati river. Visit in the open season, and carry the permits and warm layers local authorities advise.",
    highlights: ["Bhotiya weaving and woollens", "Saraswati river and Vyas Gufa", "Dramatic high-altitude setting"],
    price: 0, priceUnit: "free", palette: "snow", tags: ["Frontier", "Weaving", "Pilgrimage"],
  },
];

const homestays: Listing[] = [
  {
    slug: "kunjapuri-stone-house", kind: "homestays", title: "Stone House at Sari", tagline: "Three rooms, one courtyard, a wood-fired kitchen",
    region: "Garhwal", location: "Sari, Rudraprayag",
    description: "A family-run stone and slate house. Wake to the sunrise on the peaks, eat Garhwali thali cooked on a chulha, and join the family in the fields.",
    highlights: ["Wood-fired Garhwali meals", "Rooftop sunrise deck", "Hosted village walk"],
    price: 2400, priceUnit: "night", palette: "dawn", tags: ["Family-run", "Meals included"], featured: true,
    homestay: { rooms: 3, maxGuests: 7, meals: "Breakfast and dinner" },
  },
  {
    slug: "oak-nest-pangot", kind: "homestays", title: "Oak Nest, Pangot", tagline: "A birder's cottage in the forest edge",
    region: "Kumaon", location: "Pangot, Nainital",
    description: "Two cosy cottages ringed by oaks, with a verandah made for binoculars and chai. Your host guides early-morning bird walks.",
    highlights: ["Guided bird walks", "Kumaoni bhatt ki churkani", "Fireplace evenings"],
    price: 3200, priceUnit: "night", palette: "pine", tags: ["Birding", "Cottage"], featured: true,
    homestay: { rooms: 2, maxGuests: 5, meals: "All meals" },
  },
  {
    slug: "panchachuli-view-home", kind: "homestays", title: "Panchachuli View Home", tagline: "Johar valley hospitality at 2,200 m",
    region: "Kumaon", location: "Munsiyari, Pithoragarh",
    description: "A hillside home with large windows facing the Panchachuli range. Learn about Johar weaving from the family loom.",
    highlights: ["Peak-facing rooms", "Handloom demo", "Trek briefings"],
    price: 2800, priceUnit: "night", palette: "snow", tags: ["Peaks", "Weaving"],
    homestay: { rooms: 4, maxGuests: 8, meals: "Breakfast and dinner" },
  },
  {
    slug: "deodar-courtyard-jageshwar", kind: "homestays", title: "Deodar Courtyard", tagline: "Sleep beside the cedar forest",
    region: "Kumaon", location: "Jageshwar, Almora",
    description: "A traditional Kumaoni house with carved wooden doors, minutes from the Jageshwar temples.",
    highlights: ["Carved wood architecture", "Temple morning walk", "Homegrown vegetables"],
    price: 2200, priceUnit: "night", palette: "dusk", tags: ["Heritage", "Quiet"],
    homestay: { rooms: 3, maxGuests: 6, meals: "All meals" },
  },
  {
    slug: "apple-orchard-gangi", kind: "homestays", title: "Orchard Home, Gangi", tagline: "Apples, folk songs and big night skies",
    region: "Garhwal", location: "Gangi, Tehri",
    description: "Stay with a farming family in the high Bhilangana valley. Evenings often end with folk songs around the hearth.",
    highlights: ["Seasonal orchard visit", "Folk music evenings", "Stargazing"],
    price: 2000, priceUnit: "night", palette: "meadow", tags: ["Farm stay", "Folk culture"],
    homestay: { rooms: 3, maxGuests: 6, meals: "All meals" },
  },
  {
    slug: "bhotiya-hearth-mana", kind: "homestays", title: "Bhotiya Hearth", tagline: "Warm woollens and butter tea near Badrinath",
    region: "Garhwal", location: "Near Mana, Chamoli",
    description: "A simple, warm home run by a Bhotiya family, open in the summer season. Hear stories of the trade route and try local woollen craft.",
    highlights: ["Seasonal stay", "Weaving visit", "Local Bhotiya dishes"],
    price: 2600, priceUnit: "night", palette: "snow", tags: ["Seasonal", "Cultural"],
    homestay: { rooms: 2, maxGuests: 4, meals: "Breakfast and dinner" },
  },
];

const experiences: Listing[] = [
  {
    slug: "garhwali-cooking-class", kind: "experiences", title: "Garhwali Kitchen Class", tagline: "Cook phaanu, jhangora kheer and kandali saag",
    region: "Garhwal", location: "Sari, Rudraprayag",
    description: "Learn mountain staples from a village host: grind spices on the sil-batta, stir a pot over the chulha and eat what you cook.",
    highlights: ["Hands-on, 3 hours", "Seasonal ingredients", "Recipe card to take home"],
    price: 1200, priceUnit: "person", palette: "dawn", tags: ["Food", "Culture"], featured: true,
  },
  {
    slug: "aipan-art-workshop", kind: "experiences", title: "Aipan Art Workshop", tagline: "Kumaoni ritual art with rice-paste and geru",
    region: "Kumaon", location: "Almora",
    description: "Paint traditional Aipan patterns with a local artist, and learn the stories behind each motif.",
    highlights: ["Materials included", "Taught by local artists", "Take your artwork home"],
    price: 900, priceUnit: "person", palette: "dusk", tags: ["Craft", "Art"],
  },
  {
    slug: "folk-music-evening", kind: "experiences", title: "Folk Music Evening", tagline: "Jagar, Choliya and Jhora under the stars",
    region: "Garhwal", location: "Gangi, Tehri",
    description: "An evening of dhol, damau and songs with village musicians. A respectful, community-led programme.",
    highlights: ["Live village musicians", "Tea and snacks", "Proceeds go to the performers"],
    price: 700, priceUnit: "person", palette: "meadow", tags: ["Music", "Community"],
  },
  {
    slug: "forest-bird-walk", kind: "experiences", title: "Dawn Bird Walk", tagline: "Himalayan monal, barbets and warblers",
    region: "Kumaon", location: "Pangot, Nainital",
    description: "A guided walk with a local naturalist. Binocular loan included. Sightings depend on season and luck.",
    highlights: ["Local naturalist guide", "Binoculars provided", "Breakfast after the walk"],
    price: 1000, priceUnit: "person", palette: "pine", tags: ["Birding", "Nature"], featured: true,
  },
  {
    slug: "wool-weaving-visit", kind: "experiences", title: "Handloom Weaving Visit", tagline: "Meet the weavers of the Johar valley",
    region: "Kumaon", location: "Munsiyari, Pithoragarh",
    description: "Visit a weaving cooperative, try the loom, and buy directly from makers.",
    highlights: ["Meet women weavers", "Try the loom", "Fair-price purchases"],
    price: 600, priceUnit: "person", palette: "snow", tags: ["Craft", "Community"],
  },
  {
    slug: "terrace-farm-day", kind: "experiences", title: "Terrace Farm Day", tagline: "Sow, harvest and eat with a mountain family",
    region: "Garhwal", location: "Sari, Rudraprayag",
    description: "Spend a day working alongside a farming family, learn about millet and heirloom grains, then share a meal.",
    highlights: ["Seasonal farm tasks", "Lunch with the family", "Learn about millets"],
    price: 800, priceUnit: "person", palette: "meadow", tags: ["Farming", "Food"],
  },
];

const trekking: Listing[] = [
  {
    slug: "deoria-tal-chandrashila", kind: "trekking", image: PHOTOS["deoria"].src, title: "Deoria Tal–Chandrashila", tagline: "A lake, a summit and 360° of peaks",
    region: "Garhwal", location: "Sari to Tungnath",
    description: "A beginner-friendly trek that starts at Sari, visits the mirror-like Deoria Tal and links up with Chopta, Tungnath and Chandrashila.",
    highlights: ["Reflections of Chaukhamba in Deoria Tal", "Rhododendron forests in spring", "Summit sunrise at Chandrashila"],
    price: 8500, priceUnit: "person", palette: "dawn", tags: ["Beginner", "Lake", "Summit"], featured: true,
    trek: { difficulty: "Easy", days: 4, maxAltitudeM: 4000, bestSeason: "Mar–Jun, Sep–Nov" },
  },
  {
    slug: "kedarkantha", kind: "trekking", image: PHOTOS["kedarkantha"].src, title: "Kedarkantha", tagline: "A classic winter summit trek",
    region: "Garhwal", location: "Sankri, Uttarkashi",
    description: "A well-loved snow trek through pine forest and meadows, ending at a summit with views of the Swargarohini range.",
    highlights: ["Snow camping", "Juda ka Talab", "Summit panorama"],
    price: 9500, priceUnit: "person", palette: "snow", tags: ["Winter", "Snow", "Camping"],
    trek: { difficulty: "Moderate", days: 6, maxAltitudeM: 3800, bestSeason: "Dec–Apr" },
  },
  {
    slug: "pindari-glacier", kind: "trekking", title: "Pindari Glacier", tagline: "Walk to the foot of a Kumaon glacier",
    region: "Kumaon", location: "Bageshwar",
    description: "A long valley walk through villages, oak forest and rhododendron to the snout of the Pindari glacier.",
    highlights: ["Village-to-village trail", "Glacier viewpoint", "Phurkia and Dwali campsites"],
    price: 14500, priceUnit: "person", palette: "pine", tags: ["Glacier", "Valley"], featured: true,
    trek: { difficulty: "Moderate", days: 7, maxAltitudeM: 3600, bestSeason: "Apr–Jun, Sep–Oct" },
  },
  {
    slug: "valley-of-flowers", kind: "trekking", image: PHOTOS["valley-of-flowers"].src, title: "Valley of Flowers", tagline: "A UNESCO World Heritage alpine meadow",
    region: "Garhwal", location: "Ghangaria, Chamoli",
    description: "A seasonal trek to a high valley bursting with wildflowers in the monsoon. Combine with Hemkund Sahib.",
    highlights: ["Monsoon wildflower bloom", "Pushpawati river valley", "Optional Hemkund Sahib"],
    price: 11000, priceUnit: "person", palette: "meadow", tags: ["Flowers", "Monsoon", "World Heritage"],
    trek: { difficulty: "Moderate", days: 6, maxAltitudeM: 4300, bestSeason: "Jul–Sep" },
  },
  {
    slug: "roopkund", kind: "trekking", title: "Roopkund", tagline: "The mystery lake at high altitude",
    region: "Garhwal", location: "Lohajung, Chamoli",
    description: "A demanding high-altitude trek via Bedni Bugyal and Ali Bugyal to a glacial lake with a famous mystery. Prior fitness training strongly recommended.",
    highlights: ["Bedni and Ali Bugyal meadows", "Trishul views", "High pass crossing"],
    price: 16500, priceUnit: "person", palette: "dusk", tags: ["High altitude", "Meadows"],
    trek: { difficulty: "Challenging", days: 8, maxAltitudeM: 4800, bestSeason: "May–Jun, Sep–Oct" },
  },
  {
    slug: "nag-tibba", kind: "trekking", title: "Nag Tibba", tagline: "A quick weekend escape near Dehradun",
    region: "Garhwal", location: "Pantwari, Tehri",
    description: "A short, scenic trek with camping, ideal for first-timers and weekend breaks.",
    highlights: ["Easy introduction to trekking", "Camp under the stars", "Views of Bandarpoonch"],
    price: 4500, priceUnit: "person", palette: "pine", tags: ["Weekend", "Beginner"],
    trek: { difficulty: "Easy", days: 2, maxAltitudeM: 3000, bestSeason: "Oct–Mar" },
  },
];

const workation: Listing[] = [
  {
    slug: "sari-work-nest", kind: "workation", title: "Sari Work Nest", tagline: "Deskside peaks, power backup and quiet",
    region: "Garhwal", location: "Sari, Rudraprayag",
    description: "A homestay with a dedicated work room and ergonomic desk. Weekly rates include meals and a guided village walk.",
    highlights: ["Dedicated desk and chair", "Backup power", "Weekly rate discounts"],
    price: 3200, priceUnit: "night", palette: "dawn", tags: ["Quiet", "Meals included"], featured: true,
    workation: { wifiMbps: 40, powerBackup: true, deskSetup: true },
    homestay: { rooms: 2, maxGuests: 4, meals: "All meals" },
  },
  {
    slug: "pangot-forest-studio", kind: "workation", title: "Pangot Forest Studio", tagline: "Write, code or design among the oaks",
    region: "Kumaon", location: "Pangot, Nainital",
    description: "A forest-edge cottage with fibre broadband and a glass-fronted work corner.",
    highlights: ["Fibre broadband", "Glass-fronted workspace", "Evening bird walks"],
    price: 3800, priceUnit: "night", palette: "pine", tags: ["Fibre", "Cottage"],
    workation: { wifiMbps: 80, powerBackup: true, deskSetup: true },
    homestay: { rooms: 1, maxGuests: 2, meals: "Breakfast and dinner" },
  },
  {
    slug: "munsiyari-peak-desk", kind: "workation", title: "Munsiyari Peak Desk", tagline: "A Panchachuli view from your laptop",
    region: "Kumaon", location: "Munsiyari, Pithoragarh",
    description: "A comfortable homestay with a peak-facing desk. Connectivity is solid on 4G with a broadband backup.",
    highlights: ["Peak-facing desk", "Broadband plus 4G backup", "Weekend trek add-ons"],
    price: 3000, priceUnit: "night", palette: "snow", tags: ["Views", "4G backup"],
    workation: { wifiMbps: 25, powerBackup: true, deskSetup: true },
    homestay: { rooms: 2, maxGuests: 3, meals: "Breakfast and dinner" },
  },
];

export const LISTINGS: Record<ListingKind, Listing[]> = { villages, homestays, experiences, trekking, workation };

export const ALL_LISTINGS: Listing[] = Object.values(LISTINGS).flat();

export function getListings(kind: ListingKind): Listing[] {
  return LISTINGS[kind];
}

export function getListing(kind: ListingKind, slug: string): Listing | undefined {
  return LISTINGS[kind].find((l) => l.slug === slug);
}

export function getFeatured(limit = 6): Listing[] {
  return ALL_LISTINGS.filter((l) => l.featured).slice(0, limit);
}

export function isBookable(kind: ListingKind): boolean {
  return kind !== "villages";
}

/** Resolve a listing for server-side price validation. */
export function findListing(kind: string, slug: string): Listing | undefined {
  if (!(kind in LISTINGS)) return undefined;
  return getListing(kind as ListingKind, slug);
}
