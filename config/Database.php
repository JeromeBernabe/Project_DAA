<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'gamified_app';
    private $username = 'root';
    private $password = '';
    private $conn;

    public function connect() {
        $this->conn = new mysqli($this->host, $this->username, $this->password, $this->db_name);
        
        if ($this->conn->connect_error) {
            http_response_code(500);
            exit(json_encode(['success' => false, 'error' => 'Database connection failed']));
        }
        
        return $this->conn;
    }

    public static function getInstance() {
        static $instance = null;
        if ($instance === null) {
            $instance = new self();
            $instance->connect();
        }
        return $instance->conn;
    }
}
?>
