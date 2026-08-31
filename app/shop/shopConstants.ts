import type { Timestamp } from "firebase/firestore";

// ══════════════════════════════════════════════
//  ANIMAL SPECIES (multi-select / single-select filter)
// ══════════════════════════════════════════════
export const ANIMAL_OPTIONS = [
  {
    value: "Dog",
    label: "Dogs",
    emoji: "🐕",
    icon: "Dog",
    iconName: "Dog",
    tagline: "Canine Nutrition & Clinical Care",
    description: "Premium breed-specific kibble, supplements, dental chews, and enrichment toys.",
    popularTags: ["Puppy Food", "Dental Treats", "Dewormer", "Chew Toys", "Joint Care"],
  },
  {
    value: "Cat",
    label: "Cats",
    emoji: "🐈",
    icon: "Cat",
    iconName: "Cat",
    tagline: "Feline Vitality & Specialized Diets",
    description: "Grain-free gravies, clumping litters, hairball remedies, and feather scratchers.",
    popularTags: ["Wet Gravy", "Cat Litter", "Hairball Care", "Scratching Posts", "Catnip"],
  },
  {
    value: "Bird",
    label: "Birds",
    emoji: "🐦",
    icon: "Bird",
    iconName: "Bird",
    tagline: "Avian Seeds & Wellness",
    description: "Hand-picked seed blends, calcium cuttlebone, perches, and avian electrolytes.",
    popularTags: ["Seed Mix", "Cuttlebone", "Natural Perches", "Feather Tonic", "Toys"],
  },
  {
    value: "Fish",
    label: "Fish & Aquatics",
    emoji: "🐟",
    icon: "Fish",
    iconName: "Fish",
    tagline: "Aquatic Health & Water Care",
    description: "High-protein flakes, water conditioners, biological filter media, and treatments.",
    popularTags: ["Flake Food", "Water Conditioner", "Bio Media", "Sinking Pellets"],
  },
  {
    value: "Small Pets",
    label: "Small Pets",
    emoji: "🐹",
    icon: "Rabbit",
    iconName: "Rabbit",
    tagline: "Rabbits, Hamsters & Guinea Pigs",
    description: "First-cut timothy hay, absorbent bedding, compressed pellets, and chew logs.",
    popularTags: ["Timothy Hay", "Paper Bedding", "Nutrient Pellets", "Mineral Stones"],
  },
] as const;

export type AnimalType = (typeof ANIMAL_OPTIONS)[number]["value"];

