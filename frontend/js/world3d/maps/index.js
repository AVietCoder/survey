import meadow from './meadow.js'
import forest from './forest.js'
import sky from './sky.js'

export const MAPS = Object.freeze({ meadow, forest, sky })
export const getMap = id => MAPS[id] || meadow
