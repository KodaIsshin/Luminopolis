import {S3Client, PutObjectCommand, GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';
import {supabase_backend} from './server.js';
dotenv.config({path: './backend.env'});

const user = null;
const session = null;

const R2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.S3_API_CLIENT_URL}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

export async function generateUploadUrl(req, res){
    const unsafeFilename = req.query.filename;
    const contentType = req.query.contentType || 'application/octet-stream';
    if(!unsafeFilename){
        return res.status(400).json({error: 'Filename is required'});
    }
    // Sanitize filename to prevent directory traversal attacks
    const filename = unsafeFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `uploads/${Date.now()}-${filename}`;
    try{
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(R2, command, {expiresIn: 900}); // URL valid for 15 minutes

        return res.status(200).json({uploadUrl, key});
    }catch(error){
        console.error('Error generating upload URL:', error);
        return res.status(500).json({error: 'Could not generate upload URL'});
    }

}

export async function grabDocument(req, res){
    try{
        const channel_id = req.query.channel_id;
        const key  = `documents/${channel_id}.json`;
        const {data: existingDoc, error} = await supabase_backend
            .from('study_materials')
            .select('path')
            .eq('channel_id', channel_id)
            .eq('type', 'Document')
            .single();
        if(!existingDoc){
            const emptyDoc = {type: 'doc', content: []};
            const {data, error} = await supabase_backend
                .from('study_materials')
                .insert([{channel_id: channel_id, path: key, type: 'Document', name: 'Document'}]);
            if(error){
                console.error('Error inserting new document record:', error);
                return res.status(500).json({error: 'Could not create document record'});
            }
            await R2.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                Body: JSON.stringify(emptyDoc),
                ContentType: 'application/json',
            }));
            return res.status(200).json(emptyDoc);
        }
        const obj = await R2.send(new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: existingDoc.path,
        }));
        const text = await obj.Body.transformToString();
        const json = JSON.parse(text);
        return res.status(200).json(json);
    }catch(error){
        console.error('Error grabbing document:', error);
        return res.status(500).json({error: 'Could not grab document'});
    }
}

export async function authMiddleware(req, res, next){
    const authorization= req.headers['authorization']
    const auth_token = authorization && authorization.split(' ')[1];
    if(!auth_token) return res.status(401).json({error: 'token is not valid'})
    const {data: user, error: authError} = await supabase_backend.auth.getUser(auth_token);
    if (!user || authError) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    } 
    req.user = user;
    next();

}

export async function saveDocument(req, res){
    const content = req.body;
    const channel_id = req.query.channel_id;
    if(!channel_id){
        return res.status(400).json({error: 'channel_id is required'});
    }
    const key = `documents/${channel_id}.json`;
    try{
        await R2.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: JSON.stringify(content),
            ContentType: 'application/json',
        }));
        return res.status(200).json({message: 'Document saved successfully'});
    }catch(error){
        console.error('Error saving document:', error);
        return res.status(500).json({error: 'Could not save document'});
    }
}


export async function loadFilefromR2(req, res){
    const key = req.query.key;
    if(!key){
        return res.status(400).json({error: 'Key is required'});
    }
    try{
        const obj = await R2.send(new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        }));
        const byte = await obj.Body.transformToByteArray();
        res.setHeader('Content-Type', obj.ContentType || 'application/octet-stream');
        res.setHeader('Content-Length', byte.length);
        res.send(Buffer.from(byte));
    }catch(error){
        console.error('Error loading file from R2:', error);
        return res.status(500).json({error: 'Could not load file from R2'
        })
    }
}

export async function createServer(req, res){
    try{
        const server_name = req.body.server_name;
        if(!server_name){
            return res.status(401).json({error: "missing server name"});
        }
        const {data: server_data, error: server_error} = await supabase_backend.from("servers").insert({
            name: server_name,
        }).select().single();
        if (server_error){
            console.error("Error creating server", server_error.message);
            return res.status(401).json({error: "error creating servers"});
        }
        const {error} = await supabase_backend.from("user_servers")
        .upsert([{user_id: req.user.user.id, server_id: server_data.id, server_name: server_name, role: "owner"}]);
        if (error){
            console.error("Error adding user to server", error.message);
            return res.status(401).json({error: "error creating servers"});
        }
        if(error){
            console.error("Error adding user to server", error.message);
            return res.status(401).json({error: "error creating servers"});
        }
        const {data: category, error: category_error} = await supabase_backend
        .from("category")
        .insert({
            category_name: "Homeroom",
            server_id: server_data.id,
        })
        .select()
        .single();
        const{data, error: cat_error} = await supabase_backend.from("category").insert({
            category_name: "Document",
            server_id: server_data.id,
        })
        .select()
        .single();
        if (category_error || cat_error){
            console.error("Error creating default categories", category_error.message);
            return res.status(401).json({error: "error creating servers"});
        }
        const {error: channel_error} = await supabase_backend.from("channels").insert({
            name: "Homeroom",
            category_id: category.id,
        });
        if (channel_error){
            console.error("Error creating default category", channel_error.message);
            return res.status(401).json({error: "error creating servers"});
        }
    }
    catch(err)
    {
        console.error(err);
        return res.status(500).json({error: "Internal server error"});
    }
}

export async function createCategory(req, res){
    try{
        const name = req.body.category_name;
        const {data: category_data, error: category_error} = await supabase_backend.from("category").insert({
            category_name: name,
            server_id: id,
        }).select().single();
        if (category_error){
            console.error("Error creating category", category_error.message);
            return;
        }
    }
    catch(err){
        console.error(err);
        return res.status(500).json({error: "Internal server error"});
    }
}