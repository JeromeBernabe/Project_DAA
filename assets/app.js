let currentUser = null
let currentPage = "dashboard"

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  const appDiv = document.getElementById("app")
  const user = localStorage.getItem("user_id")

  if (user) {
    currentUser = { id: user }
    showApp()
  } else {
    showAuthPage()
  }
})

function showAuthPage() {
  const appDiv = document.getElementById("app")
  appDiv.innerHTML = `
        <div class="container auth-container">
            <div class="card">
                <h1 style="text-align: center; margin-bottom: 30px; color: var(--primary);">🎮 Task Tracker</h1>
                <div id="auth-form"></div>
            </div>
        </div>
    `

  showLoginForm()
}

function showLoginForm() {
  const formDiv = document.getElementById("auth-form")
  formDiv.innerHTML = `
        <h2 style="margin-bottom: 20px;">Login</h2>
        <div class="input-group">
            <label>Username</label>
            <input type="text" id="login-username" placeholder="Enter username">
        </div>
        <div class="input-group">
            <label>Password</label>
            <input type="password" id="login-password" placeholder="Enter password">
        </div>
        <button class="btn btn-primary" onclick="handleLogin()" style="width: 100%; margin-bottom: 10px;">Login</button>
        <button class="btn btn-secondary" onclick="showRegisterForm()" style="width: 100%;">Create Account</button>
    `
}

function showRegisterForm() {
  const formDiv = document.getElementById("auth-form")
  formDiv.innerHTML = `
        <h2 style="margin-bottom: 20px;">Create Account</h2>
        <div class="input-group">
            <label>Username</label>
            <input type="text" id="reg-username" placeholder="Choose username">
        </div>
        <div class="input-group">
            <label>Email</label>
            <input type="email" id="reg-email" placeholder="Enter email">
        </div>
        <div class="input-group">
            <label>Password</label>
            <input type="password" id="reg-password" placeholder="Enter password">
        </div>
        <button class="btn btn-primary" onclick="handleRegister()" style="width: 100%; margin-bottom: 10px;">Register</button>
        <button class="btn btn-secondary" onclick="showLoginForm()" style="width: 100%;">Back to Login</button>
    `
}

