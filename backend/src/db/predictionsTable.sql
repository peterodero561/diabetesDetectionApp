CREATE DATABASE IF NOT EXISTS diabecare; 

USE diabecare;

CREATE TABLE predictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH'),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    
    INDEX(patient_id),
    INDEX(risk_level)
);