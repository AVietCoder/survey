/* Hồ Trên Mây: các đảo bay nối bằng cầu. Ra ngoài mép đảo bị chặn lại (không rơi, không phạt). Chỉ là bố cục. */
export default {
  id: 'sky',
  theme: { sky: '#BBA8F5', fog: '#D9CBFF', grass: ['#8FD3B6', '#83C9AC', '#9ADCC1'], side: '#A693CF', light: 0.92, leaf: ['#F6A8B8', '#FFC4D1'], flowers: ['#FFFFFF', '#FFD36E', '#8FD3F4'], floating: true },
  spawn: { x: 0, z: 13 },
  areas: [
    { x1: -7, z1: 6, x2: 7, z2: 16, h: 0 },               // đảo bến
    { x1: -1.5, z1: 2, x2: 1.5, z2: 6, h: 0 },            // cầu
    { x1: -11, z1: -9, x2: 11, z2: 2, h: 0 },             // đảo hồ
    { x1: 11, z1: -5, x2: 14, z2: -2, h: 0 },             // cầu đông
    { x1: 14, z1: -11, x2: 22, z2: 3, h: 0 },             // đảo đài sao
    { x1: -14, z1: -5, x2: -11, z2: -2, h: 0 },           // cầu tây
    { x1: -22, z1: -11, x2: -14, z2: 3, h: 0 },           // đảo nhà mây
    { x1: -1.5, z1: -13, x2: 1.5, z2: -9, h: 0 },         // cầu bắc
    { x1: -8, z1: -22, x2: 8, z2: -13, h: 0 },            // đảo rồng
    { x1: 17, z1: -10, x2: 21, z2: -7, h: 1 },
    { x1: -21, z1: 0, x2: -18, z2: 3, h: 1 }
  ],
  holes: [],
  buildings: { pond: { x: -5, z: -4 }, bigtree: { x: 7, z: -5 }, observatory: { x: 18, z: -2 }, cloudhouse: { x: -18, z: -5 } },
  board: { x: 4, z: 8 },
  portal: { x: -5, z: 9 },
  guardian: { x: 0, z: -19, look: 'dragon' },
  npcs: [
    { id: 'sky-an', name: 'Bạn An câu mây', codes: ['R-03', 'G-03'], x: 2.5, z: -6.5, avatar: { preset: 'tinh' } },
    { id: 'sky-vy', name: 'Bạn Vy ngắm sao', codes: ['R-02', 'R-04'], x: 15.5, z: 1, avatar: { preset: 'emma' } }
  ],
  treasures: { sky_pearl: { x: -9, z: 0.5 }, sky_star: { x: 19.5, z: -8.5 }, sky_lotus: { x: -19.5, z: 1.5 }, sky_bell: { x: 6, z: 14.5 } },
  orbs: [{ x: -9, z: -7.5 }, { x: 9.5, z: 0 }, { x: 16, z: -9.5 }, { x: -16, z: -9.5 }, { x: -6, z: -20 }],
  trees: [{ x: -6, z: 14.5 }, { x: 20.5, z: 1.5 }, { x: -20.5, z: -9.5 }, { x: 6.5, z: -20.5 }, { x: -9.5, z: -1.5 }],
  rocks: [{ x: 5.5, z: 7.5 }, { x: 9, z: -8 }],
  path: [[0, 12], [0, 9], [0, 6], [0, 3], [0, 0], [0, -3], [0, -6], [0, -9], [0, -12], [0, -15]]
}
