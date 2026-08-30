<script>
	import LogIn from './LogIn.svelte';
  import {goto} from "@mateothegreat/svelte5-router";
  import { supabase } from "../supabase";
  import {user, session} from "../lib/stores/user.js";
  let password = $state('');
  let email = $state('');
  

  async function handleLogin(email, password){
    const {data, error} = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    if (error){
      return;
    }
    else{
      user.set(data.user);
      session.set(data.session);
    }
    goto("/home");
    return;
  }
</script>

<main>
  <h1 class="login_header">Luminopolis</h1>
  <div class="login_container">
    <input class="email_input" type="email" bind:value={email} placeholder="Email or Username" required/>
    <input class="password_input" type="password" bind:value={password} placeholder="Password" required/>
    <div class="auth_elements">
      <button class="forgot_password" id="password_retrieval">Forgot Password?</button>
    </div>
    <button class="login_button" onclick={()=> handleLogin(email, password)}>Log In</button>
  </div>
  <div class="signup_container">
    <label for="signup_query" class="signup_lbl">Don't have an account?</label>
    <button class="signup_link" id="register_id" onclick={()=> goto('/create_account')}> Register </button>
  </div>
  
</main>

<style>

  main{
    display: flex;
    flex-direction: column;
    margin: auto;
  }
  .login_header{
    text-align: center;
    margin-top: 50px;
    font-family: BagnardSans;
    font-style: normal;
    color: black;
    margin-bottom: 10px;
  }
  .login_container{
    display: flex;
    border-radius: 10px;
    flex-direction: column;
    height: auto;
    min-width: 325px;
    width: 30%;
    align-self: center;
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

  .email_input, .password_input{
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


  .login_button{
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

  .forgot_password{
    font-family: Code-New-Roman;
    font-weight: 500;
    color: black;
    font-style: normal;
    align-self: end;
  }
  .signup_container{
    min-width: 325;
    justify-content: space-between;
    align-items: center;
  }
  .signup_lbl, .signup_link{
    margin-top: 10px;
    color: black;
    font-family: FivoSans;
    font-weight: 500;
    font-style:normal;
    font-size: 20px;
  }

  .signup_link, .forgot_password{
    background: none;
    border: none;
  }
  .signup_link:hover{
    cursor: pointer;
    text-decoration:underline;
  }

  .login_button:hover{
    background-color: black;
    color: white;
    border-color: white;
  }

  .forgot_password:hover{
    cursor: pointer;
    text-decoration: underline;
  }
  
  
</style>
