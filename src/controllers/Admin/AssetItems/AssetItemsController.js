const AssetsItemCI = require('../../../models/AssetsItemCI.js')
const { dbObjectId } = require('../../../models/dbObject.js');
const fs = require('fs');
const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});
const { dbDateFormat, generateItemEntry, updateDatesInArray,replaceNullUndefined , removeFile, commonOnly, convertToDbDate} = require('../../../middlewares/myFilters.js');
 
const { validationResult } = require('express-validator');
const EmployeeCI = require('../../../models/EmployeeCI.js');

const controller = {};

/********* Add New Assets item Data **********/
controller.addAssetItem = ( req, res )=>{

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }

    saveData = {};
    saveData = req.body;
    if(typeof req.body.serial_no !== 'undefined' && req.body.serial_no !== '' ){
        saveData.serial_no = req.body.serial_no.toUpperCase();
    }
    saveData.add_date = dbDateFormat();
    saveData.updated_on =  dbDateFormat(); 

    AssetsItemCI.findOne( { asset_name: saveData.asset_name , serial_no: saveData.serial_no })
    .then( (ckData)=>{
        if( ckData ){
            return res.status(409).send( {'status':false, 'message': 'Asset Item Already Added'} );
        }
    
        AssetsItemCI.countDocuments({} ) 
        .then( (data)=>{ 
                var countItems = (parseInt( data ) || 0 ) + 1;
                saveData.asset_code = `${process.env.DEVICE_PREFIX}${generateItemEntry('',countItems)}`;
            
                const instData = new AssetsItemCI( saveData );
                instData.save()
                .then( (data)=>{
                    return res.status(200).send( {'status':true, 'message': 'Asset Item Added Successfully'} );
                })
                .catch( (error)=>{ 
                    console.log( error );
                    return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
                });
        }).catch( (error)=>{ 
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
        });
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
    });

}

controller.editAssetItem = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    if(typeof req.body.serial_no !== 'undefined' && req.body.serial_no !== '' ){
        saveData.serial_no = req.body.serial_no.toUpperCase();
    }
    saveData.updated_on =  dbDateFormat(); 
   
    AssetsItemCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
    .then( (data)=>{ 

        if( data.modifiedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Asset Updated Successfully'} );
        }else if( data.modifiedCount === 0 ){
            return res.status(304).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.deleteAssetItemById = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body; 

    AssetsItemCI.deleteOne( { _id:  dbObjectId( _id ) } )
    .then( (data)=>{  
        if( data.deletedCount === 1 ){
            return res.status(200).send( {'status':true, 'message': 'Asset Item Deleted Successfully'} );
        }else if( data.deletedCount === 0 ){
            return res.status(304).send( {'status':false, 'message': 'No Action Performed'} );
        }else{
            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } );
        }
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
    });
}

controller.getAssetItemById = ( req , res ) => {

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


    AssetsItemCI.find( { _id:  dbObjectId( _id ) }, fetchKeys )
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

controller.changeAssetItemStatus = ( req , res ) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    }   
    
    const { _id } = req.body;

    let saveData = {}
    saveData = req.body;
    saveData.updated_on =  dbDateFormat();

    AssetsItemCI.updateOne( { _id:  dbObjectId( _id ) }, {$set: saveData} )
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

controller.getAssetItemList = ( req , res ) => {  
   
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
 

    if( req.body.hasOwnProperty('status') && req.body.status !== '' ){
        where['status'] =  commonOnly( req.body.status ); 
    }

    if( req.body.hasOwnProperty('assign_status') && req.body.assign_status !== '' ){
        where['assign_status'] =  commonOnly( req.body.assign_status ); 
    }

    /****** Apply Manual Filter Start Script **********/
    if( req.body.hasOwnProperty('filter_keyword') && req.body.filter_keyword !== '' ){
        let searchKeyFilter = new RegExp( req.body.filter_keyword );
        where['$or'] = [
            { asset_name: { $regex: searchKeyFilter, $options: 'i' } }, 
            { asset_code: { $regex: searchKeyFilter, $options: 'i' } },
            { serial_no: { $regex: searchKeyFilter, $options: 'i' } },
            { asset_type: { $regex: searchKeyFilter, $options: 'i' } },
            { status: { $regex: searchKeyFilter, $options: 'i' } }
        ];
    }
    /********* Apply Manual Filter End Script ********/
  

    if( req.body.hasOwnProperty('is_count') && req.body.is_count === 'yes' ){
        AssetsItemCI.countDocuments( where, fetchKeys ) 
        .then( (data)=>{ 
                var countItems = parseInt( data ) || 0 
                return res.status(200).send( {'status':true, 'data': countItems, 'message': 'API Accessed Successfully'} );
            
        }).catch( (error)=>{
            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        });
    
    }else{ 
        const pageOptions = {
            page: parseInt( ((page_no ? page_no : 1) - 1)) || 0,
            limit: parseInt( per_page_record) || 10
        } 

        AssetsItemCI.find( where, fetchKeys )
        .skip( pageOptions.page * pageOptions.limit )
        .limit( pageOptions.limit )
        .sort( { '_id': -1 } )
        .then( (data)=>{ 

            if( data.length > 0 ){ 
                const outPutData = updateDatesInArray( replaceNullUndefined( data ), ['add_date', 'updated_on'] , 'datetime' );              
                return res.status(200).send( {'status':true, 'data': outPutData, 'message': 'API Accessed Successfully'} );
            }else{
                return res.status(403).send( {'status':false, 'message': 'No record matched'} );
            }
        }).catch( (error)=>{
            return res.status(403).send( {'status':false, 'message': error || process.env.DEFAULT_ERROR_MESSAGE } ); 
        });
    }
}


