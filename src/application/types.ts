export const INTERVAL = 100;
export const DELAY = 7000;

export interface Slide {
    alias: string;
    data: object;
}

export type SlideTheme = 'light' | 'dark';

export interface State {
    theme: SlideTheme;
    stories: Slide[];
    index: number;
    progress: number;
    pause: boolean;
}
