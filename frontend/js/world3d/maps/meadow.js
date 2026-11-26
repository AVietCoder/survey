/* Làng Khởi Đầu: đồng cỏ ban ngày. Chỉ là bố cục; tên, ngưỡng và vật phẩm do máy chủ quyết định.
   Hướng: +z là phía nam (nơi xuất phát, camera nhìn về -z). */
export default {
  id: 'meadow',
  theme: { sky: '#BFE3FF', fog: '#D7EEFF', grass: ['#9ED39A', '#93CC90', '#AADBA2'], side: '#C9A27E', light: 1, leaf: ['#6FBF73', '#83CC80'], flowers: ['#F6A8B8', '#FFD36E', '#C4B5FD', '#FFFFFF'] },
  spawn: { x: 0, z: 10 },
  areas: [
    { x1: -18, z1: -18, x2: 18, z2: 16, h: 0 },
    { x1: 10, z1: -16, x2: 17, z2: -10, h: 1 },            // gò cao giấu kho báu
    { x1: 13, z1: -16, x2: 17, z2: -13, h: 2 }
  ],
  holes: [{ x: -13, z: 8, r: 2.6 }],
  buildings: { tent: { x: -5, z: 2 }, garden: { x: 6, z: 3 }, hammock: { x: -10, z: -6 }, teahouse: { x: 4, z: -8 } },
  board: { x: 3.5, z: 7 },
  portal: { x: -8, z: 8.5 },
  guardian: { x: 0, z: -14, look: 'cloud' },
  npcs: [
    { id: 'meadow-lan', name: 'Cô Lan làm vườn', codes: ['Y-01', 'Y-05', 'G-01'], x: -2, z: -3, avatar: { style: 2, hair: 2, shirt: 2, hat: 3 } },
    { id: 'meadow-bao', name: 'Bạn Bảo', codes: ['Y-02', 'G-02', 'G-03'], x: 9, z: -2, avatar: { style: 0, hair: 1, shirt: 3, hat: 2 } }
  ],
  treasures: { meadow_dew: { x: 12, z: 6 }, meadow_clover: { x: -15, z: -14 }, meadow_acorn: { x: 15, z: -14.5 }, meadow_shell: { x: -13, z: 13 } },
  orbs: [],
  trees: [{ x: -16, z: -16 }, { x: -13, z: -13 }, { x: -16, z: -9 }, { x: 16, z: 10 }, { x: 13, z: 13 }, { x: -8, z: -16 }, { x: 8, z: -16 }, { x: 16, z: -2 }, { x: -16, z: 2 }, { x: 11, z: 9 }],
  rocks: [{ x: -7, z: 9 }, { x: 14, z: 1 }, { x: -3, z: -11 }, { x: 8, z: 12 }],
  path: [[0, 11], [0, 8], [0, 5], [0, 2], [0, -1], [-1, -4], [0, -7], [0, -10]]
}
