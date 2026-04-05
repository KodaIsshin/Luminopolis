<script lang="js">
    import {RealtimeClient} from "@supabase/realtime-js";
    import { supabase } from "../supabase";
    import { onMount } from "svelte";
    import Message from "./message.svelte";
    let {channel_name, channel_id} = $props();
    let user_info = {id: "", name: ""}
    let user_message = $state("");
    let messages = $state([]);
    let chatContainer;
    let scrollTimeout;
    let sending = $state(false);
    onMount(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.realtime.setAuth(session.access_token);
        user_info.id = session.user.id;
        user_info.name = session.user.user_metadata.display_name;
    });
    $effect(() => {
        //only should track changes in channel_id
        const current_channel = channel_id;
        let channel;    
        messages = [];
        async function chatroomSetup(){
            channel = supabase
            .channel(`channel_${current_channel}`)
            .on('postgres_changes', {schema: 'public', table: 'messages', event: '*', filter: `channel_id=eq.${current_channel}`}, payload => {
                updateMessages(payload);
            })
            .subscribe();
            await loadMessages();
            scrollToBottom();
        }
        chatroomSetup();
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };

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


</script>

<main>
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
        min-height: 0;
        overflow-y: auto;
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
        margin-bottom: 10px;
        height: 5%;
        flex: 0 0 auto;
    }

    .messages_container{
        flex: 0 0 auto;
    }

    
</style>