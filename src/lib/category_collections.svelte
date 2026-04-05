<script>
import {onMount} from "svelte";
import {supabase} from "../supabase.js";
import StudyView from "./study_view.svelte";
let {category_id} = $props();
let category_tabs = $state([]);
let input_txt = $state("");
let tab_name = $state("");
let tab_id = $state("");
let entered = $state(false);
let adding = $state(false);

onMount(async () => {
    const { data: tabs, error } = await supabase
        .from("channels")
        .select("*")
        .eq("category_id", category_id);

    if (!error) category_tabs = tabs;

    const { data: { session } } = await supabase.auth.getSession();
    await supabase.realtime.setAuth(session.access_token);
});

async function createPage(){
    if(input_txt.trim() === ""){
        alert("Page name cannot be empty");
        return;
    }
    const {data: {user}, error: userError} = await supabase.auth.getUser();
    const {data: page_data, error: page_error} = await supabase.from("channels").insert({
        name: input_txt,
        category_id: category_id,
    }).select().single();
    if (page_error){
        console.error("Error creating page", page_error.message);
        return;
    }
    input_txt = "";
    adding = false;
    category_tabs = [...category_tabs, page_data];
    enterPage(page_data.name, page_data.id);
}

function enterPage(name, id){
    tab_name = name;
    tab_id = id;
    entered = true;
}

</script>

<main>
{#if entered}
    <StudyView bind:enabled={entered} name={tab_name} channel_id={tab_id}/>
{:else}
    <button class="add_tab" onclick={()=>{
            adding = true;
    }}>+</button>
    {#if adding}
        <div class="study_tab">
            <input class= "tab_input" id="tab-name" type="text" placeholder="Enter Page Name" bind:value={input_txt}/>
            <button class="confirm_btn" onclick={()=>{
            createPage();
            }}>Y</button>
            <button class="cancel_btn" onclick={()=>{
            adding = false;
            input_txt = "";
            }}>N</button>
        </div>
    {/if}
    {#each category_tabs as tab}
        <div class="tab_container">
            <button class="tab_button" onclick={()=>{
                enterPage(tab.name, tab.id);
            }}>{tab.name}</button>
            <!-- <button class="settings">⋮</button> -->
        </div>
    {/each}
{/if}


</main>

<style>
    main{
        padding-top: 1%;
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }
    main button:hover{
        background-color: black;
        color: white;
    }

    .study_tab{
        width: 70%;
        height: 8%;
        margin-top: 2%;
        font-size: 18px;
        background-color: white;
        border: 1px solid black;
        color: black;
        border-radius: 8px;
        align-self: center;
        display: flex;
        flex-direction: row;
    }

    .study_tab button{
        width: 10%;
        height: 100%;
        font-size: 20px;
        font-family: FivoSans;
        background-color: white;
        border: 1px solid black;
        color: black;
        border-radius: 8px;
        cursor: pointer;
        transition: ease-in-out .3s;
    }

    .tab_input{
        width: 70%;
        height: 100%;
        font-size: 20px;
        font-family: FivoSans;
        border: none;
        padding-left: 10px;
        background-color:transparent;
        color: black;
        border-color: transparent;
        align-self: left;
    }
    
    .confirm_btn{
        margin-left: 5%;
        margin-right: 5%;
    }

    .add_tab{
        width: 70%;
        height: 8%;
        margin-top: 2%;
        font-size: 18px;
        font-family: FivoSans;
        background-color: white;
        border: 1px solid black;
        color: black;
        border-radius: 8px;
        cursor: pointer;
        font-size: 30px;
        border-radius: 14px;
        align-self: center;
        transition: ease-in-out .3s;
    }

    .tab_button{
        width: 70%;
        height: 100%;
        font-size: 18px;
        font-family: FivoSans;
        background-color: white;
        border: 1px solid black;
        color: black;
        border-radius: 8px;
        cursor: pointer;
        align-self: center;
        margin-right: -5px;
        transition: all 0.45s ease;
    }

    .tab_container{
        width: 100%;
        height: 8%;
        margin-top: 2%;
    }

    /* .settings{
        overflow: hidden;
        height: 100%;
        width: 0;
        padding: 0;
        opacity: 0;
        vertical-align: middle;
        transition:
            all 0.45s ease;
    } */

    /* .tab_container:hover .settings{
        width: 2%;
        background-color: white;
        color: black;
        opacity: 1;
        border: 1px solid black;
        box-sizing: border-box;
        vertical-align: middle;
        align-items: center;
        font-size: 40px;
    } */

    /* .tab_container:hover .tab_button{
        margin-right: 0;
    } */


    /* .tab_container:hover .settings:hover{
        background-color: black;
        color: white;
        border-color: white;
    } */

</style>