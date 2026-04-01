CREATE DATABASE IF NOT EXISTS diabecare; 

USE diabecare;

CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    pin VARCHAR(255), -- hashed
    doctor_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);