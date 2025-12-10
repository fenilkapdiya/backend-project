// require('dotenv').config({path: './.env'});
import dotenv from 'dotenv';
dotenv.config({path: './.env'});

import connectDB from './db/index.js';



connectDB().then(() => {
    console.log('Database connected successfully');
}).catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
});




// import express from 'express';
// const app = express();

// (async () => {
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on('error', (err) => {
//             console.error('Server error:', err);
//             throw err;
//         });
//         app.listen(process.env.PORT, () => {
//             console.log(`Server is running on port ${process.env.PORT}`);
//         });
//     }catch(err){
//         console.error('Database connection error:', err);
//         throw err;
//     }
// })();