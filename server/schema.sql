CREATE DATABASE instalyze;

USE instalyze;

CREATE TABLE profiles (
  /* Describe your table here.*/
  id int NOT NULL AUTO_INCREMENT,
  userid int UNIQUE,
  username varchar(255),
  full_name varchar(255),
  profile_picture varchar(255),
  bio varchar(255),
  media_count int,
  follows int,
  followers int,
  PRIMARY KEY (ID)
);

-- CREATE TABLE followers (
--   id int NOT NULL AUTO_INCREMENT,
--   username varchar(40) NOT NULL,
--   PRIMARY KEY (ID)
-- );


/*  Execute this file from the command line by typing:
 *    m
 *  to create the database and the tables.*/