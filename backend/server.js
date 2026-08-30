import express from 'express';
import {generateUploadUrl, grabDocument, saveDocument, loadFilefromR2, createServer, createCategory, authMiddleware} from './backend.js';
import { getRenderedAttributes } from '@tiptap/core';
import {createClient} from '@supabase/supabase-js';
import rateLimit from "express-rate-limit";

const app = express();
export const supabase_backend = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_API_KEY
);

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
})

app.use(globalLimiter);

app.use(express.json());
app.get('/api/generate-upload-url', generateUploadUrl);

app.get('/api/grab-document', grabDocument);

app.put('/api/save-document', express.raw({type: 'application/octet-stream', limit: '10mb'}), saveDocument);

app.get('/api/grab_file', loadFilefromR2);

app.post('/api/create_category', authMiddleware, createCategory);

app.post('/api/create_server', authMiddleware, createServer);

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});