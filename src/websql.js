export const isWebSQL = window.openDatabase ? true : false

export const dbExec = (query, params = []) => {
  const database = window.openDatabase('scoring', '1.0', 'Web SQL Database', 2 * 1024 * 1024)
  return new Promise((resolve, reject) => {
    database.transaction(tx => {
      tx.executeSql(
        query,
        params,
        (tx, result) => { resolve(result) },
        (tx, e) => { reject(e) }
      )
    })
  })
}

export const db = window.openDatabase('scoring', '1.0', 'Web SQL Database', 2 * 1024 * 1024)

export const transaction = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        query,
        params,
        (tx, result) => { resolve(result) },
        (tx, e) => { reject(e) }
      )
    })
  })
}