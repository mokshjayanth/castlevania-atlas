// Journeys: points are [lon, lat] or a place id. kind: 'road' | 'sea' | 'teleport'
export const routes = [
  { id: 'isaac', series: 'cv', name: 'Isaac\'s road to Styria', seasons: 'S2E8–S4E6', who: ['Isaac', 'The Captain', 'Miranda'],
    legs: [
      { kind: 'road', pts: ['desert', 'tunis'] },
      { kind: 'sea', pts: ['tunis', [10.9, 38.2], [11.0, 40.6], [10.0, 42.6], [9.35, 43.9], 'genoa'] },
      { kind: 'road', pts: ['genoa', 'magician', [10.9, 45.25], [13.2, 46.2], 'styria'] },
    ] },
  { id: 'carmilla', series: 'cv', name: 'Carmilla\'s march home', seasons: 'S2E8–S3E1', note: '800 miles, 30 days', who: ['Carmilla', 'Hector'],
    legs: [ { kind: 'road', pts: ['braila', [25.0, 44.55], [22.3, 44.9], [19.6, 45.9], [17.0, 46.6], 'styria'] } ] },
  { id: 'castle', series: 'cv', name: 'The castle\'s jumps', seasons: 'S2', who: ['Dracula', 'Alucard', 'Carmilla', 'Hector', 'Isaac', 'Godbrand'],
    legs: [ { kind: 'teleport', pts: ['castleA', 'braila'] }, { kind: 'teleport', pts: ['braila', 'VIGNETTE'] } ] },
  { id: 'nocturne', series: 'noc', name: 'Machecoul to Paris', seasons: 'Nocturne S2', who: ['Alucard', 'Richter Belmont', 'Annette'],
    legs: [ { kind: 'road', pts: ['machecoul', [-0.6, 47.4], [0.9, 47.85], 'paris'] } ] },
];

// Voyages drawn on the world inset: [from [lon,lat], to [lon,lat], label]
export const voyages = [
  { series: 'noc', from: [-71.05, 42.36], to: [-2.2, 47.1], label: '1783', who: 'Richter sails to France', lt: 0.5, dy: -4 },
  { series: 'noc', from: [-72.3, 19.6], to: [-2.2, 47.1], label: 'S1E3 · S2E8', who: 'Annette to France and home again', lt: 0.62, dy: 11 },
];
