<script>
  import { supabase } from '../supabase.js';
  import {userEmail} from '../lib/stores/user.js';
  import {Router, goto} from "@mateothegreat/svelte5-router";
  let register_error = $state(false);
  let password = $state('');
  let email = $state('');
  let display_name = $state('');

  async function register_handler(nickname, email, password){
    const {data, error} = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {display_name: nickname}
        }
    })
    if (error){
        register_error = true;
    }
    else if (data){
        userEmail.set(email);
        goto(`/email_verify`);
    }
  }
</script>

<main>
  <h1 class="register_header">Register</h1>
  <div class="register_container">
    <input id="display_name"class="nickname_input" type="text" bind:value={display_name} placeholder="Display Name"/>
    <input id="email" class="email_input" type="email" bind:value={email} placeholder="Email"/>
    <input id="password" class="password_input" type="password" bind:value={password} placeholder="Password" />
    <div class="auth_elements">
      <div>
        <input type="checkbox" id="remember_me" name="remember_me" value="Remember Me">
        <label class="remember_label" for="remember_me"> Remember Me</label>
      </div>
    </div>
    <button class="register_button" onclick={()=> register_handler(display_name, email, password)}>Sign Up</button>
  </div>
  <label for="account_warn" class="warn_lbl {register_error ? 'register_error' : ''}">There's already an account with that email.</label>
</main>

<style>

  main{
    display: flex;
    flex-direction: column;
  }
  .register_header{
    text-align: center;
    margin-top: 50px;
    font-family: FivoSans;
    font-weight: bold;
    font-style: normal;
    color: black;
    margin-bottom: 10px;
  }
  .register_container{
    display: flex;
    border-radius: 10px;
    flex-direction: column;
    height: auto;
    min-width: 325px;
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

  .register_container input{
    border-radius: 10px;
    border: none;
    padding: 10px;
    font-size: 16px;
    font-family: FivoSans;
    font-weight: 500;
    font-style: normal;
    height: 40px;
  }

  .email_input:focus, .password_input:focus{
    outline: none;
    color: white;
  }


  .register_button{
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

  .auth_elements{
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .remember_label{
    font-family: Code-New-Roman;
    font-weight: 500;
    color: black;
    font-style: normal;
  }

  .register_button:hover{
    background-color: black;
    color: white;
    border-color: white;
  }
  .warn_lbl{
    color: rgba(255, 0, 0, 0);
  }

  .warn_lbl.register_error{
    color: red;
  }



  
</style>
