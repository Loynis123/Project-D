// УДАЛЯЕМ САМЫЙ ВНЕШНИЙ IIFE (строка: ;(() => { )
// И УДАЛЯЕМ ПОСЛЕДНЮЮ СТРОКУ: })()

// Вместо этого делаем так:

// ===========================================
// 1. КОНСТАНТЫ И КОНФИГУРАЦИЯ
// ===========================================

const CONFIG = {
  API_BASE_URL: "http://localhost:3000",
  LOADER_DELAY: 1500,
  SUBMIT_DELAY: 2000,
  REDIRECT_DELAY: 1000,
  NOTIFICATION_DELAY: 4000,
  ANIMATION_DURATION: 300,
  ROWS_PER_PAGE: 5,
}

// Ключ для JWT в localStorage
const JWT_STORAGE_KEY = 'project_d_jwt_token';

// ===========================================
// 2. СИСТЕМА УВЕДОМЛЕНИЙ
// ===========================================

const NotificationSystem = {
  show: function (message, type = "info") {
    this.removeExisting()

    const notification = this.createNotificationElement(message, type)
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.classList.add("show")
    }, 10)

    setTimeout(() => {
      this.hide(notification)
    }, CONFIG.NOTIFICATION_DELAY)

    notification.querySelector(".notification-close").addEventListener("click", () => {
      this.hide(notification)
    })
  },

  hide: (notification) => {
    notification.classList.remove("show")
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, CONFIG.ANIMATION_DURATION)
  },

  removeExisting: () => {
    const existing = document.querySelector(".notification")
    if (existing) {
      existing.remove()
    }
  },

  createNotificationElement: function (message, type) {
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${this.escapeHtml(message)}</span>
        <button class="notification-close" aria-label="Закрыть уведомление">×</button>
      </div>
    `
    return notification
  },

  escapeHtml: (text) => {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  },
}

// Добавляем стили для уведомлений
const notificationStyles = `
  .notification {
    position: fixed;
    top: 100px;
    right: 20px;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    transform: translateX(400px);
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 10000;
    max-width: 350px;
  }

  .notification.show {
    transform: translateX(0);
    opacity: 1;
  }

  .notification-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .notification-message {
    flex: 1;
    color: #333;
    font-weight: 500;
  }

  .notification-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  .notification-close:hover {
    background: #f5f5f5;
    color: #333;
  }

  .notification-success {
    border-left: 4px solid #28a745;
  }

  .notification-error {
    border-left: 4px solid #dc3545;
  }

  .notification-info {
    border-left: 4px solid #17a2b8;
  }
`

// Добавляем стили для уведомлений в DOM
const styleSheet = document.createElement("style")
styleSheet.textContent = notificationStyles
document.head.appendChild(styleSheet)

// ===========================================
// 3. МЕНЕДЖЕР ДАННЫХ
// ===========================================

const DataManager = {
  init: () => {
    console.log("DataManager initialized")
  },

  getCars: async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/cars`)
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
  },

  getStatistics: async () => {
    try {
      const cars = await DataManager.getCars()
      const users = await DataManager.getUsers()

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
  },

  getUsers: async () => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/users`)
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
  },

  getUserById: async (id) => {
    try {
      const users = await DataManager.getUsers()
      return users.find((user) => user.id == id) || null
    } catch (error) {
      console.error("Error getting user by ID:", error)
      return null
    }
  },

  getUserByUsername: async (username) => {
    try {
      const users = await DataManager.getUsers()
      return users.find((user) => user.username === username) || null
    } catch (error) {
      console.error("Error getting user by username:", error)
      return null
    }
  },

  getFavorites: async (userId) => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/favorites/${userId}`)
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
  },

  getCarById: async (carId) => {
    try {
      const cars = await DataManager.getCars()
      return cars.find((car) => car.id == carId) || null
    } catch (error) {
      console.error("Error getting car by ID:", error)
      return null
    }
  },

  removeFavorite: async (userId, carId) => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/favorites/${userId}/${carId}`, {
        method: "DELETE",
      })
      return await response.json()
    } catch (error) {
      console.error("Error removing favorite:", error)
      return { success: false, message: "Ошибка при удалении" }
    }
  },

  addFavorite: async (userId, carId) => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/favorites`, {
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
  },

  createOrder: async (orderData) => {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/orders`, {
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
  },

  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem(JWT_STORAGE_KEY);
      if (!token) return null;

      const response = await fetch(`${CONFIG.API_BASE_URL}/api/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) return null;
      const data = await response.json();
      return data.user || null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }
}

// ===========================================
// 4. СИСТЕМА АУТЕНТИФИКАЦИИ
// ===========================================