async function handleLogin() {
  const username = document.getElementById("login-username").value
  const password = document.getElementById("login-password").value

  try {
    const response = await fetch("api/auth.php?action=login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()
    if (data.success) {
      localStorage.setItem("user_id", data.user_id)
      currentUser = { id: data.user_id }
      showApp()
    } else {
      alert("Login failed: " + data.error)
    }
  } catch (error) {
    alert("Error: " + error.message)
  }
}

async function handleRegister() {
  const username = document.getElementById("reg-username").value
  const email = document.getElementById("reg-email").value
  const password = document.getElementById("reg-password").value

  try {
    const response = await fetch("api/auth.php?action=register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })

    const data = await response.json()
    if (data.success) {
      localStorage.setItem("user_id", data.user_id)
      currentUser = { id: data.user_id }
      showApp()
    } else {
      alert("Registration failed: " + data.error)
    }
  } catch (error) {
    alert("Error: " + error.message)
  }
}

function showApp() {
  const appDiv = document.getElementById("app")
  appDiv.innerHTML = `
        <header>
            <div class="header-content">
                <div class="header-title">
                    <h1>🎮 Gamified Task Tracker</h1>
                    <p id="level-display"></p>
                </div>
                <div class="user-info">
                    <p id="user-display"></p>
                    <button class="btn logout-btn" onclick="handleLogout()">Logout</button>
                </div>
            </div>
        </header>
        <nav>
            <div class="nav-content">
                <div class="nav-item active" onclick="switchPage('dashboard')">Dashboard</div>
                <div class="nav-item" onclick="switchPage('tasks')">Tasks</div>
                <div class="nav-item" onclick="switchPage('habits')">Habits</div>
            </div>
        </nav>
        <div class="container">
            <div id="page-content"></div>
        </div>
    `

  loadDashboard()
}

async function switchPage(page) {
  currentPage = page
  const items = document.querySelectorAll(".nav-item")
  items.forEach((item) => item.classList.remove("active"))
  event.target.classList.add("active")

  if (page === "dashboard") loadDashboard()
  else if (page === "tasks") loadTasks()
  else if (page === "habits") loadHabits()
}

async function loadDashboard() {
  try {
    const userId = localStorage.getItem("user_id")
    const response = await fetch(`api/dashboard.php?user_id=${userId}`)
    const data = await response.json()

    if (data.success) {
      const user = data.user
      document.getElementById("user-display").innerHTML = `${user.username} - Level ${user.current_level}`
      document.getElementById("level-display").innerHTML = `XP: ${user.total_xp} | Streak: ${user.global_streak}`

      const html = `
                <div class="dashboard">
                    <div class="stat-box">
                        <div class="stat-value">${user.current_level}</div>
                        <div class="stat-label">Current Level</div>
                        <div class="xp-bar">
                            <div class="xp-progress" style="width: ${(user.total_xp % 500) / 5}%"></div>
                        </div>
                        <div style="font-size: 12px; margin-top: 5px;">${user.total_xp} XP</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${user.global_streak}</div>
                        <div class="stat-label">Day Streak</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${data.weekly_xp}</div>
                        <div class="stat-label">This Week's XP</div>
                    </div>
                </div>
                <div class="card">
                    <h2 style="margin-bottom: 20px;">Pending Tasks</h2>
                    ${
                      data.tasks.length > 0
                        ? data.tasks
                            .map(
                              (t) => `
                        <div class="task-item">
                            <div>
                                <div class="task-title">${t.title}</div>
                                <span class="difficulty ${t.difficulty}">${t.difficulty}</span>
                            </div>
                            <button class="complete-btn" onclick="completeTask(${t.task_id})">Complete</button>
                        </div>
                    `,
                            )
                            .join("")
                        : "<p>No pending tasks!</p>"
                    }
                </div>
                <div class="card">
                    <h2 style="margin-bottom: 20px;">Active Habits</h2>
                    ${
                      data.habits.length > 0
                        ? data.habits
                            .map(
                              (h) => `
                        <div class="habit-item">
                            <div>
                                <div class="task-title">${h.title}</div>
                                <div class="streak">🔥 ${h.current_streak} day streak</div>
                            </div>
                            <button class="complete-btn" onclick="completeHabit(${h.habit_id})">Done Today</button>
                        </div>
                    `,
                            )
                            .join("")
                        : "<p>No active habits!</p>"
                    }
                </div>
            `

      document.getElementById("page-content").innerHTML = html
    }
  } catch (error) {
    console.error("Error loading dashboard:", error)
  }
}

async function loadTasks() {
  try {
    const userId = localStorage.getItem("user_id")
    const response = await fetch(`api/tasks.php?action=list&user_id=${userId}`)
    const data = await response.json()

    if (data.success) {
      const html = `
                <div class="card form-section">
                    <h2 style="margin-bottom: 20px;">Create New Task</h2>
                    <div class="input-group">
                        <label>Task Title</label>
                        <input type="text" id="task-title" placeholder="What do you need to do?">
                    </div>
                    <div class="input-group">
                        <label>Difficulty</label>
                        <select id="task-difficulty">
                            <option>easy</option>
                            <option selected>medium</option>
                            <option>hard</option>
                            <option>extreme</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Deadline</label>
                        <input type="datetime-local" id="task-deadline">
                    </div>
                    <button class="btn btn-primary" onclick="createTask()">Create Task</button>
                </div>
                <div class="card">
                    <h2 style="margin-bottom: 20px;">All Tasks</h2>
                    ${
                      data.tasks.length > 0
                        ? data.tasks
                            .map(
                              (t) => `
                        <div class="task-item">
                            <div>
                                <div class="task-title">${t.title}</div>
                                <span class="difficulty ${t.difficulty}">${t.difficulty}</span>
                                <span style="color: var(--text-secondary); font-size: 12px; margin-left: 10px;">Status: ${t.status}</span>
                            </div>
                            ${t.status === "pending" ? `<button class="complete-btn" onclick="completeTask(${t.task_id})">Complete</button>` : ""}
                        </div>
                    `,
                            )
                            .join("")
                        : "<p>No tasks yet!</p>"
                    }
                </div>
            `

      document.getElementById("page-content").innerHTML = html
    }
  } catch (error) {
    console.error("Error loading tasks:", error)
  }
}

async function loadHabits() {
  try {
    const userId = localStorage.getItem("user_id")
    const response = await fetch(`api/habits.php?action=list&user_id=${userId}`)
    const data = await response.json()

    if (data.success) {
      const html = `
                <div class="card form-section">
                    <h2 style="margin-bottom: 20px;">Create New Habit</h2>
                    <div class="input-group">
                        <label>Habit Title</label>
                        <input type="text" id="habit-title" placeholder="What habit do you want to build?">
                    </div>
                    <div class="input-group">
                        <label>Difficulty</label>
                        <select id="habit-difficulty">
                            <option>easy</option>
                            <option selected>medium</option>
                            <option>hard</option>
                            <option>extreme</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="createHabit()">Create Habit</button>
                </div>
                <div class="card">
                    <h2 style="margin-bottom: 20px;">Active Habits</h2>
                    ${
                      data.habits.length > 0
                        ? data.habits
                            .map(
                              (h) => `
                        <div class="habit-item">
                            <div>
                                <div class="task-title">${h.title}</div>
                                <span class="difficulty ${h.difficulty}">${h.difficulty}</span>
                                <div class="streak" style="margin-top: 8px;">
                                    🔥 ${h.current_streak} day streak (Best: ${h.best_streak})
                                </div>
                            </div>
                            <button class="complete-btn" onclick="completeHabit(${h.habit_id})">Done Today</button>
                        </div>
                    `,
                            )
                            .join("")
                        : "<p>No habits yet!</p>"
                    }
                </div>
            `

      document.getElementById("page-content").innerHTML = html
    }
  } catch (error) {
    console.error("Error loading habits:", error)
  }
}

async function createTask() {
  const title = document.getElementById("task-title").value
  const difficulty = document.getElementById("task-difficulty").value
  const deadline = document.getElementById("task-deadline").value
  const userId = localStorage.getItem("user_id")

  if (!title) {
    alert("Please enter a task title")
    return
  }

  try {
    const response = await fetch(`api/tasks.php?action=create&user_id=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, difficulty, deadline: deadline || null }),
    })

    const data = await response.json()
    if (data.success) {
      loadTasks()
    } else {
      alert("Error creating task: " + data.error)
    }
  } catch (error) {
    alert("Error: " + error.message)
  }
}

async function createHabit() {
  const title = document.getElementById("habit-title").value
  const difficulty = document.getElementById("habit-difficulty").value
  const userId = localStorage.getItem("user_id")

  if (!title) {
    alert("Please enter a habit title")
    return
  }

  try {
    const response = await fetch(`api/habits.php?action=create&user_id=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, difficulty }),
    })

    const data = await response.json()
    if (data.success) {
      loadHabits()
    } else {
      alert("Error creating habit: " + data.error)
    }
  } catch (error) {
    alert("Error: " + error.message)
  }
}

async function completeTask(taskId) {
  try {
    const userId = localStorage.getItem("user_id")
    const response = await fetch(`api/tasks.php?action=complete&user_id=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId }),
    })

    const data = await response.json()
    if (data.success) {
      alert(`✅ Task completed! +${data.xp_earned} XP`)
      loadDashboard()
    }
  } catch (error) {
    alert("Error: " + error.message)
  }
}

async function completeHabit(habitId) {
  try {
    const userId = localStorage.getItem("user_id")
    const response = await fetch(`api/habits.php?action=complete&user_id=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habit_id: habitId }),
    })

    const data = await response.json()
    if (data.success) {
      alert(`✅ Habit completed! +${data.xp_earned} XP | Streak: ${data.new_streak}`)
      loadDashboard()
    }
  } catch (error) {
    alert("Error: " + error.message)
  }
}

function handleLogout() {
  localStorage.removeItem("user_id")
  currentUser = null
  showAuthPage()
}
