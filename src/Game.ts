import * as PIXI from 'pixi.js';
import { SplashScreen } from './SplashScreen';
import { MainMenu } from './MainMenu';
import { AboutScreen } from './AboutScreen';
import { BookController } from './BookController';
import { GlobalData } from './GlobalData';

type Screen = 'splash' | 'menu' | 'about' | 'book';

export class Game {
    stage: PIXI.Container;
    private forceRender: Function | null;
    private currentScreen: Screen = 'splash';

    /** Keep a reference to the active screen object for resize forwarding. */
    private activeBook: BookController | null = null;
    private activeMenu: MainMenu | null = null;

    constructor(stage: PIXI.Container, forceRenderFnc: Function | null = null) {
        this.stage = stage;
        this.forceRender = forceRenderFnc;
        this._showSplash();
    }

    // ─── Screen transitions ────────────────────────────────────────────────────

    private _showSplash(): void {
        this.currentScreen = 'splash';
        const splash = new SplashScreen(this.stage, () => this._showMenu());
        splash.load().then(() => this.forceRender?.());
    }

    private _showMenu(): void {
        this.currentScreen = 'menu';
        GlobalData.counter = 0; // reset to first page when returning to menu

        const menu = new MainMenu(
            this.stage,
            () => this._showBook(),
            () => this._showAbout(),
            (lang: string) => {
                GlobalData.currentLang = lang;
                menu.reload().then(() => this.forceRender?.());
            },
        );
        this.activeMenu = menu;
        menu.load().then(() => this.forceRender?.());
    }

    private _showAbout(): void {
        this.currentScreen = 'about';
        // Destroy the menu first so About can draw over a clean slate
        this.activeMenu?.destroy();
        this.activeMenu = null;

        const about = new AboutScreen(this.stage, () => {
            this._showMenu();
        });
        about.load().then(() => this.forceRender?.());
    }

    private _showBook(): void {
        this.currentScreen = 'book';
        this.activeMenu?.destroy();
        this.activeMenu = null;

        const book = new BookController(this.stage, () => {
            this.activeBook = null;
            this._showMenu();
        });
        this.activeBook = book;
        book.load().then(() => this.forceRender?.());
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
