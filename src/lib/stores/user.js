import {writable} from 'svelte/store';
import {supabase} from '../../supabase.js';
export const userEmail = writable('');
export const user = writable(null);
export const session = writable(null);

export async function initAuth(){
    const {data: {user: u}} = await supabase.auth.getUser();
    const {data: {session: s}} = await supabase.auth.getSession();

    user.set(u);
    session.set(s);

    if(s) supabase.realtime.setAuth(s.access_token);
}