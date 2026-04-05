<script>
	import { user, session } from './stores/user.js';
    import {supabase} from "../supabase.js";
    import { onMount } from "svelte";
    let {hidden = $bindable()} = $props();
    let server_name = $state("");
    let panel;
    onMount(() => {
        document.addEventListener('mousedown', handleClickOutside);
    });
    function handleClickOutside(e){
        if(hidden && panel && !panel.contains(e.target)){
            hidden = false;
        }
    }
    
    function panelHide(){
        server_name = "";
        hidden = !hidden;
    }

    async function onCreate(){
        try{
            fetch('/api/create_server',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + $session.access_token
                },
                body: JSON.stringify({
                    server_name: server_name
                })
            })
        }
        catch(error){

        }
        panelHide();
    }
</script>

<div class="server_container" bind:this={panel}>
    <h2 class="server_header">Create Citadel</h2>
    <p class="server_desc">Enter a name to label the citadel</p>
    <input class="server_name" id="server-name" type="text" name="server-name" bind:value={server_name}/>
    <div class="button_choice">
        <button class="cancel_btn" onclick={()=> panelHide()}>Cancel</button>
        <button class="create_btn" onclick={()=> onCreate()}>Create</button>
    </div>
</div>

<style>
    .server_container{
        position: fixed;
        top: 30%;
        left: 35%;
        width: 25%;
        height: 15%;
        padding: 10px;
        height: 300px;
        display: flex;
        flex-direction: column;
        background-color: rgb(255, 255, 255);
        border-width: 2px;
        border-color: black;
        border-style: solid;
        border-radius: 16px;
        font-family: FivoSans;
        color: black;
        z-index: 9999;
        padding: auto;
    }

    .server_name{
        width: 80%;
        height: 14%;
        border-radius: 8px;
        align-self: center;
        color: black;
        background-color: rgba(255, 255, 255, 0.87);
        border: 1px solid #000;
        padding-left: 10px;
        font-family: FivoSans;
        font-size: 20px;
    }

    .button_choice{
        margin-top: 10px;
        align-self: center;

        justify-content: space-between;
    }

</style>