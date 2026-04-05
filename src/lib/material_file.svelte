<script>
    import {onDestroy, onMount} from "svelte";
    let {api_path} = $props();
    let blob = $state(null);
    let objectUrl = $state("");
    let contentType = $state("");

    $effect(() => {
        if(!api_path) return;
        async function fetchFile(){
            try{
                const response = await fetch(api_path);
                if(!response.ok){
                    console.error("Failed to fetch file:", response.statusText);
                    return;
                }
                const dataBlob = await response.blob();
                blob = dataBlob;
                contentType = dataBlob.type;
                if(objectUrl){
                    URL.revokeObjectURL(objectUrl);
                }
                objectUrl = URL.createObjectURL(dataBlob);
            } catch (error){
                console.error("Error fetching file:", error);
            }
        }
        fetchFile();
    });

    onDestroy(()=>{
        if(objectUrl){
            URL.revokeObjectURL(objectUrl);
        }
    });
</script>

<main>
    {#if blob && contentType?.startsWith("image/")}
        <img src={objectUrl} alt="Material" style="max-width: 100%; max-height: 100%; object-fit:contain; overflow:auto;"/>
    {:else if blob && contentType === "application/pdf"}
       <iframe loading="eager" title="PDF Viewer" src={objectUrl} style="flex: 1; width: 100%; height: 100%; overflow:auto;"></iframe>
    {/if}
</main>


<style>
    main{
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        overflow: auto;
    }
</style>
