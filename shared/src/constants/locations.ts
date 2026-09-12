/**
 * Curated launch geography.
 *
 * Coordinates are [longitude, latitude] to match GeoJSON ordering used by MongoDB.
 * This seed covers the 15 launch cities and their high-demand localities. The
 * `locations` collection is import-shaped, so a full India pincode dataset can be loaded
 * later without touching application code (see docs/06-RISKS.md R2).
 */

export interface SeedLocality {
  name: string;
  slug: string;
  pincodes: string[];
  /** [lng, lat] */
  coordinates: [number, number];
}

export interface SeedCity {
  name: string;
  slug: string;
  district: string;
  districtSlug: string;
  state: string;
  stateSlug: string;
  /** [lng, lat] */
  coordinates: [number, number];
  localities: SeedLocality[];
}

export const SEED_CITIES: readonly SeedCity[] = [
  {
    name: 'Mumbai',
    slug: 'mumbai',
    district: 'Mumbai Suburban',
    districtSlug: 'mumbai-suburban',
    state: 'Maharashtra',
    stateSlug: 'maharashtra',
    coordinates: [72.8777, 19.076],
    localities: [
      {
        name: 'Andheri East',
        slug: 'andheri-east',
        pincodes: ['400069', '400093', '400099'],
        coordinates: [72.8697, 19.1136],
      },
      {
        name: 'Andheri West',
        slug: 'andheri-west',
        pincodes: ['400053', '400058'],
        coordinates: [72.8296, 19.1364],
      },
      {
        name: 'Goregaon',
        slug: 'goregaon',
        pincodes: ['400063', '400062'],
        coordinates: [72.8496, 19.1663],
      },
      {
        name: 'Kurla',
        slug: 'kurla',
        pincodes: ['400070', '400024'],
        coordinates: [72.8792, 19.0726],
      },
      {
        name: 'Borivali',
        slug: 'borivali',
        pincodes: ['400066', '400091'],
        coordinates: [72.8567, 19.2307],
      },
      {
        name: 'Dadar',
        slug: 'dadar',
        pincodes: ['400014', '400028'],
        coordinates: [72.8426, 19.0176],
      },
      {
        name: 'Bandra',
        slug: 'bandra',
        pincodes: ['400050', '400051'],
        coordinates: [72.8296, 19.0596],
      },
      {
        name: 'Chembur',
        slug: 'chembur',
        pincodes: ['400071', '400074'],
        coordinates: [72.8998, 19.0522],
      },
    ],
  },
  {
    name: 'Thane',
    slug: 'thane',
    district: 'Thane',
    districtSlug: 'thane',
    state: 'Maharashtra',
    stateSlug: 'maharashtra',
    coordinates: [72.9781, 19.2183],
    localities: [
      {
        name: 'Wagle Estate',
        slug: 'wagle-estate',
        pincodes: ['400604'],
        coordinates: [72.9633, 19.1972],
      },
      {
        name: 'Ghodbunder Road',
        slug: 'ghodbunder-road',
        pincodes: ['400615', '400607'],
        coordinates: [72.9633, 19.2646],
      },
      { name: 'Kalwa', slug: 'kalwa', pincodes: ['400605'], coordinates: [73.0, 19.1928] },
      { name: 'Mumbra', slug: 'mumbra', pincodes: ['400612'], coordinates: [73.0224, 19.1826] },
    ],
  },
  {
    name: 'Navi Mumbai',
    slug: 'navi-mumbai',
    district: 'Thane',
    districtSlug: 'thane',
    state: 'Maharashtra',
    stateSlug: 'maharashtra',
    coordinates: [73.0297, 19.033],
    localities: [
      { name: 'Vashi', slug: 'vashi', pincodes: ['400703'], coordinates: [73.0071, 19.077] },
      { name: 'Turbhe', slug: 'turbhe', pincodes: ['400705'], coordinates: [73.0169, 19.0728] },
      { name: 'Nerul', slug: 'nerul', pincodes: ['400706'], coordinates: [73.0169, 19.033] },
      { name: 'Taloja', slug: 'taloja', pincodes: ['410208'], coordinates: [73.0982, 19.0748] },
      { name: 'Panvel', slug: 'panvel', pincodes: ['410206'], coordinates: [73.1101, 18.9894] },
    ],
  },
  {
    name: 'Bhiwandi',
    slug: 'bhiwandi',
    district: 'Thane',
    districtSlug: 'thane',
    state: 'Maharashtra',
    stateSlug: 'maharashtra',
    coordinates: [73.0483, 19.2969],
    localities: [
      { name: 'Kalher', slug: 'kalher', pincodes: ['421302'], coordinates: [73.0225, 19.2478] },
      {
        name: 'Val Village',
        slug: 'val-village',
        pincodes: ['421302'],
        coordinates: [73.0655, 19.3125],
      },
      { name: 'Purna', slug: 'purna', pincodes: ['421302'], coordinates: [73.0345, 19.2622] },
    ],
  },
  {
    name: 'Pune',
    slug: 'pune',
    district: 'Pune',
    districtSlug: 'pune',
    state: 'Maharashtra',
    stateSlug: 'maharashtra',
    coordinates: [73.8567, 18.5204],
    localities: [
      {
        name: 'Hinjewadi',
        slug: 'hinjewadi',
        pincodes: ['411057'],
        coordinates: [73.7389, 18.5913],
      },
      { name: 'Chakan', slug: 'chakan', pincodes: ['410501'], coordinates: [73.8636, 18.7606] },
      { name: 'Hadapsar', slug: 'hadapsar', pincodes: ['411028'], coordinates: [73.926, 18.5089] },
      {
        name: 'Pimpri Chinchwad',
        slug: 'pimpri-chinchwad',
        pincodes: ['411018'],
        coordinates: [73.7997, 18.6298],
      },
    ],
  },
  {
    name: 'Nashik',
    slug: 'nashik',
    district: 'Nashik',
    districtSlug: 'nashik',
    state: 'Maharashtra',
    stateSlug: 'maharashtra',
    coordinates: [73.7898, 19.9975],
    localities: [
      {
        name: 'Satpur MIDC',
        slug: 'satpur-midc',
        pincodes: ['422007'],
        coordinates: [73.7362, 20.0043],
      },
      {
        name: 'Ambad MIDC',
        slug: 'ambad-midc',
        pincodes: ['422010'],
        coordinates: [73.7405, 19.9615],
      },
    ],
  },
  {
    name: 'Ahmedabad',
    slug: 'ahmedabad',
    district: 'Ahmedabad',
    districtSlug: 'ahmedabad',
    state: 'Gujarat',
    stateSlug: 'gujarat',
    coordinates: [72.5714, 23.0225],
    localities: [
      { name: 'Naroda', slug: 'naroda', pincodes: ['382330'], coordinates: [72.6567, 23.0716] },
      {
        name: 'Vatva GIDC',
        slug: 'vatva-gidc',
        pincodes: ['382445'],
        coordinates: [72.626, 22.9585],
      },
      { name: 'Sanand', slug: 'sanand', pincodes: ['382110'], coordinates: [72.3823, 22.9922] },
    ],
  },
  {
    name: 'Surat',
    slug: 'surat',
    district: 'Surat',
    districtSlug: 'surat',
    state: 'Gujarat',
    stateSlug: 'gujarat',
    coordinates: [72.8311, 21.1702],
    localities: [
      {
        name: 'Sachin GIDC',
        slug: 'sachin-gidc',
        pincodes: ['394230'],
        coordinates: [72.876, 21.0857],
      },
      {
        name: 'Pandesara',
        slug: 'pandesara',
        pincodes: ['394221'],
        coordinates: [72.8341, 21.1391],
      },
      { name: 'Hazira', slug: 'hazira', pincodes: ['394270'], coordinates: [72.6519, 21.1146] },
    ],
  },
  {
    name: 'Bengaluru',
    slug: 'bengaluru',
    district: 'Bengaluru Urban',
    districtSlug: 'bengaluru-urban',
    state: 'Karnataka',
    stateSlug: 'karnataka',
    coordinates: [77.5946, 12.9716],
    localities: [
      { name: 'Peenya', slug: 'peenya', pincodes: ['560058'], coordinates: [77.5177, 13.0287] },
      {
        name: 'Whitefield',
        slug: 'whitefield',
        pincodes: ['560066'],
        coordinates: [77.75, 12.9698],
      },
      {
        name: 'Electronic City',
        slug: 'electronic-city',
        pincodes: ['560100'],
        coordinates: [77.677, 12.8452],
      },
      {
        name: 'Bommasandra',
        slug: 'bommasandra',
        pincodes: ['560099'],
        coordinates: [77.699, 12.808],
      },
    ],
  },
  {
    name: 'Hyderabad',
    slug: 'hyderabad',
    district: 'Hyderabad',
    districtSlug: 'hyderabad',
    state: 'Telangana',
    stateSlug: 'telangana',
    coordinates: [78.4867, 17.385],
    localities: [
      {
        name: 'Jeedimetla',
        slug: 'jeedimetla',
        pincodes: ['500055'],
        coordinates: [78.4406, 17.5008],
      },
      {
        name: 'Gachibowli',
        slug: 'gachibowli',
        pincodes: ['500032'],
        coordinates: [78.3489, 17.44],
      },
      { name: 'Uppal', slug: 'uppal', pincodes: ['500039'], coordinates: [78.559, 17.4014] },
    ],
  },
  {
    name: 'Delhi',
    slug: 'delhi',
    district: 'New Delhi',
    districtSlug: 'new-delhi',
    state: 'Delhi',
    stateSlug: 'delhi',
    coordinates: [77.1025, 28.7041],
    localities: [
      { name: 'Okhla', slug: 'okhla', pincodes: ['110020'], coordinates: [77.275, 28.5355] },
      { name: 'Narela', slug: 'narela', pincodes: ['110040'], coordinates: [77.0921, 28.8527] },
      { name: 'Bawana', slug: 'bawana', pincodes: ['110039'], coordinates: [77.045, 28.7986] },
      { name: 'Mayapuri', slug: 'mayapuri', pincodes: ['110064'], coordinates: [77.12, 28.627] },
    ],
  },
  {
    name: 'Noida',
    slug: 'noida',
    district: 'Gautam Buddha Nagar',
    districtSlug: 'gautam-buddha-nagar',
    state: 'Uttar Pradesh',
    stateSlug: 'uttar-pradesh',
    coordinates: [77.391, 28.5355],
    localities: [
      {
        name: 'Sector 63',
        slug: 'sector-63',
        pincodes: ['201301'],
        coordinates: [77.3814, 28.6199],
      },
      {
        name: 'Greater Noida',
        slug: 'greater-noida',
        pincodes: ['201310'],
        coordinates: [77.504, 28.4744],
      },
      {
        name: 'Sector 16',
        slug: 'sector-16',
        pincodes: ['201301'],
        coordinates: [77.312, 28.5776],
      },
    ],
  },
  {
    name: 'Gurugram',
    slug: 'gurugram',
    district: 'Gurugram',
    districtSlug: 'gurugram',
    state: 'Haryana',
    stateSlug: 'haryana',
    coordinates: [77.0266, 28.4595],
    localities: [
      { name: 'Manesar', slug: 'manesar', pincodes: ['122051'], coordinates: [76.9366, 28.3543] },
      {
        name: 'Udyog Vihar',
        slug: 'udyog-vihar',
        pincodes: ['122016'],
        coordinates: [77.087, 28.505],
      },
      { name: 'Sohna Road', slug: 'sohna-road', pincodes: ['122018'], coordinates: [77.04, 28.42] },
    ],
  },
  {
    name: 'Chennai',
    slug: 'chennai',
    district: 'Chennai',
    districtSlug: 'chennai',
    state: 'Tamil Nadu',
    stateSlug: 'tamil-nadu',
    coordinates: [80.2707, 13.0827],
    localities: [
      { name: 'Ambattur', slug: 'ambattur', pincodes: ['600053'], coordinates: [80.1548, 13.1143] },
      {
        name: 'Sriperumbudur',
        slug: 'sriperumbudur',
        pincodes: ['602105'],
        coordinates: [79.945, 12.9675],
      },
      { name: 'Guindy', slug: 'guindy', pincodes: ['600032'], coordinates: [80.212, 13.0067] },
    ],
  },
  {
    name: 'Kolkata',
    slug: 'kolkata',
    district: 'Kolkata',
    districtSlug: 'kolkata',
    state: 'West Bengal',
    stateSlug: 'west-bengal',
    coordinates: [88.3639, 22.5726],
    localities: [
      { name: 'Howrah', slug: 'howrah', pincodes: ['711101'], coordinates: [88.3103, 22.5958] },
      {
        name: 'Salt Lake',
        slug: 'salt-lake',
        pincodes: ['700064'],
        coordinates: [88.4177, 22.5867],
      },
      { name: 'Dum Dum', slug: 'dum-dum', pincodes: ['700028'], coordinates: [88.42, 22.642] },
    ],
  },
];

/** Cities shown in the landing page "popular locations" strip. */
export const FEATURED_CITY_SLUGS: readonly string[] = [
  'mumbai',
  'thane',
  'navi-mumbai',
  'bhiwandi',
  'pune',
  'delhi',
  'bengaluru',
  'ahmedabad',
];
