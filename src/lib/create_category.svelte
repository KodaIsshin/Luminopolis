<script>
	import { onMount } from 'svelte';
    import {session} from "./stores/user.js";

    let {hidden = $bindable(), id} = $props();
    let name = $state("");
    let panel;
    let content = $state("");
    onMount(() => {
        document.addEventListener('mousedown', handleClickOutside);
    });
    function handleClickOutside(e){
        if(hidden && panel && !panel.contains(e.target)){
            hidden = false;
        }
    }
    function panelHide(){
        name = "";
        hidden = !hidden;
    }
    async function onCreate(){
        if (name.trim() === ""){
            alert("Category name cannot be empty");
            return;
        }
        try{   
            fetch('/api/create_category',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + $session.access_token
                },
                body: JSON.stringify({
                    category_name: name
                })
            })

        }
        catch(error){

        }
        
        panelHide();
    }
</script>

<div class="category_container" bind:this={panel}>
    <h2 class="category_header">Create Category</h2>
    <p class="category_desc">Enter a name for the category</p>
    <input class="category_name" id="category-name" type="text" name="category-name" bind:value={name}/>
    <div class="button_choice">
        <button class="cancel_btn" onclick={()=> panelHide()}>Cancel</button>
        <button class="create_btn" onclick={()=> onCreate()}>Create</button>
    </div>
</div>

<style>
    .category_header{
        align-self: center;
        font-family: FivoSans;
        font-size: 24px;
        margin-top: 10px;
        margin-bottom: 2%;
        font-weight: bold;
    }
    .category_container{
        position: fixed;
        top: 30%;
        left: 35%;
        width: 25%;
        height: 35%;
        padding: 10px;
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
    }

    .category_name{
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

    .category_desc{
        align-self: center;
        font-family: FivoSans;
        font-size: 18px;
        margin-top: 2%;
        margin-bottom: 2%;
    }

</style>