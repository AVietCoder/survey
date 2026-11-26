/* Rừng Đèn Lồng: rừng đêm ấm áp với đèn lồng. Chỉ là bố cục. */
export default {
  id: 'forest',
  theme: { sky: '#2E2A55', fog: '#3A3568', grass: ['#5E9C7A', '#559072', '#68A683'], side: '#7A5C54', light: 0.72, leaf: ['#3F7F66', '#4E9374'], flowers: ['#FFD36E', '#C4B5FD', '#8FD3F4'] },
  spawn: { x: 0, z: 12 },
  areas: [
    { x1: -17, z1: -19, x2: 17, z2: 17, h: 0 },
    { x1: -17, z1: -4, x2: -11, z2: 3, h: 1 },
    { x1: -17, z1: -2, x2: -14, z2: 1, h: 2 },
    { x1: 11, z1: -19, x2: 17, z2: -13, h: 1 }
  ],
  holes: [{ x: 12, z: 8, r: 2.2 }],
  buildings: { lantern: { x: -4, z: 5 }, clocktower: { x: 8, z: -4 }, library: { x: -7, z: -9 } },
  board: { x: 4, z: 9 },
  portal: { x: -7, z: 9.5 },
  guardian: { x: 2, z: -15, look: 'owl' },
  npcs: [
    { id: 'forest-minh', name: 'Anh Minh giữ thư viện', codes: ['Y-04', 'R-05', 'R-01'], x: -3, z: -6, avatar: { style: 3, hair: 0, shirt: 6, hat: 0 } },
    { id: 'forest-ha', name: 'Chị Hà thắp đèn', codes: ['Y-03', 'R-02'], x: 4, z: 2, avatar: { style: 1, hair: 5, shirt: 4, hat: 1 } }
  ],
  treasures: { forest_firefly: { x: -15.5, z: -0.5 }, forest_feather: { x: 14, z: -16 }, forest_pine: { x: 15, z: 13 }, forest_ribbon: { x: -14, z: -15 } },
  orbs: [],
  trees: [
    { x: -15, z: 8 }, { x: -12, z: 12 }, { x: -10, z: 6 }, { x: -15, z: -9 }, { x: -11, z: -17 }, { x: -3, z: -17 }, { x: 8, z: -12 }, { x: 15, z: -8 },
    { x: 14, z: 0 }, { x: 15, z: 4 }, { x: 8, z: 14 }, { x: 12, z: -2 }, { x: -9, z: -1 }, { x: 6, z: -17 }, { x: -7, z: 15 }
  ],
  lamps: [{ x: -2, z: 11 }, { x: 2, z: 6 }, { x: -2, z: 1 }, { x: 2, z: -4 }, { x: -1, z: -10 }, { x: 6, z: -13 }],
  rocks: [{ x: -6, z: 10 }, { x: 10, z: 2 }, { x: -12, z: -6 }],
  path: [[0, 13], [0, 10], [0, 7], [0, 4], [0, 1], [0, -2], [0, -5], [1, -8], [2, -11]]
}
