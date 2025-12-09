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
    $sql = "SELECT * FROM habits WHERE user_id = ? AND is_active = 1";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $habits = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    // Check completion status for each habit today
    $today = date('Y-m-d');
    foreach ($habits as &$habit) {
        $sql = "SELECT completion_id FROM habit_completions WHERE habit_id = ? AND completion_date = ?";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('is', $habit['habit_id'], $today);
        $stmt->execute();
        $completion = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        $habit['completed_today'] = !empty($completion);
    }
    
    echo json_encode(['success' => true, 'habits' => $habits]);

} elseif ($action === 'create') {
    $data = json_decode(file_get_contents('php://input'), true);
    $title = $data['title'] ?? '';
    $difficulty = $data['difficulty'] ?? 'medium';
    $recurrence = $data['recurrence'] ?? '{"days":[1,2,3,4,5]}';
    $category_id = $data['category_id'] ?? null;

    $sql = "INSERT INTO habits (user_id, title, difficulty, recurrence_pattern, category_id) VALUES (?, ?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('isssi', $user_id, $title, $difficulty, $recurrence, $category_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'habit_id' => $db->insert_id]);
    } else {
        echo json_encode(['success' => false, 'error' => $db->error]);
    }
    $stmt->close();

} elseif ($action === 'complete') {
    $data = json_decode(file_get_contents('php://input'), true);
    $habit_id = $data['habit_id'] ?? 0;

    // Check if already completed today
    $today = date('Y-m-d');
    $sql = "SELECT completion_id FROM habit_completions WHERE habit_id = ? AND completion_date = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('is', $habit_id, $today);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($existing) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Habit already completed today. Come back tomorrow!']);
        exit;
    }

    // Get habit info
    $sql = "SELECT difficulty, current_streak FROM habits WHERE habit_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $habit_id);
    $stmt->execute();
    $habit = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Calculate XP
    $xp_map = ['easy' => 5, 'medium' => 10, 'hard' => 20, 'extreme' => 50];
    $xp = $xp_map[$habit['difficulty']] ?? 10;

    // Add completion record
    $sql = "INSERT INTO habit_completions (habit_id, user_id, completion_date, xp_earned) VALUES (?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('iisi', $habit_id, $user_id, $today, $xp);
    $stmt->execute();
    $stmt->close();

    // Update habit streak
    $new_streak = $habit['current_streak'] + 1;
    $sql = "UPDATE habits SET current_streak = ?, last_completed_date = ? WHERE habit_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('isi', $new_streak, $today, $habit_id);
    $stmt->execute();
    $stmt->close();

    // Update best streak if needed
    $sql = "UPDATE habits SET best_streak = ? WHERE habit_id = ? AND ? > best_streak";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('iii', $new_streak, $habit_id, $new_streak);
    $stmt->execute();
    $stmt->close();

    // Add XP transaction
    $source_type = 'habit';
    $sql = "INSERT INTO xp_transactions (user_id, source_type, source_id, xp_amount) VALUES (?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('isii', $user_id, $source_type, $habit_id, $xp);
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
        $new_level = $user['current_level'];
    }

    if ($new_level > $user['current_level']) {
        $sql = "UPDATE users SET current_level = ? WHERE user_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('ii', $new_level, $user_id);
        $stmt->execute();
        $stmt->close();
    }

    // Calculate global_streak: count consecutive days with at least one habit completion
    $sql = "SELECT DISTINCT DATE(completion_date) as comp_date FROM habit_completions WHERE user_id = ? ORDER BY comp_date DESC LIMIT 365";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $dates = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    $global_streak = 0;
    $today_str = date('Y-m-d');
    
    if (!empty($dates)) {
        // Check if today is in the list (most recent date)
        $first_date_str = $dates[0]['comp_date'];
        
        // If today is the most recent completion, count backwards
        if ($first_date_str === $today_str) {
            $global_streak = 1;
            $last_ts = strtotime($first_date_str);
            
            for ($i = 1; $i < count($dates); $i++) {
                $current_ts = strtotime($dates[$i]['comp_date']);
                $diff_days = ($last_ts - $current_ts) / 86400;
                
                if ($diff_days == 1) {
                    $global_streak++;
                    $last_ts = $current_ts;
                } else {
                    break;
                }
            }
        } else {
            // Today is not the most recent, streak is broken
            $global_streak = 1;
        }
    }
    
    // Update user's global_streak
    $sql = "UPDATE users SET global_streak = ? WHERE user_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('ii', $global_streak, $user_id);
    $stmt->execute();
    $stmt->close();

    echo json_encode(['success' => true, 'xp_earned' => $xp, 'new_streak' => $new_streak, 'global_streak' => $global_streak]);
}

$db->close();
?>
