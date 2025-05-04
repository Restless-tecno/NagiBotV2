import { promises as fs } from 'fs';
import { hideIdInMessage, generateRandomValue, searchCharacter } from './gacha-search.js';

const charactersFilePath = '../src/database/characters.json';

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error('❀ Error al cargar personajes');
    }
}

let handler = async (m, { conn, args }) => {
    if (!args.length) {
        return conn.reply(m.chat, '《✧》Usa: *#wvideo <nombre>*', m);
    }

    const query = args.join(' ').toLowerCase();
    try {
        let characters = await loadCharacters();
        let character = characters.find(c => 
            c.name.toLowerCase().includes(query)
        );

        if (!character) {
            character = await searchCharacter(query);
            if (!character) {
                return conn.reply(m.chat, '《✧》Personaje no encontrado', m);
            }
        }

        const randomVideo = character.vid[Math.floor(Math.random() * character.vid.length)];
        const value = character.value || String(generateRandomValue(character.name));

        const infoMsg = `❀ Nombre » *${character.name}*
⚥ Género » *${character.gender}*
✰ Valor » *${value}*
❖ Fuente » *${character.source}*`;

        await conn.sendFile(m.chat, randomVideo, 'character.mp4', hideIdInMessage(infoMsg, character.id), m);

    } catch (error) {
        await conn.reply(m.chat, `✘ Error: ${error.message}`, m);
    }
};

handler.help = ['wvideo <nombre>'];
handler.tags = ['gacha'];
handler.command = ['wvideo', 'waifuvideo'];
handler.group = true;
handler.register = true;

export default handler;
