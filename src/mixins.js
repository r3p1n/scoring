import { dbExec } from './websql'

export const getSetting = async (key) => {
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