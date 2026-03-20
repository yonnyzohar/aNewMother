import { GlobalData } from './GlobalData';
import { SlideObj } from './SlideObj';

export class StoryLoader {

    /** Load story data and labels for the given language ("eng" or "heb"). */
    static async load(lang: string): Promise<void> {
        GlobalData.currentLang = lang;
        const base = GlobalData.getLangPath();

        await Promise.all([
            StoryLoader.loadStory(`${base}story.xml`),
            StoryLoader.loadLabels(`${base}lables.xml`),
        ]);
    }

    /**
     * Parse an XML string tolerantly: the story XMLs use an unquoted
     * `<?xml version=1.0 ...?>` declaration which is invalid XML; using
     * 'text/html' lets the browser's lenient HTML parser handle it and all
     * tag names are already lowercase so no normalisation is needed.
     */
    private static parseXML(text: string): Document {
        return new DOMParser().parseFromString(text, 'text/html');
    }

    private static async loadStory(url: string): Promise<void> {
        const text = await StoryLoader.fetchText(url);
        if (!text) return;

        const doc = StoryLoader.parseXML(text);
        GlobalData.pages = [];

        const items = doc.querySelectorAll('item');
        items.forEach((item, index) => {
            // Item at index 0 is a jpg title card with no pages/ folder — skip it.
            if (index === 0) return;

            const slide = new SlideObj();
            slide.pageNum = index; // pages/<index>/ folder exists for 1-27
            const rawSound = item.querySelector('sound')?.textContent?.trim() ?? '';
            slide.sound = rawSound.split('/').pop() ?? '';
            slide.caption = item.querySelector('caption')?.textContent?.trim() ?? '';
            GlobalData.pages.push(slide);
        });

        console.log(`StoryLoader: loaded ${GlobalData.pages.length} pages`);
    }

    private static async loadLabels(url: string): Promise<void> {
        const text = await StoryLoader.fetchText(url);
        if (!text) return;

        const doc = StoryLoader.parseXML(text);
        GlobalData.labels = {};

        const item = doc.querySelector('item');
        if (item) {
            for (const child of Array.from(item.children)) {
                GlobalData.labels[child.tagName] = child.textContent?.trim() ?? '';
            }
        }
    }

    private static async fetchText(url: string): Promise<string> {
        try {
            const res = await fetch(url);
            return await res.text();
        } catch (e) {
            console.warn(`StoryLoader: failed to fetch ${url}`, e);
            return '';
        }
    }
}
