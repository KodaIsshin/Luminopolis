<script>
    import { supabase } from "../supabase";
    import { user } from "../lib/stores/user.js";
    import Chatroom from "./chatroom.svelte";
    import CreateCategory from "./create_category.svelte";
    import CategoryPage from "./category_collections.svelte";
    import DocumentView from "./document_view.svelte";

    let {server_name, server_id} = $props();
    let category_list = $state([]);
    let category_id = $state("");
    let current_category = $state("Homeroom");
    let homeroom_id = $state("");
    let panelVisible = $state(false);
    import { onMount } from "svelte";
    import { goto } from "@mateothegreat/svelte5-router";
    onMount(async () => {
        if(!$user){ goto('/'); return; }
        await getCategories();
        current_category = category_list[0]?.name;
        category_id = category_list[0]?.id;
        const {data: channel_data, error} = await supabase.from("channels")
            .select(`id, name`)
            .eq("category_id", category_id)
            .eq("name", "Homeroom")
            .single();
        if(channel_data){
            homeroom_id = channel_data.id;
        }
    });
    $effect(() => {
        const current_server = server_id;
        const channel = supabase.channel(`server_${current_server}`)
        .on('postgres_changes', { schema: 'public', table: 'category', event: '*' }, payload => {
            updateCategoryList(payload);
        })
        .subscribe();
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        }
    });
    
    function updateCategoryList(payload){
        if(payload.eventType === "INSERT"){
            category_list = [...category_list, {id: payload.new.id, name: payload.new.category_name}];
        }
        else if(payload.eventType === "DELETE"){
            category_list = category_list.filter(cat => cat.id !== payload.old.id);
        }
        else if(payload.eventType === "UPDATE"){
            const index = category_list.findIndex(cat => cat.id === payload.old.id);
            if (index !== -1) {
                category_list[index].name = payload.new.category_name;
            }
        }
    }
    
    function enterCategory(id, category_name){
        category_id = id;
        current_category = category_name;
    }

    async function getCategories(){
        const cacheKey = `categories_${server_id}`;
        let cachedCategories = [];

        const cached = localStorage.getItem(cacheKey);
        if(cached){
            try{
                cachedCategories = JSON.parse(cached);
                category_list = cachedCategories;
            }
            catch(err){
                console.error("Error parsing cached categories:", err);
            }
        }
        const {data, error} = await supabase.from("category").select(`
            id,
            category_name
        `).eq("server_id", server_id);
        if (error){
            console.error("Error getting categories", error.message);
            return cachedCategories;
        }
        // @ts-ignores
        const categories = data.map(item => ({id: item.id, name: item.category_name}));
        const oldJSON = JSON.stringify(cachedCategories);
        const newJSON = JSON.stringify(categories);
        if(oldJSON !== newJSON){
            localStorage.setItem(cacheKey, newJSON);
            category_list = categories;
        }
    }

    async function getInvite(){
        const{data: {user}} = await supabase.auth.getUser()
        const {data: invite_data, error: invite_error} = await supabase.from("invites").select('id').eq('server_id', server_id).maybeSingle();
        if(!invite_data){
            const{data, error} = await supabase.from("invites").insert({
                server_id: server_id,
                username: user.user_metadata.display_name,
                server_name: server_name
            }).select().single();
            await navigator.clipboard.writeText(window.location.host + `/invite/${data.id}`)
        }
        else{
            await navigator.clipboard.writeText(window.location.host + `/invite/${invite_data.id}`)
        }
    }

</script>
<main>
    <div class="server_sidenav">
        <button class="server_settings" onclick={()=> getInvite()}>INV</button>
        <label class="server_title" for="server_name" id="server_name">{server_name}</label>
        {#each category_list as category}
            <div class="button_container">
                <button class="category_button {current_category == category.name ? 'active' : ''}" onclick={()=> enterCategory(category.id, category.name)}>{category.name}</button>
                <!-- <button class="settings">⋮</button> -->
            </div>
        {/each}
        <div class="button_container">
            <button class="add_button" onclick={()=> panelVisible = !panelVisible}>+</button>
        </div>
    </div>
    {#key category_id}
        {#if current_category == "Homeroom" && homeroom_id}
            <Chatroom channel_name="Homeroom" channel_id={homeroom_id}/>
        {:else if current_category == "Document"}
            <DocumentView id = {server_id} homeroom={homeroom_id}/>
        {:else if current_category != "Homeroom"}
            <CategoryPage category_id={category_id}/>
        {/if}
        {#if panelVisible}
            <CreateCategory bind:hidden={panelVisible} id={server_id}/>
        {/if}
    {/key}
    
</main>


<style>
    main{
        display: flex;
        flex-direction: row;
        top: 0;
        left: 0;
        position: absolute;
        height: 100%;
        width: 100%;
    }

    .server_settings{
        width: 50px;
        align-self: end;
        margin-right: 5px;
    }

    .server_sidenav{
        height: 100%;
        min-width: 200px;
        display: flex;
        flex-direction: column;
        border-right: 1px solid black;
        gap: 15px;
        padding-top: 10px;
        overflow-y: auto;
    }
    


    .server_title{
        font-family: FivoSans;
        font-weight: bold;
        font-style: normal;
        color: black;
        text-align: center;
        font-size: 30px;
    }
    
    .server_sidenav button{
        display: flex;
        justify-content: center;
        background-color: white;
        border-color: black;
        border-width: 2px;
        color: black;
        transition: ease-in-out .3s;
        font-family: FivoSans;
        white-space: nowrap;
    }


    .button_container{
        display: flex;
        justify-content: center;
        width: 100%;
        height: 60px;
        flex-shrink: 0;
        transition: all 0.45s ease;
    }

    /* .settings{
        overflow: hidden;
        height: 0;
        width: 0;
        padding: 0;
        opacity: 0;
        align-items: center;
        align-self: center;
        transition:
            opacity 0.45s ease,
            height 0.45s ease,
            width 0.45s ease,
            padding 0.45s ease,
            font-size 0.45s ease
    } */



    .category_button{
        width: 70%;
        height: 80%;
        font-size: 20px;
        align-items: center;
        align-self: center;
        border-radius: 14px;
        transition: transform .45s ease;
    }

    /* .button_container:hover .category_button{
        transform: translateX(-5px);
    } */

    /* .button_container:hover .settings{
        height: 80%;
        width: 8%;
        opacity: 1;
        border: 2px solid black;
        margin-left: 5px;
        font-size: 25px;

    } */

    .add_button{
        width: 70%;
        height: 80%;
        font-size: 20px;
        align-items: center;
        align-self: center;
        border-radius: 14px;
    }

    .server_sidenav button:hover{
        background-color: black;
        color: white;
        border-color: white;
    }
</style>