-- Run this in your MySQL client to create the database
-- mysql -u root -p < create_db.sql

CREATE DATABASE IF NOT EXISTS ministry_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ministry_db;

-- Flask-Migrate will create all tables automatically.
-- Just run:  flask db init  →  flask db migrate  →  flask db upgrade
-- Or simply: python run.py init-db
