<?php
$host = 'localhost';
$username = 'root';
$password = '';

// Connect to MySQL server
$conn = new mysqli($host, $username, $password);

if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}

// Create database
$sql = 'CREATE DATABASE IF NOT EXISTS gamified_app';
if (!$conn->query($sql)) {
    die('Error creating database: ' . $conn->error);
}

// Select database
$conn->select_db('gamified_app');

// Create tables
$tables = "
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    total_xp INT DEFAULT 0,
    current_level INT DEFAULT 1,
    global_streak INT DEFAULT 0,
    last_active_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category (user_id, name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tasks (
    task_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty ENUM('easy', 'medium', 'hard', 'extreme') DEFAULT 'medium',
    estimated_duration INT,
    deadline DATETIME,
    priority_score DECIMAL(5,2),
    status ENUM('pending', 'in_progress', 'completed', 'skipped', 'failed') DEFAULT 'pending',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    xp_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_user_status (user_id, status),
    INDEX idx_deadline (deadline)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS habits (
    habit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty ENUM('easy', 'medium', 'hard', 'extreme') DEFAULT 'medium',
    recurrence_pattern VARCHAR(50),
    current_streak INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    last_completed_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    INDEX idx_user_active (user_id, is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS habit_completions (
    completion_id INT AUTO_INCREMENT PRIMARY KEY,
    habit_id INT NOT NULL,
    user_id INT NOT NULL,
    completion_date DATE NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    xp_earned INT DEFAULT 0,
    FOREIGN KEY (habit_id) REFERENCES habits(habit_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_habit_date (habit_id, completion_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS xp_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    source_type ENUM('task', 'habit', 'streak_bonus', 'other'),
    source_id INT,
    xp_amount INT NOT NULL,
    description VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS level_requirements (
    level INT PRIMARY KEY,
    xp_required INT NOT NULL,
    level_name VARCHAR(50)
) ENGINE=InnoDB;
";

if ($conn->multi_query($tables)) {
    echo 'Tables created successfully!';
} else {
    echo 'Error: ' . $conn->error;
}

// Insert level requirements
$levels = [
    [1, 0, 'Novice'],
    [2, 100, 'Beginner'],
    [3, 250, 'Apprentice'],
    [4, 500, 'Intermediate'],
    [5, 1000, 'Advanced'],
    [6, 2000, 'Expert'],
    [7, 4000, 'Master'],
    [8, 8000, 'Grandmaster'],
    [9, 16000, 'Legend'],
    [10, 32000, 'Mythic']
];

foreach ($levels as $level) {
    $conn->query("INSERT IGNORE INTO level_requirements VALUES ({$level[0]}, {$level[1]}, '{$level[2]}')");
}

echo ' Levels inserted!';
$conn->close();
?>
