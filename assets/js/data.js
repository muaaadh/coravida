/* ==========================================================================
   CORAVIDA — canonical content
   One place for brand facts, navigation, voyages and gallery captions.
   Classic script (no modules) so every page opens straight from file://.
   ========================================================================== */
window.CV = (function () {
  "use strict";

  var brand = {
    name: "Coravida",
    legal: "Coravida Marine Services Pvt Ltd",
    vessel: "Tiffany Blanc 14",
    tagline: "Private charters through the Maldivian atolls",
    marina: "Hulhumalé Marina",
    address: ["M. Veraa", "Malé 20026", "Republic of Maldives"],
    phone: "+960 777 1234",
    phoneHref: "tel:+9607771234",
    whatsappHref: "https://wa.me/9607771234",
    email: "hello@coravida.com",
    charters: "charters@coravida.com",
    hours: "Daily · 08:00 – 20:00 MVT",
    year: new Date().getFullYear()
  };

  var nav = [
    { label: "The Vessel",  href: "vessel.html" },
    { label: "Voyages",     href: "voyages.html" },
    { label: "Experiences", href: "experiences.html" },
    { label: "Rates",       href: "rates.html" },
    { label: "Gallery",     href: "gallery.html" },
    { label: "About",       href: "about.html" },
    { label: "Contact",     href: "contact.html" }
  ];

  /* Hero rotation on the home page — one line per atoll. */
  var atolls = [
    { key: "north-male", label: "North Malé", line: "A quieter way through the atolls",
      img: "assets/img/vessel-anchor.jpg", alt: "Tiffany Blanc 14 at anchor off Malé with crew aboard" },
    { key: "ari",        label: "Ari",        line: "Long water, and nowhere to be",
      img: "assets/img/atoll-ari.jpg", alt: "Aerial view of a boat crossing turquoise water toward a Maldivian island" },
    { key: "baa",        label: "Baa",        line: "Where the mantas gather",
      img: "assets/img/atoll-baa.jpg", alt: "A squadron of manta rays feeding beneath the surface" },
    { key: "vaavu",      label: "Vaavu",      line: "An hour of sand, then open sea",
      img: "assets/img/atoll-vaavu.jpg", alt: "Aerial view of a bare sandbank in a turquoise lagoon" }
  ];

  var voyages = [
    {
      slug: "a-day-at-sea", title: "A Day at Sea", eyebrow: "Day charter",
      duration: "8 hours", guests: "Up to 12", season: "Year round", area: "North Malé Atoll",
      from: 1450,
      img: "assets/img/sandbank-boat.jpg",
      alt: "A boat resting beside a sandbank in clear shallow water",
      blurb: "The whole vessel, a full day, and a route drawn the morning you sail.",
      intro: "Eight hours between the reefs of North Malé — snorkelling where the water is clearest, lunch at anchor, and as much or as little of a plan as you want.",
      itinerary: [
        { t: "09:00 · Hulhumalé Marina", d: "Boarding, briefing, and a slow run out past the harbour wall." },
        { t: "10:30 · First reef", d: "Snorkelling on a sheltered thila, gear and guide aboard." },
        { t: "13:00 · Lunch at anchor", d: "Maldivian table served in the cockpit while the boat swings on the tide." },
        { t: "15:30 · Sandbank", d: "An hour of dry sand and shallow water, weather permitting." },
        { t: "17:00 · Return", d: "Back alongside for the evening." }
      ],
      includes: ["Private use of the vessel", "Captain and two crew", "Fuel and harbour dues", "Snorkelling equipment", "Lunch, soft drinks and water", "Towels and sunscreen"],
      gallery: ["assets/img/reef-surface.jpg", "assets/img/sandbank.jpg", "assets/img/vessel-salon.jpg"]
    },
    {
      slug: "sandbank-sunset", title: "Sandbank & Sunset", eyebrow: "Half day",
      duration: "5 hours", guests: "Up to 12", season: "Year round", area: "South Malé Atoll",
      from: 950,
      img: "assets/img/dusk-calm.jpg",
      alt: "A small boat on calm water beneath a warm orange sky",
      blurb: "Out at four, on the sand by five, and back under the last of the light.",
      intro: "The short version of a good day. A bare sandbank while the tide is low, then a slow run home as the sky turns over.",
      itinerary: [
        { t: "16:00 · Departure", d: "Straight out to the atoll's southern rim." },
        { t: "17:00 · Sandbank", d: "Swimming, photographs, and a table set on the sand." },
        { t: "18:30 · Underway", d: "Canapés and sparkling wine on the flybridge as the sun drops." },
        { t: "21:00 · Alongside", d: "Return to Hulhumalé." }
      ],
      includes: ["Private use of the vessel", "Captain and two crew", "Sandbank set-up", "Canapés and sparkling wine", "Snorkelling equipment", "Towels"],
      gallery: ["assets/img/sandbank.jpg", "assets/img/hammock-sunset.jpg", "assets/img/table-sea.jpg"]
    },
    {
      slug: "the-manta-passage", title: "The Manta Passage", eyebrow: "Full day",
      duration: "10 hours", guests: "Up to 10", season: "June – November", area: "Baa Atoll",
      from: 1950,
      img: "assets/img/manta-single.jpg",
      alt: "A single manta ray gliding through sunlit blue water",
      blurb: "North to Baa in the season the plankton turns and the mantas follow.",
      intro: "A long crossing for one reason. When the current runs right, Hanifaru Bay fills with feeding mantas and there is nothing else like it in the ocean.",
      itinerary: [
        { t: "06:30 · Departure", d: "Early run north while the sea is flat." },
        { t: "10:00 · Baa Atoll", d: "Ranger check-in and a first snorkel on the outer reef." },
        { t: "11:30 · Hanifaru Bay", d: "In the water with the mantas, subject to ranger clearance." },
        { t: "14:00 · Lunch", d: "At anchor in a sheltered lagoon." },
        { t: "16:30 · Return", d: "South again, arriving early evening." }
      ],
      includes: ["Private use of the vessel", "Captain, guide and crew", "Marine park fees", "Snorkelling equipment", "Breakfast, lunch and refreshments", "Towels"],
      gallery: ["assets/img/atoll-baa.jpg", "assets/img/snorkeller.jpg", "assets/img/reef-colour.jpg"]
    },
    {
      slug: "reef-and-wreck", title: "Reef & Wreck", eyebrow: "Diving",
      duration: "Full day", guests: "Up to 8 divers", season: "Year round", area: "South Malé Atoll",
      from: 1700,
      img: "assets/img/divers-blue.jpg",
      alt: "Two divers silhouetted against deep blue water",
      blurb: "Two dives, one wreck, and a boat that waits where you surface.",
      intro: "Built around the divers aboard rather than a fixed schedule. Tanks, weights and a dive guide travel with you; the sites are chosen on the day for current and light.",
      itinerary: [
        { t: "08:00 · Departure", d: "Kit set up underway." },
        { t: "09:30 · First dive", d: "A channel or thila, chosen for the tide." },
        { t: "12:00 · Surface interval", d: "Lunch at anchor and a long rest." },
        { t: "14:00 · Second dive", d: "Wreck or reef, depending on conditions." },
        { t: "17:00 · Alongside", d: "Rinse down at the marina." }
      ],
      includes: ["Private use of the vessel", "Captain, dive guide and crew", "Two tanks and weights per diver", "Fuel and site fees", "Lunch and refreshments", "Rinse tanks and towels"],
      gallery: ["assets/img/diver-bubbles.jpg", "assets/img/reef-edge.jpg", "assets/img/turtle-light.jpg"]
    },
    {
      slug: "two-nights-north", title: "Two Nights North", eyebrow: "Overnight",
      duration: "2 nights", guests: "4 guests · 2 cabins", season: "Year round", area: "Northern atolls",
      from: 4200,
      img: "assets/img/night-stars.jpg",
      alt: "The Milky Way over dark, calm water",
      blurb: "Both cabins, two anchorages, and the engines off before dark.",
      intro: "The shortest way to sleep on the water. Two nights, two quiet anchorages, and mornings that begin wherever the boat happened to stop.",
      itinerary: [
        { t: "Day one", d: "Board at midday, cross north, and anchor for the night off an uninhabited island." },
        { t: "Day two", d: "Dawn snorkel, a long lunch, and a second anchorage further out." },
        { t: "Day three", d: "Breakfast underway and alongside Hulhumalé by noon." }
      ],
      includes: ["Exclusive use of both cabins", "Captain, chef and crew", "All meals and soft drinks", "Snorkelling equipment", "Fuel, dues and linen", "Airport transfers in Malé"],
      gallery: ["assets/img/cabin-berth.jpg", "assets/img/night-glow.jpg", "assets/img/island-jetty.jpg"]
    },
    {
      slug: "twelve-nights-at-anchor", title: "Twelve Nights at Anchor", eyebrow: "Signature charter",
      duration: "12 nights", guests: "4 guests · 2 cabins", season: "February – April", area: "Northern atolls",
      from: 21000,
      img: "assets/img/horizon-dusk.jpg",
      alt: "A pale horizon at dusk over open water",
      blurb: "One vessel, four guests, and the northern atolls at their calmest.",
      intro: "Our longest itinerary, run only in the northeast season when the sea flattens out. Twelve nights, no fixed route, and a crew who know which channels are worth waiting for.",
      itinerary: [
        { t: "Nights one to three", d: "North Malé — reefs, wrecks and the first long swims." },
        { t: "Nights four to seven", d: "Across to Baa and Raa: uninhabited anchorages and empty sandbanks." },
        { t: "Nights eight to ten", d: "Outer atoll passages, weather permitting." },
        { t: "Nights eleven and twelve", d: "Slow return south, ending at Hulhumalé." }
      ],
      includes: ["Exclusive use of the vessel", "Captain, chef and two crew", "All meals, soft drinks and house wine", "Snorkelling and fishing equipment", "Fuel, dues and marine park fees", "Laundry and airport transfers"],
      gallery: ["assets/img/overwater.jpg", "assets/img/turtle-light.jpg", "assets/img/palms-white.jpg"]
    }
  ];

  var experiences = [
    { title: "Diving",       img: "assets/img/diver-bubbles.jpg", alt: "A diver rising through blue water in a trail of bubbles", line: "Two tanks aboard, a guide who reads the current, and sites chosen on the day." },
    { title: "Snorkelling",  img: "assets/img/snorkeller.jpg",    alt: "A snorkeller swimming alongside a green sea turtle", line: "Shallow thilas and reef edges where the water stays clear all afternoon." },
    { title: "Sandbanks",    img: "assets/img/sandbank.jpg",      alt: "A bare sandbank surfacing in a turquoise lagoon", line: "A table, an umbrella, and an hour of dry sand that will not be there tomorrow." },
    { title: "Sunset",       img: "assets/img/dusk-calm.jpg",     alt: "Calm water under a warm evening sky", line: "Out at four, canapés on the flybridge, home under the last of the light." },
    { title: "Fishing",      img: "assets/img/fishing-rods.jpg",  alt: "Fishing rods set in holders on the stern of a boat", line: "Evening handline off the reef, or big game trolling on the outer edge." },
    { title: "Celebrations", img: "assets/img/table-sea.jpg",     alt: "A table dressed for dinner with the ocean beyond", line: "Proposals, birthdays and small weddings, set on deck or on the sand." }
  ];

  var vessel = {
    name: "Tiffany Blanc 14",
    line: "A 14-metre flybridge cruiser, refitted in 2025 and run by a crew of three.",
    specs: [
      { k: "Length overall", v: "14.2 m" },
      { k: "Guests cruising", v: "12" },
      { k: "Cabins", v: "2" },
      { k: "Crew", v: "3" }
    ],
    detail: [
      { k: "Builder", v: "Ferretti-type flybridge motor yacht" },
      { k: "Beam", v: "4.3 m" },
      { k: "Draft", v: "1.1 m" },
      { k: "Cruising speed", v: "18 knots" },
      { k: "Maximum speed", v: "26 knots" },
      { k: "Guests overnight", v: "4 in two cabins" },
      { k: "Crew", v: "Captain, chef and deckhand" },
      { k: "Built / refit", v: "2016 / 2025" },
      { k: "Flag", v: "Maldives · Malé" },
      { k: "Berth", v: "Hulhumalé Marina" }
    ],
    decks: [
      { n: "01", t: "Flybridge", d: "Upper helm, sun pads and a shaded lounge — the best seat for a crossing.", img: "assets/img/deck-flybridge.jpg", alt: "A crew member on the flybridge of Tiffany Blanc 14, under the bimini" },
      { n: "02", t: "Salon", d: "Air-conditioned, full-height glass on both sides, and a table that seats six.", img: "assets/img/vessel-salon.jpg", alt: "The air-conditioned salon of Tiffany Blanc 14 looking forward to the helm" },
      { n: "03", t: "Cockpit & platform", d: "Shaded aft deck, boarding ladder and a bathing platform at water level.", img: "assets/img/deck-cockpit.jpg", alt: "The aft cockpit of Tiffany Blanc 14, with the boarding gate open" },
      { n: "04", t: "Cabins", d: "A forward master and a twin below, both en suite, both with sea light.", img: "assets/img/cabin-berth.jpg", alt: "Warm timber companionway looking forward to a berth below deck" }
    ],
    amenities: ["Air-conditioned salon and cabins", "Two en-suite heads with showers", "Freshwater deck shower", "Snorkelling and fishing equipment", "Bluetooth audio throughout", "Shaded flybridge lounge", "Bathing platform and ladder", "Ice box and chilled storage", "Life jackets for all ages", "Radar, GPS and VHF"]
  };

  var gallery = [
    { img: "assets/img/vessel-anchor.jpg",  cat: "vessel",     cap: "Tiffany Blanc 14 · Malé anchorage" },
    { img: "assets/img/vessel-salon.jpg",   cat: "vessel",     cap: "Salon, looking forward" },
    { img: "assets/img/atoll-baa.jpg",      cat: "underwater", cap: "Mantas feeding · Baa Atoll" },
    { img: "assets/img/sandbank.jpg",       cat: "islands",    cap: "Sandbank at low water" },
    { img: "assets/img/turtle-light.jpg",   cat: "underwater", cap: "Green turtle under the surface" },
    { img: "assets/img/dusk-calm.jpg",      cat: "light",      cap: "Evening, running south" },
    { img: "assets/img/reef-surface.jpg",   cat: "underwater", cap: "Reef top, first snorkel" },
    { img: "assets/img/atoll-vaavu.jpg",    cat: "islands",    cap: "Lagoon and sandbank · Vaavu" },
    { img: "assets/img/cabin-berth.jpg",    cat: "vessel",     cap: "Below deck, mid-afternoon" },
    { img: "assets/img/manta-single.jpg",   cat: "underwater", cap: "Hanifaru Bay" },
    { img: "assets/img/island-jetty.jpg",   cat: "islands",    cap: "Jetty, northern atolls" },
    { img: "assets/img/night-stars.jpg",    cat: "light",      cap: "At anchor, no moon" },
    { img: "assets/img/deck-cockpit.jpg",   cat: "vessel",     cap: "Aft cockpit" },
    { img: "assets/img/reef-colour.jpg",    cat: "underwater", cap: "Soft coral and anthias" },
    { img: "assets/img/palms-white.jpg",    cat: "islands",    cap: "White sand, uninhabited" },
    { img: "assets/img/horizon-dusk.jpg",   cat: "light",      cap: "Last light, open water" },
    { img: "assets/img/bow-mono.jpg",       cat: "vessel",     cap: "Bow, underway" },
    { img: "assets/img/seaplane.jpg",       cat: "islands",    cap: "Arrival by air" },
    { img: "assets/img/snorkeller.jpg",     cat: "underwater", cap: "Turtle, midday" },
    { img: "assets/img/night-glow.jpg",     cat: "light",      cap: "Shoreline after dark" },
    { img: "assets/img/sandbank-boat.jpg",  cat: "islands",    cap: "Alongside the sand" },
    { img: "assets/img/hammock-sunset.jpg", cat: "light",      cap: "Golden hour ashore" },
    { img: "assets/img/dhoni-beach.jpg",    cat: "islands",    cap: "Dhonis drawn up, local island" },
    { img: "assets/img/lagoon-vert.jpg",    cat: "islands",    cap: "Reef edge from the air" },
    { img: "assets/img/sunset-boat.jpg",    cat: "light",      cap: "Anchored, last of the light" }
  ];

  var faq = [
    { q: "Where does the vessel depart from?", a: "Hulhumalé Marina, ten minutes from Velana International Airport. We can also collect from most resorts and guesthouses in North and South Malé Atoll by arrangement." },
    { q: "How many guests can you take?", a: "Twelve for a day charter, four overnight in two en-suite cabins. Twelve is the legal maximum for the vessel and we do not exceed it." },
    { q: "What is included in the rate?", a: "Private use of the vessel, captain and crew, fuel within the itinerary, harbour dues, snorkelling equipment, water and soft drinks. Meals are included where the itinerary says so." },
    { q: "What happens if the weather turns?", a: "The captain decides on the morning. If we cannot sail safely, you may move the booking to another date or take a full refund." },
    { q: "Can you cater for dietary requirements?", a: "Yes. Tell us when you enquire — halal is standard, and vegetarian, vegan and allergy-safe menus are prepared on request." },
    { q: "How do we hold a date?", a: "A fifty percent deposit confirms the booking; the balance is due seven days before departure. Bank transfer and card are both accepted." }
  ];

  return { brand: brand, nav: nav, atolls: atolls, voyages: voyages, experiences: experiences, vessel: vessel, gallery: gallery, faq: faq };
})();
