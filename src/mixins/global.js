export const formatDatetime = (datetime) => {
  let dt = new Date(datetime)
  return (
    ("0" + dt.getDate()).slice(-2) + "." +
    ("0" + (dt.getMonth()+1)).slice(-2) + "." +
    dt.getFullYear() + " " +
    ("0" + dt.getHours()).slice(-2) + ":" +
    ("0" + dt.getMinutes()).slice(-2) + ":" +
    ("0" + dt.getSeconds()).slice(-2)
  )
}

export const randomColor = () => {
  const letters = '789ABCDEF'
  let color = '#'
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 9)]
  }
  return color
}