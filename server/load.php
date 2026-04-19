<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$id = $_GET['id'] ?? '';

if (!preg_match('/^[A-Za-z0-9_\-]{11}$/', $id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid user ID']);
    exit;
}

$path = __DIR__ . '/' . $id . '.json';

if (!file_exists($path)) {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

echo file_get_contents($path);
