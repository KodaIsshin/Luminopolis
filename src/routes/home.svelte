<script lang="js">
    import {supabase} from "../supabase.js";
    import {onMount} from "svelte";
	import CreateServer from './../lib/create_server.svelte';
    import ServerPage from "../lib/server_page.svelte";
    import { goto } from "@mateothegreat/svelte5-router";
    import {userEmail, user, session} from "../lib/stores/user.js";

    let navOpen = $state(true);
    let panelVisible = $state(false);
    let info_list = $state([]);
    let server_dict = $state({server_name: null, server_id: null});
    let home_state = $state(true);
    let logOutTimer;
    let super_admin = $state(false);
    onMount(async () => {
        if(!$user){
            console.log("no user found, redirecting to login");
            goto('/')
            return;
        }
        if(!$session){
            console.log("no session found, redirecting to login");
            goto('/')
            return;
        }
        let user_obj = supabase.auth.getUser($session.access_token);
        console.log(user_obj);
        await supabase.realtime.setAuth($session.access_token);
        const params = new URLSearchParams(window.location.search);
        const name_param = params.get("server");
        const id_param = params.get("serverId");
        if(name_param && id_param){
            server_dict = {
                server_name: name_param,
                server_id: id_param
            }
            home_state = false;
            console.log("made it here, we've been directed to the server");
        }
        await getServers();
        supabase
        .channel('room1')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_servers' }, payload => {
            info_list.push({id: payload.new.server_id, name: payload.new.server_name});
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'user_servers' }, payload => {
            info_list = info_list.filter(item => item.id !== payload.old.server_id);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_servers' }, payload => {
            getServers();
        })
        .subscribe();
        history.replaceState(null, "", window.location.pathname);
        function tabNotVisible(){
            if(document.hidden){
                try{
                    logOutTimer = setTimeout(logOut, 1800000);
                } catch (error){
                    console.error("Error setting logout timer", error);
                }
            }
            else{
                clearTimeout(logOutTimer);
            }
        }
        document.addEventListener('visibilitychange', tabNotVisible);

        
    });
    function toggleNav(){
        navOpen = !navOpen;
    }

    async function logOut(){
        const{error} = await supabase.auth.signOut();
        if(error){
            console.error("trouble signing out", error.message)
        }
        localStorage.clear();
        sessionStorage.clear();
        session.set(null);
        user.set(null);
        userEmail.set(null);
        goto('/');
        return;
    }


    async function getServers(){
        const {data: {user}, error: userError} = await supabase.auth.getUser();
        const {data, error} = await supabase.from("user_servers").select(`
            server_id,
            servers ( id, name )
        `)
        .eq("user_id", user.id);
        if (error){
            console.error("Error getting user servers", error.message);
            return;
        }
        // @ts-ignore
        const information = data.map(item => ({id: item.server_id, name: item.servers.name}));
        info_list = information;
    }
    async function enterServer(name, id){
        server_dict.server_id = id;
        server_dict.server_name = name;
        home_state = false;
        toggleNav();
    }
</script>

<main>
    <div class="sidenav_container {navOpen ? 'closed' : ''}">
        <div class="sidenav">
            <button class="home_button" onclick={()=>{ 
            home_state = true 
            toggleNav();
            }}>HOME</button>
            {#each info_list as server}
                <button onclick={() => enterServer(server.name, server.id)}>{server.name}</button>
            {/each}
            <button class="add_button"onclick={() => panelVisible = !panelVisible}>+</button>
        </div>
        <button class="sidenav_btn" onclick={()=> toggleNav()}>></button>
    </div>
    {#if !home_state}
        {#key server_dict.server_id}
            <ServerPage server_name={server_dict.server_name} server_id={server_dict.server_id}/>
        {/key}
    {:else}
        <div class="bulletin_portal">
            <h1>BULLETIN</h1>
            <h2>WORK IN PROGRESS</h2>
        </div>
    {/if}
    {#if panelVisible}
        <CreateServer bind:hidden={panelVisible}/>
    {/if}
</main>

<style>
main{
    height: 100%;
    width: 100%;
    overflow: hidden;
}

.sidenav_container{
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    display: flex;
    transition: transform 0.3s ease;
    z-index: 1000;
    flex-direction: horizontal;
    gap: 20px;
}

.sidenav_btn{
    width: 30px;
    height: 40px;
    border-radius: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    color: black;
    border-color: black;
    border-width: 2px;
}

.sidenav_btn:hover{
    background-color: black;
    color: white;
    border-color: white;
}

.sidenav{
    height: 100%;
    width: 250px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 10px;
    border-right: 2px solid #0000002b;
    background-color: white;
}

.sidenav button{
    display: flex;
    width: 35%;
    height: 50px;
    justify-content: center;
    align-items: center;
    border-radius: 20px;
    white-space: nowrap;
    align-self: center;
    background-color: white;
    color: black;
    border-color: black;
    border-width: 2px;
    font-family: FivoSans;
    transition: ease-in-out 0.2s;
}


.sidenav button:hover{
    background-color: black;
    color: white;
    border-color: white;
}

.sidenav_btn{
    margin-top: 10px;
}


.closed{
    z-index: 9999;
    transform: translateX(-250px);
}



</style>