const deleteUploadedImage = ( declarationFile, assetsImages ) => {
    if( declarationFile && typeof declarationFile.filename !=='undefined' &&  declarationFile.filename !=='' ){
        removeFile( declarationFile.filename );
    }
    if( assetsImages && typeof assetsImages !== 'undefined' &&  assetsImages.length > 0 ){
        assetsImages.map((item)=>{
            removeFile( item.filename );
        });
    }
}


/*******  Assign Assets to employee **********/ 
controller.assignAssetToEmployee = ( req, res )=>{

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    } 

    const errors = validationResult(req);

    const declarationFile = req.files.declaration_file ? req.files.declaration_file[0] : null;
    const assetsImages = req.files.assets_images || [];

    if (!errors.isEmpty()) { 
        deleteUploadedImage( declarationFile, assetsImages); 
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    } 

    const { asset_id, employee_doc_id, assign_date} = req.body;

    saveData = {};
    saveData.updated_on =  dbDateFormat(); 

    AssetsItemCI.findOne( { _id: dbObjectId( asset_id ),'assign_status':'Unassigned' })
    .then( (ckData)=>{
            if( !ckData ){
                deleteUploadedImage( declarationFile, assetsImages);
                return res.status(409).send( {'status':false, 'message': 'Asset Item Already Assigned'} );
            }

            EmployeeCI.findOne( { _id: dbObjectId( employee_doc_id ) },{'name':1,'employee_code':1})
                .then( (empData)=>{

                        if( !empData ){
                            deleteUploadedImage( declarationFile, assetsImages);
                            return res.status(409).send( {'status':false, 'message': 'Employee Data Not Found'} );
                        }

                        /****** employee *********/
                        const employeePayload= {}
                        employeePayload.name = empData.name;
                        employeePayload.employee_doc_id = employee_doc_id;
                        employeePayload.code = empData.employee_code;
                        employeePayload.assign_date = convertToDbDate( assign_date );
                        saveData.current_employee = employeePayload;
                        saveData.assign_status = 'Assigned';

                        //save history data
                        const assignHistory = {}
                        assignHistory.employee_name = empData.name;
                        assignHistory.employee_doc_id = employee_doc_id;
                        assignHistory.employee_code = empData.employee_code;
                        assignHistory.assign_date = convertToDbDate( assign_date );
                        if( req.body.hasOwnProperty('assign_condition') &&  req.body.assign_condition !== '' ){
                        assignHistory.assign_condition = req.body.assign_condition ;
                        }
                        assignHistory.assign_condition_status = req.body.assign_condition_status ;
                        assignHistory.status = 'Assigned';

                        if( assetsImages && typeof assetsImages !== 'undefined' &&  assetsImages.length > 0 ){
                            assignHistory.assign_device_image = assetsImages.map((item)=>{
                                return item.filename;
                            });
                        }

                        if( declarationFile && typeof declarationFile.filename !=='undefined' &&  declarationFile.filename !=='' ){
                            assignHistory.signed_declaration_form = declarationFile.filename ;
                        }
                       

                        AssetsItemCI.updateOne( { _id: dbObjectId( asset_id ) }, { $set: saveData, $push:{'assigned_history': assignHistory}} )
                        .then( (data)=>{
                            return res.status(200).send( {'status':true, 'message': 'Asset Assigned Successfully'} );
                        })
                        .catch( (error)=>{ 
                            return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
                        });

            })
            .catch( (error)=>{  
                return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
            });
        
    }).catch( (error)=>{
        return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
    });

}


