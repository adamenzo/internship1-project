backend 
                 npx nodemon server.js

frontend 
                 npm start

db                mysql -u root -p
Table: alertes
Columns:
id int AI PK 
ap_id int 
type varchar(50) 
message text 
severity enum('info','warning','critical') 
est_resolue tinyint(1) 
created_at timestamp 
resolved_at datetime

Table: metriques
Columns:
id int AI PK 
ap_id int 
timestamp datetime 
clients_connectes int 
debit_entrant decimal(10,2) 
debit_sortant decimal(10,2) 
cpu_usage decimal(5,2) 
mem_usage decimal(5,2)

Table: notifications
Columns:
id int AI PK 
user_id int 
message text 
lue tinyint(1) 
created_at timestamp

Table: points_acces
Columns:
id int AI PK 
mac varchar(17) 
nom varchar(100) 
modele varchar(100) 
firmware varchar(50) 
ip_address varchar(15) 
site_id int 
batiment varchar(100) 
etage varchar(50) 
salle varchar(100) 
latitude decimal(10,8) 
longitude decimal(11,8) 
statut enum('actif','maintenance','hors_ligne') 
dernier_contact datetime 
created_at timestamp 
updated_at timestamp

Table: roles
Columns:
id int AI PK 
nom varchar(50)

Table: sites
Columns:
id int AI PK 
nom varchar(100) 
adresse text 
latitude decimal(10,8) 
longitude decimal(11,8)

Table: users
Columns:
id int AI PK 
email varchar(150) 
password varchar(255) 
nom varchar(100) 
prenom varchar(100) 
telephone varchar(20) 
role_id int 
created_at timestamp