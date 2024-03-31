const {customerPool, runQuery} = require("../util/database_util.js");

// add example customer account information -> can login with example data
async function addCustomerAccounts() {
    await runQuery(customerPool, 'DELETE from customer_account');
    let customerQuery = await runQuery(customerPool, 'INSERT INTO customer_account(cid, username, default_delivery_address, phone_num, password_hash, email, default_credit_card) values' +
        '(1, "JohnDoe", "95 Rockafellar Rd, Piscataway, NJ 08854", "1234567890", "examplePass", "john_doe@gmail.com", "1234567891234567"),' + '(2, "JaneDoe", "95 Joyce Kilmer Ave, Piscataway, NJ", "9081230000", "password1", "janeDoe@yahoo.com", "1111222200009999")');

    console.log(customerQuery);
}

if (require.main === module) {
   addCustomerAccounts();
}
