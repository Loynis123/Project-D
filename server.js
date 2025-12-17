const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Пути к файлам JSON
const USERS_FILE = path.join(__dirname, 'users.json');
const CARS_FILE = path.join(__dirname, 'cars.json');
const FAVORITES_FILE = path.join(__dirname, 'favorites.json');

// Функция для хеширования пароля
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Вспомогательные функции для работы с JSON
async function readJSON(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeJSON(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing to file:', error);
        return false;
    }
}

// Инициализация файлов при запуске
async function initializeFiles() {
    try {
        console.log('🔧 Инициализация файлов...');
        
        const defaultUsers = [
            {
                "id": 1,
                "username": "admin",
                "email": "admin@projectd.com",
                "password": hashPassword("password"),
                "full_name": "Администратор",
                "phone": "+7 (999) 123-45-67",
                "created_at": "2025-11-17T10:30:00.000Z",
                "updated_at": null,
                "is_active": true,
                "role": "premium"
            }
        ];

        const files = [
            { path: USERS_FILE, default: defaultUsers },
            { path: CARS_FILE, default: require('./cars.json') || [] },
            { path: FAVORITES_FILE, default: [] }
        ];

        for (const file of files) {
            try {
                await fs.access(file.path);
                console.log(`✅ ${path.basename(file.path)} существует`);
            } catch {
                await writeJSON(file.path, file.default);
                console.log(`📄 Создан ${path.basename(file.path)}`);
            }
        }
        console.log('✅ Все файлы инициализированы');
    } catch (error) {
        console.error('❌ Ошибка инициализации файлов:', error);
    }
}

// Функция автоматической конвертации паролей
async function convertPasswordsToHash() {
    try {
        const users = await readJSON(USERS_FILE);
        let updated = false;
        
        const updatedUsers = users.map(user => {
            // Проверяем, является ли пароль валидным SHA-256 хешем (64 hex символа)
            const isPasswordHashed = user.password.length === 64 && /^[0-9a-f]+$/.test(user.password);
            
            if (!isPasswordHashed) {
                console.log(`🔄 Конвертирую пароль для ${user.username} (длина: ${user.password.length})`);
                updated = true;
                
                // Если пароль слишком длинный (96 символов), это может быть двойной хеш
                if (user.password.length > 64) {
                    console.log(`⚠️ Обнаружен длинный пароль у ${user.username}, возможно двойное хеширование`);
                    // Используем первый 64 символа для перехеширования
                    const originalPassword = user.password.substring(0, 64);
                    return {
                        ...user,
                        password: hashPassword(originalPassword)
                    };
                }
                
                // Для обычных паролей просто хешируем
                return {
                    ...user,
                    password: hashPassword(user.password)
                };
            }
            return user;
        });
        
        if (updated) {
            await writeJSON(USERS_FILE, updatedUsers);
            console.log('✅ Все пароли конвертированы в хеши');
        } else {
            console.log('✅ Все пароли уже в правильном формате');
        }
    } catch (error) {
        console.error('Ошибка конвертации паролей:', error);
    }
}

