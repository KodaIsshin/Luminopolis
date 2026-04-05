<script lang="ts">
    import {Router, type RouteConfig} from "@mateothegreat/svelte5-router";
    import LogIn from "./routes/LogIn.svelte";
    import CreateAccount from "./routes/create_account.svelte";
    import Notfound from "./routes/notfound.svelte";
    import EmailVerify from "./routes/email_verify.svelte";
    import Home from "./routes/home.svelte";
    import InvitePage from "./routes/invite_page.svelte";

    const routes: RouteConfig[] = [
        {
            path: "/",
            component: LogIn
        },
        {
            path: "/create_account",
            component: CreateAccount
        },
        {
            path: "/not_found",
            component: Notfound
        },
        {
            path: "/email_verify",
            component: EmailVerify
        },
        {
            path: "/home",
            component: Home
        },
        {
            path: "/invite/(?<invite_id>.*)",
            component: InvitePage
        }
    ]

</script>

<Router {routes}/>