/*******  Return Assets from employee **********/ 
controller.returnAssetToEmployee = ( req, res )=>{

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    } 

    const errors = validationResult(req); 

    const assetsImages = req.files.assets_images || [];

    if (!errors.isEmpty()) { 
        deleteUploadedImage( null, assetsImages ); 
        return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
    } 

    const { asset_id, return_date, return_condition, return_condition_status } = req.body;

    saveData = {};
    saveData.updated_on =  dbDateFormat(); 

    AssetsItemCI.findOne( { _id: dbObjectId( asset_id ),'assign_status':'Assigned' })
    .then( (ckData)=>{
            if( !ckData ){
                deleteUploadedImage( null, assetsImages);
                return res.status(409).send( {'status':false, 'message': 'Asset not Assigned to this Employee'} );
            }

             //console.log( ckData );

             /**** first get current employee data**********/
             const findMatchItem = ckData.assigned_history.find( (item)=> item.employee_doc_id.toString() === ckData.current_employee.employee_doc_id.toString() &&  item.status === 'Assigned' );
 
             if( findMatchItem ){  
                const arrayFilters = {'arrayFilters':[{'one._id': findMatchItem._id }]}
    
                const where = {}   
                where._id = dbObjectId( asset_id );
                where['assigned_history._id'] = dbObjectId( findMatchItem._id ); 
                
            
                const saveData = {}
                saveData.assign_status = 'Unassigned';
                saveData.current_employee = {}; 
                saveData['assigned_history.$[one].status'] = 'Returned';
                saveData['assigned_history.$[one].return_condition_status'] = return_condition_status;
                saveData['assigned_history.$[one].return_condition'] = return_condition; 
                saveData['assigned_history.$[one].return_date'] = convertToDbDate( return_date ); 
                if( assetsImages && typeof assetsImages !== 'undefined' &&  assetsImages.length > 0 ){
                    saveData['assigned_history.$[one].return_condition_device_image'] = assetsImages.map((item)=>{
                        return item.filename;
                    });
                }

                AssetsItemCI.updateOne( where, {$set: saveData}, arrayFilters )  
                .then( (data)=>{
                    return res.status(200).send( {'status':true, 'message': 'Asset Returned Successfully'} );
                })
                .catch( (error)=>{  
                    return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
                });  
            }else{
                return res.status(403).send( {'status':false, 'message': 'Selected Record is not in Unassigned State' } ); 
            }       
        
    }).catch( (error)=>{ 
        return res.status(403).send( {'status':false, 'message': process.env.DEFAULT_ERROR_MESSAGE } ); 
    });

}


/********* get Employee Assets List Script ********/
controller.getEmployeeAssets = ( req , res ) => { 

        const errors = validationResult(req);  

        if (!errors.isEmpty()) {   
            return res.status(406 ).json({ status: false, message: errors.array()[0].msg });
        } 


        const where = {}; 
        const { page_no, per_page_record, employee_doc_id, filter_keyword, is_count } = req.body;
        
        if (employee_doc_id) {
        where['assigned_history.employee_doc_id'] = dbObjectId(employee_doc_id);
        }
        
        /****** Apply Manual Filter ******/
        if (filter_keyword && typeof filter_keyword === 'string' && filter_keyword.trim() !== '') {
        const searchKeyFilter = new RegExp(filter_keyword.trim(), 'i'); // Case-insensitive regex
        where['$or'] = [
            { asset_name: { $regex: searchKeyFilter } },
            { asset_code: { $regex: searchKeyFilter } },
            { serial_no: { $regex: searchKeyFilter } },
            { asset_type: { $regex: searchKeyFilter } }
        ];
        }
        /****** End of Manual Filter ******/
 
        
        if (is_count === 'yes') { 
            AssetsItemCI.countDocuments(where)
            .then((data) => {
                const countItems = parseInt(data, 10) || 0;
                return res.status(200).send({ status: true, data: countItems, message: 'API Accessed Successfully' });
            })
            .catch((error) => { 
                return res.status(500).send({ status: false, message: error.message || process.env.DEFAULT_ERROR_MESSAGE });
            });
        } else {
        // Pagination setup
        const pageOptions = {
            page: Math.max(parseInt(page_no, 10) || 1, 1) - 1,  
            limit: Math.max(parseInt(per_page_record, 10) || 10, 1)  
        };
        
        // Aggregation pipeline
        AssetsItemCI.aggregate([
            {
            $unwind: "$assigned_history"  
            },
            {
            $match: where  
            },
            {
            $project: {
                _id: 0,
                employee_name: "$assigned_history.employee_name",
                employee_code: "$assigned_history.employee_code",
                assign_date: "$assigned_history.assign_date",
                assign_condition: "$assigned_history.assign_condition",
                assign_condition_status: "$assigned_history.assign_condition_status",
                assign_device_image: "$assigned_history.assign_device_image",
                signed_declaration_form: "$assigned_history.signed_declaration_form",
                return_date: "$assigned_history.return_date",
                return_condition: "$assigned_history.return_condition",
                return_condition_status: "$assigned_history.return_condition_status",
                return_condition_device_image: "$assigned_history.return_condition_device_image",
                status: "$assigned_history.status", 
                employee_id: "$assigned_history.employee_id",
                asset_name: "$asset_name",
                asset_code: "$asset_code",
                serial_no: "$serial_no",
                asset_type: "$asset_type",
                asset_id: "$_id",
            }
            }
        ])
            .skip(pageOptions.page * pageOptions.limit)
            .limit(pageOptions.limit)
            .sort({ '_id': -1 })
            .then((data) => {
                if (data.length > 0) { 
                    const outPutData = updateDatesInArray(replaceNullUndefined(data), ['assign_date', 'return_date'], 'date');
                    return res.status(200).send({ status: true, data: outPutData, message: 'API Accessed Successfully' });
                } else {
                    return res.status(403).send({ status: false, message: 'No record matched' });
                }
            })
            .catch((error) => { 
                return res.status(500).send({ status: false, message: error.message || process.env.DEFAULT_ERROR_MESSAGE });
            });
        }
}

module.exports = controller;
