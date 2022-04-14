const AWS = require('aws-sdk');
const SES = new AWS.SES();
const fs = require('fs');

http://prod.domain.tld/v1/verifyUserEmail?email=user@example.com&token=sometoken

exports.handler = async event => {
    const { first_name, last_name, password, username, email, token } = JSON.parse(event.Records[0].Sns.Message);
    const verificationLink = "http://prod.polepeddiaravind.me/v1/verifyUserEmail?email="+email+"&token="+token+"";
    const params = {
        Destination: {
            ToAddresses: [email],
        },
        Message: {
            Body: {
                Html:{ Data: `<html><body>Hello ${first_name} ${last_name},<br> Thank you for subscribing. To use the portal verify by clicking the below link.<br><br><a href=${verificationLink}>Verify your account</a><br><br><br> Kind Regards,<br> <strong>Team CSYE6225!<strong></body></html>` }
            },
            Subject: {
                Data: "Subscribe to the link to use service"
            },
        },
        Source: 'aravind@yprod.polepeddiaravind.me'
    };

    try {
        await SES.sendEmail(params).promise();
        return {
            statusCode: 200,
            body: 'Email sent!'
        }
    } catch (e) {
        console.error(e);
        return {
            statusCode: 400,
            body: 'Sending failed'
        }
    }
};