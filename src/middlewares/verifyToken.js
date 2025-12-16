const jwt       = require('jsonwebtoken');
const express   = require("express");
const dotenv    = require('dotenv'); 
const router    = express.Router();

dotenv.config({path:'config.env'});
 

router.verifyToken = (req, res, next) => {
  var { headers } = req;   

  let tokenString = '';
  if ( headers.hasOwnProperty( 'hrms_secret_key' ) ) {
    tokenString = headers.hrms_secret_key;  
  }
  else if ( headers.hasOwnProperty( 'authorization' ) ) {
    tokenString = headers.authorization;  
  }

  if( tokenString === '' ){
    return res.status(403).send({'status':false, 'message':'Access denied'});
  }
 
  const token = tokenString.replace(/^Bearer\s/, '');
  if (!token) {
    return res.status(200).send({'status':false, 'message':'Access denied'});
  } 

  // Validate whitelisted domains
  const whitelist = process.env.WHITELISTED_DOMAINS?.split(',') || [];
  const origin = router.getDomainName( headers.origin || headers.referer );

 
  if (origin && !whitelist.some(domain => origin.includes(domain))) {
     return res.status(403).send({ status: false, message: 'Access denied' });
  }

  if( process.env.ENABLE_JWT_TOKEN === 'YES' ){
    try {
      const verified = jwt.verify( token, process.env.JWT_SECRET );
      req.token_data = verified;
      next();
    } catch (err) {
      return res.status(401).send({'status':false, 'message':'Your session has expired or was destroyed. Please log in again to continue.'});
    }
  }else{
     next();
  }
  
}

router.getDomainName = (urlString) => {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (error) { 
    return null; 
  }
};
router.verifyFrontToken = (req, res, next) => {
  var { headers } = req;  
  
   let tokenString = '';
  if ( headers.hasOwnProperty( 'hrms_secret_key' ) ) {
    tokenString = headers.hrms_secret_key;  
  }
  else if ( headers.hasOwnProperty( 'authorization' ) ) {
    tokenString = headers.authorization;  
  }

  if( tokenString === '' ){
    return res.status(403).send({'status':false, 'message':'Access denied'});
  }
  
  const token = tokenString.replace(/^Bearer\s/, '');
  if (!token) {
    return res.status(200).send({'status':false, 'message':'Access denied'});
  }  

   // Validate whitelisted domains
  const whitelist = process.env.WHITELISTED_DOMAINS?.split(',') || [];
  const origin = router.getDomainName( headers.origin || headers.referer );
 
  if (origin && !whitelist.some(domain => origin.includes(domain))) {
     return res.status(403).send({ status: false, message: 'Access denied' });
  }

  if( process.env.ENABLE_JWT_TOKEN === 'YES' ){
        if( token === process.env.CANDIDATE_FRONT_STATIC_TOKEN ){
          next();
        }else{
          return res.status(401).send({'status':false, 'message':'Your session has expired or was destroyed. Please log in again to continue.'});
        }  
  }else{
     next();
  }  
}


router.generateJwtToken = ( payload )=>{  
    const options = {
        expiresIn: process.env.JWT_EXPIRES_IN
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, options);
    return token;
}

router.generateJwtTokenByManualTime = ( payload, jwt_expires_time  )=>{  
  const options = {
      expiresIn: jwt_expires_time
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, options);
  return token;
}




router.verifyDmsToken = (req, res, next) => {
  var { headers } = req;  
  
  let tokenString = '';
  if ( headers.hasOwnProperty( 'authorization' ) ) {
    tokenString = headers.authorization;  
  }

  if( tokenString === '' ){
    return res.status(403).send({'status':false, 'message':'Access denied'});
  }
  
  const token = tokenString.replace(/^Bearer\s/, '');
  if (!token) {
    return res.status(200).send({'status':false, 'message':'Access denied'});
  }  

   // Validate static token 
    if( token === '0da79b1942f7b1b8b14e960f6cb3414d' ){
      next();
    }else{
      return res.status(401).send({'status':false, 'message':'Your session has expired or was destroyed. Please log in again to continue.'});
    }  
  
}



module.exports = router;
