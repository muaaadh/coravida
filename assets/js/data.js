/* ==========================================================================
   CORAVIDA — content. Edit this file; the pages read from it.
   Classic script so every page opens straight from file://
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
    hours: "Daily · 08:00 – 20:00 MVT",
    year: new Date().getFullYear()
  };

  var nav = [
    { label: "The Vessel", href: "vessel.html" },
    { label: "Excursions", href: "excursions.html" },
    { label: "Gallery",    href: "gallery.html" },
    { label: "About",      href: "about.html" },
    { label: "Contact",    href: "contact.html" }
  ];

  /* The four excursions Coravida runs, as supplied by the client.
     `from` is null until they confirm rates — the pages read "On request". */
  var voyages = [
    {
      slug: "island-and-snorkelling", title: "Island & Snorkelling", kind: "Full day",
      duration: "9.5 hours", guests: "Up to 12", season: "Year round",
      area: "North Malé Atoll", departs: "08:30 · Hulhumalé", from: null,
      img: "sandbank", alt: "The Himmafushi sandbank at low water",
      line: "Fish Tank, the Himmafushi sandbank, the island itself, and home under the sunset.",
      intro: "A full day north. Snorkelling at Fish Tank while the water is clearest, a long stop on the sandbank, then time to walk Himmafushi before the run home.",
      plan: [
        { t: "08:30", h: "Hulhumalé", d: "A scenic run out from the jetty." },
        { t: "09:00", h: "Fish Tank", d: "Snorkelling over the reef, among the tropical fish the site is named for." },
        { t: "11:00", h: "Himmafushi sandbank", d: "Swim, snorkel and the turquoise lagoon. The best of the light for photographs." },
        { t: "12:30", h: "Lunch", d: "Lunch aboard, and free time." },
        { t: "13:30", h: "Himmafushi", d: "Ashore on a local island — the community, the shops and the harbour." },
        { t: "15:30", h: "Free time", d: "More swimming and snorkelling, or the deck." },
        { t: "16:30", h: "Sunset cruise", d: "Back towards Hulhumalé as the light goes." },
        { t: "18:00", h: "Hulhumalé", d: "Alongside." }
      ],
      has: ["Boat excursion", "Snorkelling at Fish Tank", "Himmafushi sandbank", "Himmafushi local island visit", "Sunset cruise", "Swimming and snorkelling time", "Photo stops"],
      shots: ["fish-tank", "sandbank-2", "aerial-marina"]
    },
    {
      slug: "reef-and-sandbank", title: "Reef & Sandbank", kind: "Half day",
      duration: "4 hours", guests: "Up to 12", season: "Year round",
      area: "North Malé Atoll", departs: "09:00 · Hulhumalé", from: null,
      img: "snorkel-reef", alt: "A snorkeller over a shallow reef in clear turquoise water",
      line: "Fish Tank, a white sandbank, and a dolphin cruise home.",
      intro: "The short version of a good day. Straight out to Fish Tank, an hour on the sand, and a cruise back with an eye out for dolphins.",
      plan: [
        { t: "09:00", h: "Hulhumalé", d: "Out from the jetty." },
        { t: "09:30", h: "Fish Tank", d: "Snorkelling with the tropical fish in clear water." },
        { t: "11:00", h: "Sandbank", d: "White sand, shallow water, and time to swim." },
        { t: "12:00", h: "Dolphin cruise", d: "A slow run back, watching for pods along the way." },
        { t: "13:00", h: "Hulhumalé", d: "Alongside." }
      ],
      has: ["Boat trip", "Fish Tank snorkelling", "Sandbank visit", "Swimming and relaxation", "Dolphin cruise back to Hulhumalé"],
      shots: ["fish-tank", "sandbank", "float-blue"]
    },
    {
      slug: "shark-point-and-gulhi", title: "Shark Point & Gulhi", kind: "Full day",
      duration: "9 hours", guests: "Up to 12", season: "Year round",
      area: "South Malé Atoll", departs: "09:00 · Hulhumalé", from: null,
      img: "reef-fish", alt: "Reef fish over coral in the South Malé Atoll",
      line: "Three snorkelling stops, a sandbank, and Gulhi before the sun goes.",
      intro: "South for the day. Reef sharks at Embudu, the coral garden off Taj, a sandbank at midday, and Gulhi in the afternoon before the run home.",
      plan: [
        { t: "09:00", h: "Hulhumalé jetty", d: "South across the atoll." },
        { t: "10:00", h: "Shark Point, Embudu", d: "Snorkelling alongside reef sharks on the village reef." },
        { t: "11:15", h: "Coral garden", d: "The reef off Taj — coral and tropical fish in shallow water." },
        { t: "12:15", h: "Sandbank", d: "White sand and a clear lagoon. Swimming and photographs." },
        { t: "13:00", h: "Gulhi", d: "Ashore on a local island." },
        { t: "13:30", h: "Lunch", d: "Lunch, and time to sit." },
        { t: "14:30", h: "Coral life", d: "One more snorkelling stop on the way back north." },
        { t: "16:30", h: "Sunset cruise", d: "Back towards Hulhumalé with the light behind." },
        { t: "18:00", h: "Hulhumalé jetty", d: "Alongside." }
      ],
      has: ["Full-day boat excursion", "Three snorkelling locations", "Shark Point snorkelling", "Coral garden snorkelling", "Sandbank visit", "Gulhi local island visit", "Lunch", "Sunset cruise"],
      shots: ["ray-sand", "snorkellers", "sandbank"]
    },
    {
      slug: "sunset-adventure", title: "Sunset Adventure", kind: "Half day",
      duration: "4.5 hours", guests: "Up to 12", season: "Year round",
      area: "South Malé Atoll", departs: "13:30 · Hulhumalé", from: null,
      img: "aerial-underway", alt: "Tiffany Blanc 14 underway on deep blue water off Malé",
      line: "Shark Point, a sandbank, and the sun going down on the way home.",
      intro: "An afternoon south. Reef sharks while the light is still high, a sandbank as it drops, and the whole run home under the sunset.",
      plan: [
        { t: "13:30", h: "Hulhumalé jetty", d: "South towards the atoll rim." },
        { t: "14:15", h: "Shark Point", d: "Snorkelling on the reef, among the sharks and everything else it holds." },
        { t: "15:30", h: "Sandbank", d: "White sand, a clear lagoon, and the best hour for photographs." },
        { t: "16:30", h: "Evening snack", d: "A light snack and refreshments aboard." },
        { t: "17:00", h: "Sunset cruise", d: "North again, slowly, with the sun going down." },
        { t: "18:00", h: "Hulhumalé jetty", d: "Alongside." }
      ],
      has: ["Boat excursion", "Shark Point snorkelling", "Sandbank visit", "Evening snack and refreshments", "Sunset cruise", "Swimming and snorkelling"],
      shots: ["ray-sand", "sandbank-2", "champagne"]
    }
  ];

  var addons = [
    { t: "Private chef aboard", d: "Three courses, cooked underway.", p: 320 },
    { t: "Photographer", d: "Half a day aboard, edited files within the week.", p: 450 },
    { t: "Floating breakfast", d: "Served in the shallows, at anchor.", p: 180 },
    { t: "Sandbank set-up", d: "Table, umbrella and mats carried across.", p: 260 },
    { t: "Diving", d: "Two tanks, weights and a guide, per diver.", p: 210 },
    { t: "Airport and resort transfers", d: "Velana or your resort, each way.", p: 120 }
  ];

  var vessel = {
    name: "Tiffany Blanc 14",
    stats: [
      { v: "14.2", u: "m", k: "Length" },
      { v: "12", u: "", k: "Guests" },
      { v: "2", u: "", k: "Cabins" },
      { v: "3", u: "", k: "Crew" }
    ],
    spec: [
      { k: "Type", v: "Flybridge motor yacht" },
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
      { n: "01", t: "Flybridge", d: "Upper helm, sun pads and a shaded lounge — the best seat for a crossing.", img: "aerial-close", alt: "The flybridge of Tiffany Blanc 14 seen from the air, guests aboard" },
      { n: "02", t: "Salon", d: "Air-conditioned, full-height glass on both sides, and a table that seats six.", img: "salon", alt: "The air-conditioned salon of Tiffany Blanc 14 looking forward to the helm" },
      { n: "03", t: "Cockpit & platform", d: "Shaded aft deck, boarding ladder and a bathing platform at water level.", img: "boarding", alt: "Guests boarding Tiffany Blanc 14 from the water at the stern" },
      { n: "04", t: "The water", d: "Mats, rings and snorkelling gear go in the moment the anchor sets.", img: "float-blue", alt: "Guests floating on rings beside the vessel in deep blue water" }
    ],
    aboard: ["Air-conditioned salon and cabins", "Two en-suite heads with showers", "Freshwater deck shower", "Snorkelling and fishing equipment", "Bluetooth audio throughout", "Shaded flybridge lounge", "Bathing platform and ladder", "Chilled storage and ice", "Life jackets for all ages", "Radar, GPS and VHF"]
  };

  var gallery = [
    { img: "vessel-guests", cat: "vessel",  cap: "Tiffany Blanc 14 · North Malé" },
    { img: "ray",           cat: "water",   cap: "Eagle ray, mid-morning" },
    { img: "sandbank",      cat: "islands", cap: "Sandbank at low water" },
    { img: "champagne",     cat: "aboard",  cap: "Poured on the gunwale" },
    { img: "aerial-anchor", cat: "vessel",  cap: "At anchor above the reef edge" },
    { img: "floats",        cat: "aboard",  cap: "Off the stern, deep water" },
    { img: "snorkellers",   cat: "water",   cap: "First reef of the day" },
    { img: "platter",       cat: "aboard",  cap: "Fruit, set before departure" },
    { img: "aerial-underway", cat: "vessel", cap: "Underway, running south" },
    { img: "sandbank-2",    cat: "islands", cap: "The long walk out" },
    { img: "ray-sand",      cat: "water",   cap: "Stingray over sand" },
    { img: "salon",         cat: "vessel",  cap: "Salon, looking forward" },
    { img: "float-blue",    cat: "aboard",  cap: "Rings, and nowhere to be" },
    { img: "aerial-marina", cat: "islands", cap: "Leaving Hulhumalé" },
    { img: "platter-macro", cat: "aboard",  cap: "Passionfruit and strawberries" },
    { img: "boarding",      cat: "vessel",  cap: "Back aboard" },
    { img: "aerial-bow",    cat: "vessel",  cap: "Bow, from directly above" },
    { img: "swim-boat",     cat: "water",   cap: "Swimming off the platform" },
    { img: "pineapple",     cat: "aboard",  cap: "Held over the water" },
    { img: "floats-2",      cat: "aboard",  cap: "Two, drifting" }
  ];

  var faq = [
    { q: "Where does the vessel depart from?", a: "Hulhumalé Marina, ten minutes from Velana International Airport. We can also collect from most resorts and guesthouses in North and South Malé Atoll by arrangement." },
    { q: "How many guests can you take?", a: "Twelve for a day charter, four overnight in two en-suite cabins. Twelve is the legal maximum for the vessel and we do not exceed it." },
    { q: "What is included in the rate?", a: "Private use of the vessel, captain and crew, fuel within the itinerary, harbour dues, snorkelling equipment, water and soft drinks. Meals are included where the itinerary says so." },
    { q: "What happens if the weather turns?", a: "The captain decides on the morning. If we cannot sail safely you may move the booking to another date or take a full refund." },
    { q: "Can you cater for dietary requirements?", a: "Yes. Tell us when you enquire — halal is standard, and vegetarian, vegan and allergy-safe menus are prepared on request." },
    { q: "How do we hold a date?", a: "A fifty percent deposit confirms the booking; the balance is due seven days before departure. Bank transfer and card are both accepted." }
  ];

  return { brand: brand, nav: nav, voyages: voyages, addons: addons, vessel: vessel, gallery: gallery, faq: faq };
})();
