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
    { label: "Voyages",    href: "voyages.html" },
    { label: "Gallery",    href: "gallery.html" },
    { label: "About",      href: "about.html" },
    { label: "Contact",    href: "contact.html" }
  ];

  var voyages = [
    {
      slug: "a-day-at-sea", title: "A Day at Sea", kind: "Day charter",
      duration: "8 hours", guests: "Up to 12", season: "Year round",
      area: "North Malé Atoll", from: 1450,
      img: "aerial-underway", alt: "Tiffany Blanc 14 underway on deep blue water off Malé",
      line: "The whole vessel, a full day, and a route drawn the morning you sail.",
      intro: "Eight hours between the reefs of North Malé. Snorkelling where the water is clearest, lunch at anchor, and as much or as little of a plan as you want.",
      plan: [
        { t: "09:00", h: "Hulhumalé Marina", d: "Boarding, briefing, and a slow run out past the harbour wall." },
        { t: "10:30", h: "First reef", d: "Snorkelling on a sheltered thila, gear and guide aboard." },
        { t: "13:00", h: "Lunch at anchor", d: "A table served in the cockpit while the boat swings on the tide." },
        { t: "15:30", h: "Sandbank", d: "An hour of dry sand and shallow water, weather permitting." },
        { t: "17:00", h: "Alongside", d: "Back at the marina for the evening." }
      ],
      has: ["Private use of the vessel", "Captain and two crew", "Fuel and harbour dues", "Snorkelling equipment", "Lunch, soft drinks and water", "Towels and sunscreen"],
      shots: ["swim-boat", "sandbank", "champagne"]
    },
    {
      slug: "sandbank-sunset", title: "Sandbank & Sunset", kind: "Half day",
      duration: "5 hours", guests: "Up to 12", season: "Year round",
      area: "South Malé Atoll", from: 950,
      img: "sandbank", alt: "A bare sandbank at low water under a bright sky",
      line: "Out at four, on the sand by five, back under the last of the light.",
      intro: "The short version of a good day. A bare sandbank while the tide is low, then a slow run home as the sky turns over.",
      plan: [
        { t: "16:00", h: "Departure", d: "Straight out to the atoll's southern rim." },
        { t: "17:00", h: "Sandbank", d: "Swimming, photographs, and a table set on the sand." },
        { t: "18:30", h: "Underway", d: "Canapés and sparkling wine on the flybridge as the sun drops." },
        { t: "21:00", h: "Alongside", d: "Return to Hulhumalé." }
      ],
      has: ["Private use of the vessel", "Captain and two crew", "Sandbank set-up", "Canapés and sparkling wine", "Snorkelling equipment", "Towels"],
      shots: ["sandbank-2", "champagne", "float-blue"]
    },
    {
      slug: "the-manta-passage", title: "The Manta Passage", kind: "Full day",
      duration: "10 hours", guests: "Up to 10", season: "June – November",
      area: "Baa Atoll", from: 1950,
      img: "ray", alt: "An eagle ray gliding through clear blue water",
      line: "North to Baa in the season the plankton turns and the rays follow.",
      intro: "A long crossing for one reason. When the current runs right the bay fills with feeding rays, and there is nothing else like it in the ocean.",
      plan: [
        { t: "06:30", h: "Departure", d: "Early run north while the sea is flat." },
        { t: "10:00", h: "Baa Atoll", d: "Ranger check-in and a first snorkel on the outer reef." },
        { t: "11:30", h: "In the water", d: "With the rays, subject to ranger clearance." },
        { t: "14:00", h: "Lunch", d: "At anchor in a sheltered lagoon." },
        { t: "16:30", h: "Return", d: "South again, arriving early evening." }
      ],
      has: ["Private use of the vessel", "Captain, guide and crew", "Marine park fees", "Snorkelling equipment", "Breakfast, lunch and refreshments", "Towels"],
      shots: ["ray-sand", "snorkellers", "swim-boat"]
    },
    {
      slug: "two-nights-north", title: "Two Nights North", kind: "Overnight",
      duration: "2 nights", guests: "4 guests · 2 cabins", season: "Year round",
      area: "Northern atolls", from: 4200,
      img: "aerial-close", alt: "Tiffany Blanc 14 from the air with guests on deck",
      line: "Both cabins, two anchorages, and the engines off before dark.",
      intro: "The shortest way to sleep on the water. Two quiet anchorages, and mornings that begin wherever the boat happened to stop.",
      plan: [
        { t: "Day one", h: "North", d: "Board at midday, cross north, and anchor for the night off an uninhabited island." },
        { t: "Day two", h: "Further out", d: "Dawn snorkel, a long lunch, and a second anchorage." },
        { t: "Day three", h: "Home", d: "Breakfast underway and alongside Hulhumalé by noon." }
      ],
      has: ["Exclusive use of both cabins", "Captain, chef and crew", "All meals and soft drinks", "Snorkelling equipment", "Fuel, dues and linen", "Airport transfers in Malé"],
      shots: ["salon", "aerial-bow", "platter"]
    },
    {
      slug: "twelve-nights-at-anchor", title: "Twelve Nights at Anchor", kind: "Signature charter",
      duration: "12 nights", guests: "4 guests · 2 cabins", season: "February – April",
      area: "Northern atolls", from: 21000,
      img: "aerial-anchor", alt: "Tiffany Blanc 14 alone at anchor above a reef edge",
      line: "One vessel, four guests, and the northern atolls at their calmest.",
      intro: "Our longest itinerary, run only in the northeast season when the sea flattens out. Twelve nights, no fixed route, and a crew who know which channels are worth waiting for.",
      plan: [
        { t: "Nights 1–3", h: "North Malé", d: "Reefs, channels and the first long swims." },
        { t: "Nights 4–7", h: "Baa and Raa", d: "Uninhabited anchorages and empty sandbanks." },
        { t: "Nights 8–10", h: "Outer atolls", d: "Outer passages, weather permitting." },
        { t: "Nights 11–12", h: "South", d: "A slow return, ending at Hulhumalé." }
      ],
      has: ["Exclusive use of the vessel", "Captain, chef and two crew", "All meals, soft drinks and house wine", "Snorkelling and fishing equipment", "Fuel, dues and marine park fees", "Laundry and airport transfers"],
      shots: ["aerial-marina", "floats", "pineapple"]
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
