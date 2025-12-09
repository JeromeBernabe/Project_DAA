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
                <h1 class="auth-title">🎮 Task Tracker</h1>
                <div id="auth-form"></div>
            </div>
        </div>
    `

  showLoginForm()
}

function showLoginForm() {
  const formDiv = document.getElementById("auth-form")
  formDiv.innerHTML = `
        <h2 class="form-title">Login</h2>
        <div class="input-group">
            <label>Username</label>
            <input type="text" id="login-username" placeholder="Enter username">
        </div>
        <div class="input-group">
            <label>Password</label>
            <input type="password" id="login-password" placeholder="Enter password">
        </div>
        <button class="btn btn-primary auth-btn-full" onclick="handleLogin()">Login</button>
        <button class="btn btn-secondary auth-btn-full" onclick="showRegisterForm()">Create Account</button>
    `
}

function showRegisterForm() {
  const formDiv = document.getElementById("auth-form")
  formDiv.innerHTML = `
        <h2 class="form-title">Create Account</h2>
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
        <button class="btn btn-primary auth-btn-full" onclick="handleRegister()">Register</button>
        <button class="btn btn-secondary auth-btn-full" onclick="showLoginForm()">Back to Login</button>
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
        <nav>
            <div class="nav-content">
                <div class="nav-brand">
                    <div class="nav-brand-icon">🎮</div>
                    <h1 class="nav-brand-title">HabitQuest</h1>
                </div>
                <div class="nav-item active" onclick="switchPage('dashboard')">
                    <span class="nav-icon">📊</span>
                    <span>Dashboard</span>
                </div>
                <div class="nav-item" onclick="switchPage('tasks-habits')">
                    <span class="nav-icon">✓</span>
                    <span>Tasks & Habits</span>
                </div>
                <div class="nav-item" onclick="switchPage('combos')">
                    <span class="nav-icon">🎯</span>
                    <span>Combos</span>
                </div>
                <div class="nav-item" onclick="switchPage('analytics')">
                    <span class="nav-icon">📈</span>
                    <span>Analytics</span>
                </div>
                <div class="nav-item" onclick="switchPage('profile')">
                    <span class="nav-icon">👤</span>
                    <span>Profile</span>
                </div>
                <div class="nav-spacer"></div>
                <div class="nav-user-info">
                    <span id="streak-display">🔥 0 days</span>
                    <span id="user-display"></span>
                </div>
                <button class="btn logout-btn" onclick="handleLogout()">🚪 Logout</button>
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
  else if (page === "tasks-habits") loadTasksAndHabits()
  else if (page === "combos") loadCombos()
  else if (page === "analytics") loadAnalytics()
  else if (page === "profile") loadProfile()
}

