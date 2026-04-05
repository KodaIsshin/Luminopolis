<script>
	import { user } from './stores/user.js';
    import Chatroom from "./chatroom.svelte";
    import {StarterKit} from "@tiptap/starter-kit";
    import {Editor} from "@tiptap/core";
    import {onDestroy, onMount} from "svelte";
    import {uploadFileToR2, loadDocument} from "../frontend.js";
    import {supabase} from "../supabase.js";
    import MaterialFile from "./material_file.svelte";
    import { goto } from "@mateothegreat/svelte5-router";

    let {name, channel_id, enabled = $bindable()} = $props();
    let materials = $state([{name: "Create Material", type: "Panel", r2_path: ""}]);
    let index = $state(0);
    let creating = $state(false);
    let mat_view = $state("start");
    //editor variables
    let fileInput = $state();


    onMount(async() => {
        if(!$user){
            goto('/');
            return;
        }
        const {data: materials_data, error: materials_error} = await supabase.from("study_materials").select(`type, path, name`).eq("channel_id", channel_id).eq('type', 'File');
        if(!materials_error) materials = [...materials, ...materials_data.map(mat => ({name: mat.name, type: mat.type, r2_path: mat.path}))];
    }); 




    async function handleFileChange(event){
        const file = event.target.files[0];
        if(file){
            const uploadProgress = document.getElementById('uploadProgress');
            uploadProgress.textContent = `Uploading...`;

            const result = await uploadFileToR2(file);
            if(result.success){
                uploadProgress.textContent = `Upload complete: ${result.key}`;
                // Update materials array with new file info
                createMaterial(result.url, "File", file.name);

            } else {
                uploadProgress.textContent = `Upload failed: ${result.error}`;
            }
        }
    }

    async function createMaterial(url, data_type, filename){
        // Logic to create study material entry in supabase database
        const {data: material_data, error: material_error} = await supabase.from("study_materials").insert({
            channel_id: channel_id,
            type: data_type,
            path: url,
            name: filename
        }).select().single();
        if(material_error){
            console.error("Error creating study material", material_error.message);
            return;
        }
        materials = [...materials, {name: filename, type: "File", r2_path: url}];
    }

    function syncMatView(){
        if(materials[index].type === "Panel"){
            creating = false;
            mat_view = "start";
        } else if (materials[index].type === "Document"){
            mat_view = "document";
            creating = false;
        }
        if(materials[index].type === "File"){
            mat_view = "viewing";
        }
    }
    

    function next(){
        index = (index + 1) % materials.length;
    }

    function prev(){
        index = (index - 1 + materials.length) % materials.length;
    }
</script>

