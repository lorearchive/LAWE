<script lang="ts">
import * as NavigationMenu from "$lib/components/ui/navigation-menu/index.ts"
</script>

<NavigationMenu.Root class="h-16 w-full fixed left-6 text-sm z-40">
    <NavigationMenu.List>
        <span class="mr-3"><h1>The Lore Archive</h1></span>
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
    </NavigationMenu.List>
</NavigationMenu.Root>