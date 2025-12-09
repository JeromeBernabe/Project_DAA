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
$action = $_GET['action'] ?? '';

if ($action === 'list') {
    $sql = "SELECT * FROM tasks WHERE user_id = ? ORDER BY deadline ASC";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $tasks = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    echo json_encode(['success' => true, 'tasks' => $tasks]);

} elseif ($action === 'create') {
    $data = json_decode(file_get_contents('php://input'), true);
    $title = $data['title'] ?? '';
    $difficulty = $data['difficulty'] ?? 'medium';
    $deadline = $data['deadline'] ?? null;
    $category_id = $data['category_id'] ?? null;
    $description = $data['description'] ?? '';

    $sql = "INSERT INTO tasks (user_id, title, difficulty, deadline, category_id, description) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $db->error]);
        exit;
    }
    // types: i=user_id, s=title, s=difficulty, s=deadline (nullable), i=category_id (nullable), s=description
    $stmt->bind_param('isssis', $user_id, $title, $difficulty, $deadline, $category_id, $description);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'task_id' => $db->insert_id]);
    } else {
        echo json_encode(['success' => false, 'error' => $db->error]);
    }
    $stmt->close();

} elseif ($action === 'complete') {
    $data = json_decode(file_get_contents('php://input'), true);
    $task_id = $data['task_id'] ?? 0;

    // Get task info
    $sql = "SELECT difficulty, estimated_duration FROM tasks WHERE task_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $task_id);
    $stmt->execute();
    $task = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$task) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Task not found']);
        exit;
    }

    // Check for incomplete dependencies
    $sql = "SELECT COUNT(*) as unfinished FROM task_dependencies td
            JOIN tasks t ON t.task_id = td.depends_on_task_id
            WHERE td.task_id = ? AND t.status != 'completed'";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $task_id);
    $stmt->execute();
    $depResult = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($depResult['unfinished'] > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Cannot complete task: unfinished dependencies exist']);
        exit;
    }

    // Calculate XP (10-50 based on difficulty)
    $xp_map = ['easy' => 10, 'medium' => 25, 'hard' => 50, 'extreme' => 100];
    $xp = $xp_map[$task['difficulty']] ?? 25;

    // Update task
    $sql = "UPDATE tasks SET status = 'completed', completed_at = NOW(), xp_earned = ? WHERE task_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('ii', $xp, $task_id);
    $stmt->execute();
    $stmt->close();

    // Add XP transaction
    $source_type = 'task';
    $sql = "INSERT INTO xp_transactions (user_id, source_type, source_id, xp_amount, description) VALUES (?, ?, ?, ?, 'Task completed')";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('isii', $user_id, $source_type, $task_id, $xp);
    $stmt->execute();
    $stmt->close();

    // Update user XP
    $sql = "UPDATE users SET total_xp = total_xp + ? WHERE user_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('ii', $xp, $user_id);
    $stmt->execute();
    $stmt->close();

    // Check for level up
    $sql = "SELECT total_xp, current_level FROM users WHERE user_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $sql = "SELECT level, xp_required FROM level_requirements WHERE xp_required <= ? ORDER BY xp_required DESC LIMIT 1";
    $stmt = $db->prepare($sql);
    if ($stmt) {
        $stmt->bind_param('i', $user['total_xp']);
        $stmt->execute();
        $level_row = $stmt->get_result()->fetch_assoc();
        $new_level = $level_row ? (int)$level_row['level'] : $user['current_level'];
        $stmt->close();
    } else {
        // If level table missing or query failed, keep current level
        $new_level = $user['current_level'];
    }

    if ($new_level > $user['current_level']) {
        $sql = "UPDATE users SET current_level = ? WHERE user_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('ii', $new_level, $user_id);
        $stmt->execute();
        $stmt->close();
    }

    echo json_encode(['success' => true, 'xp_earned' => $xp]);
}

$db->close();
?>
