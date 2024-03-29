const {runQuery, customerPool} = require("../util/database_util");
const nodeMailer = require("nodemailer");

async function sendEmail(req, res) {
    const transporter = nodeMailer.createTransport({
        service: 'Gmail',
        port: 587,
        auth: {
            user: 'damonlin8@gmail.com',
            pass: 'kard jnpe zxsi rpri',                // personal password, pls don't copy
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

    let email = decodedData.email;
    let subject = decodedData.subject;
    let message = decodedData.message;

    let mailOptions = {
        from: 'damonlin8@gmail.com',
        to: email,
        subject: subject,
        text: message,
    };

    try {
        await sendEmailHelper(transporter, mailOptions);
        res.writeHead(200, {'Content-type': 'text/plain'});
        res.end('Email sent successfully.');
    } catch (error) {
        res.writeHead(500, {'Content-type': 'text/plain'});
        res.end('Error sending email.');
    }

    transporter.close();
}

function sendEmailHelper(transporter, mailOptions) {
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            } else {
                resolve(true);
            }
        });
    });
}

// function that automatically sends an email when the user makes a delivery request
async function sendDefaultEmail(email, subject, message) {
    const transporter = nodeMailer.createTransport({
        service: 'Gmail',
        port: 587,
        auth: {
            user: 'damonlin8@gmail.com',
            pass: 'kard jnpe zxsi rpri',                // personal password, pls don't copy
        },
        secure: false,
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false,
        }
    });

    let mailOptions = {
        from: 'damonlin8@gmail.com',
        to: email,
        subject: 'Delivery Status',
        text: 'Your delivery request has been received. We will notify you when your order is ready for delivery.',
    };

    try {
        await sendEmailHelper(transporter, mailOptions);
    } catch (error) {
        console.log('Error sending email.');
    }

    transporter.close();
}

module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/email/send',
            handler: sendEmail
        }
    ],
    routes: [
        {
            method: 'POST',
            path: '/email/sendDefault',
            handler: sendDefaultEmail
        }
    ]
};