const RoleUserCl = require('../../../models/RoleUserCl.js');
const EmployeeCI = require('../../../models/EmployeeCI.js');
const jwt       = require('jsonwebtoken');

const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
const bcrypt = require('bcryptjs');
dotenv.config({path:'../src/config.env'});
const { generateJwtToken, generateJwtTokenByManualTime } = require('../../../middlewares/verifyToken.js');
const { OTP , dbDateFormat, roleUserResponseData, calculateTime, employeeResponseData,commonOnly,updateDatesInArray,replaceNullUndefined   } = require('../../../middlewares/myFilters.js');
const { otpSmsTemplate } = require('../../../middlewares/smsTemplates.js');
const { otpEmailTemplate } = require('../../../middlewares/emailTemplate.js');
const { validationResult } = require('express-validator');


const controller = {};

/********* generate token for **********/
controller.generateToken = ( req, res )=>{
    if( !req.body ){
      return res.status(200).send( {status:false, message:'Bad Request'} );  
    } 
   let token = generateJwtToken( req.body );
   return res.status(200).send( {status:true, data: token, message:'success'} );
}

/********* verify token for **********/
controller.verifyExistingToken = ( req, res )=>{
    if( !req.body.hasOwnProperty('token') ){
      return res.status(200).send( {status:false, message:'Bad Request'} );  
    } 

   let token =  req.body.token ;

   try {
    const verified = jwt.verify( token, process.env.JWT_SECRET ); 
    return res.status(200).send({'status':true, 'message':'Success'});
  } catch (err) {
    return res.status(401).send({'status':false, 'message':'Token expired'});
  } 
}

/********* Add New Role User **********/
controller.addRoleUser = async ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }

    saveData = {};
    saveData = req.body;
    saveData.profile_status = 'Active';
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat();
    saveData.otp_sent_on =  dbDateFormat();
    saveData.otp = OTP();

    try{

        //Check employee in employee collection with same email
        const ckEmp = await EmployeeCI.findOne({email:saveData.email});
        console.log( ckEmp );
        if( ckEmp ){
            saveData.employee_doc_id =  ckEmp._id;
        } 

        const ckData = await RoleUserCl.findOne({email:saveData.email});
     
        if( ckData ){
            return res.status(200).send( {'status':false, 'message': 'Email ID Already Registered'} );
        }
    
        const userData = new RoleUserCl( saveData );
        const dataAddResp = await userData.save()
        if( dataAddResp ){
            return res.status(200).send( {'status':true, 'message': 'Profile Added Successfully'} );
        }else{
            return res.status(200).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
        }
    }
    catch(error){ 
        return res.status(200).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
    }

}

controller.editRoleUser = async ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id, name , mobile_no } = req.body;

    let saveData = {}
    saveData.name = name;
    saveData.mobile_no = mobile_no;
    saveData.updated_on =  dbDateFormat(); 
    if( typeof req.body.designation_id !== 'undefined' && req.body.designation_id !== '' ){
        saveData.designation_id = dbObjectId( req.body.designation_id );
    }
    if( typeof req.body.designation !== 'undefined' && req.body.designation !== '' ){
        saveData.designation = req.body.designation;
    }

    try{

        //Check employee in employee collection with same email
        const ckEmp = await EmployeeCI.findOne({email:saveData.email});
        console.log( ckEmp );
        if( ckEmp ){
            saveData.employee_doc_id =  ckEmp._id;
        }
    
        const upData = RoleUserCl.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
     
        if( upData ){
            return res.status(200).send( {'status':true, 'message': 'Profile Updated Successfully'} );
        }else{
            return res.status(200).send( {'status':false, 'message':'Invalid Login Details'} );
        }
    }catch(error){ 
        return res.status(200).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
    }
}

/********* Check Role User Login with Password **********/
controller.loginUserWithPassword = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    } 
     
    const { username , password } = req.body;

    RoleUserCl.findOne( {email:username } )
    .then( (loginData)=>{
        if( loginData ){

            if( loginData.profile_status !== 'Active' ){
                return res.status(200).send( {'status':true, 'message': `Your Profile is ${loginData.profile_status}, Please Contact to Your Website Administrative` } );
            }

            bcrypt.compare( password, loginData.hashed_password, (err, isMatch) => {
                if (err){
                    return res.status(200).json({status: false, message:'Password Mismatched'});
                }
                if (isMatch) {
                    let jwtPayload = {}
                    jwtPayload._id = loginData._id;
                    jwtPayload.name = loginData.name;
                    jwtPayload.email = loginData.email;
                    jwtPayload.mobile_no = loginData?.mobile_no;
                    jwtPayload.employee_doc_id = loginData?.employee_doc_id || '';
                    let jwtToken = generateJwtToken( jwtPayload );
                    const userData = roleUserResponseData( loginData, jwtToken );  
                    return res.status(200).send( {'status':true, 'data':userData, 'message': 'Logged in Successfully'} );
                } else { 
                    return res.status(200).json({status: false, message:'Password Not Matched'});
                }
            });             
        }else{
            return res.status(200).send( {'status':false, 'message':'Invalid Login Details'} );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
    });
}


