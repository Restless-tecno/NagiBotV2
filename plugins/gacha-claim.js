import { promises as fs } from 'fs';
import { extractHiddenId } from './gacha-search.js';

const charactersFilePath = '../src/database/characters.json';
const haremFilePath = '../src/database/harem.json';

const cooldowns = {};

async function loadCharacters() {
    try {
        const data = await fs.readFile(charactersFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error('❀ Error al cargar personajes');
    }
}

async function saveCharacters(characters) {
    try {
        await fs.writeFile(charactersFilePath, JSON.stringify(characters, null, 2));
    } catch (error) {
        throw new Error('❀ Error al guardar personajes');
    }
}

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remaining = Math.ceil((cooldowns[userId] - now) / 1000);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        return conn.reply(m.chat, `《✧》Espera *${minutes}m ${seconds}s* para reclamar`, m);
    }

    if (m.quoted?.sender === conn.user.jid) {
        try {
            const characters = await loadCharacters();
            const characterId = extractHiddenId(m.quoted.text);

            if (!characterId) {
                return conn.reply(m.chat, '《✧》Personaje no reconocido', m);
            }

            const character = characters.find(c => c.id === characterId);
            if (!character) {
                return conn.reply(m.chat, '《✧》Personaje no válido', m);
            }

            if (character.user && character.user !== userId) {
                return conn.reply(m.chat, 
                    `《✧》Ya reclamado por @${character.user.split('@')[0]}`,
                    m, { mentions: [character.user] }
                );
            }

            character.user = userId;
            character.status = "Reclamado";
            await saveCharacters(characters);
            
            await conn.reply(m.chat, `✦ Reclamaste a *${character.name}*`, m);
            cooldowns[userId] = now + 30 * 60 * 1000;

        } catch (error) {
            await conn.reply(m.chat, `✘ Error: ${error.message}`, m);
        }
    } else {
        await conn.reply(m.chat, '《✧》Responde a un personaje válido', m);
    }
};

handler.help = ['claim'];
handler.tags = ['gacha'];
handler.command = ['c', 'claim', 'reclamar'];
handler.group = true;
handler.register = true;

export default handler;
