const express   = require('express');
const router    = express.Router();
const dotenv    = require('dotenv'); 
dotenv.config({path:'config.env'});
const axios     = require('axios');
const fs = require('fs');
const path = require('path');

//nodemailer
"use strict";
const nodemailer = require("nodemailer");
 
const removeEmailsWithDomain = (emailString, domain) => {
  return emailString
      .split(",")  // Split string into array
      .map(email => email.trim())  // Trim spaces
      .filter(email => !email.endsWith(domain))  // Remove emails ending with given domain
      .join(", ");  // Convert back to string
};

function getFileNameFromUrl( fileUrl ){
   const urlObj = new URL(fileUrl);
   const fileName = path.basename(urlObj.pathname);
   return fileName;
}

//node mailer
router.emailSystem = (email, message, subject = false, attachmentList = null, ccEmail = null  )=>{ 

  const mailData = JSON.parse( fs.readFileSync('./src/config/smtp_config_file.txt', 'utf8' ) ); 
  const orgData = JSON.parse( fs.readFileSync('./src/config/organization_config_file.txt', 'utf8' ) );  

  var smtp_host = '';
  var smtp_port = '';
  var smtp_user_name = '';
  var smtp_password = '';
  var smtp_email_from = '';
  var smtp_enabled_status = 'disabled';
  var smtp_company_name = '';

  if( mailData ){
    
    smtp_host = typeof mailData.smtp_host !== 'undefined' && mailData.smtp_host !== '' ? mailData.smtp_host : '';
    smtp_port = typeof mailData.smtp_port !== 'undefined' && mailData.smtp_port !== '' ? mailData.smtp_port : '';
    smtp_user_name = typeof mailData.smtp_username !== 'undefined' && mailData.smtp_username !== '' ? mailData.smtp_username : '';
    smtp_password = typeof mailData.smtp_password !== 'undefined' && mailData.smtp_password !== '' ? mailData.smtp_password : '';
    smtp_email_from = typeof mailData.smtp_from_mail !== 'undefined' && mailData.smtp_from_mail !== '' ? mailData.smtp_from_mail : '';
    smtp_enabled_status = typeof mailData.smtp_enable_status !== 'undefined' && mailData.smtp_enable_status !== '' ? mailData.smtp_enable_status : 'disabled';
  }

  if( orgData ){ 
    smtp_company_name = typeof orgData.organization_name !== 'undefined' && orgData.organization_name !== '' ? orgData.organization_name : '';
  }
 
  
  if( smtp_host && smtp_port && smtp_enabled_status === 'enabled' ){
      const transPortPayload = {
        host: smtp_host,
        port: smtp_port,
        secure: false,
        auth: { 
          user: smtp_user_name,
          pass: smtp_password,
        },
        tls: {
          rejectUnauthorized: false
        }
      } 

      const transporter = nodemailer.createTransport( transPortPayload );  
      
      const collectEmails = removeEmailsWithDomain(
        (Array.isArray(email) ? email.join(', ') : email) || "", 
        '@abc.com'
      );

      var ccMailList;
      if( ccEmail && process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS === 'YES' ){
         ccMailList = ccEmail ? removeEmailsWithDomain(
            (Array.isArray(ccEmail) ? ccEmail.join(', ') : ccEmail) || "", 
            '@abc.com'
          ) : null;
      }else if( process.env.ACTIVATE_LIVE_EMAIL_ACCOUNTS !== 'YES' ) {
         ccMailList = 'anil@duplextech.com';
      }    

      if (collectEmails.trim()) {
        const mailPayload = {}
        mailPayload.from = `${smtp_company_name} <${smtp_email_from}>`;
        mailPayload.to = collectEmails;
        mailPayload.subject = subject || smtp_company_name;
        mailPayload.html = message; 
        if( ccMailList ){
        mailPayload.cc = ccMailList;
        } 

       // console.log( mailPayload );
        
        if( attachmentList ){
          var mergeAttachments = [];
          attachmentList.forEach((item , index )=>{
            if( item.path !== 'undefined' && item.path !== '' ){
              mergeAttachments.push( { filename: getFileNameFromUrl( item.path ), path: item.path } );
            }
          });
         
          /*email attachment is not possible at hlfppt email configuration it was comment according to yashjeet sir*/
          if(mergeAttachments.length > 0 ){
            //mailPayload.attachments = mergeAttachments; //commented when new feature was added for choose option
          }
        }
        
        transporter.sendMail( mailPayload )
        .then( (dt)=>{
          console.log("Email sent: %s", dt.messageId);
        }).catch( ( e )=>{
          console.log("Email Failed: %s", e );
        });  
      } 
    } 
  }

  const sms_msg_club = ( mobileNo, messageBody )=>{
    if( mobileNo === ''){
      return false;
    }
 
    var msgBody  = decodeURI( messageBody ); 
    var smsUrl = `${process.env.SMS_HOST}/rest/services/sendSMS/sendGroupSms?AUTH_KEY=${process.env.SMS_KEY}&message=${msgBody}&senderId=${process.env.SMS_SENDER_ID}&routeId=${process.env.SMS_ROUTE_ID}&mobileNos=${mobileNo}&smsContentType=english`;
     
    axios.get( smsUrl )
    .then( (response)=>{
        //console.log("Message sent: %s", response );
    }).catch( (e)=>{
        //console.log("Message Failed: %s", e );
    });
  }

  router.sendTextSms = ( mobileNo, messageBody )=>{
       sms_msg_club( mobileNo, messageBody );
       return true;
  }

  module.exports = router;