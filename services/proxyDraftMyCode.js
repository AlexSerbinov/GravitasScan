const fetcher = new EventEmitter()

fetcher.on("sendUsersToSubgraph", async data => {
  // send users to subraph in batches
  const nonBlacklistedUsers = await getNonBlacklistedUsers(protocol)
  const batchSize = 10
  for (let i = 0; i < nonBlacklistedUsers.length; i += batchSize) {
    const batch = nonBlacklistedUsers.slice(i, i + batchSize)
    console.log(`Sending batch of ${batch.length} users`)
    $.send("sendUsersToSubgraph", batch)
  }
})

$.on("drain", () => {
  console.log("received drain event")
  // Отправляем данные сразу, если событие произошло менее чем через 30 секунд после последнего вызова
  console.log("Событие drain, немедленная отправка данных")
  fetcher.emit("sendUsersToSubgraph")
  // Сбрасываем таймер, начинаем отсчет заново
  restartTimeout()
})

fetcher.emit("drain")

let timeoutId

const restartTimeout = () => {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  timeoutId = setTimeout(() => {
    console.log("30 секунд простоя, отправка данных")
    fetcher.emit("sendUsersToSubgraph")
  }, 10000) // Задержка в 30 секунд
}

restartTimeout()

// Utility function to read and parse the user file.
const getUserFromFile = async () => {
  const filePath = path.join(__dirname, "allUsers", "allUsersM.json")
  const items = await fs.readFile(filePath, "utf8")
  return JSON.parse(items)
}

// New utility function to get non-blacklisted users.
const getNonBlacklistedUsers = async protocol => {
  const allUsers = await getUserFromFile()
  const usersToCheck = allUsers.map(userInfo => userInfo.user)
  const checkBlacklistUsers = await checkUsersInBlacklistSet(usersToCheck, protocol)
  return allUsers.filter((_, index) => checkBlacklistUsers[index] === 0)
}