// ══════════════════════════════════════════════
//  CURATED CATEGORIES (Bento & Filter Grid)
// ══════════════════════════════════════════════
export const CATEGORY_OPTIONS = [
  {
    value: "Food",
    icon: "Bone",
    iconName: "Bone",
    color: "bg-amber-500 text-white",
    bgGradient: "from-amber-500/15 via-orange-500/5 to-transparent",
    accentColor: "text-amber-600",
    borderColor: "border-amber-200/70",
    pillBg: "bg-amber-50 text-amber-900 border-amber-200",
    tagline: "Wholesome Kibble & Wet Diets",
    description: "Formulated for optimal digestion, coat radiance, and active life stages.",
    badgeText: "Nutrient Dense",
  },
  {
    value: "Medicine",
    icon: "Pill",
    iconName: "Pill",
    color: "bg-blue-500 text-white",
    bgGradient: "from-blue-500/15 via-sky-500/5 to-transparent",
    accentColor: "text-blue-600",
    borderColor: "border-blue-200/70",
    pillBg: "bg-blue-50 text-blue-900 border-blue-200",
    tagline: "Clinical & Rx Formulations",
    description: "Vet-verified dewormers, eye/ear drops, antiseptics, and therapeutics.",
    badgeText: "Vet Verified",
  },
  {
    value: "Toys",
    icon: "Gamepad2",
    iconName: "Gamepad2",
    color: "bg-violet-500 text-white",
    bgGradient: "from-violet-500/15 via-purple-500/5 to-transparent",
    accentColor: "text-violet-600",
    borderColor: "border-violet-200/70",
    pillBg: "bg-violet-50 text-violet-900 border-violet-200",
    tagline: "Mental Enrichment & Play",
    description: "Durable natural rubber chews, laser toys, plush squeakers, and puzzles.",
    badgeText: "Non-Toxic",
  },
  {
    value: "Grooming",
    icon: "Scissors",
    iconName: "Scissors",
    color: "bg-rose-500 text-white",
    bgGradient: "from-rose-500/15 via-pink-500/5 to-transparent",
    accentColor: "text-rose-600",
    borderColor: "border-rose-200/70",
    pillBg: "bg-rose-50 text-rose-900 border-rose-200",
    tagline: "Boutique Spa & Coat Care",
    description: "Botanical shampoos, slicker brushes, nail grinders, and paw balms.",
    badgeText: "Gentle Formula",
  },
  {
    value: "Accessories",
    icon: "Tag",
    iconName: "Tag",
    color: "bg-indigo-500 text-white",
    bgGradient: "from-indigo-500/15 via-blue-500/5 to-transparent",
    accentColor: "text-indigo-600",
    borderColor: "border-indigo-200/70",
    pillBg: "bg-indigo-50 text-indigo-900 border-indigo-200",
    tagline: "Ergonomic Walk & Travel Gear",
    description: "Padded harnesses, reflective leashes, stainless bowls, and carriers.",
    badgeText: "Durable Build",
  },
  {
    value: "Beds & Crates",
    icon: "Home",
    iconName: "Home",
    color: "bg-teal-500 text-white",
    bgGradient: "from-teal-500/15 via-emerald-500/5 to-transparent",
    accentColor: "text-teal-600",
    borderColor: "border-teal-200/70",
    pillBg: "bg-teal-50 text-teal-900 border-teal-200",
    tagline: "Orthopedic Comfort & Havens",
    description: "Memory foam sleep loungers, calming donut beds, and secure travel crates.",
    badgeText: "Orthopedic Support",
  },
  {
    value: "Treats",
    icon: "Cookie",
    iconName: "Cookie",
    color: "bg-orange-500 text-white",
    bgGradient: "from-orange-500/15 via-amber-500/5 to-transparent",
    accentColor: "text-orange-600",
    borderColor: "border-orange-200/70",
    pillBg: "bg-orange-50 text-orange-900 border-orange-200",
    tagline: "Single-Ingredient Rewards",
    description: "Freeze-dried meats, calcium sticks, training bites, and dental jerky.",
    badgeText: "100% Natural",
  },
  {
    value: "Health Supplements",
    icon: "HeartPulse",
    iconName: "HeartPulse",
    color: "bg-emerald-500 text-white",
    bgGradient: "from-emerald-500/15 via-teal-500/5 to-transparent",
    accentColor: "text-emerald-600",
    borderColor: "border-emerald-200/70",
    pillBg: "bg-emerald-50 text-emerald-900 border-emerald-200",
    tagline: "Joint, Gut & Immunity Boost",
    description: "Glucosamine syrups, Omega-3 fish oils, probiotics, and multivitamin pastes.",
    badgeText: "High Potency",
  },
] as const;

export type CategoryType = (typeof CATEGORY_OPTIONS)[number]["value"];

// Badge color lookup
export const BADGE_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((c) => [c.value, c.color])
);
export const DEFAULT_BADGE_COLOR = "bg-primary text-white";

// ══════════════════════════════════════════════
//  TRUST GUARANTEES
// ══════════════════════════════════════════════
export const TRUST_PROMISES = [
  {
    iconName: "ShieldCheck",
    title: "Vet Formulated & Tested",
    subtitle: "Clinical grade safety checks",
    accentBg: "bg-emerald-100/70 text-emerald-800",
  },
  {
    iconName: "Truck",
    title: "Cold-Chain & Express Delivery",
    subtitle: "Free on orders over ₹499",
    accentBg: "bg-secondary/15 text-secondary",
  },
  {
    iconName: "Sparkles",
    title: "100% Genuine Care",
    subtitle: "Direct authorized inventory",
    accentBg: "bg-amber-100/70 text-amber-800",
  },
  {
    iconName: "RotateCcw",
    title: "7-Day Return Guarantee",
    subtitle: "Hassle-free replacement policy",
    accentBg: "bg-primary/15 text-primary",
  },
] as const;

// ══════════════════════════════════════════════
//  PRODUCT INTERFACE (Firestore schema)
// ══════════════════════════════════════════════
export interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  category: string;
  animals: string[];
  images: string[];
  brandId: string;
  brandName: string;
  stockQty: number;
  weight: number;
  length?: number | null;
  breadth?: number | null;
  height?: number | null;
  shiprocketPickupId?: number | null;
  status: "active" | "inactive" | "deleted";
  avgRating?: number;
  reviewCount?: number;
  featured?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ══════════════════════════════════════════════
//  SORT OPTIONS
// ══════════════════════════════════════════════
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest Arrivals" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Reviewed" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