async function loadDashboard() {
  try {
    const userId = localStorage.getItem("user_id")
    const response = await fetch(`api/dashboard.php?user_id=${userId}`)
    const data = await response.json()

    if (data.success) {
      const user = data.user
      document.getElementById("user-display").innerHTML = `⭐ Level ${user.current_level}`
      document.getElementById("streak-display").innerHTML = `🔥 ${user.global_streak} days`

      // Helper to check if task can be completed (all deps finished)
      const canCompleteTask = (taskId) => {
        const deps = data.dependencies[taskId] || []
        return deps.every(d => d.status === 'completed')
      }

      // Helper to get unfinished dependency names
      const getBlockingDeps = (taskId) => {
        const deps = data.dependencies[taskId] || []
        return deps.filter(d => d.status !== 'completed').map(d => d.title)
      }

      const html = `
                <div class="dashboard">
                    <div class="stat-box stat-box-level">
                        <div class="stat-box-header">
                            <div class="stat-box-content">
                                <div class="stat-box-level-value">${user.current_level}</div>
                                <div class="stat-box-level-label stat-label">LEVEL</div>
                            </div>
                            <div class="stat-box-icon">⭐</div>
                        </div>
                        <div class="stat-box-level-text">Progress to Level ${user.current_level + 1}</div>
                        <div class="stat-box-xp-bar">
                            <div class="stat-box-xp-progress" style="width:${Math.min((user.total_xp % (data.next_level_xp || 100)) / (data.next_level_xp || 100) * 100, 100)}%;"></div>
                        </div>
                        <div class="stat-box-xp-text">${user.total_xp} / ${data.next_level_xp} XP</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box-header">
                            <div class="stat-box-content">
                                <div class="stat-value">${user.global_streak}</div>
                                <div class="stat-label">Day Streak</div>
                            </div>
                            <div class="stat-box-icon">🔥</div>
                        </div>
                        <div class="stat-label">Keep it up to build momentum!</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box-header">
                            <div class="stat-box-content">
                                <div class="stat-value">${data.weekly_xp}</div>
                                <div class="stat-label">This Week</div>
                            </div>
                            <div class="stat-box-icon">📈</div>
                        </div>
                        <div class="stat-label">XP earned from tasks & habits</div>
                    </div>
                </div>
                <div class="card">
                    <h2 class="card-title">Pending Tasks</h2>
                    ${
                      data.tasks.length > 0
                        ? data.tasks
                            .map(
                              (t) => {
                                const canComplete = canCompleteTask(t.task_id)
                                const blockingDeps = getBlockingDeps(t.task_id)
                                return `
                        <div class="task-item ${canComplete ? 'task-item-ready' : 'task-item-blocked'}">
                            <div class="task-item-content">
                                <div class="task-title">${t.title}</div>
                                <span class="difficulty ${t.difficulty}">${t.difficulty}</span>
                                ${blockingDeps.length > 0 ? `<div class="task-item-blocked-msg">⚠️ Blocked by: ${blockingDeps.join(', ')}</div>` : ''}
                            </div>
                            <button class="complete-btn" onclick="completeTask(${t.task_id})" ${canComplete ? '' : 'disabled style="opacity:0.5;cursor:not-allowed"'}>Complete</button>
                        </div>
                    `}
                            )
                            .join("")
                        : "<p>No pending tasks!</p>"
                    }
                </div>
                <div class="card">
                    <h2 class="card-title">Active Habits</h2>
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
                            <div class="habit-item-buttons">
                              ${h.completed_today ? '<span class="habit-completed-badge">✅ Done Today</span>' : ''}
                              <button class="complete-btn" onclick="completeHabit(${h.habit_id})" ${h.completed_today ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>Done Today</button>
                            </div>
                        </div>
                    `
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

async function loadTasksAndHabits() {
  try {
    const userId = localStorage.getItem("user_id")
    const tasksRes = await fetch(`api/tasks.php?action=list&user_id=${userId}`)
    const habitsRes = await fetch(`api/habits.php?action=list&user_id=${userId}`)
    const tasksData = await tasksRes.json()
    const habitsData = await habitsRes.json()

    if (tasksData.success && habitsData.success) {
      const tasks = tasksData.tasks
      const habits = habitsData.habits

      let html = `
        <div class="tasks-habits-grid">
          <div class="card form-section">
            <h2 class="form-section-title">➕ New Task</h2>
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

          <div class="card form-section">
            <h2 class="form-section-title">➕ New Habit</h2>
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
        </div>

        <div class="tasks-habits-list">
          <div class="card">
            <h2 class="card-title">✓ All Tasks</h2>
      `

      if (tasks.length > 0) {
        html += tasks.map(t => `
          <div class="task-list">
            <div>
              <div class="task-list-title">${t.title}</div>
              <div class="task-list-meta">
                <span class="difficulty ${t.difficulty}" style="font-size:11px;">${t.difficulty}</span>
                <span class="task-list-status">Status: ${t.status}</span>
              </div>
            </div>
            ${t.status === "pending" ? `<button class="complete-btn btn-sm" onclick="completeTask(${t.task_id})">Complete</button>` : '<span style="color:#4CAF50;font-weight:bold;">✅</span>'}
          </div>
        `).join("")
      } else {
        html += `<p class="empty-state">No tasks yet!</p>`
      }

      html += `
          </div>

          <div class="card">
            <h2 class="card-title">🔥 Active Habits</h2>
      `

      if (habits.length > 0) {
        html += habits.map(h => `
          <div class="habit-list">
            <div class="habit-list-content">
              <div class="habit-list-title">${h.title}</div>
              <div class="habit-list-meta">
                <span class="difficulty ${h.difficulty}" style="font-size:11px;">${h.difficulty}</span>
                <span class="habit-list-streak">🔥 ${h.current_streak}d (Best: ${h.best_streak}d)</span>
              </div>
            </div>
            <div class="habit-list-actions">
              ${h.completed_today ? '<span class="habit-list-done">✅ Done</span>' : ''}
              <button class="complete-btn btn-sm" onclick="completeHabit(${h.habit_id})" ${h.completed_today ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>Do It</button>
            </div>
          </div>
        `).join("")
      } else {
        html += `<p class="empty-state">No habits yet!</p>`
      }

      html += `
          </div>
        </div>
      `

      document.getElementById("page-content").innerHTML = html
    }
  } catch (error) {
    console.error("Error loading tasks and habits:", error)
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
                            <div style="display:flex;align-items:center;gap:8px;">
                              ${h.completed_today ? '<span style="color:#4CAF50;font-weight:bold;">✅ Done Today</span>' : ''}
                              <button class="complete-btn" onclick="completeHabit(${h.habit_id})" ${h.completed_today ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>Done Today</button>
                            </div>
                        </div>
                    `
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
      if (currentPage === "profile") {
        loadProfile()
      } else {
        loadTasks()
        loadTasksAndHabits()
      }
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
      if (currentPage === "profile") {
        loadProfile()
      } else {
        loadHabits()
        loadTasksAndHabits()
      }
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
      if (currentPage === "profile") {
        loadProfile()
      }
    } else {
      alert("Error completing task: " + data.error)
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
      loadDashboard()
      loadTasksAndHabits()
      if (currentPage === "profile") {
        loadProfile()
      }
    }
  } catch (error) {
    console.error("Error:", error.message)
  }
}

// Combos UI + actions
async function loadCombos() {
  try {
    const userId = localStorage.getItem("user_id")
    const response = await fetch(`api/combos.php?action=list&user_id=${userId}`)
    const data = await response.json()

    if (data.success) {
      const combos = data.combos
      const html = `
                <div class="card form-section">
                    <h2 style="margin-bottom: 20px;">🎯 Create New Combo</h2>
                    <div class="input-group">
                        <label>Combo Name</label>
                        <input type="text" id="combo-name" placeholder="E.g. Launch Website, Complete Marathon">
                    </div>
                    <div class="input-group">
                        <label>Description</label>
                        <input type="text" id="combo-desc" placeholder="What's your goal? (optional)">
                    </div>
                    <button class="btn btn-primary" onclick="createCombo()">Create Combo</button>
                </div>
                <div class="card">
                    <h2 style="margin-bottom: 20px;">⚡ Active Combos</h2>
                    ${
                      combos.length > 0
                        ? combos.map((c) => {
                            const percentage = c.total_tasks>0?Math.round((c.completed_tasks/c.total_tasks)*100):0
                            return `
                        <div class="combo-item" onclick="showComboDetail(${c.combo_id})" style="cursor: pointer; border-radius:8px; padding:16px; background:linear-gradient(135deg,rgba(255,215,0,0.05),rgba(255,69,0,0.05)); border:2px solid rgba(255,215,0,0.3); transition:all 0.3s; margin-bottom:12px;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div style="flex:1;">
                                    <div class="task-title" style="margin-bottom:4px;">${c.name}</div>
                                    <div style="font-size:13px; color:var(--text-secondary); margin-bottom:8px;">${c.description || 'No description'}</div>
                                    <div style="display:flex;gap:12px;font-size:12px;">
                                      <span style="background:rgba(76,175,80,0.2);color:#4CAF50;padding:2px 8px;border-radius:4px;">✓ ${c.completed_tasks} completed</span>
                                      <span style="background:rgba(255,107,107,0.2);color:#ff6b6b;padding:2px 8px;border-radius:4px;">○ ${c.total_tasks - c.completed_tasks} remaining</span>
                                    </div>
                                </div>
                                <div style="width:180px; margin-left:16px;">
                                    <div class="progress-bar" style="background:rgba(200,200,200,0.3); height:14px; border-radius:7px; overflow:hidden; box-shadow:inset 0 2px 4px rgba(0,0,0,0.1);">
                                        <div style="height:100%; background:linear-gradient(90deg,#ffd700,#ff4500); width:${percentage}%; transition:width 0.3s; box-shadow:0 0 8px rgba(255,215,0,0.5)"></div>
                                    </div>
                                    <div style="font-size:12px; text-align:right; margin-top:4px; font-weight:600;">${percentage}%</div>
                                </div>
                            </div>
                        </div>
                    `}).join('')
                        : '<p style="text-align:center;color:var(--text-secondary);">No combos yet. Create one to get started!</p>'
                    }
                </div>
            `

      document.getElementById("page-content").innerHTML = html
    }
  } catch (error) {
    console.error("Error loading combos:", error)
  }
}

async function createCombo() {
  const name = document.getElementById('combo-name').value
  const description = document.getElementById('combo-desc').value
  if (!name) return alert('Please enter a combo name')

  try {
    const userId = localStorage.getItem('user_id')
    const response = await fetch(`api/combos.php?action=create&user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
    const data = await response.json()
    if (data.success) {
      loadCombos()
    } else alert('Error creating combo: ' + data.error)
  } catch (err) {
    alert('Error: ' + err.message)
  }
}

async function showComboDetail(comboId) {
  try {
    const userId = localStorage.getItem('user_id')
    const res = await fetch(`api/combos.php?action=detail&combo_id=${comboId}&user_id=${userId}`)
    const data = await res.json()
    if (!data.success) return alert('Error: ' + data.error)

    const combo = data.combo
    const tasks = data.tasks
    const deps = data.dependencies

    // Build a helper to check if task can be completed (all deps finished)
    const canCompleteTask = (taskId) => {
      const unfinishedDeps = deps.filter(d => d.task_id === taskId).some(d => {
        const depTask = tasks.find(t => t.task_id === d.depends_on_task_id)
        return depTask && depTask.status !== 'completed'
      })
      return !unfinishedDeps
    }

    const getUnfinishedDeps = (taskId) => {
      return deps.filter(d => d.task_id === taskId).filter(d => {
        const depTask = tasks.find(t => t.task_id === d.depends_on_task_id)
        return depTask && depTask.status !== 'completed'
      }).map(d => {
        const depTask = tasks.find(t => t.task_id === d.depends_on_task_id)
        return depTask ? depTask.title : 'Unknown'
      })
    }

    const html = `
      <div style="display:flex; gap:20px; flex-wrap:wrap;">
        <div style="flex:1; min-width:320px;">
          <div class="card">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
              <div style="font-size:28px;">🎯</div>
              <div style="flex:1;">
                <h2 style="margin:0;">${combo.name}</h2>
                <p style="color:var(--text-secondary);margin:4px 0;">${combo.description || 'No description'}</p>
              </div>
            </div>
            
            <div style="background:linear-gradient(135deg,rgba(76,175,80,0.1),rgba(255,215,0,0.1));border-radius:8px;padding:12px;margin-bottom:16px;">
              <h4 style="margin:0 0 8px 0;">📊 Progress</h4>
              <div class="progress-bar" style="background:rgba(200,200,200,0.3);height:16px;border-radius:8px;overflow:hidden;margin-bottom:6px;">
                <div style="height:100%;background:linear-gradient(90deg,#ffd700,#ff4500);width:${tasks.length>0?Math.round((tasks.filter(t=>t.status==='completed').length/tasks.length)*100):0}%;"></div>
              </div>
              <div style="font-size:13px;display:flex;gap:16px;">
                <span>✓ <strong>${tasks.filter(t=>t.status==='completed').length}</strong> completed</span>
                <span>○ <strong>${tasks.filter(t=>t.status==='pending').length}</strong> pending</span>
              </div>
            </div>
            
            <h3>📋 Tasks</h3>
            <div id="combo-task-list" style="margin-bottom:16px;">
              ${tasks.length>0 ? tasks.map(t=>{
                const canComplete = canCompleteTask(t.task_id)
                const unfinishedDeps = getUnfinishedDeps(t.task_id)
                const statusIcon = t.status==='completed'?'✓':'○'
                return `
                <div style="background:${t.status==='completed'?'rgba(76,175,80,0.1)':'rgba(255,107,107,0.05)'};border-left:4px solid ${t.status==='completed'?'#4CAF50':canComplete?'#ffd700':'#ff6b6b'};border-radius:6px;padding:12px;margin-bottom:10px;">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                    <div style="flex:1;">
                      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                        <span style="font-size:16px;">${statusIcon}</span>
                        <span class="task-title">${t.title}</span>
                        <span class="difficulty ${t.difficulty}" style="font-size:11px;padding:2px 6px;">${t.difficulty}</span>
                      </div>
                      ${unfinishedDeps.length > 0 ? `<div style="font-size:12px;color:#ff6b6b;margin-top:4px;">⚠️ Blocked by: ${unfinishedDeps.join(', ')}</div>` : ''}
                    </div>
                    <div style="display:flex;gap:6px;margin-left:8px;">
                      ${t.status === 'pending' ? `<button class="btn" onclick="completeTask(${t.task_id})" style="font-size:12px;" ${canComplete ? '' : 'disabled style="opacity:0.5;cursor:not-allowed"'}>✓ Complete</button>` : ''}
                      <button class="btn" onclick="removeTaskFromCombo(${t.task_id})" style="font-size:12px;">✕ Remove</button>
                    </div>
                  </div>
                </div>
              `}).join('') : '<p style="text-align:center;color:var(--text-secondary);">No tasks yet</p>'}
            </div>
            
            <hr style="margin:16px 0;border:none;border-top:1px solid rgba(200,200,200,0.3);" />
            
            <h4>➕ Add Task</h4>
            <div style="background:rgba(100,200,255,0.05);border-radius:8px;padding:12px;margin-bottom:12px;">
              <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Existing Task</div>
              <div style="display:flex;gap:8px;">
                <select id="combo-existing-tasks" style="flex:1;padding:8px;border-radius:4px;border:1px solid rgba(200,200,200,0.3);"></select>
                <button class="btn" onclick="attachExistingTask(${combo.combo_id})" style="white-space:nowrap;">Attach</button>
              </div>
            </div>
            
            <div style="background:rgba(76,175,80,0.05);border-radius:8px;padding:12px;">
              <div style="font-size:13px;font-weight:600;margin-bottom:8px;">New Task</div>
              <div class="input-group" style="margin-bottom:8px;">
                <label>Title</label>
                <input type="text" id="combo-new-task-title" placeholder="Task name">
              </div>
              <div class="input-group" style="margin-bottom:8px;">
                <label>Difficulty</label>
                <select id="combo-new-task-difficulty">
                  <option>easy</option>
                  <option selected>medium</option>
                  <option>hard</option>
                  <option>extreme</option>
                </select>
              </div>
              <button class="btn btn-primary" onclick="createTaskInCombo(${combo.combo_id})" style="width:100%;">➕ Create Task</button>
            </div>
          </div>
        </div>
        
        <div style="flex:1; min-width:320px;">
          <div class="card">
            <h3>🔗 Dependencies</h3>
            <div id="combo-deps-list" style="margin-bottom:16px;">
              ${tasks.length>0 ? tasks.map(t=>`
                <div style="background:rgba(255,215,0,0.05);border-left:3px solid #ffd700;border-radius:6px;padding:12px;margin-bottom:10px;">
                  <div style="font-weight:600;margin-bottom:8px;">${t.title}</div>
                  <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
                    <select id="depends-on-${t.task_id}" style="flex:1;padding:6px;border-radius:4px;border:1px solid rgba(200,200,200,0.3);font-size:12px;">
                      <option value="">-- add dependency --</option>
                      ${tasks.filter(x=>x.task_id!==t.task_id).map(o=>`<option value="${o.task_id}">${o.title}</option>`).join('')}
                    </select>
                    <button class="btn" onclick="addDependency(${t.task_id})" style="padding:6px 10px;font-size:12px;">Add</button>
                  </div>
                  <div style="font-size:12px;color:var(--text-secondary);background:rgba(100,150,255,0.1);padding:6px;border-radius:4px;">
                    ${deps.filter(d=>d.task_id==t.task_id).length > 0 ? '📌 Depends on: <strong>' + deps.filter(d=>d.task_id==t.task_id).map(d=>{
                      const dep = tasks.find(tt=>tt.task_id==d.depends_on_task_id);
                      return dep ? dep.title : 'Unknown'
                    }).join(', ') + '</strong>' : 'No dependencies'}
                  </div>
                </div>
              `).join('') : '<p style="text-align:center;color:var(--text-secondary);">No tasks to set dependencies</p>'}
            </div>
            
            <hr style="margin:16px 0;border:none;border-top:1px solid rgba(200,200,200,0.3);" />
            
            <div style="display:flex;flex-direction:column;gap:8px;">
              <button class="btn btn-primary" onclick="calculateCombo(${combo.combo_id})" style="width:100%;">⏱️ Calculate Critical Path</button>
              <button class="btn" onclick="loadCombos()" style="width:100%;">← Back to Combos</button>
            </div>
            <div id="combo-critical-path" style="margin-top:12px;"></div>
          </div>
        </div>
      </div>
    `

    document.getElementById('page-content').innerHTML = html

    // populate existing pending tasks select
    const allTasksResp = await fetch(`api/tasks.php?action=list&user_id=${userId}`)
    const allTasksData = await allTasksResp.json()
    if (allTasksData.success) {
      const sel = document.getElementById('combo-existing-tasks')
      sel.innerHTML = '<option value="">-- select --</option>'
      allTasksData.tasks.filter(t=>!t.combo_id && t.status==='pending').forEach(t=>{
        const opt = document.createElement('option')
        opt.value = t.task_id
        opt.textContent = t.title
        sel.appendChild(opt)
      })
    }

  } catch (err) {
    console.error('Error loading combo detail', err)
    alert('Error: ' + err.message)
  }
}

async function attachExistingTask(comboId) {
  const sel = document.getElementById('combo-existing-tasks')
  const taskId = sel.value
  if (!taskId) return alert('Select a task')
  try {
    const userId = localStorage.getItem('user_id')
    const resp = await fetch(`api/combos.php?action=add_task&user_id=${userId}`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ combo_id: comboId, task_id: parseInt(taskId) })
    })
    const data = await resp.json()
    if (data.success) showComboDetail(comboId)
    else alert('Error: ' + data.error)
  } catch (e) { alert('Error: ' + e.message) }
}

async function createTaskInCombo(comboId) {
  const title = document.getElementById('combo-new-task-title').value
  const difficulty = document.getElementById('combo-new-task-difficulty').value
  if (!title) return alert('Enter task title')
  try {
    const userId = localStorage.getItem('user_id')
    const resp = await fetch(`api/combos.php?action=add_task&user_id=${userId}`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ combo_id: comboId, title, difficulty })
    })
    const data = await resp.json()
    if (data.success) showComboDetail(comboId)
    else alert('Error: ' + data.error)
  } catch (e) { alert('Error: ' + e.message) }
}

