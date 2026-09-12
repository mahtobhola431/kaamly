/**
 * Seed taxonomy for rokdajob.
 *
 * This is *seed data*, not the source of truth. Categories and skills live in MongoDB and
 * are editable from the admin panel; this file is what the seeder inserts on a fresh
 * database and what the frontend falls back to before the catalog request resolves.
 */

export interface SeedSkill {
  name: string;
  slug: string;
  /** Alternate names people actually type or say. Drives fuzzy search: "wireman" -> Electrician. */
  aliases: string[];
}

export interface SeedCategory {
  name: string;
  slug: string;
  /** Lucide icon name, resolved on the client. */
  icon: string;
  description: string;
  skills: SeedSkill[];
}

export const SEED_CATEGORIES: readonly SeedCategory[] = [
  {
    name: 'Construction',
    slug: 'construction',
    icon: 'HardHat',
    description: 'Masons, helpers, carpenters and site crews for building work.',
    skills: [
      { name: 'Mason', slug: 'mason', aliases: ['mistri', 'raj mistri', 'rajmistri', 'brickwork'] },
      {
        name: 'Construction Helper',
        slug: 'construction-helper',
        aliases: ['helper', 'majdoor', 'labour', 'labourer'],
      },
      { name: 'Carpenter', slug: 'carpenter', aliases: ['badhai', 'wood work'] },
      {
        name: 'Shuttering Carpenter',
        slug: 'shuttering-carpenter',
        aliases: ['shuttering', 'formwork'],
      },
      { name: 'Bar Bender', slug: 'bar-bender', aliases: ['barbender', 'steel fixer', 'sariya'] },
      { name: 'Painter', slug: 'painter', aliases: ['putty', 'wall painter', 'rangai'] },
      { name: 'Welder', slug: 'welder', aliases: ['welding', 'arc welder', 'gas welder'] },
      { name: 'Tile Worker', slug: 'tile-worker', aliases: ['tiles', 'marble fitter', 'flooring'] },
      { name: 'Plaster Worker', slug: 'plaster-worker', aliases: ['plaster', 'pop', 'plastering'] },
      {
        name: 'Site Supervisor',
        slug: 'site-supervisor',
        aliases: ['supervisor', 'site incharge'],
      },
    ],
  },
  {
    name: 'Electrical',
    slug: 'electrical',
    icon: 'Zap',
    description: 'Electricians and wiremen for sites, factories and buildings.',
    skills: [
      { name: 'Electrician', slug: 'electrician', aliases: ['bijli', 'electric', 'electrical'] },
      { name: 'Wireman', slug: 'wireman', aliases: ['wiring', 'house wiring'] },
      {
        name: 'Electrical Technician',
        slug: 'electrical-technician',
        aliases: ['electrical tech'],
      },
      {
        name: 'Industrial Electrician',
        slug: 'industrial-electrician',
        aliases: ['panel wiring', 'ht lt'],
      },
    ],
  },
  {
    name: 'Plumbing',
    slug: 'plumbing',
    icon: 'Droplets',
    description: 'Plumbers, pipe fitters and sanitary workers.',
    skills: [
      { name: 'Plumber', slug: 'plumber', aliases: ['nal', 'plumbing'] },
      { name: 'Pipe Fitter', slug: 'pipe-fitter', aliases: ['fitter', 'pipe fitting'] },
      { name: 'Sanitary Worker', slug: 'sanitary-worker', aliases: ['sanitary', 'drainage'] },
    ],
  },
  {
    name: 'Mechanical',
    slug: 'mechanical',
    icon: 'Wrench',
    description: 'Mechanics, machine operators and maintenance technicians.',
    skills: [
      { name: 'Mechanic', slug: 'mechanic', aliases: ['mechanical', 'repair'] },
      { name: 'Machine Operator', slug: 'machine-operator', aliases: ['operator', 'cnc operator'] },
      {
        name: 'Maintenance Technician',
        slug: 'maintenance-technician',
        aliases: ['maintenance', 'technician'],
      },
    ],
  },
  {
    name: 'Warehouse',
    slug: 'warehouse',
    icon: 'PackageOpen',
    description: 'Loading, packing, picking and forklift work for warehouses.',
    skills: [
      {
        name: 'Warehouse Worker',
        slug: 'warehouse-worker',
        aliases: ['godown', 'warehouse staff'],
      },
      { name: 'Loader', slug: 'loader', aliases: ['loading unloading', 'hamal'] },
      { name: 'Packer', slug: 'packer', aliases: ['packing'] },
      { name: 'Picker', slug: 'picker', aliases: ['order picker', 'picking'] },
      {
        name: 'Forklift Operator',
        slug: 'forklift-operator',
        aliases: ['forklift', 'hydra operator'],
      },
    ],
  },
  {
    name: 'Hospitality',
    slug: 'hospitality',
    icon: 'ChefHat',
    description: 'Kitchen and service staff for canteens, hotels and messes.',
    skills: [
      { name: 'Cook', slug: 'cook', aliases: ['chef', 'bawarchi', 'rasoiya'] },
      { name: 'Kitchen Helper', slug: 'kitchen-helper', aliases: ['kitchen staff', 'utensil'] },
      { name: 'Waiter', slug: 'waiter', aliases: ['steward', 'service staff'] },
      {
        name: 'Housekeeping Staff',
        slug: 'housekeeping-staff',
        aliases: ['housekeeping', 'room boy'],
      },
    ],
  },
  {
    name: 'Appliance Services',
    slug: 'appliance-services',
    icon: 'AirVent',
    description: 'AC, refrigeration and appliance repair technicians.',
    skills: [
      {
        name: 'AC Technician',
        slug: 'ac-technician',
        aliases: ['ac repair', 'air conditioner', 'hvac'],
      },
      {
        name: 'Refrigerator Technician',
        slug: 'refrigerator-technician',
        aliases: ['fridge repair', 'refrigeration'],
      },
      {
        name: 'Washing Machine Technician',
        slug: 'washing-machine-technician',
        aliases: ['washing machine repair'],
      },
    ],
  },
  {
    name: 'Transport',
    slug: 'transport',
    icon: 'Truck',
    description: 'Drivers and delivery workers.',
    skills: [
      {
        name: 'Driver',
        slug: 'driver',
        aliases: ['car driver', 'truck driver', 'tempo driver', 'chalak'],
      },
      { name: 'Delivery Worker', slug: 'delivery-worker', aliases: ['delivery boy', 'courier'] },
    ],
  },
  {
    name: 'General & Facility',
    slug: 'general-facility',
    icon: 'Users',
    description: 'Security, cleaning and general support staff.',
    skills: [
      {
        name: 'Security Guard',
        slug: 'security-guard',
        aliases: ['guard', 'watchman', 'chowkidar'],
      },
      { name: 'Cleaner', slug: 'cleaner', aliases: ['safai', 'sweeper', 'housekeeping'] },
      { name: 'Helper', slug: 'helper', aliases: ['general helper', 'assistant'] },
      { name: 'Office Assistant', slug: 'office-assistant', aliases: ['peon', 'office boy'] },
      { name: 'Gardener', slug: 'gardener', aliases: ['mali', 'landscaping'] },
    ],
  },
];

/** Flat list of every seed skill with its category slug, for search dictionaries. */
export const SEED_SKILLS: readonly (SeedSkill & { categorySlug: string })[] =
  SEED_CATEGORIES.flatMap((category) =>
    category.skills.map((skill) => ({ ...skill, categorySlug: category.slug })),
  );

export const LANGUAGES: readonly string[] = [
  'Hindi',
  'English',
  'Marathi',
  'Gujarati',
  'Bengali',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Odia',
  'Bhojpuri',
  'Urdu',
  'Assamese',
  'Rajasthani',
];
