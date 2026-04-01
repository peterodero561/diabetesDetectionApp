CREATE DATABASE IF NOT EXISTS diabecare; 

USE diabecare;

CREATE TABLE medical_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT,
    
    pregnancies INT,
    glucose FLOAT,
    blood_pressure VARCHAR(20),
    skin_thickness INT,
    insulin INT,
    bmi FLOAT,
    diabetes_pedigree_function FLOAT,
    age INT,
    
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    
    INDEX(patient_id),
    INDEX(created_at)
);