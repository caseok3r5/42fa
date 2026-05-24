import type { Category } from "@/src/types/profile";

export const categoryTerms: Record<Exclude<Category, "unknown">, string[]> = {
  pilates: ["pilates", "reformer", "lagree", "megaformer", "mat pilates"],
  yoga: ["yoga", "yogi", "vinyasa", "asana", "hot yoga", "yin yoga", "sky ting"],
  hair: ["hair", "hairstylist", "colorist", "balayage", "cut", "salon", "extensions", "stylist"],
  aesthetician: ["esthetician", "aesthetician", "facialist", "facial", "skin", "skincare", "brows", "lashes"],
  wellness: [
    "wellness",
    "bodywork",
    "massage",
    "somatic",
    "breathwork",
    "acupuncture",
    "nutrition",
    "doula",
    "movement",
    "healer",
    "reiki"
  ]
};

export const nycTerms = [
  "nyc",
  "new york",
  "brooklyn",
  "manhattan",
  "williamsburg",
  "soho",
  "chelsea",
  "les",
  "lower east side",
  "tribeca",
  "west village",
  "east village",
  "greenpoint",
  "bushwick",
  "bed-stuy",
  "bedstuy",
  "fort greene",
  "dumbo",
  "park slope",
  "cobble hill",
  "carroll gardens",
  "noho",
  "nolita",
  "flatiron",
  "ues",
  "upper east side",
  "uws",
  "upper west side",
  "queens",
  "astoria",
  "long island city"
];

export const businessTerms = [
  "club",
  "collective",
  "studio",
  "salon",
  "spa",
  "house",
  "clinic",
  "center",
  "academy",
  "method",
  "project",
  "company",
  "official",
  "team"
];

export const practitionerTerms = [
  "teacher",
  "instructor",
  "trainer",
  "stylist",
  "colorist",
  "esthetician",
  "aesthetician",
  "facialist",
  "practitioner",
  "therapist",
  "artist",
  "founder"
];
