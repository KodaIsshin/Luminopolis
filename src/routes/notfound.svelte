<script>
  import { supabase } from '../supabase.js';
  import {Router} from "@mateothegreat/svelte5-router";
  let password = $state('');
  let email = $state('');

  function handleLogin(email, password){
    return void(0);
  }
</script>

<main>
  <h1 class="login_header">Page Not Found</h1>
  <div class="login_container">
    <input class="email_input" type="email" bind:value={email} placeholder="Email" />
    <input class="password_input" type="password" bind:value={password} placeholder="Password" />
    <div class="auth_elements">
      <div>
        <input type="checkbox" id="remember_me" name="remember_me" value="Remember Me">
        <label class="remember_label" for="remember_me"> Remember Me</label>
      </div>
      <label for="forgot_password" class="forgot_password">Forgot Password?</label>
    </div>
    <button class="login_button" onclick={()=> handleLogin(email, password)}>Log In</button>
  </div>
  
</main>




<style>

  main{
    display: flex;
    flex-direction: column;
  }
  .login_header{
    text-align: center;
    margin-top: 50px;
    font-family: FivoSans;
    font-weight: bold;
    font-style: normal;
    color: black;
    margin-bottom: 10px;
  }
  .login_container{
    display: flex;
    border-radius: 10px;
    flex-direction: column;
    height: auto;
    min-width: 200px;
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
    font-family: Code-New-Roman;
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
    font-family: Code-New-Roman;
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

  
  
</style>
