const mongoose = require('mongoose');
//const dbObjectId = mongoose.Types.ObjectId; 

const  dbObjectId = ( objectIdString )=>{
   return new mongoose.Types.ObjectId(objectIdString);
}

const  dbObjectIdValidate = ( _id  )=>{
   if (!mongoose.Types.ObjectId.isValid(_id)) {
      return '';
   }else{
      return _id;
   }
}



module.exports = { dbObjectId, dbObjectIdValidate }