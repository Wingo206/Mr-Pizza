const path = require('path');
const fs = require('node:fs');
const conf = require('../lib/util/config');

// array values: 0 = none, 1 = read, 2 = readwrite, 3 = readwrite+
let permissionsTable = {};
permissionsTable[conf.sqlAuthUser] = {
   "admin_account": 2,
   "custom": 0,
   "custom_availability": 0,
   "custom_option": 0,
   "customer_account": 2,
   "customer_order": 0,
   "delivery_batch": 0,
   "employee_account": 2,
   "help_ticket": 0,
   "in_batch": 0,
   "item_availability": 0,
   "made_by": 0,
   "menu_item": 0,
   "order_item": 0,
   "review": 0,
   "store": 0,
   "with_custom": 0,
}

permissionsTable[conf.sqlVisitorUser] = {
   "admin_account": 0,
   "custom": 1,
   "custom_availability": 1,
   "custom_option": 1,
   "customer_account": 0,
   "customer_order": 0,
   "delivery_batch": 0,
   "employee_account": 0,
   "help_ticket": 0,
   "in_batch": 0,
   "item_availability": 1,
   "made_by": 0,
   "menu_item": 1,
   "order_item": 0,
   "review": 0,
   "store": 1,
   "with_custom": 0,

}

permissionsTable[conf.sqlCustomerUser] = {
   "admin_account": 0,
   "custom": 2,
   "custom_availability": 1,
   "custom_option": 1,
   "customer_account": 2,
   "customer_order": 2,
   "delivery_batch": 1,
   "employee_account": 0,
   "help_ticket": 2,
   "in_batch": 1,
   "item_availability": 1,
   "made_by": 1,
   "menu_item": 1,
   "order_item": 2,
   "review": 2,
   "store": 1,
   "with_custom": 2,
}

permissionsTable[conf.sqlEmployeeUser] = {
   "admin_account": 0,
   "custom": 2,
   "custom_availability": 2,
   "custom_option": 1,
   "customer_account": 1,
   "customer_order": 2,
   "delivery_batch": 2,
   "employee_account": 2,
   "help_ticket": 2,
   "in_batch": 2,
   "item_availability": 2,
   "made_by": 2,
   "menu_item": 1,
   "order_item": 2,
   "review": 2,
   "store": 1,
   "with_custom": 2,
}

permissionsTable[conf.sqlAdminUser] = {
   "admin_account": 3,
   "custom": 3,
   "custom_availability": 3,
   "custom_option": 3,
   "customer_account": 3,
   "customer_order": 3,
   "delivery_batch": 3,
   "employee_account": 3,
   "help_ticket": 3,
   "in_batch": 3,
   "item_availability": 3,
   "made_by": 3,
   "menu_item": 3,
   "order_item": 3,
   "review": 3,
   "store": 3,
   "with_custom": 3,
}
/**
 * input: config to substitute, filepath
 * return: contents of the substituted file
 */
function substitute(config, inFileName) {
   let templatePath = __dirname + path.sep + inFileName;
   let template = fs.readFileSync(templatePath, 'utf8')
   // console.log(template)
   for (const [key, value] of Object.entries(config)) {
      template = template.replaceAll('{{' + key + '}}', value);
   }

   return template;
}

/**
 * returns: string containing sql commands to set all permissions
 */
function generateUserPermissions(config) {
   let grantPerms = ['', 'select', 'select, insert, update, delete', 'select, insert, update, delete, alter, drop'];
   let output = '';
   let keys = Object.keys(permissionsTable);
   for (let i = 0; i < keys.length; i++) {
      let curUser = keys[i];
      let permissions = permissionsTable[curUser];

      // iterate all entries in the perms for this user
      let tableNames = Object.keys(permissions);
      for (let j = 0; j < tableNames.length; j++) {
         let curTableName = tableNames[j];
         let permissionLevel = permissions[curTableName];
         // skip if no permissions
         if (permissionLevel == 0) {
            continue;
         }
         output += `grant ${grantPerms[permissionLevel]} on ${config.database}.${curTableName} to "${curUser}"@"${config.sqlHost}";\n`;
      }

   }
   return output;
}

function runSubstitute() {
   let usersSetup = substitute(conf, 'template_users_setup.sql');

   // setup for normal database
   let databaseSetup = substitute(conf, 'template_setup.sql');
   let databasePerms = generateUserPermissions(conf);
   
   // setup for unit testing database
   let conf2 = JSON.parse(JSON.stringify(conf));
   if (conf2.unitTestDatabase == undefined) {
      throw new Error("Unit test database is not defined in config.js. Please specify ");
   }

   conf2.database = conf2.unitTestDatabase;
   let testingDatabaseSetup = substitute(conf2, 'template_setup.sql');
   let testingDatabasePerms = generateUserPermissions(conf2);

   // output the full setup into temp folder
   let fullSetup = [usersSetup, databaseSetup, databasePerms, testingDatabaseSetup, testingDatabasePerms].join("\n");

   let tempPath = __dirname + path.sep + 'temp'
   if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath)
   }
   let outPath = tempPath + path.sep + 'setup.sql';
   fs.writeFileSync(outPath, fullSetup);
}

if (require.main === module) {
   runSubstitute();
}
