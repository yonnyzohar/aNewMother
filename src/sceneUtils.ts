import * as PIXI from 'pixi.js';
import { ZScene } from 'zimporter-pixi';

/**
 * Safely destroys a ZScene, suppressing the `t.parse is not a function` error
 * that occurs when the scene was loaded with individual images rather than a
 * sprite-sheet atlas (ZScene.js calls spritesheet.parse() unconditionally).
 */
export async function safeDestroyScene(scene: ZScene): Promise<void> {
    try {
        await scene.destroy();
    } catch (e) {
        // Non-critical: happens for image-based scenes that have no spritesheet.
        // PIXI still frees the textures in the destroy loop before the parse call.
    }
}

/**
 * For image-based scenes (atlas:false), ZScene registers each image under a
 * short alias like "BodyMC1" — with no path prefix.  Different pages often
 * share the same alias names, so PIXI returns the cached texture from a
 * previous page instead of loading the new one.
 *
 * This function reads the placements.json for a given asset folder, collects
 * every image alias that ZScene would have registered, and unloads them all
 * from PIXI.Assets so the next scene gets a fresh load.
 *
 * Call this BEFORE loading the next page, passing the BASE PATH of the scene
 * that is about to be replaced.
 */
export async function unloadSceneImages(assetBasePath: string): Promise<void> {
    try {
        const placementsUrl = assetBasePath + 'placements.json';
        const res = await fetch(placementsUrl);
        if (!res.ok) return;
        const data = await res.json() as { atlas?: boolean; templates?: Record<string, { children?: Array<{ type: string; name: string; filePath?: string }> }> };

        // Only image-based scenes (atlas === false) use named aliases
        if (data.atlas !== false) return;

        const templates = data.templates ?? {};
        const seen = new Set<string>();

        // Access PIXI resolver internals so we can remove alias→URL mappings.
        // Assets.unload() only decrements ref-counts / clears the texture cache;
        // it does NOT remove the entry from resolver._assetMap.  That means the
        // next Assets.load(sameAlias) resolves to the OLD page's URL and loads
        // stale content.  Deleting the entry here forces the resolver to accept
        // the freshly-registered alias from the new page's ZScene.load().
        const resolver = (PIXI.Assets as any).resolver as
            { _assetMap?: Record<string, unknown>; _resolverHash?: Record<string, unknown> };

        for (const tmpl of Object.values(templates)) {
            for (const child of (tmpl.children ?? [])) {
                if (child.type === 'img' || child.type === '9slice') {
                    let alias = child.name;
                    if (alias.endsWith('_9S')) alias = alias.slice(0, -3);
                    if (alias.endsWith('_IMG')) alias = alias.slice(0, -4);
                    if (!seen.has(alias)) {
                        seen.add(alias);
                        try {
                            await PIXI.Assets.unload(alias);
                        } catch (_) {
                            // alias may not have been cached — that's fine
                        }
                        // Remove alias from resolver so next load uses new URL
                        if (resolver._assetMap) delete resolver._assetMap[alias];
                        if (resolver._resolverHash) delete resolver._resolverHash[alias];
                    }
                }
            }
        }
    } catch (_) {
        // Non-fatal: if fetch fails, we just won't unload
    }
}
