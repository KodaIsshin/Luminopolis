
export async function uploadFileToR2(file){ 
    try{
        const response = await fetch(
            `/api/generate-upload-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
        )

        if(!response.ok){
            const errorData = await response.json();
            throw new Error(`Failed to get upload URL: ${errorData.error || response.statusText}`);
        }
        const {uploadUrl, key} = await response.json();

        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        })

        if(!uploadResponse.ok){
            const errorText = await uploadResponse.text();
            console.error('Upload response error text:', errorText);
            throw new Error(`File upload failed: ${uploadResponse.statusText}`);
        }

        console.log('File uploaded successfully to R2');
        return {success: true, url: key};
    }catch(error){
        console.error('Error uploading file to R2:', error);
        //@ts-ignore
        return {success: false, error: error.message};
    }
}

export async function loadDocument(channelID){
    const res = await fetch(`/api/grab-document?channel_id=${encodeURIComponent(channelID)}`);
    if(!res.ok){
        const errorData = await res.json();
        throw new Error(`Failed to get document URL: ${errorData.error || res.statusText}`);
    }
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
}



