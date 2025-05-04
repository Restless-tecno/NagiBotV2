import { promises as fs } from 'fs';
import { hideIdInMessage, generateRandomValue, searchCharacter } from './gacha-search.js';

const charactersFilePath = '../src/database/characters.json';
const haremFilePath = '../src/database/harem.json';

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error('❀ Error al cargar personajes');
    }
}

async function loadHarem() {
    try {
        const data = await fs.readFile(haremFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

let handler = async (m, { conn, args }) => {
    if (!args.length) {
        return conn.reply(m.chat, '《✧》Usa: *#winfo <nombre>*', m);
    }

    const query = args.join(' ').toLowerCase();
    try {
        let characters = await loadCharacters();
        let character = characters.find(c => 
            c.name.toLowerCase().includes(query)
        );

        // Búsqueda online si no se encuentra localmente
        if (!character) {
            character = await searchCharacter(query);
            if (!character) {
                return conn.reply(m.chat, '《✧》Personaje no encontrado', m);
            }
            // Mostrar valor generado en la búsqueda
            character.value = String(generateRandomValue(character.name));
        }

        const harem = await loadHarem();
        const owner = harem.find(e => e.characterId === character.id);
        const status = owner ? `Reclamado por @${owner.userId.split('@')[0]}` : 'Libre';

        const infoMsg = `❀ Nombre » *${character.name}*
⚥ Género » *${character.gender}*
✰ Valor » *${character.value}*
♡ Estado » ${status}
❖ Fuente » *${character.source}*`;

        await conn.reply(m.chat, hideIdInMessage(infoMsg, character.id), m, {
            mentions: owner ? [owner.userId] : []
        });

    } catch (error) {
        await conn.reply(m.chat, `✘ Error: ${error.message}`, m);
    }
};

handler.help = ['winfo <nombre>'];
handler.tags = ['gacha'];
handler.command = ['winfo', 'waifuinfo'];
handler.group = true;
handler.register = true;

export default handler;