controller.changeUserPassword = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(200).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id, password , hashed_password } = req.body;

    let saveData = {}
    saveData.password = password;
    saveData.hashed_password = hashed_password;
    saveData.updated_on =  dbDateFormat(); 

    RoleUserCl.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{
        console.log(data);
        if( data && data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Password Updated Successfully'} );
        }else{
            return res.status(200).send( {'status':false, 'message':'Password Update Failed'} );
        }
    }).catch( (error)=>{
        return res.status(200).send( {'status':false, 'message': error || 'Some Error Occurred'} ); 
    });
}

/********* Check Role User Login  **********/
controller.checkLoginUserWithEmail = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    } 
     
    const { email_id  } = req.body;

    RoleUserCl.findOne( {email: email_id } )
    .then( (loginData)=>{
        if( loginData ){

            if( loginData.profile_status !== 'Active' ){
                return res.status(401).send( {'status':true, 'message': `Your Profile is ${loginData.profile_status}, Please Contact to Your Website Administrative` } );
            }

            const otp = OTP();
            const saveData = {}
            saveData.otp = otp;
            saveData.updated_on = dbDateFormat();
            saveData.otp_sent_on = dbDateFormat();

            RoleUserCl.updateOne( { _id: loginData._id }, {$set: saveData} )
            .then( (data)=>{ 
                if( data ){ 
                    if( typeof loginData.mobile_no !== 'undefined' && loginData.mobile_no.length === 10 ){ 
                       // otpSmsTemplate( loginData.mobile_no, otp );
                    }
                    if( typeof loginData.email !== 'undefined' && loginData.email !== '' ){ 
                        otpEmailTemplate( loginData.email, otp, loginData.name  );
                    }
                    
                    return res.status(200).send( {'status':true, data: {email_id,'user_type':'role'}, 'message': 'OTP Sent Successfully at your registered email ID'} );
                }else{
                    return res.status(403).send( {'status':false, 'message':'Invalid Login Details'} );
                }
            }).catch( (error)=>{ 
                return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
            }); 
            
        } else{

            /********** Check the Employee User Start Script ************/ 
            EmployeeCI.findOne( {email: email_id, profile_status :'Active' } )
            .then( (loginData)=>{
                if( loginData ){
        
                    if( loginData.profile_status !== 'Active' ){
                        return res.status(403).send( {'status':true, 'message': `Your Profile is ${loginData.profile_status}, Please Contact to Your Website Administrative` } );
                    }
        
                    const otp = OTP();
                    const saveData = {}
                    saveData.otp = otp;
                    saveData.updated_on = dbDateFormat();
                    saveData.otp_sent_on = dbDateFormat();
        
                    EmployeeCI.updateOne( { _id: loginData._id }, {$set: saveData} )
                    .then( (data)=>{ 
                        if( data ){ 
                            if( typeof loginData.mobile_no !== 'undefined' && loginData.mobile_no.length === 10 ){ 
                                otpSmsTemplate( loginData.mobile_no, otp );
                            }
                            if( typeof loginData.email !== 'undefined' && loginData.mobile_no.email !== '' ){ 
                                otpEmailTemplate( loginData.email, otp, loginData.name  );
                            }
                            
                            return res.status(200).send( {'status':true, data: {email_id,'user_type':'employee'}, 'message': 'OTP Sent Successfully at your registered email ID'} );
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
            /********** Check the Employee User End Script ************/ 
        }       
        
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
    });
}

/********* Verify Login OTP  **********/
controller.verifyOTP = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) { 
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    } 
     
    const { email_id, otp, login_device, user_type } = req.body;

    if( user_type == 'employee' && email_id !== 'sagarwal@hlfppt.org' ){ 

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
                        jwtPayload.mobile_no = loginData?.mobile_no || '';
                        jwtPayload.employee_doc_id = loginData._id;
                        let jwtToken = email_id === 'sagarwal@hlfppt.org' ? generateJwtTokenByManualTime( jwtPayload, '1y') : generateJwtTokenByManualTime( jwtPayload, '1y' );
                        const userData = employeeResponseData( loginData, jwtToken );
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
    }else {
        RoleUserCl.findOne( {email: email_id } )
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

                RoleUserCl.updateOne( { _id: loginData._id }, {$set: saveData} )
                .then( (data)=>{ 
                    if( data ){ 
                        let jwtPayload = {}
                        jwtPayload._id = loginData._id;
                        jwtPayload.name = loginData.name;
                        jwtPayload.email = loginData.email;
                        jwtPayload.mobile_no = loginData?.mobile_no;
                        jwtPayload.employee_doc_id = loginData?.employee_doc_id || '';
                        let jwtToken = email_id === 'sagarwal@hlfppt.org' ? generateJwtTokenByManualTime( jwtPayload, '1y') : generateJwtToken( jwtPayload );
                        const userData = roleUserResponseData( loginData, jwtToken );  
                        return res.status(200).send( {'status':true, 'data':userData, 'message': 'Logged in Successfully'} );
                    }else{
                        return res.status(403).send( {'status':false, 'message':'Invalid Login Details'} );
                    }
                }).catch( (error)=>{  console.log(error);
                    return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
                }); 
                
            } else{  
                return res.status(403).send( {'status':false, 'message': 'Invalid Login Details'} );
            } 
            
        }).catch( (error)=>{   console.log(error);
            return res.status(403).send( {'status':false, 'message': error || 'Invalid Login Details'} ); 
        });
    }
}


