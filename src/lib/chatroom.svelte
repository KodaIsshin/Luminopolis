<script lang="js">
    import {RealtimeClient} from "@supabase/realtime-js";
    import { supabase } from "../supabase";
    import { onMount, onDestroy } from "svelte";
    import Message from "./message.svelte";
    import { Diamonds } from 'svelte-loading-spinners';
    let {channel_name, channel_id} = $props();
    let user_info = {id: "", name: ""}
    let user_message = $state("");
    let messages = $state([]);
    let chatContainer;
    let scrollTimeout;
    let channel;
    let sending = $state(false);
    let loading = $state(true);
    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.realtime.setAuth(session.access_token);
        user_info.id = session.user.id;
        user_info.name = session.user.user_metadata.display_name;
        messages = [];
        channel = supabase
        .channel(`channel_${channel_id}`)
        .on('postgres_changes', {schema: 'public', table: 'messages', event: '*', filter: `channel_id=eq.${channel_id}`}, payload => {
            updateMessages(payload);
        })
        .subscribe();
        await loadMessages();
        loading = false;
    });
    function scrollToBottom() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });
    }


    async function loadMessages(){
        console.log("Loading messages for channel ", channel_id);
        const {data: message_list, error: message_error} = await supabase.from("messages").select(`user_display, id, message, user_id, created_at`).eq("channel_id", channel_id).limit(50);
        if(message_error){
            console.error("Error getting channel ", message_error.message);
        }
        messages = message_list;
        scrollToBottom()
    }

    function updateMessages(payload){
        if(payload.eventType === "INSERT"){
            messages = [...messages, {user_display: payload.new.user_display, id: payload.new.id, message: payload.new.message, user_id: payload.new.user_id, created_at: payload.new.created_at}]
            scrollToBottom();
        }
        else if(payload.eventType === "DELETE"){
            messages = messages.filter(msg => msg.id !== payload.old.id);
        }
        else if(payload.eventType === "UPDATE"){
            const index = messages.findIndex(msg => msg.id === payload.old.id);
            if (index !== -1) {
                messages[index].message = payload.new.message;
            }
        }
    }

    async function sendMessage(channel_id){
        if(sending) return;
        if (user_message.length <= 0){
            return;
        }

        sending = true;
        const {data, error} = await supabase.from("messages").insert({
            message: user_message,
            channel_id: channel_id,
            user_id: user_info.id,
            user_display: user_info.name
        }).select().single();
        sending = false;
        if (error){
            console.error("Error sending message", error.message);
            return;
        }
        user_message = "";
    }

    onDestroy(async () => {
        if(channel){
            await supabase.realtime.removeChannel(channel);
        }

    });

</script>

<main>
    {#if loading}
        <div style="display:flex; justify-content:center; align-items:center; height:100%; width:100%;">
            <Diamonds size={80} color="#000000" />
        </div>
    {/if}
    <div class="chatroom_container">
        <div class="messages_container">
            <div class="message">{channel_name}</div>
        </div>
        <div class="chatroom_spacer" bind:this={chatContainer}>
            {#each messages as msg (msg.id)}
                <Message user_message={msg.message} display_name={msg.user_display} timestamp={msg.created_at}/>
            {/each}
        </div>
        <div class="input_container">
            <input id="message_field" onkeydown={(e) => e.key === "Enter" && sendMessage(channel_id)} class="message_input" type="text" placeholder="Type your message here..." bind:value={user_message}/>
        </div>
    </div>
</main>

<style>

    main{
        height: 100%;
        width: 100%;
    }


    .chatroom_container{
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        z-index: 1;
        min-height: 0;
    }

    .chatroom_spacer{
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: auto;
        min-height: 0;
    }

    .chatroom_spacer::-webkit-scrollbar {
        display: none;
    }

    .message{
        font-family: FivoSans;
        font-size: 16px;
        color: black;
        padding: 5px;
        margin: 5px;
        background-color: #e0e0e0;
        border-radius: 8px;
    }

    .message_input{
        background-color: transparent;
        border-color: transparent;
        color: black;
        width: 100%;
        font-family: Code-New-Roman;
        font-size: 18px;
        width: inherit;
        height: auto;
        resize: vertical;
        
    }

    .message_input:focus{
        outline: none;
        color: black;
    }

    .message_input::placeholder{
        color: grey;
    }

    .input_container{
        display:flex;
        align-self: center;
        background-color: white;
        border: 2px solid black;
        border-radius: 10px;
        width: 99%;
        justify-content: space-between;
        margin-bottom: 5px;
        height: 40px;
        flex: 0 0 40px;
    }

    .messages_container{
        flex: 0 0 auto;
    }

    
</style>