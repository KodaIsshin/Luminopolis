<script>
    let {user_message, display_name, timestamp} = $props();

</script>

<main>
    <div class="message_header">
        <strong class="username">{display_name}</strong>
    </div>
    <p class="msg_content">{user_message}</p>
</main>

<style>
    main{
        padding-left: 20px;
        position:sticky;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding-top: 10px;
    }
    main:hover{
        background-color: rgb(232, 232, 232);
    }
    .message_header{
        display: flex;
        flex-direction: row;
    }
    .username:hover{
        text-decoration: underline;
        cursor: pointer;
    }


    .message_header{
        color: black;
        font-family: FivoSans;
        font-size: 20px;
    }
    .msg_content{
        margin-top: 0;
        color: black;
        font-family: OfficeCodePro;
        font-style: normal;
        font-size: 15px;
        text-align: left;
    }
</style>