/********* Assign Menu  to Role User  **********/
controller.assignMenuPermission = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ status: false, message: errors.array()[0].msg });
    } 
     
    const { _id , permissions } = req.body;

    RoleUserCl.findOne( {_id: dbObjectId( _id ) } )
    .then( (loginData)=>{
        if( loginData ){
  
            const saveData = {}
            saveData.permissions = permissions;
            saveData.updated_on = dbDateFormat(); 

            RoleUserCl.updateOne( { _id: loginData._id }, {$set: saveData} )
            .then( (data)=>{ 
                if( data ){ 
                    return res.status(200).send( {'status':true,  'message': 'Menu Assigned Successfully '} );
                }else{
                    return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
                }
            }).catch( (error)=>{ 
                return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
            }); 
            
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );   
        }       
        
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


controller.getRoleUserList = ( req , res ) => {  
   
    const { page_no, per_page_record, scope_fields } = req.body;   

    const where = {}  
    const fetchKeys = {}
    
    if( req.body.hasOwnProperty('scope_fields') && scope_fields.length > 0 ){
        scope_fields.forEach(field => {
            fetchKeys[field] = 1;  
        }); 
    }else{
        fetchKeys.__v = 0;
    }

    if( req.body.hasOwnProperty('keyword') && req.body.keyword !== '' ){
    let searchKeyWord = new RegExp( lettersOnly( req.body.keyword ) );
        where['name'] = { $regex: searchKeyWord, $options: 'i' } 
    } 

    if( req.body.hasOwnProperty('status') && req.body.status !== '' ){
        where['status'] =  commonOnly( req.body.status ); 
    }

    const pageOptions = {
        page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
        limit: parseInt( per_page_record) || 10
    } 

    RoleUserCl.find( where, fetchKeys )
    .skip( pageOptions.page * pageOptions.limit )
    .limit( pageOptions.limit )
    .sort( { 'name': 1 } )
    .then( (data)=>{ 

        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on','otp_sent_on','last_login'] , 'date' );              
            return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(204).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}



controller.getRoleUserById = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body; 
    const fetchKeys = {}

    if( req.body.hasOwnProperty('scope_fields') && req.body.scope_fields.length > 0 ){
        req.body.scope_fields.forEach(field => {
            fetchKeys[field] = 1;  
        }); 
    }else{
        fetchKeys.__v = 0;
    }


    RoleUserCl.find( { _id:  dbObjectId( _id ) }, fetchKeys )
    .then( (data)=>{   
        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on'] , 'datetime' );              
            return res.status(200).send( {'status':true, 'data': outPutData[0], 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(204).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.changeRoleUserProfileStatus = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body; 

    let saveData = {}
    saveData.profile_status = req.body.status;
    saveData.updated_on =  dbDateFormat();

    RoleUserCl.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Status Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(200).send( {'status':true, 'message': 'Status Updated Successfully'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


/********* Special Permission to Role User  **********/
controller.assignSpecialPermission = async ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(403).json({ status: false, message: errors.array()[0].msg });
    } 
     
    const { role_doc_id , permissions } = req.body;

    try{ 
        const userData = await RoleUserCl.findOne( {_id: dbObjectId( role_doc_id ) }, { special_permissions : 1} );

        if( !userData ){
            return res.status(403).json({ status: false, message: 'User not exists' });
        }
    
        const saveData = {}
        saveData['special_permissions.reference_check_skip'] = permissions?.reference_check_skip;
        /******** add more permissions ********/

        saveData.updated_on = dbDateFormat();

        await RoleUserCl.updateOne( { _id: dbObjectId( role_doc_id ) }, {$set: saveData} );
        
        return res.status(200).send( {'status':true,  'message': 'Permission updated successfully '} ); 

    }catch ( error ){ console.log( error );
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE });
    }
}


module.exports = controller;