/* ------------------------------------------------------------------
   EDIT THIS FILE to change what the site says.

   Projects: every project appears in the Index list and in the sea of
   screenshots. Only the ones marked `featured: true` become stops on
   the scroll journey (six works best).

   Screenshots live in assets/work/ (16:10, about 1600x1000). If an
   `image` is empty or missing, a generated placeholder is shown.
------------------------------------------------------------------- */
window.PORTFOLIO = {
  name: "Olayiwole Samuel",
  role: "Web developer",
  location: "Available worldwide",
  email: "kingarnold678@gmail.com",
  available: true,
  intro: "I build fast, animated websites and web apps for churches, energy companies, media platforms and startups. Scroll on and drift through a few of them.",

  socials: [
    { label: "GitHub", url: "https://github.com/Olayiwole-Samuel" }
  ],

  projects: [
    {
      title: "The Triumphant Family",
      kind: "Church website",
      year: "2026",
      stack: "TypeScript · Next.js · Vercel",
      blurb: "A home online for The Gleam of Salvation Apostolic Ministry: a place to find services, give and connect, in person or online.",
      url: "https://triumphant-family-seven.vercel.app",
      image: "assets/work/triumphant-family.jpg",
      featured: true
    },
    {
      title: "Media Manager",
      kind: "Booking platform",
      year: "2026",
      stack: "JavaScript · Vercel",
      blurb: "Media slot booking across Nigeria: discover stations, compare advertising options and book campaigns in minutes.",
      url: "https://media-mast.vercel.app",
      image: "assets/work/media-mast.jpg",
      featured: true
    },
    {
      title: "Interpetro Energy",
      kind: "Corporate website",
      year: "2026",
      stack: "TypeScript · Vercel",
      blurb: "Corporate site for an integrated energy company working across exploration, gas development and trading in Africa.",
      url: "https://interpetro.vercel.app",
      image: "assets/work/interpetro.jpg",
      featured: true
    },
    {
      title: "Discipleship Academy",
      kind: "Learning platform",
      year: "2026",
      stack: "JavaScript · Vercel",
      blurb: "A structured learning journey that takes students through knowledge, character, faith and purpose.",
      url: "https://tda-pied.vercel.app",
      image: "assets/work/tda.jpg",
      featured: true
    },
    {
      title: "Hybrid Hydrocarbons",
      kind: "Corporate website",
      year: "2026",
      stack: "TypeScript · Vercel",
      blurb: "Site for an energy and hydrocarbon services company, from oil and gas services to technical solutions and procurement.",
      url: "https://hybrid-hydrocarbons.vercel.app",
      image: "assets/work/hybrid-hydrocarbons.jpg",
      featured: true
    },
    {
      title: "Gemz Software",
      kind: "Agency website",
      year: "2026",
      stack: "JavaScript · Vercel",
      blurb: "Site for a software company that engineers scalable, secure systems for growing businesses.",
      url: "https://next-gemz.vercel.app",
      image: "assets/work/next-gemz.jpg",
      featured: true
    },
    {
      title: "EHCDT",
      kind: "Non-profit website",
      year: "2026",
      stack: "JavaScript · Vercel",
      blurb: "Site for the Ekid Host Community Development Trust, covering its members, activities and donations.",
      url: "https://ehdt.vercel.app",
      image: "assets/work/ehdt.jpg"
    },
    {
      title: "BridgeLink",
      kind: "Business website",
      year: "2026",
      stack: "JavaScript · Vercel",
      blurb: "Site for an IT solutions company: hardware sales, repairs, data recovery, cloud storage and support.",
      url: "https://bridge-link-delta.vercel.app",
      image: "assets/work/bridge-link.jpg"
    },
    {
      title: "Weekly Goals",
      kind: "Web app",
      year: "2026",
      stack: "TypeScript · Vercel",
      blurb: "A weekly goals planner with daily check-ins, streaks, food tracking and a rule-based coach.",
      url: "https://daily-opal-eight.vercel.app",
      image: "assets/work/daily.jpg"
    },
    {
      title: "Our Place",
      kind: "Web app",
      year: "2026",
      stack: "JavaScript · Vercel",
      blurb: "A private space for two, with games to play together and music alongside.",
      url: "https://our-place-tau.vercel.app",
      image: "assets/work/our-place.jpg"
    },
    {
      title: "Church CMS",
      kind: "Dashboard",
      year: "2026",
      stack: "TypeScript · Vercel",
      blurb: "Church management for attendance, engagement, departments and follow-ups.",
      url: "https://church-cms-psi.vercel.app",
      image: "assets/work/church-cms.jpg"
    },
    {
      title: "Declutter",
      kind: "Web app",
      year: "2026",
      stack: "JavaScript · Vercel",
      blurb: "One pick at a time, chosen for your learning goal.",
      url: "https://declutter-theta.vercel.app",
      image: "assets/work/declutter.jpg"
    }
  ],

  // Big statements shown while travelling between two featured projects
  // (one fewer than the number of featured projects).
  beats: [
    { title: "Design and code, same hands.", text: "What you approve is what ships. Nothing gets lost in a handover." },
    { title: "Motion with a reason.", text: "Animation that guides the eye, never one that makes you wait." },
    { title: "Fast on a bad day.", text: "Built to load quickly on a tired phone and a weak signal." },
    { title: "Made to be handed over.", text: "Clean builds your team can run without me." },
    { title: "Small details, all of them.", text: "Hover states, empty states, the 404. The parts people notice." }
  ],

  about: {
    statement: "I build websites and web apps that feel alive: fast, considered, and animated with intent, for people who care how their work shows up online.",
    heading: "Who's behind this?",
    body: "I'm Olayiwole Samuel, a web developer working across the whole build, from the first layout to the live deployment. So far that has meant church websites and management tools, corporate sites for energy companies, a media booking platform, and a handful of apps of my own.",
    stats: [
      { value: 12, suffix: "", label: "Live projects" },
      { value: 27, suffix: "", label: "Public repos" },
      { value: 6, suffix: "", label: "Industries" },
      { value: 100, suffix: "%", label: "Deployed and live" }
    ]
  },

  services: [
    { title: "Websites", text: "Corporate, church and business sites that are clear, quick and easy to update.", tags: ["Next.js", "React", "Responsive"] },
    { title: "Web apps", text: "Dashboards, booking flows and tools with sign-in, data and real users.", tags: ["TypeScript", "Databases", "Auth"] },
    { title: "Motion & interaction", text: "Scroll-driven stories, page transitions and micro-interactions with GSAP.", tags: ["GSAP", "ScrollTrigger", "WebGL"] },
    { title: "Launch & care", text: "Deployment, fixes and new sections once the site is live.", tags: ["Vercel", "Performance", "Support"] }
  ]
};
