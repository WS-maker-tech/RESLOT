/**
 * Centraliserad svensk microcopy för Reslot Identity v2.
 *
 * Italic-markers använder `*ord*`-syntax (Markdown-like) som parsas av <Heading>-komponenten.
 * Pi-stil-regel: italic på VERB / evocative noun, ALDRIG på CTAs/labels/numerics/priser/tider.
 * Max 1 italic-fras per viewport. Om italic inte passar naturligt → ut.
 *
 * Tonalitet: conversational, varm-svensk, thoughtful — INTE playful-parodisk.
 * Single-word-success-mönster: "*Snappat*.", "*Klart*.", "*Bokat*."
 *
 * Strings flyttas hit gradvis per skärm. Inline-strings i komponenter är fortsatt OK
 * tills den skärmen får sin design-pass.
 */

export const copy = {
  brand: {
    wordmark: "Reslot",
    tagline: "Din genväg till fullbokade restauranger",
    taglineEditorial: "Andrahandshandeln för bord du *trodde* var fullbokade",
  },

  home: {
    eyebrow: "Hitta ett bord",
    hero: "Vad är *suget* ikväll?",
    heroAlt: "*Hitta* ditt nästa favoritbord",
    locationPrompt: "Bord i",
    seeMap: "Visa på karta",
    search: "Sök restaurang eller stadsdel",
    emptyTitle: "Inget *ledigt* just nu",
    emptyBody: "Sätt en bevakning — vi hör av oss direkt när någon släpper ett bord.",
    watchCta: "Bevaka restaurang",
    loading: "*Letar* …",
  },

  restaurant: {
    eyebrow: "Tillgängligt nu",
    claimCta: "Ta det här bordet",
    claimCtaItalic: "*Ta* det här bordet",
    claimingCta: "*Snappar* …",
    detailsHeader: "Om bordet",
    notesHeader: "Bokningsdetaljer",
    cancelWindow: "Avbokningsfönster",
    submittedBy: "Lagd av",
    verifiedBadge: "Verifierad",
    soldOut: "Bordet är *taget*",
    backToHome: "Tillbaka",
  },

  reservations: {
    eyebrow: "Dina bord",
    title: "Dina *bord*",
    emptyTitle: "Inga bokningar *än*",
    emptyBody: "Lägg upp en bokning eller ta över ett bord från någon annan.",
    statusUpcoming: "Snart",
    statusConfirmed: "Bekräftad",
    statusCompleted: "Klar",
    statusCancelled: "Avbokad",
    upcoming: "Kommande",
    history: "Historik",
  },

  submit: {
    eyebrow: "Lägg upp",
    title: "*Bjud* någon på ditt bord",
    subtitle: "Tjäna credits när någon snappar din bokning.",
    stepRestaurant: "Var är bokningen?",
    stepDate: "När?",
    stepGuests: "Hur många?",
    stepDetails: "Detaljer",
    stepCancelWindow: "Avbokningsfönster",
    stepReview: "Granska & publicera",
    publishCta: "Publicera bokning",
    publishingCta: "*Skickar* …",
    successTitle: "*Skickat*.",
    successBody: "Bokningen är publicerad. Vi pingar dig när någon snappar den.",
  },

  alerts: {
    eyebrow: "Bevakningar",
    title: "*Vaktade* favoriter",
    emptyTitle: "Inget *vaktat* än",
    emptyBody: "Bevaka en restaurang så pingar vi när ett bord släpps.",
    addCta: "Lägg till bevakning",
    removeCta: "Ta bort",
  },

  profile: {
    eyebrow: "Profil",
    title: "Hej, {name}",
    titleAnonymous: "Välkommen",
    creditsLabel: "Saldo",
    statsLabel: "Aktivitet",
    accountLabel: "Konto",
    logoutCta: "Logga ut",
  },

  credits: {
    eyebrow: "Bordkredit",
    title: "*Sparade* bord",
    balance: "Saldo",
    buyCta: "Köp credits",
    earnCta: "Tjäna credits",
    historyCta: "Visa historik",
  },

  onboarding: {
    welcome: "*Välkommen* till Reslot",
    welcomeSub: "Andrahandshandeln för bord du *trodde* var fullbokade.",
    howItWorksTitle: "Så här *funkar* det",
    step1Title: "Bevaka",
    step1Body: "Välj restaurangen du drömmer om.",
    step2Title: "Snappa",
    step2Body: "När ett bord släpps är du först.",
    step3Title: "Njut",
    step3Body: "Dyk upp och beställ — bordet är ditt.",
    nextCta: "Nästa",
    startCta: "Sätt igång",
    skipCta: "Hoppa över",
  },

  bookingConfirmation: {
    successTitle: "*Snappat*.",
    successBody: "Bordet är ditt. Vi har skickat detaljerna till {phone}.",
    addToCalendar: "Lägg till i kalendern",
    seeDetails: "Visa bokningsdetaljer",
    backToHome: "Till hem",
  },

  payment: {
    eyebrow: "Betalning",
    title: "Säkerställ kortet",
    subtitle: "Vi drar inget förrän du tar över ett bord.",
    cardLabel: "Kortnummer",
    expiryLabel: "Giltigt till",
    cvcLabel: "CVC",
    saveCta: "Spara kort",
    securityNote: "Kortet hanteras säkert av Stripe.",
    successTitle: "*Klart*.",
  },

  invite: {
    eyebrow: "Bjud in",
    title: "Dela *Reslot* med en vän",
    subtitle: "Du får 50 credits när din vän gör sin första bokning.",
    codeLabel: "Din kod",
    shareCta: "Dela",
    copyCta: "Kopiera",
    copied: "Kopierad",
  },

  saved: {
    eyebrow: "Sparat",
    title: "*Sparade* restauranger",
    emptyTitle: "Inget sparat *än*",
    emptyBody: "Spara restauranger du gillar — så blir det enklare att bevaka dem.",
  },

  rewards: {
    eyebrow: "Belöningar",
    title: "Dina *fördelar*",
    earnCta: "Tjäna mer",
  },

  errors: {
    generic: "*Hicka*. Försök igen?",
    network: "Ingen *anslutning*. Kolla nätet.",
    notFound: "Hittar inte sidan",
    notFoundBody: "Sidan finns inte längre — eller har aldrig funnits.",
    backToHome: "Tillbaka till hem",
  },

  status: {
    available: "Tillgänglig",
    watching: "Bevakat",
    taken: "Taget",
    confirmed: "Bekräftad",
    soon: "Snart",
    new: "Ny",
  },

  common: {
    cancel: "Avbryt",
    confirm: "Bekräfta",
    save: "Spara",
    saving: "Sparar …",
    delete: "Ta bort",
    edit: "Redigera",
    close: "Stäng",
    next: "Nästa",
    back: "Tillbaka",
    continue: "Fortsätt",
    done: "Klar",
    showMore: "Visa mer",
    showLess: "Visa mindre",
  },
} as const;

export type Copy = typeof copy;
