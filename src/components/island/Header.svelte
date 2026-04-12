<script  lang="ts">
import * as NavigationMenu from "$lib/components/ui/navigation-menu/index.ts"
let { session } = $props()


</script>

<NavigationMenu.Root class="h-16 w-full fixed left-6 text-sm z-40">
    <NavigationMenu.List>
        <span class="mr-3"><a href="/wiki/home"><h1>The Lore Archive</h1></a></span>
        <NavigationMenu.Item>
            <NavigationMenu.Link href="/about" class="a-no-style ">
                About
            </NavigationMenu.Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
            <NavigationMenu.Link href="/donate" class="a-no-style ">
                Donate
            </NavigationMenu.Link>
        </NavigationMenu.Item>


        <NavigationMenu.Item>
            {#if !session}
                <NavigationMenu.Link href="/signin" class="a-no-style ">
                    Sign in
                </NavigationMenu.Link>
            {:else}
                <NavigationMenu.Link href="/admin/account" class="a-no-style ">
                    Account
                </NavigationMenu.Link>
            {/if}
            
        </NavigationMenu.Item>
    </NavigationMenu.List>
</NavigationMenu.Root>