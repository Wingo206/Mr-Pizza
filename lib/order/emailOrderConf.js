const nodemailer = require('nodemailer');


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

    //let decodedData = JSON.parse(body);

    //add stuff from database for the email to send to 

    //replace later with the real stuff
    var mailOptions = {
        from: 'realmrpizza285@gmail.com',
        to: 'pewdiepie285@gmail.com',
        subject: 'Sending Email Confirmation of Pizza Order!',
        text: 'Order # Confirmed buddy!'
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
            method: 'GET',
            path: '/order/emailOrderConf',
            handler: sendEmail
        },
    ]
};