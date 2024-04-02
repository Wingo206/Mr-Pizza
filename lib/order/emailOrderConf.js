const nodemailer = require('nodemailer');
const mysql = require("mysql2");
const {runQuery, customerPool, adminPool} = require("../util/database_util");


async function sendEmail(req, res) {
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        port: 587,
        auth: {
        user: 'realmrpizza285@gmail.com',
        pass: 'cmcd hgju nekz drqj'
        },
        secure: false,
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false,
        }
    });
    
    let body = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
        })
        req.on('end', () => {
            resolve(data);
        })
    });

    let decodedData = JSON.parse(body);
    let order_id = decodedData.order_id;
    let confirmationCode = decodedData.confirmationCode;
    let email = decodedData.email;

    let orderInfo;
    try {
      // Query to retrieve the order id from cid 

      const query = `
      SELECT co.order_id,
             co.status,
             co.DT_created AS date_created,
             co.total_price,
             oi.item_num,
             mi.price AS item_price,
             mi.description AS item_description
      FROM customer_order AS co
      LEFT JOIN order_item AS oi ON co.order_id = oi.order_id
      LEFT JOIN menu_item AS mi ON oi.mid = mi.mid
      WHERE co.order_id = ?
      `;

      orderInfo = await runQuery(customerPool, query, [order_id]);
      //console.log(results);
    } catch (error) {
      console.error("Error retrieving order from orderID of customer " + order_id + ".");
    }

    let output = "Order Details:\n-------------\n";
    let totals = 0;

    orderInfo.forEach(order => {
        totals += order.item_price;
        output += `Item: ${order.item_description}\n`;
        output += `Price per Item: $${order.item_price.toFixed(2)}\n`;
        output += `Total Price: $${(1 * order.item_price).toFixed(2)}\n`;
        output += "-----------------------------------\n";
    });

    output += `Total Order Price: $${totals.toFixed(2)}`;
        
    let text = "Order #" + order_id + "\n Your confirmation code is " + confirmationCode + " buddy! Your order info below:\n" + output;

    //add stuff from database for the email to send to 

    //replace later with the real stuff
    var mailOptions = {
        from: 'realmrpizza285@gmail.com',
        to: email,
        subject: 'Sending Email Confirmation of Pizza Order!',
        text: text
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
        console.log(error);
        } else {
        console.log('Email sent: ' + info.response);
        }
    });
    
    transporter.close();

    res.writeHead(200, {'Content-type': 'text/plain'});
    res.end("Email sent!");
}

module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/order/emailOrderConf',
            handler: sendEmail
        },
    ]
};