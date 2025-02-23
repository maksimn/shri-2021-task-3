import { messageSetTheme, messageUpdate, XMessage } from './messages';

import {
    actionMessage,
    actionPrev,
    actionNext,
    actionRestart,
    actionSetTheme,
    actionUpdate,
} from './application/actions';
import { createState } from './application/state';
import { createCurrentDataSelector, createCurrentIndexSelector, createProgressSelector, createThemeSelector } from './application/selectors';
import { initIframe, initProgress, sendMessage, setElementTheme, setScale } from './application/view';

import './index.css';

import { stories } from './data';

const [dispatch, state$] = createState(stories);

function onMessage({ data }: MessageEvent<XMessage>) {
    switch (data.type) {
        case 'message@ACTION':
            dispatch(actionMessage(data.action, data.params));
            break;
        case 'message@SET_THEME':
            dispatch(actionSetTheme(data.theme));
            break;
        case 'message@UPDATE':
            dispatch(actionUpdate(data.data));
            break;
    }
}

const player = document.querySelector<HTMLDivElement>('.player');
const frames = stories.map(({ alias, data }) => initIframe(player, iframe => {
    iframe.contentWindow.addEventListener('message', onMessage);
    sendMessage(iframe, messageUpdate(alias, data));
}));

const progress = document.querySelector<HTMLDivElement>('.progress-container');
const bars = stories.map(() => initProgress(progress));

createProgressSelector(state$)
    .subscribe(({ index, value }) => setScale(bars[index], value));

createCurrentIndexSelector(state$)
    .subscribe(index => {
        player.style.transform = `translateX(-${index * 100}%)`;
        bars.forEach((el, i) => setScale(el, i < index ? 1 : 0));
    });

createCurrentDataSelector(state$)
    .subscribe(({ index, value: { alias, data } }) => {
        sendMessage(frames[index], messageUpdate(alias, data));
    });

createThemeSelector(state$)
    .subscribe(theme => {
        setElementTheme(document.body, theme);
        frames.forEach(iframe => sendMessage(iframe, messageSetTheme(theme)));
    })

document.querySelector<HTMLDivElement>('.set-light').addEventListener('click', () => dispatch(actionSetTheme('light')));
document.querySelector<HTMLDivElement>('.set-dark').addEventListener('click', () => dispatch(actionSetTheme('dark')));
document.querySelector<HTMLDivElement>('.prev').addEventListener('click', () => dispatch(actionPrev()));
document.querySelector<HTMLDivElement>('.next').addEventListener('click', () => dispatch(actionNext()));
document.querySelector<HTMLDivElement>('.restart').addEventListener('click', () => dispatch(actionRestart()));
