import * as PIXI from 'pixi.js';
import { ZScene, ZSceneStack } from 'zimporter-pixi';
import { SplashScreen } from './SplashScreen';
import { MainMenu } from './MainMenu';
import { AboutScreen } from './AboutScreen';
import { BookController } from './BookController';
import { GlobalData } from './GlobalData';
import { Preloader } from './Preloader';

type Screen = 'splash' | 'menu' | 'about' | 'book';

export class Game {
    stage: PIXI.Container;
    private forceRender: Function | null;
    private currentScreen: Screen = 'splash';

    /** Keep a reference to the active screen object for resize forwarding. */
    private activeBook: BookController | null = null;
    private activeMenu: MainMenu | null = null;

    /** Pending background preload of the Block frame scene. */
    private _blockPreload: Promise<ZScene> | null = null;

    constructor(stage: PIXI.Container, forceRenderFnc: Function | null = null) {
        this.stage = stage;
        this.forceRender = forceRenderFnc;
        this._showSplash();
    }

    // ─── Screen transitions ────────────────────────────────────────────────────

    private async _showSplash(): Promise<void> {
        this.currentScreen = 'splash';

        // Splash onComplete fires after 2 s; we use it to begin loading the menu
        // while the splash is still visible.
        const splash = new SplashScreen(this.stage, () => this._splashToMenu(splash));
        await splash.load();

        this.forceRender?.();
    }

    /** Called by SplashScreen after its 2-second hold. Loads menu, then removes splash. */
    private async _splashToMenu(splash: SplashScreen): Promise<void> {
        const menu = this._buildMenu();
        await menu.load(); // menu is added to stage (on top of splash)

        splash.destroy(); // splash is now hidden behind menu — safe to destroy
        this.currentScreen = 'menu';
        this.activeMenu = menu;
        this._blockPreload = BookController.preloadBlockScene();
        this.forceRender?.();
    }

    /** Constructs a MainMenu wired to this Game's callbacks. */
    private _buildMenu(): MainMenu {
        GlobalData.counter = 0;
        let menu!: MainMenu;
        menu = new MainMenu(
            this.stage,
            () => this._showBook(),
            () => this._showAbout(),
            (lang: string) => {
                GlobalData.currentLang = lang;
                menu.reload().then(() => this.forceRender?.());
            },
        );
        return menu;
    }

    /** Loads a fresh menu. Called when returning from About or Book. */
    private async _showMenu(): Promise<void> {
        this.currentScreen = 'menu';

        const menu = this._buildMenu();
        await menu.load();

        this.activeMenu = menu;
        this._blockPreload = BookController.preloadBlockScene();
        this.forceRender?.();
    }

    private async _showAbout(): Promise<void> {
        this.currentScreen = 'about';
        const menuToDestroy = this.activeMenu;
        this.activeMenu = null;

        // Show preloader on top of the menu — disables all menu buttons.
        const preloader = new Preloader(this.stage);
        preloader.show();

        // Pop the menu from the resize stack before About pushes itself on top.
        ZSceneStack.pop();

        const about = new AboutScreen(this.stage, () => this._showMenu());
        await about.load(); // about is added to stage on top of menu + preloader

        menuToDestroy?.destroy(); // menu is hidden behind about — safe to destroy
        preloader.hide();
        this.forceRender?.();
    }

    private async _showBook(): Promise<void> {
        this.currentScreen = 'book';
        const menuToDestroy = this.activeMenu;
        this.activeMenu = null;

        // Await the background preload (instant if it already finished).
        const preloadedScene = this._blockPreload ? await this._blockPreload : undefined;
        this._blockPreload = null;

        const book = new BookController(this.stage, () => {
            this.activeBook = null;
            this._showMenu();
        });
        this.activeBook = book;
        // book.load() keeps everything offscreen until the first page is ready,
        // so the menu stays fully visible throughout.
        await book.load(preloadedScene);

        // Book is fully ready — now pop the menu and swap.
        ZSceneStack.pop();
        menuToDestroy?.destroy();
        this.forceRender?.();
    }

    // ─── Called by app.ts ticker ───────────────────────────────────────────────

    update(_deltaMS: number): void {
        // Per-frame logic goes here if needed
    }

    /** Called by app.ts when the window resizes. */
    resize(W: number, H: number): void {
        this.activeBook?.resize(W, H);
    }
}