<main>
    <header class="study_view_header">
        <button class="back_button" onclick={()=> enabled = false}>←</button>
        <h1 class="header_text">{name}</h1>
        <div class="spacer"></div>
    </header>
   <div class="study_view_container">
        <div class="chatroom_section">
            <Chatroom channel_name={name} channel_id={channel_id}/>
        </div>
        <div class="study_materials">
            <div class="material_header">
                <select class="mat_dropdown" bind:value={index} onchange={() =>syncMatView()}>
                    {#each materials as mat, i}
                        <option value={i}>
                            {mat.name}
                        </option>
                    {/each}
                </select>
                {#if mat_view == "viewing"}
                    <button class="delete_button">D</button>
                {/if}
            </div>
            <div class="study_view">
                <button class="arrow_button" onclick={()=>{
                    prev();
                    syncMatView();
                }}>←</button>
                <div class="material_container"
                class:start={mat_view === "start"}
                class:creating={mat_view === "creating"}
                class:viewing={mat_view === "viewing"}>
                    {#if materials[index].type === "Panel" && creating === false}
                        <button class="start_btn" onclick={()=>{
                            creating = true;
                            mat_view = "creating";
                        }}>+</button>
                    {:else if materials[index].type === "Panel" && creating}
                        <div class="panel_header">Create Study Material</div>
                        <div id="drop-area" class="drop_area">
                            <input id="fileInput" class="upload_input" type="file" bind:this={fileInput} onchange={handleFileChange} multiple>
                            <label class="inputLbl" for="fileInput" id="uploadProgress">Click or Drag & Drop to upload files</label>
                        </div>
                        <button class="cancel_btn" onclick={()=>{
                            creating = false;
                            mat_view = "start";
                        }}>Close</button>
                    {:else if materials[index].type === "File"}
                        <MaterialFile api_path={`/api/grab_file?key=${materials[index].r2_path}`}/>
                    {/if}
                </div>
                <button class="arrow_button" onclick={()=>{
                    next();
                    syncMatView();
                }}>→</button>
            </div>
        </div>
   </div>
</main>

<style> 

    main{
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }
    .study_view_header{
        border-bottom: 2px solid #0000002b;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }

    .study_view{
        width: 100%;
        display: flex;
        flex-direction: row;
        height: 95%;
        justify-content: space-between;
        align-items: center;
    }

    .arrow_button{
        height: 10%;
        min-width: 50px;
        align-self: center;

    }

    .header_text{
        font-weight: bold;
        margin: 16px;
        color: black;
        font-family: FivoSans;
        font-size: 32px;
        align-self: center;
        margin-left: -5rem;
    }
    .study_view_container{
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: row;
    }

    .material_header{
        display: flex;
        width: 100%;
        justify-content: space-between;
        padding-top: 5px;
    }

    .study_materials{
        height: 100%;
        width: 50%;
        display: flex;
        border-left: 2px solid #0000002b;
        box-sizing: border-box;
        padding-left: 5px;
        padding-right: 5px;
        flex-direction: column;
    }

    .chatroom_section{
        height: 100%;
        width: 50%;
    }
    
    .material_container{
        height: 100%;
        width: 100%;
        border: 2px solid #0000002b;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all ease-in-out 0.2s;
        
    }
    .material_container.start{
        border: 2px solid #000000;
        height: 10%;
        width: 15%;
        border-radius: 10px;
    }

    .material_container.creating{
        border: 2px solid #000000;
        height: 40%;
        width: 70%;
        border-radius: 10px;
        display: flex;
        flex-direction:column;
        justify-content: space-between;
        padding-top: 2%;
        padding-bottom: 2%;
        box-sizing: border-box;
    }


    .material_container.viewing{
        border: none;
        border-radius: 10px;
        display: flex;
        height: 98%;
        width: 95%;
        flex-direction: column;
        border: 2px solid #0000002b;
        color: none;
    }

    .start_btn{
        height: 100%;
        width: 100%;
        border: none;
        background-color: transparent;
        color: black;
        font-family: FivoSans;
        font-size: 20px;
        cursor: pointer;
        transition: ease-in-out 0.2s;
    }

    .start_btn:hover{
        background-color: black;
        color: white;
    }

    .panel_header{
        font-family: FivoSans;
        font-size: 28px;
        font-weight: bold;
        color: black;
        padding-bottom: 40px;
        border-bottom: 2px solid #0000002b;
        width: 100%;
        height: 3%;
    }

    .upload_input{
        margin-top: 10px;
        margin-bottom: 10px;
        font-family: FivoSans;
        font-size: 16px;
        color: black;
        align-self: center;
        width: 100%;
    }

    .back_button{
        font-size: 24px;
        font-family: FivoSans;
        background-color: transparent;
        border: none;
        color: black;
        cursor: pointer;
        margin-left: 16px;
        align-self: center;
        border: 2px solid black;
        vertical-align: middle;
    }

    .drop_area{
        height: 50%;
        width: 80%;
        border: 2px dashed #0000002b;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        align-self: center;
        display: flex;
        flex-direction: column;
    }

    .cancel_btn{
        font-family: FivoSans;
        background-color: white;
        border-color: black;
        border-width: 2px;
        color: black;
        cursor: pointer;
        align-self: center;
        transition: ease-in-out 0.2s;
    }


    .inputLbl{
        margin-top: 10px;
        font-family: FivoSans;
        font-size: 16px;
        color: black;
        cursor: pointer;
    }


    .mat_dropdown{
        font-family: FivoSans;
        background: black;
        border: 1px solid #0000002b;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 14px;
        height: 30px;
    }

    .material_header button{
        padding: 5;

    }


</style>