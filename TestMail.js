 
const path = require('path');
const fs = require('fs');
const EmployeeCI = require('../backend/src/models/EmployeeCI');
const {emailSystem} = require('../backend/src/middlewares/smsMailSystem');

//nodemailer
"use strict";
const nodemailer = require("nodemailer");

const controller = {};

controller.testMaildata = async (req, res) => { 


    const email = 'anil@duplextech.com';
    const message = '<h1>Hi this is test</h1>';
    const subject = 'This test';

    const attachmentList = [];
    attachmentList.push( { name:'AB.jpg',path: 'https://hrms.hlfppt.org/static/media/logo.53ed9f64c4c1cad674a1.png'});
    attachmentList.push( { name:'Ac.pdf',path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'});


    emailSystem( email, message, subject, attachmentList );

    return res.status(200).send({ 'status': true, data: req.body, 'message': 'success' });
    const configMaiData = {
        host: 'cloud.md4.in',
        port: '2525',
        secure: false, // Secure for port 465
        auth: { 
            user: 'lakshyacabs-com/emailnotify-in',   // Correct username
            pass: 'CQ5puOLb6sMZs8TFVTDubXXx',   // Correct password or App Password
        },
        tls: {
            rejectUnauthorized: false // Allow unauthorized certificates if needed
        },
        debug: true,  // Debug mode to get detailed logs
        logger: true  // Log the process
    };

    const transporter = nodemailer.createTransport(configMaiData);

    transporter.sendMail({
        from: `HRMS Portal info@emailnotify.in`, 
        to: email,
        subject: subject,
        html: message,
        attachments: attachmentList
    })
    .then((info) => {
        return res.status(200).send({ 'status': true, data: req.body, 'message': info.messageId });
    })
    .catch((error) => {
        console.error( error);
        return res.status(500).send({ 'status': false, data: 'test', 'message': error.message });
    });
};

module.exports = controller;