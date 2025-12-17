// data-manager.js
const DataManager = (() => {
  const API_BASE_URL = "http://localhost:3000/api"

  let isInitialized = false

  const init = () => {
    if (isInitialized) return
    console.log("DataManager initialized")
    isInitialized = true
  }

  // Получение автомобилей
  const getCars = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars`)
      if (!response.ok) {
        console.error("Failed to fetch cars:", response.status)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error("Error fetching cars:", error)
      return []
    }
  }

  // Получение статистики
  const getStatistics = async () => {
    try {
      const cars = await getCars()
      const users = await getUsers()

      return {
        totalUsers: users.length,
        totalCars: cars.length,
        availableCars: cars.filter((car) => car.isAvailable).length,
        premiumUsers: users.filter((user) => user.role === "premium").length,
      }
    } catch (error) {
      console.error("Error getting statistics:", error)
      return {
        totalUsers: 0,
        totalCars: 0,
        availableCars: 0,
        premiumUsers: 0,
      }
    }
  }

  // Получение пользователей
  const getUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`)
      if (!response.ok) {
        console.error("Failed to fetch users:", response.status)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error("Error fetching users:", error)
      return []
    }
  }

  // Получение пользователя по ID
  const getUserById = async (id) => {
    try {
      const users = await getUsers()
      return users.find((user) => user.id == id) || null
    } catch (error) {
      console.error("Error getting user by ID:", error)
      return null
    }
  }

  // Получение пользователя по username
  const getUserByUsername = async (username) => {
    try {
      const users = await getUsers()
      return users.find((user) => user.username === username) || null
    } catch (error) {
      console.error("Error getting user by username:", error)
      return null
    }
  }

  // Получение избранного пользователя
  const getFavorites = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/${userId}`)
      if (!response.ok) {
        console.error("Failed to fetch favorites:", response.status)
        return []
      }
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error("Error fetching favorites:", error)
      return []
    }
  }

  // Получение автомобиля по ID
  const getCarById = async (carId) => {
    try {
      const cars = await getCars()
      return cars.find((car) => car.id == carId) || null
    } catch (error) {
      console.error("Error getting car by ID:", error)
      return null
    }
  }

  // Удаление из избранного
  const removeFavorite = async (userId, carId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites/${userId}/${carId}`, {
        method: "DELETE",
      })
      return await response.json()
    } catch (error) {
      console.error("Error removing favorite:", error)
      return { success: false, message: "Ошибка при удалении" }
    }
  }

  // Добавление в избранное
  const addFavorite = async (userId, carId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, carId }),
      })
      return await response.json()
    } catch (error) {
      console.error("Error adding favorite:", error)
      return { success: false, message: "Ошибка при добавлении" }
    }
  }

  // Создание заказа
  const createOrder = async (orderData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })
      return await response.json()
    } catch (error) {
      console.error("Error creating order:", error)
      return { success: false, message: "Ошибка при создании заказа" }
    }
  }

  return {
    init,
    getCars,
    getStatistics,
    getUsers,
    getUserById,
    getUserByUsername,
    getFavorites,
    getCarById,
    removeFavorite,
    addFavorite,
    createOrder,
  }
})()
if (typeof module !== "undefined" && module.exports) {
  module.exports = DataManager
} else {
  window.DataManager = DataManager
}
