<script>
  import { supabase } from '../supabase.js';
  import {userEmail} from '../lib/stores/user.js';
  import {Router, goto, route} from "@mateothegreat/svelte5-router";
  import {onMount} from "svelte";
  let checking = $state(false);
  const {query = {}} = $props();


  async function verify_func(email){
    const {data: {user}, error} = await supabase.auth.getUser();
    if (error){
        console.error("Error getting user", error.message)
    }

    if (user?.email_confirmed_at){
        goto("/")
    }
    else{
        const {error} = await supabase.auth.resend({
            type: 'signup',
            email: $userEmail
        })
        checking = false;
    }
  }
</script>

<main>
  <h1 class="verify_header">Verify Email</h1>
  <div class="verify_container">
    <p class="email_text">An email has been sent to your inbox. Once you have verified your email, press the button below to move to your home page.</p>
    <button class="verify_button" onclick={()=> verify_func()}>Go to Home</button>
  </div>
  <label for="account_warn" class="warn_lbl {checking ? 'register_error' : ''}">Email has not been verified yet. We have resent a confirmation email to your inbox.</label>
</main>
<style>

  main{
    display: flex;
    flex-direction: column;
  }
  .verify_header{
    text-align: center;
    margin-top: 50px;
    font-family: FivoSans;
    font-weight: bold;
    font-style: normal;
    color: black;
    margin-bottom: 10px;
  }
  .verify_container{
    display: flex;
    border-radius: 10px;
    align-self: center;
    flex-direction: column;
    height: auto;
    width: 250px;
    background: #eeecea;
    padding-left: 20px;
    padding-right: 20px;
    padding-top: 25px;
    padding-bottom: 25px;
    gap: 20px;
    border-width: 2px;
    border-color: #2c2c2c;
    border-style: solid;
  }

  .verify_button{
    align-self: center;
    min-width: 150px;
    min-height: 50px;
    border-radius: 16px;
    font-family: Code-New-Roman;
    background-color: white;
    border-color: black;
    border-width: 2.5px;
    color: black;
    transition: ease-in-out .3s;
  }

  .verify_button:hover{
    background-color: black;
    color: white;
    border-color: white;
  }

  .email_text{
    max-width: 300px;
    color: black;
    font-family: FivoSans;
    font-weight: normal;
    margin-top: 0px;
  }



  
</style>
