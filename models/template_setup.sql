drop database if exists {{database}};

create database {{database}};

drop user if exists '{{sqlAuthUser}}'@'{{sqlHost}}';
create user '{{sqlAuthUser}}'@'{{sqlHost}}' identified by '{{sqlAuthPw}}';

drop user if exists '{{sqlCustomerUser}}'@'{{sqlHost}}';
create user '{{sqlCustomerUser}}'@'{{sqlHost}}' identified by '{{sqlCustomerPw}}';

use {{database}};

create table customer_account(cid int primary key auto_increment, username varchar(30), default_delivery_address varchar(40), phone_num varchar(15), password_hash varchar(50), email varchar(40), default_credit_card varchar(20));

create table admin_account(aid int primary key auto_increment, email varchar(40), password_hash varchar(50));

create table store (store_id int primary key auto_increment, address varchar(40), image_url varchar(1000));

create table employee_account(eid int primary key auto_increment, name varchar(50), employee_type varchar(20), email varchar(50), password_hash varchar(50), works_at int,
foreign key(works_at) references store(store_id));

create table help_ticket(tid int auto_increment primary key, asked_by int not null, answered_by int, date_created date, question varchar(200), answer varchar(200), quality_rating boolean, original_tid int, DTSTAMP datetime,
foreign key(asked_by) references customer_account(cid),
foreign key(answered_by) references employee_account(eid));
alter table help_ticket add constraint original_tid_references_help_ticket foreign key(original_tid) references help_ticket(tid) on delete set null;

create table customer_order(order_id int primary key auto_increment, credit_card varchar(20), status varchar(20), total_price float, delivery_address varchar(40), DT_created datetime, DT_delivered datetime, ordered_by int not null, 
foreign key(ordered_by) references customer_account(cid));

create table menu_item(mid int primary key auto_increment, price float, image_url varchar(1000), description varchar(1000));

create table order_item(item_num int auto_increment, order_id int not null, mid int not null,
primary key(item_num, order_id, mid),
foreign key(mid) references menu_item(mid),
foreign key(order_id) references customer_order(order_id));

create table topping(topping_name varchar(30), mid int not null, price float,
primary key(mid, topping_name),
foreign key(mid) references menu_item(mid));

create table with_topping(order_id int, item_num int, mid int not null, topping_name varchar(30),
primary key(order_id, mid, item_num, topping_name),
foreign key(item_num, order_id, mid) references order_item(item_num, order_id, mid),
foreign key(mid, topping_name) references topping(mid, topping_name));

create table delivery_batch(batch_id int primary key auto_increment, location varchar(40), DT_stamp datetime, driver_status varchar(20), assignedToEmp int,
foreign key(assignedToEmp) references employee_account(eid));

create table in_batch(order_id int, batch_id int,
primary key(order_id, batch_id),
foreign key(order_id) references customer_order(order_id),
foreign key(batch_id) references delivery_batch(batch_id));

create table review(mid int not null, rid int auto_increment primary key, description varchar(1000), DT_stamp datetime, stars float,
	reviewedBy int not null,
foreign key(mid) references menu_item(mid),
foreign key(reviewedBy) references customer_account(cid));

create table made_by(order_id int, eid int, 
primary key(order_id, eid),
foreign key(order_id) references customer_order(order_id),
foreign key(eid) references employee_account(eid));

create table topping_availability(mid int, topping_name varchar(30), store_id int, available boolean,
primary key(mid, topping_name, store_id),
foreign key(mid, topping_name) references topping(mid, topping_name),
foreign key(store_id) references store(store_id));

create table item_availability(mid int, store_id int, available boolean,
primary key(mid, store_id),
foreign key(mid) references menu_item(mid),
foreign key(store_id) references store(store_id));


grant select, insert, update, delete on {{database}}.customer_account to '{{sqlAuthUser}}'@'{{sqlHost}}';
grant select, insert, update, delete on {{database}}.customer_account to '{{sqlCustomerUser}}'@'{{sqlHost}}';
