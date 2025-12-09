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

if ($action === 'overview') {
    // Get task statistics
    $sql = "SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        AVG(CASE WHEN difficulty='easy' THEN 10 WHEN difficulty='medium' THEN 25 WHEN difficulty='hard' THEN 50 WHEN difficulty='extreme' THEN 100 END) as avg_difficulty
    FROM tasks WHERE user_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $task_stats = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Get habit statistics
    $sql = "SELECT 
        COUNT(*) as total_habits,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_habits,
        AVG(current_streak) as avg_streak,
        MAX(best_streak) as max_streak
    FROM habits WHERE user_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $habit_stats = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Get difficulty distribution
    $sql = "SELECT difficulty, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY difficulty";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $difficulty_dist = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // Get completion trend (last 30 days)
    $sql = "SELECT DATE(created_at) as date, COUNT(*) as completions FROM xp_transactions 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
            GROUP BY DATE(created_at) ORDER BY date";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $trend = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode([
        'success' => true,
        'tasks' => $task_stats,
        'habits' => $habit_stats,
        'difficulty_dist' => $difficulty_dist,
        'trend' => $trend
    ]);

} elseif ($action === 'clustering') {
    // K-Means clustering on task data
    $sql = "SELECT task_id, difficulty, 
            (CASE WHEN difficulty='easy' THEN 1 WHEN difficulty='medium' THEN 2 WHEN difficulty='hard' THEN 3 WHEN difficulty='extreme' THEN 4 END) as difficulty_val,
            (CASE WHEN status='completed' THEN 1 ELSE 0 END) as is_completed,
            (CASE WHEN DATEDIFF(NOW(), deadline) <= 0 THEN 1 ELSE 0 END) as is_urgent
            FROM tasks WHERE user_id = ? LIMIT 50";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $tasks = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    if (empty($tasks)) {
        echo json_encode(['success' => true, 'clusters' => [], 'message' => 'No tasks to cluster']);
        exit;
    }

    // Simple K-Means clustering (k=3: High Priority, Medium Priority, Low Priority)
    $k = 3;
    $clusters = performKMeans($tasks, $k);

    // Get cluster insights
    $insights = [];
    foreach ($clusters as $idx => $cluster) {
        $avg_difficulty = array_sum(array_column($cluster, 'difficulty_val')) / count($cluster);
        $completion_rate = (array_sum(array_column($cluster, 'is_completed')) / count($cluster)) * 100;
        $urgency_count = array_sum(array_column($cluster, 'is_urgent'));
        
        $insights[] = [
            'cluster_id' => $idx,
            'size' => count($cluster),
            'avg_difficulty' => round($avg_difficulty, 2),
            'completion_rate' => round($completion_rate, 1),
            'urgent_tasks' => $urgency_count,
            'tasks' => $cluster
        ];
    }

    usort($insights, function($a, $b) {
        return ($b['avg_difficulty'] + ($b['urgent_tasks'] * 0.5)) <=> 
               ($a['avg_difficulty'] + ($a['urgent_tasks'] * 0.5));
    });

    echo json_encode([
        'success' => true,
        'clusters' => $insights
    ]);

} elseif ($action === 'habits_analysis') {
    // Cluster habits by streak performance
    $sql = "SELECT habit_id, title, current_streak, best_streak, difficulty,
            (current_streak * 0.6 + best_streak * 0.4) as performance_score
            FROM habits WHERE user_id = ? AND is_active = 1 ORDER BY performance_score DESC";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $habits = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    if (empty($habits)) {
        echo json_encode(['success' => true, 'habits_clusters' => [], 'message' => 'No habits to analyze']);
        exit;
    }

    // Categorize habits into clusters: Thriving, Steady, Struggling
    $clusters = [
        'thriving' => ['habits' => [], 'threshold' => 0.67],
        'steady' => ['habits' => [], 'threshold' => 0.33],
        'struggling' => ['habits' => []]
    ];

    $max_score = max(array_column($habits, 'performance_score')) ?: 1;

    foreach ($habits as $habit) {
        $normalized_score = $habit['performance_score'] / $max_score;
        
        if ($normalized_score >= $clusters['thriving']['threshold']) {
            $clusters['thriving']['habits'][] = $habit;
        } elseif ($normalized_score >= $clusters['steady']['threshold']) {
            $clusters['steady']['habits'][] = $habit;
        } else {
            $clusters['struggling']['habits'][] = $habit;
        }
    }

    echo json_encode([
        'success' => true,
        'habits_clusters' => $clusters
    ]);
}

/**
 * Simple K-Means clustering algorithm
 */
function performKMeans($data, $k = 3, $iterations = 10) {
    if (count($data) <= $k) {
        // If data points <= k, each gets its own cluster
        $clusters = [];
        foreach ($data as $idx => $point) {
            $clusters[$idx] = [$point];
        }
        return $clusters;
    }

    // Initialize centroids randomly
    $indices = array_rand($data, min($k, count($data)));
    if (!is_array($indices)) {
        $indices = [$indices];
    }
    
    $centroids = [];
    foreach ($indices as $idx) {
        $centroids[] = [
            'difficulty_val' => $data[$idx]['difficulty_val'],
            'is_completed' => $data[$idx]['is_completed'],
            'is_urgent' => $data[$idx]['is_urgent']
        ];
    }

    for ($iter = 0; $iter < $iterations; $iter++) {
        // Assign points to nearest centroid
        $clusters = array_fill(0, count($centroids), []);
        
        foreach ($data as $point) {
            $min_dist = PHP_FLOAT_MAX;
            $nearest_cluster = 0;
            
            foreach ($centroids as $idx => $centroid) {
                $dist = euclideanDistance($point, $centroid);
                if ($dist < $min_dist) {
                    $min_dist = $dist;
                    $nearest_cluster = $idx;
                }
            }
            
            $clusters[$nearest_cluster][] = $point;
        }

        // Recalculate centroids
        $new_centroids = [];
        foreach ($clusters as $cluster) {
            if (empty($cluster)) {
                $new_centroids[] = $centroids[count($new_centroids)] ?? $centroids[0];
            } else {
                $new_centroids[] = [
                    'difficulty_val' => array_sum(array_column($cluster, 'difficulty_val')) / count($cluster),
                    'is_completed' => array_sum(array_column($cluster, 'is_completed')) / count($cluster),
                    'is_urgent' => array_sum(array_column($cluster, 'is_urgent')) / count($cluster)
                ];
            }
        }

        $centroids = $new_centroids;
    }

    // Remove empty clusters
    return array_filter($clusters, fn($c) => !empty($c));
}

function euclideanDistance($point1, $point2) {
    $diff_difficulty = ($point1['difficulty_val'] - $point2['difficulty_val']) ** 2;
    $diff_completed = ($point1['is_completed'] - $point2['is_completed']) ** 2;
    $diff_urgent = ($point1['is_urgent'] - $point2['is_urgent']) ** 2;
    
    return sqrt($diff_difficulty + $diff_completed + $diff_urgent);
}

$db->close();
?>