async function removeTaskFromCombo(taskId) {
  if (!confirm('Remove task from combo?')) return
  try {
    const userId = localStorage.getItem('user_id')
    const resp = await fetch(`api/combos.php?action=remove_task&user_id=${userId}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ task_id: taskId }) })
    const data = await resp.json()
    if (data.success) loadCombos()
    else alert('Error: ' + data.error)
  } catch (e) { alert('Error: ' + e.message) }
}

async function addDependency(taskId) {
  const sel = document.getElementById('depends-on-' + taskId)
  const dependsOn = sel.value
  if (!dependsOn) return alert('Select a dependency')
  try {
    const userId = localStorage.getItem('user_id')
    const resp = await fetch(`api/combos.php?action=add_dependency&user_id=${userId}`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ task_id: taskId, depends_on_task_id: parseInt(dependsOn) }) })
    const data = await resp.json()
    if (data.success) showComboDetail((new URLSearchParams(location.search)).get('combo_id') || location.hash || null)
    else alert('Error: ' + data.error)
  } catch (e) { alert('Error: ' + e.message) }
}

async function calculateCombo(comboId) {
  try {
    const userId = localStorage.getItem('user_id')
    const resp = await fetch(`api/combos.php?action=calculate&combo_id=${comboId}&user_id=${userId}`)
    const data = await resp.json()
    if (!data.success) return alert('Error: ' + data.error)
    // display critical path
    const cp = data.critical_path
    const container = document.getElementById('combo-critical-path')
    container.innerHTML = `<h4>Critical Path (project duration: ${cp.project_duration})</h4>` + cp.tasks.map(t=>`<div style="padding:6px;margin:4px;border-radius:6px;${t.critical? 'background:linear-gradient(90deg,#ffd700,#ff4500); color:#000; font-weight:700;': 'background:#f3f3f3;'}">${t.title} — ES:${t.earliest_start} EF:${t.earliest_finish} LS:${t.latest_start} LF:${t.latest_finish} Slack:${t.slack}</div>`).join('')
  } catch (e) { alert('Error: ' + e.message) }
}

async function loadAnalytics() {
  try {
    const userId = localStorage.getItem("user_id")
    
    const overviewRes = await fetch(`api/analytics.php?action=overview&user_id=${userId}`)
    const overviewData = await overviewRes.json()
    
    const clusterRes = await fetch(`api/analytics.php?action=clustering&user_id=${userId}`)
    const clusterData = await clusterRes.json()
    
    const habitsRes = await fetch(`api/analytics.php?action=habits_analysis&user_id=${userId}`)
    const habitsData = await habitsRes.json()

    if (!overviewData.success) return alert('Error loading analytics')

    const overview = overviewData.tasks
    const habits = overviewData.habits

    let html = `<h2 class="analytics-title">📊 Analytics & Insights</h2>
      <div class="card">
        <h3>📈 Overview Statistics</h3>
        <div class="analytics-section">
          <div class="analytics-stat-box analytics-stat-blue">
            <div class="analytics-stat-label">Total Tasks</div>
            <div class="analytics-stat-value analytics-stat-value-blue">${overview.total_tasks}</div>
            <div class="analytics-stat-subtext">✓ ${overview.completed_tasks} completed</div>
          </div>
          <div class="analytics-stat-box analytics-stat-green">
            <div class="analytics-stat-label">Completion Rate</div>
            <div class="analytics-stat-value analytics-stat-value-green">${overview.total_tasks > 0 ? Math.round((overview.completed_tasks / overview.total_tasks) * 100) : 0}%</div>
            <div class="analytics-stat-subtext">○ ${overview.pending_tasks} pending</div>
          </div>
          <div class="analytics-stat-box analytics-stat-red">
            <div class="analytics-stat-label">Active Habits</div>
            <div class="analytics-stat-value analytics-stat-value-red">${habits.active_habits}</div>
            <div class="analytics-stat-subtext">🔥 Avg: ${Math.round(habits.avg_streak)} day streak</div>
          </div>
          <div class="analytics-stat-box analytics-stat-yellow">
            <div class="analytics-stat-label">Longest Streak</div>
            <div class="analytics-stat-value analytics-stat-value-yellow">${habits.max_streak}</div>
            <div class="analytics-stat-subtext">Personal record</div>
          </div>
        </div>
      </div>`

    html += `<div class="card"><h3>🎯 Task Clustering Analysis</h3>
        <p style="color:var(--text-secondary);margin-bottom:16px;">Tasks grouped by priority</p>`
    
    if (clusterData.clusters && clusterData.clusters.length > 0) {
      const colors = ['#ff6b6b', '#ffd700', '#4CAF50']
      const labels = ['🔴 High Priority', '🟡 Medium Priority', '🟢 Low Priority']
      const gradients = ['linear-gradient(135deg,rgba(255,107,107,0.1),rgba(255,69,0,0.1))', 'linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,165,0,0.1))', 'linear-gradient(135deg,rgba(76,175,80,0.1),rgba(100,200,100,0.1))']
      
      clusterData.clusters.forEach((cluster, idx) => {
        html += `<div style="background:${gradients[idx]};border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid ${colors[idx]};">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div><h4 style="margin:0;font-size:16px;">${labels[idx]}</h4><div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">${cluster.size} tasks</div></div>
            <div style="text-align:right;"><div style="font-size:14px;font-weight:600;">Completion: ${cluster.completion_rate}%</div>
            <div style="font-size:12px;color:var(--text-secondary);">Urgency: ${cluster.urgent_tasks} tasks</div></div>
          </div></div>`
      })
    } else {
      html += '<p style="color:var(--text-secondary);text-align:center;">No task clustering data available</p>'
    }
    html += '</div>'

    html += `<div class="card"><h3>🔥 Habit Performance Clusters</h3>
        <p style="color:var(--text-secondary);margin-bottom:16px;">Habits by performance</p>`
    
    if (habitsData.habits_clusters) {
      const categories = [
        { key: 'thriving', icon: '🚀', label: 'Thriving', color: '#4CAF50', bg: 'rgba(76,175,80,0.1)' },
        { key: 'steady', icon: '⚡', label: 'Steady', color: '#ffd700', bg: 'rgba(255,215,0,0.1)' },
        { key: 'struggling', icon: '💪', label: 'Struggling', color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)' }
      ]
      
      categories.forEach(cat => {
        html += `<div style="background:${cat.bg};border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid ${cat.color};">
          <h4 style="margin:0 0 12px 0;">${cat.icon} ${cat.label}</h4>`
        
        if (habitsData.habits_clusters[cat.key].habits.length > 0) {
          habitsData.habits_clusters[cat.key].habits.forEach(h => {
            html += `<div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:6px;border-left:2px solid ${cat.color};margin-bottom:6px;">
              <div style="font-weight:600;">${h.title}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">
                🔥 ${h.current_streak} day streak | Best: ${h.best_streak} | ${h.difficulty}
              </div></div>`
          })
        } else {
          html += '<p style="color:var(--text-secondary);font-size:12px;">No habits in this category</p>'
        }
        html += '</div>'
      })
    }
    html += '</div>'

    html += `<div class="card"><h3>💡 Recommendations</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;">`
    
    if (overview.pending_tasks > 0) {
      html += `<div style="background:rgba(100,200,255,0.15);border-radius:8px;padding:12px;border-left:3px solid #6496ff;">
        <div style="font-weight:600;">Focus on Pending Tasks</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">You have ${overview.pending_tasks} pending. Try completing 3-5 today!</div></div>`
    }
    
    if (habits.active_habits > 0 && habits.avg_streak < 7) {
      html += `<div style="background:rgba(255,107,107,0.15);border-radius:8px;padding:12px;border-left:3px solid #ff6b6b;">
        <div style="font-weight:600;">Build Your Streak</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">Average streak is ${Math.round(habits.avg_streak)} days. Aim for 7+!</div></div>`
    }
    
    if (overview.total_tasks > 0 && (overview.completed_tasks / overview.total_tasks) > 0.8) {
      html += `<div style="background:rgba(76,175,80,0.15);border-radius:8px;padding:12px;border-left:3px solid #4CAF50;">
        <div style="font-weight:600;">Great Progress!</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">You're on 🔥 with ${Math.round((overview.completed_tasks / overview.total_tasks) * 100)}% completion!</div></div>`
    }
    
    html += '</div></div>'

    document.getElementById("page-content").innerHTML = html
  } catch (error) {
    console.error("Error loading analytics:", error)
    document.getElementById("page-content").innerHTML = `<p style="color:red;">Error: ${error.message}</p>`
  }
}

async function loadProfile() {
  try {
    const userId = localStorage.getItem("user_id")
    const response = await fetch(`api/dashboard.php?user_id=${userId}`)
    const data = await response.json()

    if (!data.success) return alert('Error loading profile')

    const user = data.user
    
    // Calculate overview stats from tasks
    const allTasksRes = await fetch(`api/tasks.php?action=list&user_id=${userId}`)
    const allTasksData = await allTasksRes.json()
    const allTasks = allTasksData.success ? allTasksData.tasks : []
    
    const overview = {
      total_tasks: allTasks.length,
      completed_tasks: allTasks.filter(t => t.status === 'completed').length,
      pending_tasks: allTasks.filter(t => t.status === 'pending').length
    }
    
    // Calculate habits stats
    const allHabitsRes = await fetch(`api/habits.php?action=list&user_id=${userId}`)
    const allHabitsData = await allHabitsRes.json()
    const allHabits = allHabitsData.success ? allHabitsData.habits : []
    
    const habits = {
      active_habits: allHabits.length,
      avg_streak: allHabits.length > 0 ? Math.round(allHabits.reduce((sum, h) => sum + (h.current_streak || 0), 0) / allHabits.length) : 0
    }

    let html = `
      <h2 class="analytics-title">👤 My Profile</h2>
      
      <div class="profile-container">
        <div class="card">
          <div class="profile-header">
            <div class="profile-header-icon">⭐</div>
            <h3 class="profile-header-title">${user.username || 'Player'}</h3>
            <div class="profile-header-subtitle">Level ${user.current_level || 1} Player</div>
          </div>
          
          <div class="xp-card">
            <div class="xp-card-label">TOTAL XP</div>
            <div class="xp-card-value">${user.total_xp || 0}</div>
            <div class="xp-card-weekly">📊 ${data.weekly_xp || 0} XP this week</div>
          </div>

          <div class="streak-card">
            <div class="streak-card-label">STREAK</div>
            <div class="streak-card-value">🔥 ${user.global_streak || 0} days</div>
          </div>
        </div>

        <div class="card">
          <h3 class="stats-header">📊 Your Stats</h3>
          
          <div class="stats-grid">
            <div class="stat-card stat-card-tasks">
              <div class="stat-card-label">Current Tasks</div>
              <div class="stat-card-value stat-card-value-tasks">${overview.pending_tasks || 0}</div>
            </div>
            <div class="stat-card stat-card-done">
              <div class="stat-card-label">Tasks Done</div>
              <div class="stat-card-value stat-card-value-done">${overview.completed_tasks || 0}</div>
            </div>
            <div class="stat-card stat-card-completion">
              <div class="stat-card-label">Completion</div>
              <div class="stat-card-value stat-card-value-completion">${overview.total_tasks > 0 ? Math.round((overview.completed_tasks / overview.total_tasks) * 100) : 0}%</div>
            </div>
            <div class="stat-card stat-card-habits">
              <div class="stat-card-label">Active Habits</div>
              <div class="stat-card-value stat-card-value-habits">${habits.active_habits || 0}</div>
            </div>
          </div>

          <div class="level-progress-card">
            <div class="level-progress-label">Level Progress</div>
            <div class="level-progress-bar">
              <div class="level-progress-fill" style="width:${Math.min((user.total_xp % (data.next_level_xp || 100)) / (data.next_level_xp || 100) * 100, 100)}%;"></div>
            </div>
            <div class="level-progress-text">Level ${(user.current_level || 0) + 1}: ${user.total_xp || 0} / ${data.next_level_xp || 0} XP</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="achievements-section">🎯 Achievements & Milestones</h3>
        <div class="achievements-grid">
          <div class="achievement-badge achievement-badge-task-master">
            <div class="achievement-icon">✓</div>
            <div class="achievement-title">Total Completed</div>
            <div class="achievement-text">${overview.completed_tasks} tasks done</div>
          </div>
          <div class="achievement-badge achievement-badge-on-fire">
            <div class="achievement-icon">🔥</div>
            <div class="achievement-title">Current Streak</div>
            <div class="achievement-text">${user.global_streak || 0} day streak</div>
          </div>
          <div class="achievement-badge achievement-badge-level">
            <div class="achievement-icon">📋</div>
            <div class="achievement-title">Active Tasks</div>
            <div class="achievement-text">${overview.pending_tasks} task${overview.pending_tasks !== 1 ? 's' : ''} remaining</div>
          </div>
          <div class="achievement-badge achievement-badge-habit">
            <div class="achievement-icon">💪</div>
            <div class="achievement-title">Building Habits</div>
            <div class="achievement-text">${habits.active_habits} habit${habits.active_habits !== 1 ? 's' : ''} active</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="settings-section">⚙️ Settings</h3>
        <div class="settings-list">
          <div class="settings-item">
            <div class="settings-item-title">📧 Email</div>
            <div class="settings-item-desc">Account settings</div>
          </div>
          <div class="settings-item">
            <div class="settings-item-title">🔔 Notifications</div>
            <div class="settings-item-desc">Manage reminders & alerts</div>
          </div>
          <div class="settings-item">
            <div class="settings-item-title">🎨 Preferences</div>
            <div class="settings-item-desc">Theme & display settings</div>
          </div>
        </div>
      </div>
    `

    document.getElementById("page-content").innerHTML = html
  } catch (error) {
    console.error("Error loading profile:", error)
  }
}

function handleLogout() {
  localStorage.removeItem("user_id")
  currentUser = null
  showAuthPage()
}
