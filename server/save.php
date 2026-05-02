<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$id = $_GET['id'] ?? '';

// Strict validation: exactly 11 chars, YouTube-style base64url alphabet only
if (!preg_match('/^[A-Za-z0-9_\-]{11}$/', $id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid user ID']);
    exit;
}

$body = file_get_contents('php://input');

if (strlen($body) > 5 * 1024 * 1024) {
    http_response_code(413);
    echo json_encode(['error' => 'Payload too large']);
    exit;
}

if (json_decode($body) === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$dir = __DIR__ . '/userdata';
$path = $dir . '/' . $id . '.json';

if (file_put_contents($path, $body, LOCK_EX) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save']);
    exit;
}

http_response_code(200);
echo json_encode(['ok' => true]);
