const JobAppliedCandidateCl = require('../../../models/JobAppliedCandidateCl.js');
const EmployeeCI = require('../../../models/EmployeeCI.js');
const JobsCL = require('../../../models/JobsCI.js');
const JobCl = require('../../../models/JobsCI.js');
const StateCI = require('../../../models/StateCI.js');
const LocationCl = require('../../../models/LocationCl.js') ;
const RegionCI = require('../../../models/RegionCI.js')
const axios         = require('axios');
//const { DocumentApi, DocumentSigner, FormField, Rectangle, SendForSign }  = require("boldsign") ;

const { dbObjectId } = require('../../../models/dbObject.js');
const dotenv = require("dotenv");
dotenv.config({path:'../src/config.env'});

const path = require('path');
const fs = require('fs');
const { generateJwtToken } = require('../../../middlewares/verifyToken.js');
const { readExcelFile, readCSVFileData } = require('../../../middlewares/ImportExport.js'); 
const { validationResult } = require('express-validator');
const { dbDateFormat, updateDatesInArray,updateDatesInObject, replaceNullUndefined ,removeBlankValuesFromObject, getImageType, convertBitsIntoKbMb, removeFile, getHumanReadableDate, convertToDbDate, commonOnly } = require('../../../middlewares/myFilters.js');

const { uploadPDFDocxFile } = require('../../../middlewares/fileUploads.js');
var uploadPDFDocxFileData = uploadPDFDocxFile.single('filename');  

const uploadsDir =  './uploads';
const controller = {}

function toTitleCase(str) {
    return str.toLowerCase().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}


/*controller.pushStateCityData = ( req, res )=>{

    axios.get( `https://super.simplisync.in/api/countryapi` )
    .then( (data) => { 



        const getCountryData = data.data ;
        const country_id = data.data[0]._id ;
        const stateList = data.data[0].state_list ;

        //console.log( JSON.stringify( getCountryData ) ); 
        
        // console.log(  country_id );
        // console.log(  stateList );

        LocationCl.find({})
        .then( (lData)=>{ 
            for( var i = 0; i < stateList.length; i++  ){
                const findStateWiseData = lData.filter((item)=>item.state === stateList[i].state_name );
                if( findStateWiseData.length > 0  && stateList[i].state_name !== '' ){ 

                    findStateWiseData.map( (elm)=>{
                        const findCity = stateList[i].city_list.find((celm)=> celm.city_name === elm.name );
                        const saveData = {}
                        saveData.country_id = country_id;
                        saveData.state_id = stateList[i]._id;
                        saveData.city_name = elm.name;
                        saveData.city_code = '';
                        saveData.status = 'Active';
                        saveData.id = findCity && typeof findCity.city_name !== 'undefined' && findCity.city_name !== '' ? findCity._id : '';
                        console.log( JSON.stringify( saveData ) );
                        axios.post( `https://super.simplisync.in/api/savecity`, saveData )
                        .then( (data) => { 
                            console.log( data.data );
                        });
                    })
                    
                } 
            }
            //console.log(  lData ); 
        })
        return res.status(200).json({'status':true}); 
    }).catch( (err)=>{
        return res.send(err);
    }) 

}*/


