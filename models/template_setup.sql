drop database if exists {{{database}}};

create database {{{database}}};

drop user if exists '{{{sqlCustomerUser}}}'@'{{{sqlHost}}}';
create user '{{{sqlCustomerUser}}}'@'{{{sqlHost}}}' identified by '{{{sqlCustomerPw}}}';

use {{{database}}};

create table customer_account(cid int primary key auto_increment, username varchar(30), default_delivery_address varchar(40), phone_num varchar(15), password_hash varchar(50), email varchar(40), default_credit_card varchar(20));