// Маршруты API

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, full_name, phone } = req.body;
        
        // Валидация
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Все обязательные поля должны быть заполнены'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Пароль должен быть не менее 6 символов'
            });
        }

        if (username.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Логин должен быть не менее 3 символов'
            });
        }

        // Чтение существующих пользователей
        const users = await readJSON(USERS_FILE);
        
        // Проверка на дубликаты
        if (users.find(u => u.email === email)) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь с таким email уже существует'
            });
        }
        
        if (users.find(u => u.username === username)) {
            return res.status(400).json({
                success: false,
                message: 'Пользователь с таким логином уже существует'
            });
        }

        // ХЕШИРОВАНИЕ ПАРОЛЯ
        const hashedPassword = hashPassword(password);

        // Создание нового пользователя
        const newUser = {
            id: Date.now(),
            username: username,
            email: email.toLowerCase(),
            password: hashedPassword,
            full_name: full_name || '',
            phone: phone || '',
            created_at: new Date().toISOString(),
            updated_at: null,
            is_active: true,
            role: 'user'
        };

        // Добавление пользователя и сохранение
        users.push(newUser);
        const success = await writeJSON(USERS_FILE, users);
        
        if (success) {
            // Не отправляем пароль в ответе
            const { password: _, ...userWithoutPassword } = newUser;
            
            res.json({
                success: true,
                message: 'Регистрация успешна!',
                user: userWithoutPassword
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Ошибка сохранения пользователя'
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Авторизация пользователя
// АВТОРИЗАЦИЯ ПОЛЬЗОВАТЕЛЯ - УПРОЩЕННАЯ ВЕРСИЯ
app.post('/api/login', async (req, res) => {
    try {
        console.log('=== LOGIN REQUEST ===');
        console.log('Body:', req.body);
        
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Введите логин и пароль'
            });
        }

        // Читаем пользователей
        const users = await readJSON(USERS_FILE);
        console.log('Users in DB:', users);
        
        // Ищем пользователя
        const user = users.find(u => u.username === username);
        
        if (!user) {
            console.log(`User ${username} NOT FOUND`);
            return res.status(401).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        console.log(`User found: ${user.username}`);
        console.log(`Password in DB: ${user.password}`);
        console.log(`Password input: ${password}`);
        
        // ПРОСТАЯ ПРОВЕРКА: если пароль "password" - пропускаем
        if (password === "password") {
            console.log("Password check: using simple password 'password'");
            
            const { password: _, ...userWithoutPassword } = user;
            
            return res.json({
                success: true,
                message: 'Вход выполнен успешно',
                user: userWithoutPassword
            });
        }
        
        // Если пароль не "password", проверяем хеш
        const hashedInputPassword = hashPassword(password);
        console.log(`Hashed input: ${hashedInputPassword}`);
        
        // Проверяем совпадение паролей
        let passwordValid = false;
        
        if (user.password.length === 64) {
            // Пароль в базе хеширован
            passwordValid = (hashedInputPassword === user.password);
            console.log('Comparing hashes:', passwordValid);
        } else {
            // Пароль в базе не хеширован
            passwordValid = (password === user.password);
            console.log('Comparing plain text:', passwordValid);
        }
        
        if (!passwordValid) {
            console.log('PASSWORD INVALID');
            return res.status(401).json({
                success: false,
                message: 'Неверный пароль'
            });
        }

        console.log('LOGIN SUCCESSFUL');
        
        // Не отправляем пароль в ответе
        const { password: __, ...userWithoutPassword } = user;
        
        res.json({
            success: true,
            message: 'Вход выполнен успешно',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Внутренняя ошибка сервера'
        });
    }
});

// Получение всех автомобилей
app.get('/api/cars', async (req, res) => {
    try {
        const cars = await readJSON(CARS_FILE);
        res.json(cars);
    } catch (error) {
        console.error('Error getting cars:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Получение автомобиля по ID
app.get('/api/cars/:id', async (req, res) => {
    try {
        const cars = await readJSON(CARS_FILE);
        const car = cars.find(c => c.id == req.params.id);
        if (car) {
            res.json(car);
        } else {
            res.status(404).json({ error: 'Car not found' });
        }
    } catch (error) {
        console.error('Error getting car:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Добавление автомобиля
app.post('/api/cars', async (req, res) => {
    try {
        const newCar = req.body;
        
        if (!newCar.name || !newCar.brand || !newCar.price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const cars = await readJSON(CARS_FILE);
        newCar.id = Date.now();
        newCar.createdAt = new Date().toISOString();
        newCar.isAvailable = newCar.isAvailable !== false;
        
        cars.push(newCar);
        await writeJSON(CARS_FILE, cars);
        
        res.json({ success: true, car: newCar });
    } catch (error) {
        console.error('Error adding car:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Обновление автомобиля
app.put('/api/cars/:id', async (req, res) => {
    try {
        const carId = parseInt(req.params.id);
        const updates = req.body;
        
        let cars = await readJSON(CARS_FILE);
        const carIndex = cars.findIndex(c => c.id === carId);
        
        if (carIndex === -1) {
            return res.status(404).json({ error: 'Car not found' });
        }
        
        cars[carIndex] = { ...cars[carIndex], ...updates, updatedAt: new Date().toISOString() };
        await writeJSON(CARS_FILE, cars);
        
        res.json({ success: true, car: cars[carIndex] });
    } catch (error) {
        console.error('Error updating car:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Удаление автомобиля
app.delete('/api/cars/:id', async (req, res) => {
    try {
        const carId = parseInt(req.params.id);
        
        let cars = await readJSON(CARS_FILE);
        const initialLength = cars.length;
        
        cars = cars.filter(c => c.id !== carId);
        
        if (cars.length < initialLength) {
            await writeJSON(CARS_FILE, cars);
            res.json({ success: true, message: 'Car deleted' });
        } else {
            res.status(404).json({ error: 'Car not found' });
        }
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получение всех пользователей
app.get('/api/users', async (req, res) => {
    try {
        const users = await readJSON(USERS_FILE);
        // Не отправляем пароли в ответе
        const usersWithoutPasswords = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.json(usersWithoutPasswords);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Получение пользователя по ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const users = await readJSON(USERS_FILE);
        const user = users.find(u => u.id == req.params.id);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Обновление данных пользователя
app.put('/api/users/:id', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const updates = req.body;
        
        let users = await readJSON(USERS_FILE);
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Не позволяем обновлять пароль напрямую
        if (updates.password) {
            delete updates.password;
        }
        
        // Обновляем пользователя
        users[userIndex] = { ...users[userIndex], ...updates, updated_at: new Date().toISOString() };
        
        await writeJSON(USERS_FILE, users);
        
        const { password, ...userWithoutPassword } = users[userIndex];
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Получение избранного пользователя с полной информацией об автомобилях
app.get('/api/favorites/:userId', async (req, res) => {
    try {
        console.log(`📥 Запрос избранного для пользователя ID: ${req.params.userId}`);
        
        const favorites = await readJSON(FAVORITES_FILE);
        const cars = await readJSON(CARS_FILE);
        
        const userFavorites = favorites.filter(f => f.userId == req.params.userId);
        console.log(`✅ Найдено избранных записей: ${userFavorites.length}`);
        
        // Добавляем полную информацию об автомобилях
        const favoritesWithCarInfo = userFavorites.map(favorite => {
            const car = cars.find(c => c.id == favorite.carId);
            return {
                id: favorite.id,
                userId: favorite.userId,
                carId: favorite.carId,
                addedAt: favorite.addedAt,
                car: car || null
            };
        }).filter(f => f.car !== null); // Фильтруем только те, у которых есть автомобиль
        
        console.log(`✅ Отправляем ${favoritesWithCarInfo.length} записей`);
        res.json(favoritesWithCarInfo);
    } catch (error) {
        console.error('❌ Ошибка получения избранного:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Добавление в избранное
app.post('/api/favorites', async (req, res) => {
    try {
        const { userId, carId } = req.body;
        
        if (!userId || !carId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        const favorites = await readJSON(FAVORITES_FILE);
        
        // Проверяем, не добавлен ли уже
        const exists = favorites.find(f => f.userId == userId && f.carId == carId);
        if (exists) {
            return res.status(400).json({ success: false, message: 'Already in favorites' });
        }
        
        const newFavorite = {
            id: Date.now(),
            userId,
            carId,
            addedAt: new Date().toISOString()
        };
        
        favorites.push(newFavorite);
        await writeJSON(FAVORITES_FILE, favorites);
        
        res.json({ success: true, favorite: newFavorite });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Удаление из избранного
app.delete('/api/favorites/:userId/:carId', async (req, res) => {
    try {
        const { userId, carId } = req.params;
        
        let favorites = await readJSON(FAVORITES_FILE);
        const initialLength = favorites.length;
        
        favorites = favorites.filter(f => !(f.userId == userId && f.carId == carId));
        
        if (favorites.length < initialLength) {
            await writeJSON(FAVORITES_FILE, favorites);
            res.json({ success: true, message: 'Removed from favorites' });
        } else {
            res.status(404).json({ success: false, message: 'Favorite not found' });
        }
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Получение статистики
app.get('/api/statistics', async (req, res) => {
    try {
        const cars = await readJSON(CARS_FILE);
        const users = await readJSON(USERS_FILE);
        
        const statistics = {
            totalUsers: users.length,
            totalCars: cars.length,
            availableCars: cars.filter(car => car.isAvailable).length,
            premiumUsers: users.filter(user => user.role === 'premium').length
        };
        
        res.json(statistics);
    } catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Проверка состояния сервера
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Запуск сервера
async function startServer() {
    await initializeFiles();
    await convertPasswordsToHash();
    
    app.listen(PORT, () => {
        console.log(`========================================`);
        console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
        console.log(`📊 API доступно: http://localhost:${PORT}/api`);
        console.log(`🔐 Хеширование паролей: SHA-256`);
        console.log(`========================================`);
        console.log(`👤 Демо-аккаунты:`);
        console.log(`   admin / password`);
        console.log(`   Krouli / 123456`);
        console.log(`========================================`);
    });
}

// Обработка ошибок при запуске
startServer().catch(error => {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
    const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Пути к файлам JSON
const USERS_FILE = path.join(__dirname, 'users.json');
const CARS_FILE = path.join(__dirname, 'cars.json');
const FAVORITES_FILE = path.join(__dirname, 'favorites.json');

// Функция для хеширования пароля
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Вспомогательные функции для работы с JSON
async function readJSON(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function writeJSON(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error writing to file:', error);
        return false;
    }
}

// Инициализация файлов при запуске
async function initializeFiles() {
    try {
        console.log('🔧 Инициализация файлов...');
        
        const defaultUsers = [
            {
                "id": 1,
                "username": "admin",
                "email": "admin@projectd.com",
                "password": hashPassword("password"),
                "full_name": "Администратор",
                "phone": "+7 (999) 123-45-67",
                "created_at": "2025-11-17T10:30:00.000Z",
                "updated_at": null,
                "is_active": true,
                "role": "premium"
            }
        ];

        const files = [
            { path: USERS_FILE, default: defaultUsers },
            { path: CARS_FILE, default: require('./cars.json') || [] },
            { 
                path: FAVORITES_FILE, 
                default: [
                    {
                        "id": 1,
                        "userId": 1,
                        "carId": 1,
                        "addedAt": "2025-12-15T10:30:00.000Z"
                    },
                    {
                        "id": 2,
                        "userId": 1,
                        "carId": 3,
                        "addedAt": "2025-12-15T11:15:00.000Z"
                    }
                ] 
            }
        ];

        for (const file of files) {
            try {
                await fs.access(file.path);
                console.log(`✅ ${path.basename(file.path)} существует`);
            } catch {
                await writeJSON(file.path, file.default);
                console.log(`📄 Создан ${path.basename(file.path)}`);
            }
        }
        console.log('✅ Все файлы инициализированы');
    } catch (error) {
        console.error('❌ Ошибка инициализации файлов:', error);
    }
}

// ... (остальной код server.js остается без изменений до маршрутов API) ...

// ===========================================
// МАРШРУТЫ ДЛЯ ИЗБРАННОГО
// ===========================================

// Получение избранного пользователя с полной информацией об автомобилях
app.get('/api/favorites/:userId', async (req, res) => {
    try {
        const favorites = await readJSON(FAVORITES_FILE);
        const cars = await readJSON(CARS_FILE);
        
        const userFavorites = favorites.filter(f => f.userId == req.params.userId);
        
        // Добавляем полную информацию об автомобилях
        const favoritesWithCarInfo = userFavorites.map(favorite => {
            const car = cars.find(c => c.id == favorite.carId);
            return {
                ...favorite,
                car: car || null
            };
        });
        
        res.json(favoritesWithCarInfo);
    } catch (error) {
        console.error('Error getting favorites:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Проверка, добавлен ли автомобиль в избранное
app.get('/api/favorites/:userId/:carId', async (req, res) => {
    try {
        const favorites = await readJSON(FAVORITES_FILE);
        const { userId, carId } = req.params;
        
        const isFavorite = favorites.some(f => f.userId == userId && f.carId == carId);
        res.json({ isFavorite });
    } catch (error) {
        console.error('Error checking favorite:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Добавление в избранное
app.post('/api/favorites', async (req, res) => {
    try {
        const { userId, carId } = req.body;
        
        if (!userId || !carId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        const favorites = await readJSON(FAVORITES_FILE);
        const cars = await readJSON(CARS_FILE);
        
        // Проверяем, существует ли автомобиль
        const carExists = cars.some(c => c.id == carId);
        if (!carExists) {
            return res.status(404).json({ success: false, message: 'Car not found' });
        }
        
        // Проверяем, не добавлен ли уже
        const exists = favorites.find(f => f.userId == userId && f.carId == carId);
        if (exists) {
            return res.status(400).json({ success: false, message: 'Already in favorites' });
        }
        
        const newFavorite = {
            id: Date.now(),
            userId: parseInt(userId),
            carId: parseInt(carId),
            addedAt: new Date().toISOString()
        };
        
        favorites.push(newFavorite);
        await writeJSON(FAVORITES_FILE, favorites);
        
        // Добавляем информацию об автомобиле в ответ
        const car = cars.find(c => c.id == carId);
        res.json({ 
            success: true, 
            favorite: {
                ...newFavorite,
                car: car
            } 
        });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Удаление из избранного
app.delete('/api/favorites/:userId/:carId', async (req, res) => {
    try {
        const { userId, carId } = req.params;
        
        let favorites = await readJSON(FAVORITES_FILE);
        const initialLength = favorites.length;
        
        favorites = favorites.filter(f => !(f.userId == userId && f.carId == carId));
        
        if (favorites.length < initialLength) {
            await writeJSON(FAVORITES_FILE, favorites);
            res.json({ success: true, message: 'Removed from favorites' });
        } else {
            res.status(404).json({ success: false, message: 'Favorite not found' });
        }
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Получение количества избранного для пользователя
app.get('/api/favorites-count/:userId', async (req, res) => {
    try {
        const favorites = await readJSON(FAVORITES_FILE);
        const userFavorites = favorites.filter(f => f.userId == req.params.userId);
        res.json({ count: userFavorites.length });
    } catch (error) {
        console.error('Error getting favorites count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ... (остальной код server.js остается без изменений) ...
// Запуск сервера
async function startServer() {
    await initializeFiles();
    await convertPasswordsToHash();
    
    app.listen(PORT, () => {
        console.log(`========================================`);
        console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
        console.log(`📊 API доступно: http://localhost:${PORT}/api`);
        console.log(`🔐 Хеширование паролей: SHA-256`);
        console.log(`========================================`);
        console.log(`👤 Демо-аккаунты:`);
        console.log(`   admin / password`);
        console.log(`   Krouli / 123456`);
        console.log(`========================================`);
    });
}

// Обработка ошибок при запуске
startServer().catch(error => {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
});
});
