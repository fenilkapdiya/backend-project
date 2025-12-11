import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
 
    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });

    const uploadToCloudinary = async (localFilePath) => {
        try{
            if(!localFilePath) return null;
            // Upload file to Cloudinary
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type: 'auto',
            });
            // file has been uploaded successfull
            console.log('Cloudinary upload result:', response.url);
            return response;
        }
        catch (error) {
            fs.unlinkSync(localFilePath); // remove the locallu saved temporary file as the upload opration got failed
            return null;
        }


    };   
    
    export { uploadToCloudinary};