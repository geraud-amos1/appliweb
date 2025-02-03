CREATE DATABASE mini_project;
USE mini_project;

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text VARCHAR(255) NOT NULL
);

INSERT INTO messages (text) VALUES ('Hello, World!');
