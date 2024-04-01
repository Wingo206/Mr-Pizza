drop user if exists '{{sqlAuthUser}}'@'{{sqlHost}}';
create user '{{sqlAuthUser}}'@'{{sqlHost}}' identified by '{{sqlAuthPw}}';

drop user if exists '{{sqlVisitorUser}}'@'{{sqlHost}}';
create user '{{sqlVisitorUser}}'@'{{sqlHost}}' identified by '{{sqlVisitorPw}}';

drop user if exists '{{sqlCustomerUser}}'@'{{sqlHost}}';
create user '{{sqlCustomerUser}}'@'{{sqlHost}}' identified by '{{sqlCustomerPw}}';

drop user if exists '{{sqlEmployeeUser}}'@'{{sqlHost}}';
create user '{{sqlEmployeeUser}}'@'{{sqlHost}}' identified by '{{sqlEmployeePw}}';

drop user if exists '{{sqlAdminUser}}'@'{{sqlHost}}';
create user '{{sqlAdminUser}}'@'{{sqlHost}}' identified by '{{sqlAdminPw}}';