controller.importStateData = async ( req, res )=>{

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    }   

    const errors = validationResult(req); 

    if (!errors.isEmpty()) {
        if( req.file &&  req.file.filename ){
            removeFile( req.file.filename );
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    }

    var csvData = []; 
    if( req.file &&  req.file.filename ){ 
        const excelData = await readExcelFile( uploadsDir+'/'+req.file.filename  ); 
          
        const headersData = excelData[0];
         csvData = excelData.slice(1).map(row => {
                const obj = {};
                headersData.forEach((header, index) => {
                    obj[header] = row[index];
                });
                return obj;
        });
        removeFile( req.file.filename ); 

    }else{
        return res.status(403).json( {'status':false, 'message': 'Please choose valid CSV(Comma Delimited) file'} ); 
    }  

    if ( csvData.length === 0) {  
        return res.status(403).json( {'status':false, 'message': 'No record in the file'} ); 
    }else{
            // Remove duplicates from csvData array
            const uniqueLocations = Array.from(
            new Set(csvData.map(JSON.stringify))
            ).map(JSON.parse);

            console.log( uniqueLocations );

            // Get all states
            // const allStateList = uniqueLocations.map(location => location.statename ); 
            // const uniqueStateList = Array.from(new Set(allStateList));

            // const allRegionList = uniqueLocations.map(location => location.regionname );
            // const uniqueRegionList = Array.from(new Set(allRegionList));
            // const allCityList = uniqueLocations.map(location => { return {'Districtname':location.Districtname, 'statename': location.statename} } );
            // const uniqueCityList = Array.from(new Set(allCityList)); 

            // console.log(uniqueCityList);            // Array of unique locations 

            // ////Bulk Write
            // const newStatePayload = uniqueStateList.map( (item)=>{
            //     return {'name':toTitleCase( item ),'status':'Active',add_date:dbDateFormat(),updated_on:dbDateFormat()};
            // });
            // //console.log( newStatePayload );
            // const insertState = await StateCI.insertMany( newStatePayload );
            // const getAllInsertedStateList = await StateCI.find(); 

            // const newCityPayload = uniqueCityList.map( (item)=>{
            //     const push = {}
            //     push.name = item.Districtname;
            //     push.status = 'Active';
            //     push.add_date = dbDateFormat();
            //     push.updated_on = dbDateFormat();
                
            //     const findState = getAllInsertedStateList.find( (citem)=>citem.name === toTitleCase( item.statename ) );
            //     if(findState){
            //         push.state = findState.name;
            //         push.state_id = findState._id;
            //     } 
            //     return push;
                
            //    });

            // const insertCity = await LocationCl.insertMany( newCityPayload );

            // ////Bulk Write
            // const newRegionPayload = uniqueRegionList.map( (item)=>{
            //     return {'name':toTitleCase( item ),'status':'Active',add_date:dbDateFormat(),updated_on:dbDateFormat()};
            // });

            // const insertRegion = await RegionCI.insertMany( newRegionPayload );
            // console.log( newRegionPayload ); 


            // return res.status(200).json({ 'status': true, data: uniqueLocations, uniqueStates: uniqueStateList });
            // ;
    }    
}


controller.checkPdfFileUpload = ( req, res )=>{

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    } 
  
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if( req.file &&  req.file.filename ){
            removeFile( req.file.filename );
        }
        return res.status(402).json({ status: false, message: errors.array()[0].msg });
    } 
}



/**** Testing fro bold sign for digital signature ******/
controller.getBoldSign = ( req, res )=>{

    if (req.body && typeof req.body === 'object') { 
        req.body = JSON.parse(JSON.stringify(req.body));
    } 
  
    //const errors = validationResult(req);

    return res.status(200).json({ status: true, message: 'Success' } );

    // if (!errors.isEmpty()) {
    //     if( req.file &&  req.file.filename ){
    //         removeFile( req.file.filename );
    //     }
    //     return res.status(402).json({ status: false, message: errors.array()[0].msg });
    // } 
}

controller.testBoldSign = async ( req, res )=>{

     
    try {
   
            // const documentApi = new DocumentApi();
            // // Replace "your_api_key" with the actual API key from your BoldSign account.
            // documentApi.setApiKey("MGVjOGE0MWItZmE4YS00YzgyLTk2YzctZmExZjZhYTFjZjNk");
 
            //  console.log( documentApi );

            // // These coordinates specify where the signature field will appear on the document.
            // const bounds = new Rectangle();
            // bounds.x = 100;
            // bounds.y = 50;
            // bounds.width = 100;
            // bounds.height = 100;
 
            // // Define the form fields where the signer needs to provide input.
            // // In this case, we are adding a signature field on page 1 at specific coordinates.
            // const formField = new FormField();
            // // Unique identifier for the field.
            // formField.id = "Signature";
            // formField.fieldType = FormField.FieldTypeEnum.Signature;
            // formField.pageNumber = 1;
            // formField.bounds = bounds;
 
            // // Define the signer information.
            // const documentSigner = new DocumentSigner();
            // documentSigner.name = "Anil";
            // // Email address where the signing request will be sent.
            // //documentSigner.emailAddress = "anil@duplextech.com";
            // documentSigner.emailAddress = "anil.duplextechnology@gmail.com";
            // documentSigner.signerType = DocumentSigner.SignerTypeEnum.Signer;
            // documentSigner.formFields = [formField];
 
            // // Path to the document that needs to be signed.
            // // Ensure that the file exists at the specified path and is accessible.        
            // const files = fs.createReadStream("uploads/dummyPDF.pdf");
 
            // // Create the document details for sending.
            // const sendForSign = new SendForSign();
            // sendForSign.title = "Appointment Letter";
            // sendForSign.signers = [documentSigner];
            // sendForSign.files = [files];
 
            // // Send the document for signature.
            // const documentCreated = await documentApi.sendDocument(sendForSign);

            // console.log( documentCreated );
 
            // The documentCreated object contains document id.
            // The signer will receive an email to review and sign the document.

        return res.status(200).json({ status: true, message: 'Success' } );
    }catch ( error ){
        return res.status(200).json({ status: false, message: 'failed' } );
    }
   
 
}


module.exports = controller;