const AuthSystem = {
  selectors: {
    loader: "#loader",
    form: "#login-form",
    usernameInput: "#login-username",
    passwordInput: "#login-password",
    passwordToggle: "#password-toggle",
    submitButton: "#login-submit",
    socialButtons: ".btn-social",
    forgotPasswordLink: ".forgot-password",
    registerLink: ".register-link",
    loginCard: "#login-card",
    alreadyLoggedIn: "#already-logged-in",
    currentUsername: "#current-username",
    logoutBtn: "#logout-btn",
    logoutLink: "#logout-link",
    navAuth: "#nav-auth",
    navUser: "#nav-user",
    navLogout: "#nav-logout",
  },

  init: () => {
    AuthSystem.checkAuthStatus()

    const form = document.querySelector(AuthSystem.selectors.form)
    if (!form) return

    AuthSystem.hideLoaderAfterDelay()
    AuthSystem.attachFormEventListeners()
    AuthSystem.attachPasswordToggle()
    AuthSystem.attachSocialButtons()
    AuthSystem.attachForgotPassword()
    AuthSystem.attachRegisterLink()
    AuthSystem.attachLogoutHandlers()
    
    // Проверяем JWT токен при загрузке
    AuthSystem.verifyTokenOnLoad();
  },

  checkAuthStatus: () => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"
    const username = localStorage.getItem("username")

    if (isAuthenticated && username) {
      AuthSystem.showAlreadyLoggedInView(username)
    } else {
      AuthSystem.showLoginForm()
    }

    AuthSystem.updateNavigation()
  },

  showAlreadyLoggedInView: (username) => {
    const loginCard = document.querySelector(AuthSystem.selectors.loginCard)
    const alreadyLoggedIn = document.querySelector(AuthSystem.selectors.alreadyLoggedIn)
    const currentUsername = document.querySelector(AuthSystem.selectors.currentUsername)

    if (loginCard) loginCard.style.display = "none"
    if (alreadyLoggedIn) alreadyLoggedIn.style.display = "block"
    if (currentUsername) currentUsername.textContent = `Добро пожаловать, ${username}!`
  },

  showLoginForm: () => {
    const loginCard = document.querySelector(AuthSystem.selectors.loginCard)
    const alreadyLoggedIn = document.querySelector(AuthSystem.selectors.alreadyLoggedIn)

    if (loginCard) loginCard.style.display = "block"
    if (alreadyLoggedIn) alreadyLoggedIn.style.display = "none"
  },

  updateNavigation: () => {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"
    const navAuth = document.querySelector(AuthSystem.selectors.navAuth)
    const navUser = document.querySelector(AuthSystem.selectors.navUser)
    const navLogout = document.querySelector(AuthSystem.selectors.navLogout)

    if (isAuthenticated) {
      if (navAuth) navAuth.style.display = "none"
      if (navUser) navUser.style.display = "block"
      if (navLogout) navLogout.style.display = "block"
    } else {
      if (navAuth) navAuth.style.display = "block"
      if (navUser) navUser.style.display = "none"
      if (navLogout) navLogout.style.display = "none"
    }
  },

  attachLogoutHandlers: () => {
    const logoutBtn = document.querySelector(AuthSystem.selectors.logoutBtn)
    const logoutLink = document.querySelector(AuthSystem.selectors.logoutLink)

    if (logoutBtn) {
      logoutBtn.addEventListener("click", AuthSystem.handleLogout)
    }
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => {
        e.preventDefault()
        AuthSystem.handleLogout()
      })
    }
  },

  handleLogout: () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("username")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userPhone")
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    localStorage.removeItem("user")
    localStorage.removeItem(JWT_STORAGE_KEY)

    NotificationSystem.show("Вы вышли из системы", "success")

    setTimeout(() => {
      window.location.href = "index.html"
    }, CONFIG.REDIRECT_DELAY)
  },

  hideLoaderAfterDelay: () => {
    const loader = document.querySelector(AuthSystem.selectors.loader)
    if (loader) {
      setTimeout(() => {
        loader.classList.add("hidden")
      }, CONFIG.LOADER_DELAY)
    }
  },

  attachFormEventListeners: () => {
    const form = document.querySelector(AuthSystem.selectors.form)
    if (form) {
      form.addEventListener("submit", AuthSystem.handleFormSubmit)
    }
  },

  handleFormSubmit: async (e) => {
    e.preventDefault()

    const username = document.querySelector(AuthSystem.selectors.usernameInput)?.value
    const password = document.querySelector(AuthSystem.selectors.passwordInput)?.value

    if (!username || !password) {
      NotificationSystem.show("Пожалуйста, заполните все поля", "error")
      return
    }

    const submitButton = document.querySelector(AuthSystem.selectors.submitButton)
    if (submitButton) submitButton.classList.add("loading")

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const result = await response.json()

      if (result.success) {
        AuthSystem.handleSuccessfulLogin(result.user, result.token, submitButton)
      } else {
        AuthSystem.handleFailedLogin(submitButton, result.message)
      }
    } catch (error) {
      console.error("Login error:", error)
      AuthSystem.handleLocalStorageLogin(username, password, submitButton)
    }
  },

  handleLocalStorageLogin: (username, password, submitButton) => {
    const users = JSON.parse(localStorage.getItem("projectd_users") || "[]")
    const user = users.find((u) => u.username === username && u.password === password)

    const isDemo = username === "admin" && password === "password"

    if (user || isDemo) {
      const userData = user || {
        id: "1",
        username: "admin",
        email: "admin@projectd.com",
        full_name: "Администратор",
        phone: "+7 (999) 123-45-67",
        role: "admin",
      }

      AuthSystem.handleSuccessfulLogin(userData, null, submitButton)
    } else {
      AuthSystem.handleFailedLogin(submitButton, "Неверный логин или пароль")
    }
  },

  handleSuccessfulLogin: (userData, token, submitButton) => {
    NotificationSystem.show("Успешный вход!", "success")

    // Сохраняем JWT токен если есть
    if (token) {
      localStorage.setItem(JWT_STORAGE_KEY, token);
    }
    
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("username", userData.username)
    localStorage.setItem("userEmail", userData.email || `${userData.username}@projectd.com`)
    localStorage.setItem("userPhone", userData.phone || "+7 (999) 123-45-67")
    localStorage.setItem("userId", userData.id || "1")
    localStorage.setItem("userRole", userData.role || "user")
    localStorage.setItem("user", JSON.stringify(userData))

    setTimeout(() => {
      window.location.href = "dashboard.html"
    }, CONFIG.REDIRECT_DELAY)
  },

  handleFailedLogin: (submitButton, message = "Неверный логин или пароль") => {
    NotificationSystem.show(message, "error")
    if (submitButton) submitButton.classList.remove("loading")
  },

  attachPasswordToggle: () => {
    const toggle = document.querySelector(AuthSystem.selectors.passwordToggle)
    const passwordInput = document.querySelector(AuthSystem.selectors.passwordInput)

    if (toggle && passwordInput) {
      toggle.addEventListener("click", AuthSystem.handlePasswordToggle)
    }
  },

  handlePasswordToggle: function () {
    const passwordInput = document.querySelector(AuthSystem.selectors.passwordInput)
    if (!passwordInput) return

    const isPassword = passwordInput.getAttribute("type") === "password"
    const newType = isPassword ? "text" : "password"

    passwordInput.setAttribute("type", newType)
    this.textContent = isPassword ? "Скрыть" : "Показать"

    this.style.transform = "translateY(-50%) scale(0.95)"
    setTimeout(() => {
      this.style.transform = "translateY(-50%) scale(1)"
    }, 150)
  },

  attachSocialButtons: () => {
    document.querySelectorAll(AuthSystem.selectors.socialButtons).forEach((button) => {
      button.addEventListener("click", AuthSystem.handleSocialLogin)
    })
  },

  handleSocialLogin: function () {
    const service = this.classList.contains("google-btn") ? "Google" : "Yandex"
    NotificationSystem.show(`Вход через ${service} временно недоступен`, "info")
  },

  attachForgotPassword: () => {
    const link = document.querySelector(AuthSystem.selectors.forgotPasswordLink)
    if (link) {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        NotificationSystem.show("Функция восстановления пароля временно недоступна", "info")
      })
    }
  },

  attachRegisterLink: () => {
    const link = document.querySelector(AuthSystem.selectors.registerLink)
    if (link) {
      link.addEventListener("click", (e) => {
        e.preventDefault()
        AuthSystem.showRegistrationForm()
      })
    }
  },

  showRegistrationForm: () => {
    const modalHTML = `
      <div class="modal-overlay" id="register-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Регистрация</h2>
            <button class="modal-close" id="modal-close">&times;</button>
          </div>
          <form class="registration-form" id="registration-form">
            <div class="form-group">
              <label for="reg-username">Логин *</label>
              <input type="text" id="reg-username" required minlength="3">
              <small>Минимум 3 символа</small>
            </div>
            
            <div class="form-group">
              <label for="reg-email">Email *</label>
              <input type="email" id="reg-email" required>
            </div>
            
            <div class="form-group">
              <label for="reg-fullname">Полное имя</label>
              <input type="text" id="reg-fullname">
            </div>
            
            <div class="form-group">
              <label for="reg-phone">Телефон</label>
              <input type="tel" id="reg-phone">
            </div>
            
            <div class="form-group">
              <label for="reg-password">Пароль *</label>
              <input type="password" id="reg-password" required minlength="6">
              <small>Минимум 6 символов</small>
            </div>
            
            <div class="form-group">
              <label for="reg-password-confirm">Подтверждение пароля *</label>
              <input type="password" id="reg-password-confirm" required>
            </div>
            
            <button type="submit" class="btn login-btn" id="reg-submit">
              <span class="btn-text">Зарегистрироваться</span>
              <div class="btn-loader">
                <div class="spinner"></div>
              </div>
            </button>
          </form>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML("beforeend", modalHTML)

    const modal = document.getElementById("register-modal")
    const form = document.getElementById("registration-form")
    const closeBtn = document.getElementById("modal-close")

    closeBtn.addEventListener("click", () => {
      modal.remove()
    })

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })

    form.addEventListener("submit", AuthSystem.handleRegistration)
  },

  handleRegistration: async (e) => {
    e.preventDefault()

    const formData = {
      username: document.getElementById("reg-username").value.trim(),
      email: document.getElementById("reg-email").value.trim().toLowerCase(),
      full_name: document.getElementById("reg-fullname").value.trim(),
      phone: document.getElementById("reg-phone").value.trim(),
      password: document.getElementById("reg-password").value,
      password_confirm: document.getElementById("reg-password-confirm").value,
    }

    if (!formData.username || !formData.email || !formData.password) {
      NotificationSystem.show("Пожалуйста, заполните все обязательные поля", "error")
      return
    }

    if (formData.password !== formData.password_confirm) {
      NotificationSystem.show("Пароли не совпадают", "error")
      return
    }

    if (formData.password.length < 6) {
      NotificationSystem.show("Пароль должен быть не менее 6 символов", "error")
      return
    }

    if (formData.username.length < 3) {
      NotificationSystem.show("Логин должен быть не менее 3 символов", "error")
      return
    }

    const submitButton = document.getElementById("reg-submit")
    submitButton.classList.add("loading")

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        NotificationSystem.show("Регистрация успешна! Теперь вы можете войти.", "success")

        document.querySelector(AuthSystem.selectors.usernameInput).value = formData.username
        document.querySelector(AuthSystem.selectors.passwordInput).value = formData.password

        setTimeout(() => {
          document.getElementById("register-modal").remove()
          submitButton.classList.remove("loading")
        }, 1000)
      } else {
        NotificationSystem.show(result.message, "error")
        submitButton.classList.remove("loading")
      }
    } catch (error) {
      console.error("Registration error:", error)

      const users = JSON.parse(localStorage.getItem("projectd_users") || "[]")

      if (users.find((u) => u.email === formData.email)) {
        NotificationSystem.show("Пользователь с таким email уже существует", "error")
        submitButton.classList.remove("loading")
        return
      }

      if (users.find((u) => u.username === formData.username)) {
        NotificationSystem.show("Пользователь с таким логином уже существует", "error")
        submitButton.classList.remove("loading")
        return
      }

      const newUser = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        is_active: true,
        role: "user",
      }

      users.push(newUser)
      localStorage.setItem("projectd_users", JSON.stringify(users))

      NotificationSystem.show("Регистрация успешна в локальном хранилище!", "success")

      document.querySelector(AuthSystem.selectors.usernameInput).value = formData.username
      document.querySelector(AuthSystem.selectors.passwordInput).value = formData.password

      setTimeout(() => {
        document.getElementById("register-modal").remove()
        submitButton.classList.remove("loading")
      }, 1000)
    }
  },

  verifyTokenOnLoad: async () => {
    const token = localStorage.getItem(JWT_STORAGE_KEY);
    if (!token) return;

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Сохраняем данные пользователя
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('username', data.user.username);
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('userRole', data.user.role);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          AuthSystem.updateNavigation();
          if (window.location.pathname.includes('contact.html')) {
            AuthSystem.showAlreadyLoggedInView(data.user.username);
          }
        } else {
          // Невалидный токен
          localStorage.removeItem(JWT_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Token verification error:', error);
    }
  }
}

// ПРОДОЛЖАЕМ ОСТАВШИЙСЯ КОД cars.js ТАК ЖЕ БЕЗ IIFE...
// ... остальной код (CarFilters, DashboardSystem, MapSystem и т.д.) ...

  // ===========================================
  // 5. ФИЛЬТРЫ АВТОМОБИЛЕЙ
  // ===========================================

  const CarFilters = {
    CONFIG: {
      filterSelectors: {
        brand: "#brand-filter",
        price: "#price-filter",
        year: "#year-filter",
        type: "#type-filter",
      },
      carCardSelector: ".car-card",
      resetButtonSelector: "#reset-filters",
      noResultsMessage: "Автомобили по вашим критериям не найдены.",
    },

    filters: {
      brand: "all",
      price: "all",
      year: "all",
      type: "all",
    },

    isInitialized: false,

    init: function () {
      if (this.isInitialized) return

      const filterElements = document.querySelectorAll("[data-filter]")
      filterElements.forEach((element) => {
        element.addEventListener("change", this.handleFilterChange.bind(this))
      })

      const resetBtn = document.querySelector(this.CONFIG.resetButtonSelector)
      if (resetBtn) {
        resetBtn.addEventListener("click", this.resetAllFilters.bind(this))
      }

      // Initial filter application
      setTimeout(() => {
        this.applyFilters()
        this.isInitialized = true
      }, 200)
    },

    handleFilterChange: function (event) {
      const filterType = event.target.dataset.filter
      this.filters[filterType] = event.target.value
      this.applyFilters()
    },

    applyFilters: function () {
      const carCards = document.querySelectorAll(this.CONFIG.carCardSelector)

      if (carCards.length === 0) {
        setTimeout(() => this.applyFilters(), 100)
        return
      }

      let visibleCount = 0

      carCards.forEach((card) => {
        const shouldShow = this.matchesFilters(card)
        card.style.display = shouldShow ? "flex" : "none"
        if (shouldShow) visibleCount++
      })

      this.displayNoResultsMessage(visibleCount === 0)
    },

    matchesFilters: function (card) {
      const cardBrand = card.getAttribute("data-brand")
      const cardPrice = card.getAttribute("data-price")
      const cardYear = card.getAttribute("data-year")
      const cardType = card.getAttribute("data-type")

      const brandMatch = this.filters.brand === "all" || cardBrand === this.filters.brand
      const priceMatch = this.filters.price === "all" || cardPrice === this.filters.price
      const yearMatch = this.filters.year === "all" || cardYear === this.filters.year
      const typeMatch = this.filters.type === "all" || cardType === this.filters.type

      return brandMatch && priceMatch && yearMatch && typeMatch
    },

    resetAllFilters: function () {
      this.filters = {
        brand: "all",
        price: "all",
        year: "all",
        type: "all",
      }

      Object.entries(this.CONFIG.filterSelectors).forEach(([key, selector]) => {
        const element = document.querySelector(selector)
        if (element) {
          element.value = "all"
        }
      })

      this.applyFilters()
    },

    displayNoResultsMessage: function (show) {
      let messageElement = document.getElementById("no-results-message")
      const carsGrid = document.querySelector(".cars-grid")

      if (show) {
        const carCards = document.querySelectorAll(this.CONFIG.carCardSelector)
        if (carCards.length === 0) return

        if (!messageElement) {
          messageElement = document.createElement("div")
          messageElement.id = "no-results-message"
          messageElement.className = "no-results-message"
          messageElement.textContent = this.CONFIG.noResultsMessage

          if (carsGrid) {
            carsGrid.appendChild(messageElement)
          }
        }
        messageElement.style.display = "block"
      } else if (messageElement) {
        messageElement.style.display = "none"
      }
    },
  }

  // ===========================================
  // 6. ДАШБОРД СИСТЕМА
  // ===========================================

  const DashboardSystem = (() => {
    const selectors = {
      loader: "#loader",
      userAvatar: "#user-avatar",
      profileName: "#profile-name",
      logoutLink: "#logout-link",
      searchInput: "#car-search",
      sortSelect: "#car-sort",
      tableBody: "#cars-table-body",
      prevBtn: "#prev-btn",
      nextBtn: "#next-btn",
      currentPage: "#current-page",
      totalPages: "#total-pages",
      editProfileBtn: "#edit-profile-btn",
      activityView: ".action-view",
      activityRemove: ".action-remove",
    }

    let currentPage = 1
    let filteredRows = []
    let allRows = []

    const init = async () => {
      checkAuthentication()
      hideLoaderAfterDelay()

      if (typeof DataManager !== "undefined") {
        DataManager.init()
      }

      await loadUserProfile()
      initializeCharts()
      await initializeFavoritesTable()
      initializeFiltersAndSearch()
      initializeLogout()
      attachEditProfileListener()
      initAnimations()
    }

    const checkAuthentication = () => {
      const isAuthenticated = localStorage.getItem("isAuthenticated")
      const username = localStorage.getItem("username")

      if (!isAuthenticated || !username) {
        NotificationSystem.show("Требуется авторизация", "info")
        setTimeout(() => {
          window.location.href = "contact.html"
        }, 1000)
        return
      }
    }

    const loadUserProfile = async () => {
      const username = localStorage.getItem("username")
      const userId = localStorage.getItem("userId")

      if (!username) {
        const userAvatar = document.querySelector(selectors.userAvatar)
        const profileName = document.querySelector(selectors.profileName)
        if (userAvatar) userAvatar.textContent = "A"
        if (profileName) profileName.textContent = "Гость"
        return
      }

      if (typeof DataManager !== "undefined") {
        DataManager.init()

        let userData = null

        if (userId && userId !== "1") {
          userData = await DataManager.getUserById(userId)
        }

        if (!userData && username) {
          userData = await DataManager.getUserByUsername(username)
        }

        if (userData) {
          const firstLetter = userData.username.charAt(0).toUpperCase()
          const displayName =
            userData.full_name || userData.username.charAt(0).toUpperCase() + userData.username.slice(1)

          const userAvatar = document.querySelector(selectors.userAvatar)
          const profileName = document.querySelector(selectors.profileName)
          if (userAvatar) userAvatar.textContent = firstLetter
          if (profileName) profileName.textContent = displayName

          const profileDate = document.querySelector("#profile-date")
          if (profileDate && userData.created_at) {
            const date = new Date(userData.created_at)
            const formattedDate = date.toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
            profileDate.textContent = `Присоединился: ${formattedDate}`
          }

          return
        }
      }

      const firstLetter = username.charAt(0).toUpperCase()
      const displayName = username.charAt(0).toUpperCase() + username.slice(1)

      const userAvatar = document.querySelector(selectors.userAvatar)
      const profileName = document.querySelector(selectors.profileName)
      if (userAvatar) userAvatar.textContent = firstLetter
      if (profileName) profileName.textContent = displayName
    }

    const hideLoaderAfterDelay = () => {
      const loader = document.querySelector(selectors.loader)
      if (loader) {
        setTimeout(() => {
          loader.classList.add("hidden")
        }, CONFIG.LOADER_DELAY)
      }
    }

    const initializeCharts = () => {
      initActivityChart()
      initBrandsChart()
      initTypesChart()
      initProgressChart()
    }

    const initActivityChart = () => {
      const ctx = document.getElementById("activityChart")
      if (!ctx || typeof window.Chart === "undefined") return

      new window.Chart(ctx.getContext("2d"), {
        type: "line",
        data: {
          labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
          datasets: [
            {
              label: "Просмотры",
              data: [12, 19, 8, 15, 22, 18, 25],
              borderColor: "#ff5500",
              backgroundColor: "rgba(255, 85, 0, 0.1)",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 5,
              pointBackgroundColor: "#ff5500",
              pointBorderColor: "white",
              pointBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: true,
              labels: { font: { size: 12 } },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "#e1e5e9" },
            },
            x: {
              grid: { color: "#e1e5e9" },
            },
          },
        },
      })
    }

    const initBrandsChart = () => {
      const ctx = document.getElementById("brandsChart")
      if (!ctx || typeof window.Chart === "undefined") return

      new window.Chart(ctx.getContext("2d"), {
        type: "bar",
        data: {
          labels: ["Toyota", "Nissan", "Mazda", "Honda", "Subaru"],
          datasets: [
            {
              label: "Количество просмотров",
              data: [8, 6, 5, 4, 3],
              backgroundColor: ["#ff5500", "#ff8c42", "#ffa366", "#ffb88c", "#ffd9b3"],
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: true,
              labels: { font: { size: 12 } },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: { color: "#e1e5e9" },
            },
          },
        },
      })
    }

    const initTypesChart = () => {
      const ctx = document.getElementById("typesChart")
      if (!ctx || typeof window.Chart === "undefined") return

      new window.Chart(ctx.getContext("2d"), {
        type: "pie",
        data: {
          labels: ["Купе", "Седан", "Хэтчбек", "Внедорожник"],
          datasets: [
            {
              data: [45, 25, 20, 10],
              backgroundColor: ["#ff5500", "#ff8c42", "#ffa366", "#ffb88c"],
              borderColor: "white",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: "bottom",
              labels: { font: { size: 12 }, padding: 15 },
            },
          },
        },
      })
    }

    const initProgressChart = () => {
      const ctx = document.getElementById("progressChart")
      if (!ctx || typeof window.Chart === "undefined") return

      new window.Chart(ctx.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: ["Выполнено", "Осталось"],
          datasets: [
            {
              data: [70, 30],
              backgroundColor: ["#ff5500", "#e1e5e9"],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: "70%",
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              enabled: false,
            },
          },
        },
        plugins: [
          {
            id: "doughnutLabel",
            afterDraw: (chart) => {
              const {
                ctx,
                chartArea: { width, height },
              } = chart
              ctx.save()
              ctx.font = "bold 20px Arial"
              ctx.fillStyle = "#333"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillText("70%", width / 2, height / 2)
              ctx.restore()
            },
          },
        ],
      })
    }

    const initializeFavoritesTable = async () => {
      const tableBody = document.querySelector(selectors.tableBody)
      if (!tableBody) return

      const userId = localStorage.getItem("userId") || "1"

      if (typeof DataManager !== "undefined") {
        DataManager.init()

        const favorites = await DataManager.getFavorites(userId)

        if (favorites.length === 0) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
                У вас пока нет избранных автомобилей. 
                <a href="cars.html" style="color: #ff5500; text-decoration: none;">Перейти в каталог →</a>
              </td>
            </tr>
          `
          return
        }

        let tableHTML = ""

        for (const favorite of favorites) {
          const car = await DataManager.getCarById(favorite.carId)

          if (car) {
            const addedDate = new Date(favorite.addedAt)
            const formattedDate = addedDate.toLocaleDateString("ru-RU")

            tableHTML += `
              <tr>
                <td>${car.name}</td>
                <td>${car.brand.charAt(0).toUpperCase() + car.brand.slice(1)}</td>
                <td>${car.year}</td>
                <td>${formatPrice(car.price)} руб</td>
                <td><span class="status-badge ${car.isAvailable ? "status-available" : "status-sold"}">${car.isAvailable ? "В наличии" : "Продано"}</span></td>
                <td>
                  <button class="action-btn action-view" title="Просмотреть" data-car-id="${car.id}">👁️</button>
                  <button class="action-btn action-remove" title="Удалить" data-favorite-id="${favorite.id}">🗑️</button>
                </td>
              </tr>
            `
          }
        }

        tableBody.innerHTML = tableHTML
        allRows = Array.from(tableBody.querySelectorAll("tr"))
        filteredRows = [...allRows]

        attachFavoriteActionButtons()
        updateTableDisplay(currentPage)
      } else {
        allRows = Array.from(tableBody.querySelectorAll("tr"))
        filteredRows = [...allRows]
        attachFavoriteActionButtons() // Используем ту же функцию
        updateTableDisplay(currentPage)
      }
    }

    const attachFavoriteActionButtons = () => {
      const viewButtons = document.querySelectorAll(".action-view")
      const removeButtons = document.querySelectorAll(".action-remove")

      viewButtons.forEach((btn) => {
        btn.addEventListener("click", handleFavoriteViewClick)
      })

      removeButtons.forEach((btn) => {
        btn.addEventListener("click", handleFavoriteRemoveClick)
      })
    }

    const handleFavoriteViewClick = async function () {
      const carId = this.getAttribute("data-car-id")

      if (typeof DataManager !== "undefined") {
        const car = await DataManager.getCarById(carId)
        if (car) {
          NotificationSystem.show(`Открытие деталей ${car.name}`, "info")
          showCarDetailsModal(car)
        }
      }
    }

    const handleFavoriteRemoveClick = async function () {
      const favoriteId = this.getAttribute("data-favorite-id")
      const row = this.closest("tr")
      const carName = row.querySelector("td").textContent

      if (typeof DataManager !== "undefined") {
        const userId = localStorage.getItem("userId") || "1"
        const favorites = await DataManager.getFavorites(userId)
        const favorite = favorites.find((f) => f.id.toString() === favoriteId)

        if (favorite) {
          const result = await DataManager.removeFavorite(userId, favorite.carId)

          if (result.success) {
            row.remove()
            allRows = allRows.filter((r) => r !== row)
            filteredRows = filteredRows.filter((r) => r !== row)

            currentPage = 1
            updateTableDisplay(currentPage)
            NotificationSystem.show(`${carName} удален из избранного`, "success")
          } else {
            NotificationSystem.show(result.message, "error")
          }
        }
      } else {
        row.remove()
        allRows = allRows.filter((r) => r !== row)
        filteredRows = filteredRows.filter((r) => r !== row)

        currentPage = 1
        updateTableDisplay(currentPage)
        NotificationSystem.show(`${carName} удален из избранного`, "success")
      }
    }

    const showCarDetailsModal = (car) => {
      // Проверка авторизации
      const currentUser = JSON.parse(localStorage.getItem("user"))

      const modalHTML = `
        <div class="modal-overlay" id="car-details-modal">
          <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
              <h2>${car.name}</h2>
              <button class="modal-close" id="modal-close">&times;</button>
            </div>
            
            <div style="display: flex; gap: 2rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 250px;">
                <img src="${car.image}" alt="${car.name}" style="width: 100%; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
              </div>
              <div style="flex: 1; min-width: 250px;">
                <h3 style="color: #333; margin-bottom: 1rem; font-size: 1.3rem;">Характеристики</h3>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                  <p style="margin: 0;"><strong>Марка:</strong> ${car.brand.charAt(0).toUpperCase() + car.brand.slice(1)}</p>
                  <p style="margin: 0;"><strong>Год:</strong> ${car.year}</p>
                  <p style="margin: 0;"><strong>Тип кузова:</strong> ${getTypeName(car.type)}</p>
                  <p style="margin: 0; font-size: 1.4rem; color: #e74c3c; font-weight: bold;"><strong>Цена:</strong> ${formatPrice(car.price)} руб</p>
                  <p style="margin: 0;"><strong>Статус:</strong> <span style="color: ${car.isAvailable ? "#27ae60" : "#e74c3c"};">${car.isAvailable ? "В наличии" : "Продано"}</span></p>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
              <h3 style="color: #333; margin-bottom: 0.5rem;">Описание</h3>
              <p style="color: #555; line-height: 1.6;">${car.description}</p>
            </div>
            
            <div style="margin-bottom: 2rem;">
              <h3 style="color: #333; margin-bottom: 0.5rem;">Технические характеристики</h3>
              <p style="color: #555;">${car.specs}</p>
            </div>
            
            ${
              car.isAvailable
                ? `
              <div style="border-top: 2px solid #e1e5e9; padding-top: 1.5rem; margin-top: 1.5rem;">
                <h3 style="color: #333; margin-bottom: 1rem;">Форма заказа</h3>
                ${
                  !currentUser
                    ? `
                  <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <p style="margin: 0; color: #856404;">Для оформления заказа необходимо <a href="contact.html" style="color: #e74c3c; text-decoration: underline;">войти в систему</a></p>
                  </div>
                `
                    : `
                  <form id="purchase-form" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div class="form-group">
                      <label for="customer-name" style="font-weight: 600; color: #333; margin-bottom: 0.3rem; display: block;">Ваше имя *</label>
                      <input type="text" id="customer-name" value="${currentUser.full_name || currentUser.username}" required 
                        style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">
                    </div>
                    
                    <div class="form-group">
                      <label for="customer-email" style="font-weight: 600; color: #333; margin-bottom: 0.3rem; display: block;">Email *</label>
                      <input type="email" id="customer-email" value="${currentUser.email || ""}" required 
                        style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">
                    </div>
                    
                    <div class="form-group">
                      <label for="customer-phone" style="font-weight: 600; color: #333; margin-bottom: 0.3rem; display: block;">Телефон *</label>
                      <input type="tel" id="customer-phone" value="${currentUser.phone || ""}" required placeholder="+7 (___) ___-__-__"
                        style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">
                    </div>
                    
                    <div class="form-group">
                      <label for="customer-message" style="font-weight: 600; color: #333; margin-bottom: 0.3rem; display: block;">Дополнительные пожелания</label>
                      <textarea id="customer-message" rows="3" placeholder="Укажите удобное время для связи, дополнительные вопросы..."
                        style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-top: 0.5rem;">
                      <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">Итоговая стоимость:</p>
                      <p style="margin: 0; font-size: 1.8rem; font-weight: bold; color: #e74c3c;">${formatPrice(car.price)} руб</p>
                    </div>
                    
                    <button type="submit" class="btn" id="purchase-submit-btn" 
                      style="width: 100%; padding: 1rem; font-size: 1.1rem; margin-top: 0.5rem; background: linear-gradient(135deg, #e74c3c, #c0392b); border: none; cursor: pointer;">
                      <span class="btn-text">Оформить заказ</span>
                      <div class="btn-loader" style="display: none;">
                        <div class="spinner"></div>
                      </div>
                    </button>
                  </form>
                `
                }
              </div>
            `
                : `
              <div style="background: #ffebee; border: 1px solid #e74c3c; padding: 1rem; border-radius: 8px; text-align: center;">
                <p style="margin: 0; color: #c62828; font-weight: 600;">Этот автомобиль уже продан</p>
              </div>
            `
            }
            
            <button class="btn btn-secondary" style="width: 100%; margin-top: 1rem;" id="close-details-btn">Закрыть</button>
          </div>
        </div>
      `

      document.body.insertAdjacentHTML("beforeend", modalHTML)

      const modal = document.getElementById("car-details-modal")
      const closeBtn = document.getElementById("modal-close")
      const closeDetailsBtn = document.getElementById("close-details-btn")
      const purchaseForm = document.getElementById("purchase-form")

      closeBtn.addEventListener("click", () => modal.remove())
      closeDetailsBtn.addEventListener("click", () => modal.remove())

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.remove()
        }
      })

      if (purchaseForm && currentUser) {
        purchaseForm.addEventListener("submit", async (e) => {
          e.preventDefault()

          const submitBtn = document.getElementById("purchase-submit-btn")
          const btnText = submitBtn.querySelector(".btn-text")
          const btnLoader = submitBtn.querySelector(".btn-loader")

          const orderData = {
            carId: car.id,
            carName: car.name,
            carPrice: car.price,
            userId: currentUser.id,
            customerName: document.getElementById("customer-name").value.trim(),
            customerEmail: document.getElementById("customer-email").value.trim(),
            customerPhone: document.getElementById("customer-phone").value.trim(),
            customerMessage: document.getElementById("customer-message").value.trim(),
            orderDate: new Date().toISOString(),
            status: "pending",
          }

          // Валидация
          if (!orderData.customerName || !orderData.customerEmail || !orderData.customerPhone) {
            if (typeof NotificationSystem !== "undefined") {
              NotificationSystem.show("Заполните все обязательные поля", "error")
            } else {
              alert("Заполните все обязательные поля")
            }
            return
          }

          // Показываем загрузку
          submitBtn.disabled = true
          btnText.style.display = "none"
          btnLoader.style.display = "block"

          try {
            let result

            // Пробуем использовать DataManager API
            if (typeof DataManager !== "undefined" && DataManager.createOrder) {
              result = await DataManager.createOrder(orderData)
            } else {
              // Fallback: сохраняем в localStorage
              const orders = JSON.parse(localStorage.getItem("orders") || "[]")
              orderData.id = Date.now()
              orders.push(orderData)
              localStorage.setItem("orders", JSON.stringify(orders))
              result = { success: true, orderId: orderData.id }
            }

            if (result.success) {
              if (typeof NotificationSystem !== "undefined") {
                NotificationSystem.show(
                  "Заказ успешно оформлен! Наш менеджер свяжется с вами в ближайшее время.",
                  "success",
                )
              } else {
                alert("Заказ успешно оформлен! Наш менеджер свяжется с вами в ближайшее время.")
              }

              setTimeout(() => {
                modal.remove()
              }, 2000)
            } else {
              throw new Error(result.message || "Ошибка при оформлении заказа")
            }
          } catch (error) {
            console.error("Error creating order:", error)
            if (typeof NotificationSystem !== "undefined") {
              NotificationSystem.show("Ошибка при оформлении заказа. Попробуйте позже.", "error")
            } else {
              alert("Ошибка при оформлении заказа. Попробуйте позже.")
            }
          } finally {
            submitBtn.disabled = false
            btnText.style.display = "block"
            btnLoader.style.display = "none"
          }
        })
      }
    }

    // Вспомогательные функции, вынесенные для чистоты кода
    const getTypeName = (type) => {
      const types = {
        coupe: "Купе",
        sedan: "Седан",
        hatchback: "Хэтчбек",
        suv: "Внедорожник",
      }
      return types[type] || type
    }

    const formatPrice = (price) => {
      return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    }

    const updateTableDisplay = (page) => {
      if (filteredRows.length === 0) {
        const tableBody = document.querySelector(selectors.tableBody)
        if (tableBody) {
          tableBody.innerHTML =
            '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Нет результатов</td></tr>'
        }
        updatePaginationState(page, 1)
        return
      }

      const startIndex = (page - 1) * CONFIG.ROWS_PER_PAGE
      const endIndex = startIndex + CONFIG.ROWS_PER_PAGE
      const totalPages = Math.ceil(filteredRows.length / CONFIG.ROWS_PER_PAGE)

      const tableBody = document.querySelector(selectors.tableBody)
      if (!tableBody) return

      tableBody.innerHTML = ""

      filteredRows.slice(startIndex, endIndex).forEach((row) => {
        const clonedRow = row.cloneNode(true)
        tableBody.appendChild(clonedRow)
      })

      attachFavoriteActionButtons()
      updatePaginationState(page, totalPages)
    }

    const updatePaginationState = (page, totalPages) => {
      const currentPageEl = document.querySelector(selectors.currentPage)
      const totalPagesEl = document.querySelector(selectors.totalPages)

      if (currentPageEl) currentPageEl.textContent = page
      if (totalPagesEl) totalPagesEl.textContent = totalPages

      const prevBtn = document.querySelector(selectors.prevBtn)
      const nextBtn = document.querySelector(selectors.nextBtn)

      if (prevBtn) prevBtn.disabled = page === 1
      if (nextBtn) nextBtn.disabled = page === totalPages
    }

    const initializeFiltersAndSearch = () => {
      const searchInput = document.querySelector(selectors.searchInput)
      const sortSelect = document.querySelector(selectors.sortSelect)
      const prevBtn = document.querySelector(selectors.prevBtn)
      const nextBtn = document.querySelector(selectors.nextBtn)

      if (searchInput) {
        searchInput.addEventListener("keyup", handleSearch)
      }

      if (sortSelect) {
        sortSelect.addEventListener("change", handleSort)
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          if (currentPage > 1) {
            currentPage--
            updateTableDisplay(currentPage)
          }
        })
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          const totalPages = Math.ceil(filteredRows.length / CONFIG.ROWS_PER_PAGE)
          if (currentPage < totalPages) {
            currentPage++
            updateTableDisplay(currentPage)
          }
        })
      }
    }

    const handleSearch = () => {
      const searchTerm = document.querySelector(selectors.searchInput)?.value.toLowerCase()
      if (searchTerm === undefined) return

      currentPage = 1

      filteredRows = allRows.filter((row) => {
        const text = row.textContent.toLowerCase()
        return text.includes(searchTerm)
      })

      updateTableDisplay(currentPage)
    }

    const handleSort = () => {
      const sortSelect = document.querySelector(selectors.sortSelect)
      if (!sortSelect) return

      const sortValue = sortSelect.value
      currentPage = 1

      filteredRows.sort((a, b) => {
        const aName = a.querySelector("td:nth-child(1)")?.textContent.trim() || ""
        const bName = b.querySelector("td:nth-child(1)")?.textContent.trim() || ""
        const aPrice = Number.parseInt((a.querySelector("td:nth-child(4)")?.textContent || "").replace(/\D/g, "")) || 0
        const bPrice = Number.parseInt((b.querySelector("td:nth-child(4)")?.textContent || "").replace(/\D/g, "")) || 0
        const aYear = Number.parseInt(a.querySelector("td:nth-child(3)")?.textContent || "0") || 0
        const bYear = Number.parseInt(b.querySelector("td:nth-child(3)")?.textContent || "0") || 0

        switch (sortValue) {
          case "name":
            return aName.localeCompare(bName)
          case "price-low":
            return aPrice - bPrice
          case "price-high":
            return bPrice - aPrice
          case "year":
            return bYear - aYear
          default:
            return 0
        }
      })

      updateTableDisplay(currentPage)
    }

    const initializeLogout = () => {
      const logoutLink = document.querySelector(selectors.logoutLink)
      if (logoutLink) {
        logoutLink.addEventListener("click", (e) => {
          e.preventDefault()
          localStorage.removeItem("isAuthenticated")
          localStorage.removeItem("username")
          localStorage.removeItem("userId")
          localStorage.removeItem("userRole")
          localStorage.removeItem("userEmail")
          localStorage.removeItem("userPhone")
          localStorage.removeItem("user") // Удаляем полный объект пользователя
          NotificationSystem.show("Вы успешно вышли", "success")
          setTimeout(() => {
            window.location.href = "index.html"
          }, CONFIG.REDIRECT_DELAY)
        })
      }
    }

    const attachEditProfileListener = () => {
      const editBtn = document.querySelector(selectors.editProfileBtn)
      if (editBtn) {
        editBtn.addEventListener("click", () => {
          NotificationSystem.show("Функция редактирования профиля временно недоступна", "info")
        })
      }
    }

    const initAnimations = () => {
      const animatedElements = document.querySelectorAll(".animate-on-scroll")

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("animate")
            }
          })
        },
        {
          threshold: 0.1,
        },
      )

      animatedElements.forEach((element) => {
        observer.observe(element)
      })

      const cards = document.querySelectorAll(".card, .stat-card")
      cards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          card.style.transform = "translateY(-5px)"
          card.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.15)"
        })

        card.addEventListener("mouseleave", () => {
          card.style.transform = "translateY(0)"
          card.style.boxShadow = "var(--card-shadow)"
        })
      })

      const buttons = document.querySelectorAll(".btn")
      buttons.forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
          btn.style.transform = "translateY(-2px)"
        })

        btn.addEventListener("mouseleave", () => {
          btn.style.transform = "translateY(0)"
        })
      })
    }

    return { init }
  })()

  // ===========================================
  // 7. КАРТА И ГЕОЛОКАЦИЯ
  // ===========================================

  const MapSystem = {
    init: function () {
      if (typeof window.ymaps === "undefined") {
        console.error("Yandex Maps API не загружена")
        this.showFallbackMap()
        return
      }

      window.ymaps.ready(this.initMap.bind(this))
    },

    initMap: function () {
      const mapContainer = document.getElementById("map")
      if (!mapContainer) return

      // Устанавливаем центр на Ростов-на-Дону
      const map = new window.ymaps.Map("map", {
        center: [47.222078, 39.720358], // Координаты центра Ростова-на-Дону
        zoom: 12,
        controls: ["zoomControl", "fullscreenControl", "typeSelector"],
      })

      const dealerCollection = new window.ymaps.GeoObjectCollection(null, {
        preset: "islands#blueAutoIcon",
        iconColor: "#ff5500",
      })

      const dealers = [
        {
          id: 1,
          coords: [47.222078, 39.720358], // Центр Ростова-на-Дону
          title: "Главный магазин Project D",
          address: "ул. Большая Садовая, 106, Ростов-на-Дону",
          phone: "+7 (863) 303-03-03",
          hours: "09:00 - 21:00",
          description: "Главный магазин и штаб-квартира Project D в Ростове-на-Дону. Здесь представлены все модели автомобилей, сервисный центр и консультации специалистов.",
          services: ["Продажа автомобилей", "Сервисное обслуживание", "Тест-драйв", "Финансирование", "Trade-in", "Гарантия"],
          manager: "Александр Иванов",
          isMain: true // Флаг главного магазина
        },
        {
          id: 2,
          coords: [47.235378, 39.703112],
          title: "Дилерский центр Project D - Западный",
          address: "пр. Стачки, 189, Ростов-на-Дону",
          phone: "+7 (863) 303-03-04",
          hours: "10:00 - 20:00",
          description: "Западный дилерский центр Project D. Специализация - премиальные модели и кастомные проекты.",
          services: ["Тест-драйв", "Кастомизация", "Сервис", "Экспресс-кредит"],
          manager: "Екатерина Петрова",
        },
        {
          id: 3,
          coords: [47.258642, 39.733465],
          title: "Дилерский центр Project D - Северный",
          address: "ул. Таганрогская, 112, Ростов-на-Дону",
          phone: "+7 (863) 303-03-05",
          hours: "09:00 - 19:00",
          description: "Северный дилерский центр Project D. Крупнейший склад запчастей в регионе.",
          services: ["Сервис", "Запчасти", "Шиномонтаж", "Диагностика"],
          manager: "Дмитрий Сидоров",
        },
        {
          id: 4,
          coords: [47.205525, 39.652062],
          title: "Дилерский центр Project D - Южный",
          address: "ул. Малиновского, 36, Ростов-на-Дону",
          phone: "+7 (863) 303-03-06",
          hours: "10:00 - 22:00",
          description: "Южный дилерский центр Project D. Специальные условия для постоянных клиентов.",
          services: ["Тест-драйв", "Сезонное хранение", "Тюнинг", "Обучение вождению"],
          manager: "Мария Кузнецова",
        },
        {
          id: 5,
          coords: [55.751244, 37.618423], // Москва
          title: "Москва - Представительство",
          address: "ул. Тверская, 7, Москва",
          phone: "+7 (495) 123-45-67",
          hours: "09:00 - 21:00",
          description: "Московское представительство Project D. Здесь вы найдете весь модельный ряд.",
          services: ["Тест-драйв", "Сервис", "Финансирование", "Trade-in"],
          manager: "Иван Петров",
        },
        {
          id: 6,
          coords: [59.93428, 30.335098], // Санкт-Петербург
          title: "Санкт-Петербург - Представительство",
          address: "Невский пр-т, 28, Санкт-Петербург",
          phone: "+7 (812) 987-65-43",
          hours: "10:00 - 20:00",
          description: "Санкт-Петербургское представительство Project D. Специализация - премиальные модели.",
          services: ["Тест-драйв", "Сервис", "Экспресс-кредит"],
          manager: "Анна Сидорова",
        }
      ]

      dealers.forEach((dealer) => {
        // Используем другую иконку для главного магазина
        const iconPreset = dealer.isMain ? "islands#redAutoIcon" : "islands#blueAutoIcon"
        const iconColor = dealer.isMain ? "#ff0000" : "#ff5500"
        const iconSize = dealer.isMain ? [40, 40] : [30, 30]

        const placemark = new window.ymaps.Placemark(
          dealer.coords,
          {
            balloonContentHeader: `<strong style="color: ${dealer.isMain ? '#ff0000' : '#333'}">${dealer.title} ${dealer.isMain ? '🏢' : ''}</strong>`,
            balloonContentBody: `
            <div class="dealer-balloon">
              ${dealer.isMain ? '<div style="background: #ff5500; color: white; padding: 5px 10px; border-radius: 5px; margin-bottom: 10px; font-weight: bold;">🏢 ГЛАВНЫЙ МАГАЗИН</div>' : ''}
              <p><strong>📍 Адрес:</strong> ${dealer.address}</p>
              <p><strong>📞 Телефон:</strong> ${dealer.phone}</p>
              <p><strong>🕒 Часы работы:</strong> ${dealer.hours}</p>
              <p><strong>👨‍💼 Менеджер:</strong> ${dealer.manager}</p>
              <p>${dealer.description}</p>
              <div class="dealer-services">
                <strong>Услуги:</strong>
                <ul style="padding-left: 20px; margin-top: 5px;">
                  ${dealer.services.map((service) => `<li>${service}</li>`).join("")}
                </ul>
              </div>
              <button class="btn btn-small" onclick="window.location.href='contact.html'" style="margin-top: 10px; background: ${dealer.isMain ? '#ff0000' : '#ff5500'}; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">Записаться</button>
            </div>
          `,
            hintContent: dealer.title,
          },
          {
            preset: iconPreset,
            iconColor: iconColor,
            iconSize: iconSize,
            balloonCloseButton: true,
            balloonLayout: window.ymaps.templateLayoutFactory.createClass(
              '<div class="balloon-layout">$[[options.contentLayout]]</div>'
            ),
          },
        )

        placemark.events.add("click", function (e) {
          e.preventDefault()
          this.balloon.open()
          this.animateMarker("click")
          
          // Показываем уведомление для главного магазина
          if (dealer.isMain) {
            NotificationSystem.show("Вы выбрали главный магазин Project D в Ростове-на-Дону!", "info")
          }
        })

        placemark.events.add("mouseenter", function () {
          this.animateMarker("hover")
        })

        placemark.events.add("mouseleave", function () {
          this.animateMarker("leave")
        })

        placemark.animateMarker = function (action) {
          switch (action) {
            case "hover":
              this.options.set("iconColor", dealer.isMain ? "#ff3333" : "#ff3300")
              this.options.set("iconSize", dealer.isMain ? [45, 45] : [35, 35])
              break
            case "leave":
              this.options.set("iconColor", dealer.isMain ? "#ff0000" : "#ff5500")
              this.options.set("iconSize", dealer.isMain ? [40, 40] : [30, 30])
              break
            case "click":
              this.options.set("iconColor", "#ff0000")
              setTimeout(() => {
                this.options.set("iconColor", dealer.isMain ? "#ff0000" : "#ff5500")
              }, 500)
              break
          }
        }

        dealerCollection.add(placemark)
      })

      map.geoObjects.add(dealerCollection)

      // Открываем балун главного магазина при загрузке
      setTimeout(() => {
        const mainDealer = dealerCollection.get(0)
        if (mainDealer) {
          mainDealer.balloon.open()
        }
      }, 1000)

      document.getElementById("find-me-btn")?.addEventListener("click", () => {
        this.findUserLocation(map, dealerCollection, dealers)
      })

      document.getElementById("reset-view-btn")?.addEventListener("click", () => {
        map.setCenter([47.222078, 39.720358], 12) // Центр Ростова-на-Дону
        NotificationSystem.show("Вид карты сброшен на главный магазин", "info")
      })

      document.getElementById("show-all-dealers-btn")?.addEventListener("click", () => {
        this.showAllDealers(map, dealerCollection)
      })

      setTimeout(() => {
        this.findUserLocation(map, dealerCollection, dealers, true)
      }, 1000)

      setTimeout(() => {
        this.animateMarkersOnLoad(dealerCollection)
      }, 1500)
    },

    findUserLocation: function (map, dealerCollection, dealers, isInitial = false) {
      if (!navigator.geolocation) {
        NotificationSystem.show("Геолокация не поддерживается вашим браузером", "error")
        return
      }

      NotificationSystem.show("Определяем ваше местоположение...", "info")

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = [position.coords.latitude, position.coords.longitude]

          const userPlacemark = new window.ymaps.Placemark(
            userCoords,
            {
              balloonContentHeader: "📍 Вы здесь",
              balloonContentBody: "Ваше текущее местоположение",
              hintContent: "Ваше местоположение",
            },
            {
              preset: "islands#blueCircleDotIcon",
              iconColor: "#2196F3",
              iconGlyph: "user",
            },
          )

          // Удаляем предыдущий маркер пользователя, если есть
          map.geoObjects.remove(map.geoObjects.get(0))
          map.geoObjects.add(userPlacemark)

          map.setCenter(userCoords, 12)

          this.showNearestDealer(userCoords, dealers)

          if (!isInitial) {
            NotificationSystem.show("Ваше местоположение определено!", "success")
          }
        },
        (error) => {
          console.error("Ошибка геолокации:", error)
          let errorMessage = "Не удалось определить ваше местоположение. "

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Разрешение на геолокацию отклонено."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Информация о местоположении недоступна."
              break
            case error.TIMEOUT:
              errorMessage += "Время ожидания истекло."
              break
            default:
              errorMessage += "Неизвестная ошибка."
          }

          NotificationSystem.show(errorMessage, "error")
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        },
      )
    },

    showNearestDealer: function (userCoords, dealers) {
      let nearestDealer = null
      let minDistance = Number.POSITIVE_INFINITY

      dealers.forEach((dealer) => {
        const distance = this.getDistance(userCoords, dealer.coords)
        if (distance < minDistance) {
          minDistance = distance
          nearestDealer = dealer
        }
      })

      if (nearestDealer) {
        const distanceText =
          minDistance < 1 ? `${(minDistance * 1000).toFixed(0)} метров` : `${minDistance.toFixed(1)} км`

        const infoElement = document.getElementById("nearest-dealer-info")
        const textElement = document.getElementById("nearest-dealer-text")

        if (infoElement && textElement) {
          const isMainStore = nearestDealer.isMain ? " 🏢 ГЛАВНЫЙ МАГАЗИН" : ""
          
          textElement.innerHTML = `
            <strong>${nearestDealer.title}${isMainStore}</strong><br>
            📍 ${nearestDealer.address}<br>
            📞 ${nearestDealer.phone}<br>
            🕒 ${nearestDealer.hours}<br>
            <span style="color: ${nearestDealer.isMain ? '#ff0000' : '#28a745'}; font-weight: bold;">🗺️ Расстояние: ${distanceText}</span>
          `
          infoElement.style.display = "block"
          infoElement.style.background = nearestDealer.isMain ? "rgba(255, 0, 0, 0.1)" : "rgba(255, 85, 0, 0.1)"
          infoElement.style.borderLeft = `4px solid ${nearestDealer.isMain ? "#ff0000" : "#ff5500"}`

          setTimeout(() => {
            infoElement.classList.add("slide-up")
          }, 100)
        }
      }
    },

    getDistance: (coord1, coord2) => {
      const [lat1, lon1] = coord1
      const [lat2, lon2] = coord2

      const R = 6371
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLon = ((lon2 - lon1) * Math.PI) / 180

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    },

    animateMarkersOnLoad: (dealerCollection) => {
      dealerCollection.each((marker, index) => {
        setTimeout(() => {
          const isMain = marker.properties.get('balloonContentHeader', '').includes('ГЛАВНЫЙ МАГАЗИН')
          marker.options.set("iconSize", isMain ? [45, 45] : [35, 35])
          setTimeout(() => {
            marker.options.set("iconSize", isMain ? [40, 40] : [30, 30])
          }, 300)
        }, index * 200)
      })
    },

    showAllDealers: (map, dealerCollection) => {
      const bounds = dealerCollection.getBounds()
      if (bounds) {
        map.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: 50,
        })
        NotificationSystem.show("Показаны все дилерские центры", "info")
      }
    },

    showFallbackMap: () => {
      const mapContainer = document.getElementById("map")
      if (mapContainer) {
        mapContainer.innerHTML = `
          <div class="fallback-map" style="
            background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
            color: white;
            height: 600px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          ">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🗺️</div>
            <h3 style="color: #ff5500; margin-bottom: 1rem;">Карта временно недоступна</h3>
            <p style="margin-bottom: 2rem; max-width: 600px;">
              Для отображения интерактивной карты необходим API ключ Яндекс.Карт.
              Вы можете получить его на <a href="https://developer.tech.yandex.ru/" 
              style="color: #ff5500; text-decoration: underline;">developer.tech.yandex.ru</a>
            </p>
            <div class="dealer-list" style="text-align: left; background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 10px;">
              <h4 style="color: #ff5500; margin-bottom: 1rem;">🏢 Наши магазины и представительства:</h4>
              <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 0.8rem; background: rgba(255, 0, 0, 0.2); padding: 10px; border-radius: 5px; border-left: 3px solid #ff0000;">
                  <strong>🏢 Ростов-на-Дону - Главный магазин Project D</strong><br>
                  📍 ул. Большая Садовая, 106<br>
                  📞 +7 (863) 303-03-03<br>
                  🕒 09:00 - 21:00
                </li>
                <li style="margin-bottom: 0.8rem;">
                  <strong>Ростов-на-Дону - Западный</strong><br>
                  📍 пр. Стачки, 189<br>
                  📞 +7 (863) 303-03-04
                </li>
                <li style="margin-bottom: 0.8rem;">
                  <strong>Ростов-на-Дону - Северный</strong><br>
                  📍 ул. Таганрогская, 112<br>
                  📞 +7 (863) 303-03-05
                </li>
                <li style="margin-bottom: 0.8rem;">
                  <strong>Ростов-на-Дону - Южный</strong><br>
                  📍 ул. Малиновского, 36<br>
                  📞 +7 (863) 303-03-06
                </li>
                <li style="margin-bottom: 0.8rem;">
                  <strong>Москва - Представительство</strong><br>
                  📍 ул. Тверская, 7<br>
                  📞 +7 (495) 123-45-67
                </li>
                <li>
                  <strong>Санкт-Петербург - Представительство</strong><br>
                  📍 Невский пр-т, 28<br>
                  📞 +7 (812) 987-65-43
                </li>
              </ul>
              <p style="margin-top: 1rem; color: #ff5500; font-size: 0.9rem;">
                ⭐ Главный магазин находится в Ростове-на-Дону по адресу: ул. Большая Садовая, 106
              </p>
            </div>
          </div>
        `
      }
    },
  }

  // ===========================================
  // 8. ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ DOM
  // ===========================================

  document.addEventListener("DOMContentLoaded", () => {
    // Инициализация фильтров автомобилей
    const hasCarFilters = document.querySelector("#brand-filter") || document.querySelector(".car-card")
    if (hasCarFilters) {
      CarFilters.init()

      // Обработка кнопок "Подробнее" для автомобилей - ИЗМЕНЕНО ДЛЯ РЕДИРЕКТА
      const detailButtons = document.querySelectorAll(".btn-secondary")
      detailButtons.forEach((button) => {
        button.addEventListener("click", function () {
          const carCard = this.closest(".car-card")
          if (carCard) {
            const carName = carCard.querySelector("h3")?.textContent || "автомобиля"
            
            // Получаем URL страницы покупки на основе названия автомобиля
            const buyPage = getBuyPageUrl(carName)
            
            if (buyPage && buyPage !== '#') {
              // Перенаправляем на страницу покупки
              window.location.href = buyPage
            } else {
              // Если страница не найдена, показываем уведомление
              NotificationSystem.show(`Страница покупки для ${carName} не найдена`, "info")
            }
          }
        })
      })
    }

    // Инициализация системы аутентификации
    const hasAuthForm = document.querySelector("#login-form")
    if (hasAuthForm) {
      AuthSystem.init()
    }

    // Инициализация дашборда - ПРОВЕРЯЕМ ПО НАЛИЧИЮ ЭЛЕМЕНТОВ ДАШБОРДА
    const hasDashboardElements = document.querySelector("#profile-name") || 
                                 document.querySelector("#activityChart") ||
                                 document.querySelector("#cars-table")
    
    if (hasDashboardElements && typeof DashboardSystem !== "undefined") {
      console.log("Инициализация дашборда...")
      DashboardSystem.init()
    }

    // Инициализация карты
    const hasMap = document.querySelector("#map")
    if (hasMap) {
      MapSystem.init()
    }

    // Общая инициализация DataManager
    if (typeof DataManager !== "undefined") {
      DataManager.init()
    }
    
    // Скрываем лоадер через 2 секунды на всякий случай (fallback)
    setTimeout(() => {
      const loader = document.querySelector("#loader")
      if (loader && !loader.classList.contains("hidden")) {
        loader.classList.add("hidden")
        console.log("Лоадер скрыт по таймауту")
      }
    }, 2000)
  })

  // ===========================================
  // 9. ЭКСПОРТ ДЛЯ ГЛОБАЛЬНОГО ИСПОЛЗОВАНИЯ
  // ===========================================

  window.ProjectD = {
    NotificationSystem,
    DataManager,
    AuthSystem,
    CarFilters,
    DashboardSystem,
    MapSystem,
  }
  
  // Автоматическая инициализация дашборда при прямом доступе к функциям
  // Это запасной вариант на случай, если обычная инициализация не сработала
  if (typeof DashboardSystem !== "undefined" && document.querySelector("#profile-name")) {
    console.log("Автоматическая инициализация дашборда...")
    setTimeout(() => {
      DashboardSystem.init()
    }, 100)
  }
  
  // Скрываем лоадер при полной загрузке страницы
  window.addEventListener('load', function() {
    const loader = document.querySelector("#loader")
    if (loader) {
      setTimeout(() => {
        loader.classList.add("hidden")
        console.log("Лоадер скрыт после полной загрузки страницы")
      }, 500)
    }
  })

  // ===========================================
  // 10. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РЕДИРЕКТА
  // ===========================================

  // Функция для получения URL страницы покупки на основе названия автомобиля
  function getBuyPageUrl(carName) {
    const buyPages = {
      'Toyota GR86': 'buy-toyota-gr86.html',
      'Toyota Supra MK4': 'buy-toyota-supra-mk4.html',
      'Nissan GT-R Nismo': 'buy-nissan-gtr-nismo.html',
      'Nissan Silvia S15': 'buy-nissan-silvia-s15.html',
      'Mazda RX-7 FD': 'buy-mazda-rx7-fd.html',
      'Honda S2000': 'buy-honda-s2000.html',
      'Subaru WRX STI': 'buy-subaru-wrx-sti.html',
      'Mitsubishi Lancer Evolution X': 'buy-mitsubishi-lancer-evo-x.html'
    };
    
    return buyPages[carName] || '#';
  }

  // ===========================================
  // 11. ОБРАБОТКА ИЗБРАННОГО НА СТРАНИЦЕ АВТОМОБИЛЕЙ
  // ===========================================

  // Функция для обновления состояния кнопок избранного
  function updateFavoriteButtons() {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      
      if (typeof DataManager !== 'undefined') {
          DataManager.getFavorites(userId)
              .then(favorites => {
                  document.querySelectorAll('.add-to-favorite-btn').forEach(button => {
                      const carId = button.getAttribute('data-car-id');
                      const isFavorite = favorites.some(f => f.carId == carId);
                      
                      if (isFavorite) {
                          button.innerHTML = '<span class="favorite-icon">❤️</span> В избранном';
                          button.classList.add('favorited');
                      } else {
                          button.innerHTML = '<span class="favorite-icon">🤍</span> В избранное';
                          button.classList.remove('favorited');
                      }
                  });
              })
              .catch(error => {
                  console.error('Error updating favorite buttons:', error);
              });
      }
  }
  
  // Обработчик для кнопок избранного
  document.addEventListener('click', async function(event) {
      if (event.target.classList.contains('add-to-favorite-btn') || 
          event.target.closest('.add-to-favorite-btn')) {
          
          const button = event.target.classList.contains('add-to-favorite-btn') 
              ? event.target 
              : event.target.closest('.add-to-favorite-btn');
          
          const carId = button.getAttribute('data-car-id');
          const carName = button.getAttribute('data-car-name') || 'Автомобиль';
          const userId = localStorage.getItem('userId');
          
          if (!userId) {
              if (typeof NotificationSystem !== 'undefined') {
                  NotificationSystem.show('Для добавления в избранное необходимо войти в систему', 'error');
              }
              setTimeout(() => {
                  window.location.href = 'contact.html';
              }, 1500);
              return;
          }
          
          const isCurrentlyFavorited = button.classList.contains('favorited');
          
          try {
              if (isCurrentlyFavorited) {
                  // Удаление из избранного
                  const result = await DataManager.removeFavorite(userId, carId);
                  if (result.success) {
                      button.innerHTML = '<span class="favorite-icon">🤍</span> В избранное';
                      button.classList.remove('favorited');
                      if (typeof NotificationSystem !== 'undefined') {
                          NotificationSystem.show(`${carName} удален из избранного`, 'success');
                      }
                  } else {
                      if (typeof NotificationSystem !== 'undefined') {
                          NotificationSystem.show('Ошибка при удалении из избранного', 'error');
                      }
                  }
              } else {
                  // Добавление в избранное
                  const result = await DataManager.addFavorite(userId, carId);
                  if (result.success) {
                      button.innerHTML = '<span class="favorite-icon">❤️</span> В избранном';
                      button.classList.add('favorited');
                      if (typeof NotificationSystem !== 'undefined') {
                          NotificationSystem.show(`${carName} добавлен в избранное`, 'success');
                      }
                  } else {
                      if (typeof NotificationSystem !== 'undefined') {
                          NotificationSystem.show(result.message || 'Ошибка при добавлении в избранное', 'error');
                      }
                  }
              }
          } catch (error) {
              console.error('Error toggling favorite:', error);
              if (typeof NotificationSystem !== 'undefined') {
                  NotificationSystem.show('Ошибка при работе с избранным', 'error');
              }
          }
      }
  });
  
  // Обновляем кнопки избранного при загрузке страницы
  document.addEventListener('DOMContentLoaded', function() {
      setTimeout(() => {
          updateFavoriteButtons();
      }, 1000);
  });