<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', '0');
session_start();
require_once '../config/Database.php';

$user_id = $_SESSION['user_id'] ?? $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(['success' => false, 'error' => 'Not authenticated']);
    exit;
}

try {
    $conn = new Database();
    $db = $conn->connect();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Get user info
$sql = "SELECT username, total_xp, current_level, global_streak FROM users WHERE user_id = ?";
$stmt = $db->prepare($sql);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

// Get pending tasks
$sql = "SELECT task_id, title, difficulty, deadline FROM tasks WHERE user_id = ? AND status = 'pending' LIMIT 5";
$stmt = $db->prepare($sql);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$tasks = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Get active habits
$sql = "SELECT habit_id, title, current_streak, best_streak FROM habits WHERE user_id = ? AND is_active = 1 LIMIT 5";
$stmt = $db->prepare($sql);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$habits = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Get XP transactions this week
$sql = "SELECT SUM(xp_amount) as weekly_xp FROM xp_transactions WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
$stmt = $db->prepare($sql);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$xp_result = $stmt->get_result()->fetch_assoc();
$weekly_xp = $xp_result['weekly_xp'] ?? 0;
$stmt->close();

// Get next level requirement
$sql = "SELECT xp_required FROM level_requirements WHERE level = ?";
$stmt = $db->prepare($sql);
$next_level = $user['current_level'] + 1;
$stmt->bind_param('i', $next_level);
$stmt->execute();
$next_req = $stmt->get_result()->fetch_assoc();
$stmt->close();

echo json_encode([
    'success' => true,
    'user' => $user,
    'tasks' => $tasks,
    'habits' => $habits,
    'weekly_xp' => $weekly_xp,
    'next_level_xp' => $next_req['xp_required'] ?? 0
]);

$db->close();
?>
