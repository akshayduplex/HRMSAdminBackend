const HolidaysCI = require('../../../models/HolidaysCI.js');
const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});
const { dbDateFormat, updateDatesInArray,replaceNullUndefined } = require('../../../middlewares/myFilters.js');
 
const { validationResult } = require('express-validator');


const controller = {};

/********* Add Holidays Data **********/
controller.addHolidayData = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    } 
    

    saveData = {};
    saveData = req.body;
    saveData.status = 'Active';
    saveData.year = new Date( saveData.schedule_date ).getFullYear();
    saveData.schedule_date = new Date( saveData.schedule_date ).toISOString(); 
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat();

    if( typeof saveData.state_list !== 'undefined' && saveData.state_list !== '' ){
        saveData.state_list =  saveData.state_list.map((item)=>{
            const push = {}
            push.state_id = dbObjectId( item.state_id );
            push.state_name = item.state_name;
            return push;
        });
    }

    HolidaysCI.findOne( { name:saveData.name, year: saveData.year } )
    .then( (ckData)=>{
        if( ckData ){
            return res.status(409).send( {'status':false, 'message': 'This Holiday for this Year Already Added'} );
        }
    
        const instData = new HolidaysCI( saveData );
        instData.save()
        .then( (data)=>{
            return res.status(200).send( {'status':true, 'message': 'Holiday Data Added Successfully'} );
        })
        .catch( (error)=>{ 
            return res.status(404).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        });
    }).catch( (error)=>{ 
        return res.status(404).send( {'status':false, 'message':error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });

}

controller.editHoliday = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.year = new Date( saveData.schedule_date ).getFullYear();
    saveData.schedule_date = new Date( saveData.schedule_date ).toISOString(); 
    saveData.updated_on =  dbDateFormat();

    if( typeof saveData.state_list !== 'undefined' && saveData.state_list !== '' ){
        saveData.state_list =  saveData.state_list.map((item)=>{
            const push = {}
            push.state_id = dbObjectId( item.state_id );
            push.state_name = item.state_name;
            return push;
        });
    }

    HolidaysCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Holiday Data Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(304).send( {'status':true, 'message': 'No Holiday Data Updated'} );
        }else{
            return res.status(409).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}


controller.deleteHoliday = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body; 

    HolidaysCI.deleteOne( { _id:  dbObjectId( _id ) } )
    .then( (data)=>{  
        if( data.deletedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Holiday Data Deleted Successfully'} );
        }else if( data.deletedCount === 0 ){
            return res.status(304).send( {'status':true, 'message': 'No Holiday Data Deleted'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getHolidayById = ( req , res ) => {     

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }    
    
    const { _id } = req.body;  

    HolidaysCI.find( { _id:  dbObjectId( _id ) } ,{ _id: 0, __v: 0 } )
    .then( (data)=>{  

        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on','schedule_date'] , 'datetime' );              
            return res.status(200).send( {'status':true, 'data': outPutData[0], 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(204).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.changeHolidayStatus = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on =  dbDateFormat();

    HolidaysCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Holiday Status Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(304).send( {'status':true, 'message': 'No Holiday Data Updated'} );
        }else{
            return res.status(200).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(200).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getHolidayList = ( req , res ) => { 
  
    if (Object.keys(req.body).length === 0) { 
        return res.status(401).send( {status:false, message:'Bad Request'} ); 
    }

    if ( !req.body.hasOwnProperty('keyword')) {
        return res.status(402).json({ status: false, message: 'Keyword Key is Missing'});
    }  
    else if ( !req.body.hasOwnProperty('year')) {
        return res.status(402).json({ status: false, message: 'Year Key is Missing'});
    }
    else if ( !req.body.hasOwnProperty('scope_fields')) {
        return res.status(402).json({ status: false, message: 'Scope Field Key is Missing'});
    }
    
    const { keyword, year, scope_fields } = req.body;  

    const where = {} 

    if( req.body.hasOwnProperty('keyword') && keyword !== '' ){
        let searchKeyWord = new RegExp( lettersOnly( keyword ) );
            where['name'] = { $regex: searchKeyWord, $options: 'i' } 
    }

    if( req.body.hasOwnProperty('year') && year !== '' ){ 
            where['year'] =  year;
    } 

    /****** Apply Manual Filter Start Script **********/
    if( req.body.hasOwnProperty('filter_keyword') && req.body.filter_keyword !== '' ){
        let searchKeyFilter = new RegExp( req.body.filter_keyword );
        where['$or'] = [
            { name: { $regex: searchKeyFilter, $options: 'i' } },
            { year: { $regex: searchKeyFilter, $options: 'i' } },
            { status: { $regex: searchKeyFilter, $options: 'i' } }, 
            { 'state_list.state_name': { $regex: searchKeyFilter, $options: 'i' } }
        ];
    }
    /********* Apply Manual Filter End Script ********/


    const fetchKeys = {} 
    
    if( scope_fields.length > 0 ){
        scope_fields.forEach(field => {
            fetchKeys[field]=1;  
        }); 
    }else{
        fetchKeys._id = 0;
        fetchKeys.__v = 0; 
    } 

    HolidaysCI.find( where, fetchKeys )
    .then( (data)=>{

        //console.log( data );

        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on'] , 'datetime' );              
            return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(204).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getHolidayListDateRangeData = ( req , res ) => { 
  
    if (Object.keys(req.body).length === 0) { 
        return res.status(401).send( {status:false, message:'Bad Request'} ); 
    }

    if ( !req.body.hasOwnProperty('from_date')) {
        return res.status(402).json({ status: false, message: 'From Date Key is Missing'});
    }
    else if ( !req.body.hasOwnProperty('to_date')) {
        return res.status(402).json({ status: false, message: 'To Date Key is Missing'});
    }
    if ( !req.body.hasOwnProperty('scope_fields')) {
        return res.status(402).json({ status: false, message: 'Scope Field Key is Missing'});
    }
    
    const { from_date, to_date, scope_fields } = req.body;  

    const where = {}  

    const fetchKeys = {} 
    
    if( scope_fields.length > 0 ){
        scope_fields.forEach(field => {
            fetchKeys[field]=1;  
        });
    }else{
        fetchKeys._id = 0;
        fetchKeys.__v = 0;
    } 

    if( from_date !== '' && to_date !== '' ){
            where["schedule_date"] = { $gte: new Date( from_date).toISOString(),$lte: new Date( to_date).toISOString() }
    }

    HolidaysCI.find( where, fetchKeys )
    .then( (data)=>{
        if( data.length > 0 ){ 
            const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on','schedule_date'] , 'date' );              
            return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
        }else{
            return res.status(204).send( {'status':false, 'message': 'No record matched'} );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

module.exports = controller;
