const EmployeeCI = require('../../../models/EmployeeCI.js');
const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
const bcrypt = require('bcryptjs');
dotenv.config({path:'../src/config.env'});
const { generateJwtToken } = require('../../../middlewares/verifyToken.js');
const { OTP , dbDateFormat, candidateUserResponseData, calculateTime  } = require('../../../middlewares/myFilters.js');
const { otpSmsTemplate } = require('../../../middlewares/smsTemplates.js');
const { otpEmailTemplate } = require('../../../middlewares/emailTemplate.js');
const { validationResult } = require('express-validator');

const controller = {}; 
 
/********* Check Candidate User Login  **********/
controller.checkLoginUserWithEmail = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    } 
     
    const { email_id  } = req.body;
  
    const where = {}
    where.email = email_id;

    EmployeeCI.findOne( where )
    .then( (loginData)=>{  

        if( loginData ){ 
            if( loginData.profile_status !== 'Active' ){
                return res.status(402).send( {'status':true, 'message': `Your Profile is ${loginData.profile_status}, Please Contact to Your Website Administrative` } );
            }

            const otp = OTP();
            const saveData = {}
            saveData.otp = otp;
            saveData.updated_on = dbDateFormat();
            saveData.otp_sent_on = dbDateFormat();

            EmployeeCI.updateOne( { _id: loginData._id }, {$set: saveData} )
            .then( (data)=>{ 
                if( data ){
                    // if( typeof loginData.mobile_no !== 'undefined' && loginData.mobile_no.length === 10 ){ 
                    //     otpSmsTemplate( loginData.mobile_no, otp );
                    // }
                    if( typeof loginData.email !== 'undefined' && loginData.email !== '' ){ 
                        otpEmailTemplate( loginData.email, otp, loginData.name  );
                    }
                    
                    return res.status(200).send( {'status':true, data: {email_id}, 'message': 'OTP Sent Successfully at your registered email ID'} );
                }else{
                    return res.status(403).send( {'status':false, 'message':'Invalid Login Details'} );
                }
            }).catch( (error)=>{ 
                return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
            });  
        }else{
           return res.status(403).send( {'status':false, 'message': 'Invalid Login Details'} );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
    });
}


/********* Verify Login OTP  **********/
controller.verifyOTP = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(406).json({ status: false, message: errors.array()[0].msg });
    } 
     
    const { email_id, otp, login_device  } = req.body;

    EmployeeCI.findOne( {email: email_id } )
    .then( (loginData)=>{ 

        if( loginData ){

            if( loginData.profile_status !== 'Active' ){
                return res.status(403).send( {'status':true, 'message': `Your Profile is ${loginData.profile_status}, Please Contact to Your Website Administrative` } );
            }

            if( loginData.otp.toString() !== otp.toString() ){
                return res.status(403).send( {'status':false, 'message':'OTP not matched'} );
            }

            const timeDifference = calculateTime( loginData.otp_sent_on , dbDateFormat() );

            if( timeDifference > 10 ){
                return res.status(403).send( {'status':false, 'message':'OTP Expired'} );
            } 
           
            const saveData = {}
            saveData.otp = '0000';
            saveData.updated_on = dbDateFormat();
            saveData.last_login = dbDateFormat();
            saveData.login_device = login_device;

            EmployeeCI.updateOne( { _id: loginData._id }, {$set: saveData} )
            .then( (data)=>{ 
                if( data ){ 
                    let jwtPayload = {}
                    jwtPayload._id = loginData._id;
                    jwtPayload.name = loginData.name;
                    jwtPayload.email = loginData.email;
                    jwtPayload.mobile_no = loginData.mobile_no;
                    let jwtToken = generateJwtToken( jwtPayload );
                    const userData = candidateUserResponseData( loginData, jwtToken );  
                    return res.status(200).send( {'status':true, 'data':userData, 'message': 'Logged in Successfully'} );
                }else{
                    return res.status(403).send( {'status':false, 'message':'Invalid Login Details'} );
                }
            }).catch( (error)=>{ 
                return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
            }); 
             
        } else{
            return res.status(403).send( {'status':false, 'message': 'Invalid Login Details'} );
        } 
        
    }).catch( (error)=>{  
        return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
    });
}


module.exports = controller;