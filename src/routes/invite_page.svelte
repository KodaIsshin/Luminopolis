<script>
    import { goto } from '@mateothegreat/svelte5-router';
	import { supabase } from './../supabase.js';
	import { onMount } from 'svelte';
    const {route} = $props();
    const invite_id = $derived(route.result.path.params.invite_id);
    let invite_obj = $state({server_id: "", username: "", server_name: ""});

    onMount(async ()=>{
        const{data: {user}} = await supabase.auth.getUser();
        if(!user){
            goto('/');
            return;
        }
        const{data: invite_data} = await supabase.from("invites").select(`server_id, username, server_name`).eq("id", invite_id).single();
        invite_obj = {
            server_id: invite_data.server_id,
            username: invite_data.username,
            server_name: invite_data.server_name
        };
        const{data: user_data} = await supabase.from("user_servers").select().eq("user_id", user.id).eq("server_id", invite_data.server_id).maybeSingle();
        if(user_data){
            goto(`/home?server=${encodeURIComponent(invite_obj.server_name)}&serverId=${invite_obj.server_id}`);
        }
    })

    async function joinServer(){
        const{data: {user}} = await supabase.auth.getUser();
        const{data: join_data} = await supabase.from("user_servers").insert({
            user_id: user.id,
            server_id: invite_obj.server_id,
            server_name: invite_obj.server_name,
            role: "member"
        })
        goto(`/home?server=${encodeURIComponent(invite_obj.server_name)}&serverId=${encodeURIComponent(invite_obj.server_id)}`);
    }
</script> 

<main>
    <div class="invite_container">
        <p>{invite_obj.username} has invited you to {invite_obj.server_name}</p>
        <button onclick={()=> joinServer()}>Join</button>
    </div>

</main>

<style>
    .invite_container{
        margin: auto;
        background-color: black;
        border: 1px solid white;
        height: 500px;
        width: 500px;
        border-radius: 16px;
    }
</style>