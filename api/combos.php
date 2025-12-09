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

// Helper function for error responses
function jsonError($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
}

if ($action === 'list') {
    $sql = "SELECT c.combo_id, c.name, c.description, c.deadline, c.status, c.xp_earned, c.created_at,
            (SELECT COUNT(*) FROM tasks t WHERE t.combo_id = c.combo_id) AS total_tasks,
            (SELECT COUNT(*) FROM tasks t WHERE t.combo_id = c.combo_id AND t.status = 'completed') AS completed_tasks
            FROM combos c WHERE c.user_id = ? ORDER BY c.created_at DESC";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode(['success' => true, 'combos' => $res]);
    exit;

} elseif ($action === 'detail') {
    $combo_id = intval($_GET['combo_id'] ?? 0);
    if (!$combo_id) jsonError('Missing combo_id');

    // fetch combo
    $sql = "SELECT * FROM combos WHERE combo_id = ? AND user_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('ii', $combo_id, $user_id);
    $stmt->execute();
    $combo = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$combo) jsonError('Combo not found', 404);

    // fetch tasks in combo
    $sql = "SELECT * FROM tasks WHERE combo_id = ? ORDER BY created_at ASC";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $combo_id);
    $stmt->execute();
    $tasks = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // fetch dependencies involving these tasks
    $taskIds = array_column($tasks, 'task_id');
    $deps = [];
    if (count($taskIds) > 0) {
        $placeholders = implode(',', array_fill(0, count($taskIds), '?'));

        $sql = "SELECT * FROM task_dependencies WHERE task_id IN ($placeholders) OR depends_on_task_id IN ($placeholders)";
        $stmt = $db->prepare($sql);
        // bind params dynamically
        $params = array_merge($taskIds, $taskIds);
        $types = str_repeat('i', count($params));
        $bind_names = [];
        $bind_names[] = $types;
        for ($i = 0; $i < count($params); $i++) {
            $bind_names[] = &$params[$i];
        }
        call_user_func_array([$stmt, 'bind_param'], $bind_names);
        $stmt->execute();
        $deps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
    }

    echo json_encode(['success' => true, 'combo' => $combo, 'tasks' => $tasks, 'dependencies' => $deps]);
    exit;

} elseif ($action === 'create') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'] ?? '';
    $description = $data['description'] ?? '';
    if (!$name) jsonError('Name required');

    $sql = "INSERT INTO combos (user_id, name, description) VALUES (?, ?, ?)";
    $stmt = $db->prepare($sql);
    if (!$stmt) jsonError($db->error, 500);
    $stmt->bind_param('iss', $user_id, $name, $description);
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'combo_id' => $db->insert_id]);
    } else {
        jsonError($db->error, 500);
    }
    $stmt->close();
    exit;

} elseif ($action === 'add_task') {
    $data = json_decode(file_get_contents('php://input'), true);
    $task_id = $data['task_id'] ?? null;
    $combo_id = intval($data['combo_id'] ?? 0);
    if (!$combo_id) jsonError('Missing combo_id');

    if ($task_id) {
        // attach existing task (ensure it belongs to user)
        $sql = "UPDATE tasks SET combo_id = ? WHERE task_id = ? AND user_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->bind_param('iii', $combo_id, $task_id, $user_id);
        $stmt->execute();
        if ($stmt->affected_rows > 0) echo json_encode(['success' => true]);
        else jsonError('Unable to attach task (not found or not yours)');
        $stmt->close();
        exit;
    } else {
        // create a new task inside combo
        $title = $data['title'] ?? '';
        if (!$title) jsonError('Task title required');
        $difficulty = $data['difficulty'] ?? 'medium';
        $deadline = $data['deadline'] ?? null;
        $description = $data['description'] ?? '';

        $sql = "INSERT INTO tasks (user_id, combo_id, title, difficulty, deadline, description) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $db->prepare($sql);
        if (!$stmt) jsonError($db->error, 500);
        $stmt->bind_param('iissss', $user_id, $combo_id, $title, $difficulty, $deadline, $description);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'task_id' => $db->insert_id]);
        } else {
            jsonError($db->error, 500);
        }
        $stmt->close();
        exit;
    }

} elseif ($action === 'remove_task') {
    $data = json_decode(file_get_contents('php://input'), true);
    $task_id = intval($data['task_id'] ?? 0);
    if (!$task_id) jsonError('task_id required');

    $sql = "UPDATE tasks SET combo_id = NULL WHERE task_id = ? AND user_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('ii', $task_id, $user_id);
    $stmt->execute();
    if ($stmt->affected_rows > 0) echo json_encode(['success' => true]);
    else jsonError('Unable to remove task from combo');
    $stmt->close();
    exit;

} elseif ($action === 'add_dependency') {
    $data = json_decode(file_get_contents('php://input'), true);
    $task_id = intval($data['task_id'] ?? 0); // dependent task
    $depends_on = intval($data['depends_on_task_id'] ?? 0); // prerequisite
    if (!$task_id || !$depends_on) jsonError('task_id and depends_on_task_id required');

    // ensure both tasks exist and belong to user
    $sql = "SELECT task_id FROM tasks WHERE task_id IN (?, ?) AND user_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('iii', $task_id, $depends_on, $user_id);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    if (count($res) < 2) jsonError('One or both tasks not found or not yours');

    // circular dependency check: adding edge (depends_on -> task)
    function pathExists($db, $start, $end) {
        // check if there's a path from start -> end using DFS
        $seen = [];
        $stack = [$start];
        while (!empty($stack)) {
            $node = array_pop($stack);
            if (isset($seen[$node])) continue;
            $seen[$node] = true;
            if ($node == $end) return true;
            $sql = "SELECT task_id FROM task_dependencies WHERE depends_on_task_id = ?";
            $stmt = $db->prepare($sql);
            $stmt->bind_param('i', $node);
            $stmt->execute();
            $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();
            foreach ($rows as $r) $stack[] = $r['task_id'];
        }
        return false;
    }

    // if there is already a path from task -> depends_on, adding depends_on->task would create a cycle
    if (pathExists($db, $task_id, $depends_on)) {
        jsonError('Circular dependency detected!');
    }

    $sql = "INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES (?, ?)";
    $stmt = $db->prepare($sql);
    if (!$stmt) jsonError($db->error, 500);
    $stmt->bind_param('ii', $task_id, $depends_on);
    if ($stmt->execute()) echo json_encode(['success' => true]);
    else jsonError($db->error, 500);
    $stmt->close();
    exit;

} elseif ($action === 'remove_dependency') {
    $data = json_decode(file_get_contents('php://input'), true);
    $task_id = intval($data['task_id'] ?? 0);
    $depends_on = intval($data['depends_on_task_id'] ?? 0);
    if (!$task_id || !$depends_on) jsonError('task_id and depends_on_task_id required');

    $sql = "DELETE FROM task_dependencies WHERE task_id = ? AND depends_on_task_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('ii', $task_id, $depends_on);
    $stmt->execute();
    if ($stmt->affected_rows > 0) echo json_encode(['success' => true]);
    else jsonError('Dependency not found');
    $stmt->close();
    exit;

} elseif ($action === 'calculate') {
    // calculate critical path for combo
    $combo_id = intval($_GET['combo_id'] ?? 0);
    if (!$combo_id) jsonError('Missing combo_id');

    // fetch tasks in combo
    $sql = "SELECT task_id, title, estimated_duration FROM tasks WHERE combo_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param('i', $combo_id);
    $stmt->execute();
    $taskRows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    if (count($taskRows) === 0) jsonError('No tasks in combo');

    $tasks = [];
    foreach ($taskRows as $r) {
        $tasks[$r['task_id']] = [
            'task_id' => (int)$r['task_id'],
            'title' => $r['title'],
            'duration' => $r['estimated_duration'] ? (int)$r['estimated_duration'] : 1,
            'succ' => [],
            'pred' => []
        ];
    }

    // get dependencies among tasks in combo
    $ids = array_keys($tasks);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $sql = "SELECT task_id, depends_on_task_id FROM task_dependencies WHERE task_id IN ($placeholders) OR depends_on_task_id IN ($placeholders)";
    $stmt = $db->prepare($sql);
    $params = array_merge($ids, $ids);
    $types = str_repeat('i', count($params));
    $bind_names = [];
    $bind_names[] = $types;
    for ($i = 0; $i < count($params); $i++) $bind_names[] = &$params[$i];
    call_user_func_array([$stmt, 'bind_param'], $bind_names);
    $stmt->execute();
    $deps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    foreach ($deps as $d) {
        $tid = (int)$d['task_id'];
        $pid = (int)$d['depends_on_task_id'];
        if (isset($tasks[$tid]) && isset($tasks[$pid])) {
            $tasks[$pid]['succ'][] = $tid; // edge pid -> tid
            $tasks[$tid]['pred'][] = $pid;
        }
    }

    // topological order (Kahn)
    $inDegree = [];
    foreach ($tasks as $id => $t) $inDegree[$id] = count($t['pred']);
    $queue = [];
    foreach ($inDegree as $id => $deg) if ($deg === 0) $queue[] = $id;
    $topo = [];
    while (!empty($queue)) {
        $n = array_shift($queue);
        $topo[] = $n;
        foreach ($tasks[$n]['succ'] as $m) {
            $inDegree[$m]--;
            if ($inDegree[$m] === 0) $queue[] = $m;
        }
    }

    if (count($topo) !== count($tasks)) jsonError('Circular dependency detected in combo', 500);

    // earliest start/finish
    $es = []; $ef = [];
    foreach ($topo as $id) {
        $maxPredEF = 0;
        foreach ($tasks[$id]['pred'] as $p) {
            $maxPredEF = max($maxPredEF, $ef[$p]);
        }
        $es[$id] = $maxPredEF;
        $ef[$id] = $es[$id] + $tasks[$id]['duration'];
    }

    $projectDuration = max($ef);

    // latest finish/start init
    $lf = []; $ls = [];
    foreach (array_reverse($topo) as $id) {
        if (empty($tasks[$id]['succ'])) {
            $lf[$id] = $projectDuration;
        } else {
            $minSuccLS = PHP_INT_MAX;
            foreach ($tasks[$id]['succ'] as $s) $minSuccLS = min($minSuccLS, $ls[$s]);
            $lf[$id] = $minSuccLS;
        }
        $ls[$id] = $lf[$id] - $tasks[$id]['duration'];
    }

    $result = [];
    foreach ($tasks as $id => $t) {
        $result[$id] = [
            'task_id' => $id,
            'title' => $t['title'],
            'duration' => $t['duration'],
            'earliest_start' => $es[$id],
            'earliest_finish' => $ef[$id],
            'latest_start' => $ls[$id],
            'latest_finish' => $lf[$id],
            'slack' => $ls[$id] - $es[$id],
            'critical' => ($ls[$id] - $es[$id]) === 0
        ];
    }

    $cpJson = json_encode(['project_duration' => $projectDuration, 'tasks' => array_values($result)]);

    // save to combos
    $sql = "UPDATE combos SET critical_path_data = ? WHERE combo_id = ? AND user_id = ?";
    $stmt = $db->prepare($sql);
    if (!$stmt) jsonError($db->error, 500);
    $stmt->bind_param('sii', $cpJson, $combo_id, $user_id);
    if ($stmt->execute()) echo json_encode(['success' => true, 'critical_path' => json_decode($cpJson, true)]);
    else jsonError($db->error, 500);
    $stmt->close();
    exit;

} else {
    jsonError('Unknown action', 400);
}

$db->close();

?>
