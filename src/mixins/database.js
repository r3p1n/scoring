import { dbExec } from '../websql'

const version = import.meta.env.VITE_DATABASE_VERSION

// tables
const getTables = async () => {
  try {
    const result = await dbExec(`SELECT rootpage, name FROM sqlite_master WHERE type='table' 
      AND (name='users' OR name='games' OR name='players' OR name='rounds' OR name='scores' OR name='settings')`)
    return [...result.rows]
  } catch (e) {
    console.error(e)
    return []
  }
}

const createTables = async () => {
  try {
    await dbExec(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT
    )`)

    await dbExec(`CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      finished_at TIMESTAMP DEFAULT NULL,
      goal INTEGER
    )`)

    await dbExec(`CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY,
      game_id INTEGER,
      user_id INTEGER,
      is_active TINYINT(1) DEFAULT 1
    )`)

    await dbExec(`CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY,
      number INTEGER,
      game_id INTEGER
    )`)

    await dbExec(`CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY,
      round_id INTEGER,
      player_id INTEGER,
      score INTEGER
    )`)

    await dbExec(`CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      key TEXT,
      value TEXT
    )`)
  } catch (e) {
    console.error(e)
  }
}

const updateTables = async (currentVersion) => {
  const v = (currentVersion || '0').replace(/[^0-9]/g, '')
  if (v < 220903) {
    try {
      await dbExec(`ALTER TABLE games ADD goal INTEGER`)
    } catch (e) {
      console.error(e)
    }
  }

  if (v < 221005) {
    try {
      await dbExec(`ALTER TABLE players ADD is_active TINYINT(1) DEFAULT 1`)
    } catch (e) {
      console.error(e)
    }
  }
}

// settings
const getSetting = async (key) => {
  try {
    let result = await dbExec("SELECT value FROM settings WHERE key = ?", [key])
    if (!result.rows.length) {
      return null
    }
    return result.rows[0].value
  } catch (e) {
    console.error(e)
    return null
  }
}

const setSetting = async (key, value) => {
  try {
    let result = await dbExec(`UPDATE settings SET value = ? WHERE key = ?`, [value, key])
    if (!result.rowsAffected) {
      await dbExec(`INSERT INTO settings (key, value) VALUES (?, ?)`, [key, value])
    }
  } catch (e) {
    console.error(e)
  }
}

// games
const addGame = async (goal) => {
  try {
    const result = await dbExec("INSERT INTO games (goal) VALUES (?)", [goal])
    return result.insertId
  } catch (e) {
    console.error(e)
    return null
  }
}

const getGameGoal = async (id) => {
  try {
    const result = await dbExec("SELECT goal FROM games WHERE id = ?", [id])
    return result.rows.length ? result.rows[0].goal : 0 // result.rows
  } catch (e) {
    console.error(e)
    return 0
  }
}

const updateGameGoal = async (id, goal) => {
  try {
    const result = await dbExec("UPDATE games SET goal = ? WHERE id = ?", [goal, id])
    return result.rowsAffected
  } catch (e) {
    console.error(e)
    return null
  }
}

const getGameFinishedAt = async (id) => {
  try {
    const result = await dbExec("SELECT finished_at FROM games WHERE id = ?", [id])
    return result.rows
  } catch (e) {
    console.error(e)
    return []
  }
}

const setGameFinishedAtNow = async (id) => {
  try {
    const result = await dbExec("UPDATE games SET finished_at = datetime('now') WHERE id = ?", [id])
    return result.rowsAffected
  } catch (e) {
    console.error(e)
    return null
  }
}

const getUnfinishedGames = async () => {
  try {
    const result = await dbExec("SELECT * FROM games WHERE finished_at is NULL ORDER BY created_at DESC")
    return result.rows
  } catch (e) {
    console.error(e)
    return []
  }
}

const getFinishedGames = async () => {
  try {
    const result = await dbExec("SELECT * FROM games WHERE finished_at is not NULL ORDER BY finished_at DESC")
    return result.rows
  } catch (e) {
    console.error(e)
    return []
  }
}

// players
const getPlayers = async (gameId) => {
  try {
    const result = await dbExec("SELECT * FROM players WHERE game_id = ?", [gameId])
    return [...result.rows]
  } catch (e) {
    console.error(e)
    return []
  }
}

const addPlayer = async (gameId, userId) => {
  try {
    await dbExec("INSERT INTO players (game_id, user_id) VALUES (?, ?)", [gameId, userId])
  } catch (e) {
    console.error(e)
  }
}

const updateActivityPlayer = async (id, isActive) => {
  try {
    let result = await dbExec("UPDATE players SET is_active = ? WHERE id = ?", [isActive, id])
    return result.rowsAffected
  } catch (e) {
    console.error(e)
    return null
  }
}

// users
const getUsers = async () => {
  try {
    const result = await dbExec("SELECT * FROM users")
    return [...result.rows]
  } catch (e) {
    console.error(e)
    return []
  }
}

const addUser = async (name) => {
  try {
    const result = await dbExec("INSERT INTO users (name) VALUES (?)", [name])
    return result.insertId
  } catch (e) {
    console.error(e)
    return null
  }
}

const updateUser = async (id, name) => {
  try {
    let result = await dbExec("UPDATE users SET name = ? WHERE id = ?", [name, id])
    return result.rowsAffected
  } catch (e) {
    console.error(e)
    return null
  }
}

// rounds
const getLastRound = async (gameId) => {
  try {
    const result = await dbExec("SELECT r.number, r.id FROM rounds r WHERE r.game_id = ? ORDER BY id DESC LIMIT 1", [gameId])
    return result.rows.length ? result.rows[0].number : 0
  } catch (e) {
    console.error(e)
    return 0
  }
}

const addRound = async (gameId, number) => {
  try {
    const result = await dbExec("INSERT INTO rounds (number, game_id) VALUES (?, ?)", [number, gameId])
    return result.insertId
  } catch (e) {
    console.error(e)
    return null
  }
}

// scores
const addScore = async (roundId, playerId, score) => {
  try {
    await dbExec("INSERT INTO scores (round_id, player_id, score) VALUES (?, ?, ?)", [roundId, playerId, score])
  } catch (e) {
    console.error(e)
  }
}

const getLastRoundScore = async (gameId) => {
  try {
    const result = await dbExec(`
      SELECT p.id AS player_id, u.name AS player_name, SUM(IFNULL(s.score, 0)) AS last_round_score, 0 AS score,
        SUM(IFNULL(s.score, 0)) AS total_score, g.finished_at FROM games g
        JOIN users u ON u.id = p.user_id
        JOIN players p ON p.game_id = g.id AND p.is_active = 1
        LEFT JOIN rounds r ON r.game_id = g.id
        LEFT JOIN scores s ON s.round_id = r.id AND s.player_id = p.id
        WHERE g.id = ?
        GROUP BY p.id
    `, [gameId])
    if (!result.rows.length) {
      return []
    }
    return result.rows
  } catch (e) {
    console.error(e)
    return []
  }
}

// other
const getPlayersAndTotalScoreAndScores = async (gameId) => {
  try {
    const result = await dbExec(`
      SELECT p.id, u.name, IFNULL(SUM(s.score), 0) total_score, null scores FROM games g
        JOIN users u ON u.id = p.user_id
        JOIN players p ON p.game_id = g.id AND p.is_active = 1
        JOIN rounds r ON r.game_id = g.id
        LEFT JOIN scores s ON s.round_id = r.id AND s.player_id = p.id
        WHERE g.id = ? -- AND NOT g.finished_at IS NULL
        GROUP BY p.id
        ORDER BY SUM(s.score) DESC
    `, [gameId])
    return [...result.rows]
  } catch (e) {
    console.error(e)
    return []
  }
}

const getRoundAndScoreByPlayerId = async (gameId, playerId) => {
  try {
    const result = await dbExec(`
      SELECT r.number round_number, IFNULL(s.score, 0) score FROM games g
        JOIN players p ON p.game_id = g.id AND p.id = ?
        JOIN rounds r ON r.game_id = g.id
        LEFT JOIN scores s ON s.round_id = r.id AND s.player_id = p.id
        WHERE g.id = ?
        ORDER BY r.number
    `, [playerId, gameId])
    return [...result.rows]
  } catch (e) {
    console.error(e)
    return []
  }
}

const getRoundByNumber = async (gameId) => {
  try {
    const result = await dbExec(`
      SELECT r.id, r.number, null scores FROM games g
        JOIN rounds r ON r.game_id = g.id
        WHERE g.id = ?
        ORDER BY r.number
    `, [gameId])
    return [...result.rows]
  } catch (e) {
    console.error(e)
    return []
  }
}

const getPlayersAndTotalScore = async (gameId) => {
  try {
    const result = await dbExec(`
      SELECT p.id, u.name, IFNULL(SUM(s.score), 0) total_score FROM games g
        JOIN users u ON u.id = p.user_id
        JOIN players p ON p.game_id = g.id AND p.is_active = 1
        JOIN rounds r ON r.game_id = g.id
        LEFT JOIN scores s ON s.round_id = r.id AND s.player_id = p.id
        WHERE g.id = ?
        GROUP BY p.id
        ORDER BY SUM(s.score) DESC
    `, [gameId])
    return [...result.rows]
  } catch (e) {
    console.error(e)
    return []
  }
}

const getScoreByPlayerIdAndRoundId = async (gameId, playerId, roundId) => {
  try {
    const result = await dbExec(`
      SELECT p.id, IFNULL(s.score, 0) score FROM games g
        JOIN players p ON p.game_id = g.id AND p.id = ?
        JOIN rounds r ON r.game_id = g.id AND r.id = ?
        LEFT JOIN scores s ON s.round_id = r.id AND s.player_id = p.id
        WHERE g.id = ?
    `, [playerId, roundId, gameId])
    return [...result.rows]
  } catch (e) {
    console.error(e)
    return []
  }
}

export default {
  version,

  getTables,
  createTables,
  updateTables,

  getSetting,
  setSetting,
  
  addGame,
  getGameGoal,
  updateGameGoal,
  getGameFinishedAt,
  setGameFinishedAtNow,
  getUnfinishedGames,
  getFinishedGames,

  getPlayers,
  addPlayer,
  updateActivityPlayer,

  getUsers,
  addUser,
  updateUser,

  getLastRound,
  addRound,

  addScore,
  getLastRoundScore,

  getPlayersAndTotalScoreAndScores,
  getRoundAndScoreByPlayerId,
  getRoundByNumber,
  getPlayersAndTotalScore,
  getScoreByPlayerIdAndRoundId,
}