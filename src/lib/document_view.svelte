<script>
	import { StarterKit } from '@tiptap/starter-kit';
	import { Editor, Extension} from '@tiptap/core';
    import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
    import Collaboration from '@tiptap/extension-collaboration';
    import * as Y from 'yjs';
    import * as awareness from 'y-protocols/awareness.js';
    import { Decoration, DecorationSet} from 'prosemirror-view';
    import {createLowlight} from 'lowlight';
    import {onMount, onDestroy} from "svelte";
    import {supabase} from "../supabase.js";
    import {loadDocument} from "../frontend";
    import { Link, Bold, SquareCode, List, TextQuote, Undo, Redo, Minus, ListOrdered, Highlighter, TabletSmartphone, TruckElectric} from '@lucide/svelte';
    import cpp from 'highlight.js/lib/languages/cpp';
    import html from 'highlight.js/lib/languages/xml';
    import { Diamonds } from 'svelte-loading-spinners';
    let {id, homeroom} = $props();
    let element = $state();
    let editorState = $state({editor: null});
    let debounceTimeout;
    let lowlight = createLowlight();
    let bootstrapped = $state(false);
    let loading = $state(true);
    let channel;
    const ydocument = new Y.Doc();
    const docAwareness = new awareness.Awareness(ydocument);
    let yUpdateHandler;
    let docUsers = new Map();
    lowlight.register("c++", cpp);
    lowlight.register("html", html);

    
    onMount(async() =>{
        const {data: {user}} = await supabase.auth.getUser();
        const current_server = id;
        async function collabSetup(){
            channel = supabase.channel(`document_${current_server}`, {
                config: {
                    presence: {
                        key: user.id,
                    },
                    broadcast: {
                        ack: false,
                        self: false,
                    }
                }
            })
            .on('presence', {event: 'sync'}, async () => {
                
            })
            .on('presence', {event: 'join'}, ({key, newPresences}) => {
                newPresences.forEach(presence => {
                    docUsers.set(key, presence.user);
                });
            })
            .on('presence', {event: 'leave'}, ({key, leftPresences}) => {
                leftPresences.forEach(presence => {
                    docUsers.delete(key);
                });
            })
            .on('broadcast', {event: 'yjs-update'}, ({payload}) =>{
                Y.applyUpdate(ydocument, new Uint8Array(payload), 'remote');
                if(!bootstrapped){
                    bootstrapped = true;
                }
            })
            .on('broadcast', {event: 'request-sync'}, async ({payload}) =>{
                const { requesterId } = payload;
                console.log("Received sync request from", requesterId);
                if (requesterId === user.id) return;
                const update = Y.encodeStateAsUpdate(ydocument);
                bootstrapped = true;
                await channel.send({
                    type: 'broadcast',
                    event: 'yjs-update',
                    payload: Array.from(update),
                });
            })
            .subscribe(async (status) =>{
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_name: user.user_metadata.display_name || 'Anonymous'
                    });
                    if (bootstrapped) return;
                    const state = channel.presenceState();

                    const othersPresent = Object.keys(state).filter(key => key !== user.id);
                    if (othersPresent.length === 0) {
                        const documentContent = await loadDocument(homeroom);
                        if(documentContent && documentContent.byteLength > 0){
                            Y.applyUpdate(ydocument, new Uint8Array(documentContent), 'remote');
                            bootstrapped = true;
                        }
                    } else {
                        await channel.send({
                            type: 'broadcast',
                            event: 'request-sync',
                            payload: {
                                requesterId: user.id,
                            }
                        });
                    }
                    loading = false;
                }
            });
            yUpdateHandler = (update, origin) => {
                if(origin === 'remote'){
                    return;
                }
                debounceSave();
                try{
                    channel?.send({
                        type: 'broadcast',
                        event: 'yjs-update',
                        payload: Array.from(update)
                    })  
                } catch (error){
                    console.error("Error sending yjs update", error);
                }
            }
            ydocument.on('update', (update, origin) => yUpdateHandler(update, origin));
        }
        await collabSetup();

        editorState.editor = new Editor({
            element,
            extensions: [StarterKit.configure({
                codeBlock: false,
                undoRedo: false
            }), 
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {
                    class: 'code-block-lowlight',
                },
                enableTabIndentation: true,
            }),
            Collaboration.configure({
                document: ydocument,
                field: 'prosemirror'
            }),
            ],
            content: null,
            onSelectionUpdate: () =>{
                const sel = editorState.editor.state.selection;
                docAwareness.setLocalState({
                    user: {
                        user_name: user.user_metadata.display_name || 'Anonymous',
                    },
                    selection: {
                        anchor: sel.anchor,
                        head: sel.head
                    }
                })
            }
        });
    })



    onDestroy( async () =>{
        debounceTimeout = null;
        if(channel){
            channel.unsubscribe();
            channel = null;
        }
        editorState.editor?.destroy();
        editorState.editor = null;
        if(ydocument){
            ydocument.off('update', yUpdateHandler);
            ydocument.destroy();
        }
        docAwareness?.setLocalState(null);
        docAwareness?.destroy();
    })


    function debounceSave(){
        clearTimeout(debounceTimeout);
        try{
            debounceTimeout = setTimeout(async () =>{
                saveDocument()
                console.log("Document saved");
            }, 500);
        } catch (error){
            console.error("Error in debounce save", error);
        }
    }``

    function saveDocument(){
        if(!editorState.editor) return;
        try{
            const update = Y.encodeStateAsUpdate(ydocument);
            fetch(`/api/save-document?channel_id=${encodeURIComponent(homeroom)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/octet-stream',
                },
                //@ts-ignore
                body: update.buffer,
            });
        } catch (error){
            console.error("Error saving document", error);
        };
    }

</script>



<main>
    {#if loading}
        <div style="display:flex; justify-content:center; align-items:center; height:100%; width:100%;">
            <Diamonds size={80} color="#000000" />
        </div>
    {/if}
    <div class="doc_container">
        {#if editorState.editor}
            <div class="doc_menu">
                <button onclick={()=>{editorState.editor.chain().focus().toggleBold().run()}}
                disabled={!editorState.editor.can().chain().focus().toggleBold().run()}
                class={editorState.editor.isActive("bold") ? "is-active" : "editor_btn"}><Bold size=18px/></button>
                <button onclick={()=>{editorState.editor.chain().focus().toggleCodeBlock().run()}}
                class={editorState.editor.isActive("codeBlockLowlight") ? "is-active" : "editor_btn"}><SquareCode size=18px/></button>
                <button onclick={()=>{editorState.editor.chain().focus().toggleBlockquote().run()}}
                class={editorState.editor.isActive("blockquote") ? "is-active" : "editor_btn"}><TextQuote size=18px/></button>
                <button onclick={()=>{editorState.editor.chain().focus().toggleBulletList().run()}}
                class={editorState.editor.isActive("bulletList") ? "is-active" : "editor_btn"}><List size=18px/></button>
                <button onclick={()=>{editorState.editor.chain().focus().toggleOrderedList().run()}}
                class={editorState.editor.isActive("orderedList") ? "is-active" : "editor_btn"}><ListOrdered size=18px/></button>
                <button onclick={()=>{editorState.editor.chain().focus().setHorizontalRule().run()}}
                class="editor_btn"><Minus size=18px/></button>
            </div>
        {/if}
        <div bind:this={element} class="editor"></div>
    </div>
</main>


<style>
    main{
        width: 100%;
        padding-top: 20px;
    }
    .doc_container{
        width: 60%;
        height: 95%;
        border-radius: 16px;
        flex-direction: column;
        border: 1px solid #0000002b;
        margin: auto;
        display: flex;
        overflow: hidden;
    }

    .doc_menu{
        min-height: 45px;
        width: 100%;
        display: flex;
        gap: 5px;
        padding: 7px;
        box-sizing: border-box;
        border-bottom: 1px solid #0000002b;
        justify-content: center;
        overflow-x: auto;
        flex-shrink: 0;
    }

    .editor{
        height: 100%;
        width: 100%;
        color: black;
        box-sizing: border-box;
        display: flex;
        align-items: flex-start;
    }


    .editor :global(.ProseMirror){
        height: 100%;
        width: 100%;
        overflow-wrap: break-word;
        word-break: break-word;
        white-space: pre-wrap;
        outline: none;
        padding: 15px;
        box-sizing: border-box;
        font-size: 16px;
        text-align: left;
        line-height: 1.25;
        overflow-y: scroll;
        padding-bottom: 250px;
        font-family: OfficeCodePro;
    }

    .editor :global(.ProseMirror)::-webkit-scrollbar {
        display: none;
    }


    .editor :global(pre){
        background: black;
        padding: 12px;
        border-radius: 6px;
        overflow-x: scroll;
    }

    .editor :global(code){
        font-size: 14px;
        color: white;
        background-color: rgb(17, 17, 17);
        padding: 2px 4px;
        border-radius: 4px;
        width: 100%;
        font-family: Menlo, Monaco, Consolas, monospace;
        overflow-x: scroll;
    }

    .editor :global(blockquote){
        border-left: 4px solid #0000002b;
        margin-left: 0;
        margin-right: 0;
        padding-left: 16px;
    }

    .editor_btn{
        position: relative;
        vertical-align: middle;
        justify-content: center;
        font-size: 5px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 5px 5px 5px 5px;
        background-color: transparent;
        color: black;
        outline: none;
        transition: all 0.3s ease;
    }
    .editor_btn:hover{
        background-color: rgba(0, 0, 0, 0.361);
        outline: none;
    }
    


    :global(.hljs-comment, .hljs-quote){
        color: #048700;
    }

    :global(.hljs-variable, .hljs-template-variable, .hljs-attribute,
    .hljs-tag, .hljs-regexp, .hljs-link, .hljs-name, .hljs-selector-id,.hljs-class){
        color: rgb(255, 94, 94)
    }

    :global(.hljs-number, .hljs-meta, .hljs-built_in, .hljs-builtin-name,
    .hljs-literal, .hljs-type, .hljs-params){
        color: #fbbc88;
    }

    :global(.hljs-string, .hljs-symbol, .hljs-bullet){
        color: #b9f18d;
    }

    :global(.hljs-title, .hljs-section){
        color: #63ff52;
    }

    :global(.hljs-keyword, .hljs-selector-tag){
        color: #70cff8;
    }

    :global(.hljs-emphasis){
        font-style: italic;
    }



</style>