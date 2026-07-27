/* Lebanon's eight governorates and the cities that actually appear in job ads.
   Location stays a free-text field — plenty of roles sit in a village or a
   specific district — but these power the board's location filter and the
   editor's suggestions so the common cases stay consistent. */
export const GOVERNORATES = [
  'Beirut',
  'Mount Lebanon',
  'North Lebanon',
  'Akkar',
  'Bekaa',
  'Baalbek-Hermel',
  'South Lebanon',
  'Nabatieh',
];

export const CITIES = [
  'Beirut',
  'Tripoli',
  'Sidon',
  'Tyre',
  'Jounieh',
  'Zahlé',
  'Byblos',
  'Baabda',
  'Aley',
  'Batroun',
  'Nabatieh',
  'Baalbek',
  'Halba',
  'Antelias',
  'Dbayeh',
  'Hazmieh',
  'Zalka',
];

export const LOCATION_SUGGESTIONS = [...new Set([...CITIES, ...GOVERNORATES])].sort((a, b) =>
  a.localeCompare(b)
);
