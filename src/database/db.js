const mongoose          =  require("mongoose");
mongoose.set('strictQuery', true);

const fs                =  require("fs");
const path              =  require('path');

const { Client } = require('ssh2');

const connectDB = ()=>{
    if(process.env.APP_ENVIRONMENT === 'DEV' ){ 
    
            mongoose.connect( process.env.MONGODB_URI_DEV, {  
                //dbName: 'hrms'
                dbName: 'hrms_test'
            })
            .then((db) => {  
                //console.log(mongoose.connection.name); // myDatabase
                //console.log('Connection to DB successful') ;
            })
            .catch((err) =>{ 
                //console.error(err,'Error');
            });    
 

            // SSH Tunnel configuration
            // const conn = new Client(); 
            // conn.on('ready', () => {
            // console.log('SSH Tunnel Established');
            // conn.forwardOut(
            //     '127.0.0.1', 
            //     27018, // Local endpoint on localhost 
            //     'localhost', 
            //     27017, // Remote MongoDB server address
            //     (err, stream) => {
            //         if (err) {
            //             console.error('SSH Forwarding Error:', err);
            //             return;
            //         }

            //         // mongoose.connect('mongodb://127.0.0.1:27018/admin', {
            //         mongoose.connect( process.env.MONGODB_URI_DEV , {
            //             //useNewUrlParser: true,
            //             //useUnifiedTopology: true,
            //             //serverSelectionTimeoutMS: 5000, // Optional, adjusts timeout settings
            //             //stream,
            //         })
            //         .then((db) => {  
            //             console.log(mongoose.connection.name); // myDatabase
            //             console.log('Connection to DB successful') 
            //         })
            //         .catch((err) =>{ 
            //             console.error(err,'Error') 
            //         });  
            //     }
            // );
            // }).connect({
            // host: '103.57.65.12',
            // port: 35610, 
            // username: 'root',
            // privateKey: fs.readFileSync(path.join(__dirname, 'gold-private-key.ppk')),
            // passphrase: 'Hlfppt@62',
            // //debug: console.log // Optional, logs connection details
            // });


    }
    else if( process.env.APP_ENVIRONMENT === 'MONGODB_URI_PROD' ){   
               
                //mongoose.connect( process.env.MONGODB_URL_PROD , { 
                const sslCA = path.join(__dirname, 'rootCA.pem'); 
                const mongoSslCa = path.join(__dirname, 'mongodb.pem'); 
                 
                var mongoPath = `mongodb://homecabsadmin:<password>@68.178.167.175:27017/?tls=true&authMechanism=DEFAULT&tlsCAFile=${encodeURIComponent(sslCA)}&tlsCertificateKeyFile=${encodeURIComponent(mongoSslCa )}&tlsInsecure=true`;
  
                mongoose.connect( mongoPath , {  
                    dbName: 'hrms',
                    useNewUrlParser : true 
                })
                .then((db) => {  
                    //console.log(mongoose.connection.name); // myDatabase
                    //console.log('Connection to DB successful') 
                })
                .catch((err) =>{ 
                    //console.error(err,'Error') 
                });

    }        
}
 

module.exports = { connectDB };