import { promises as fs } from 'fs';
import { hideIdInMessage, generateRandomValue } from './gacha-search.js';

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

async function loadHarem() {
    try {
        const data = await fs.readFile(haremFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function saveHarem(harem) {
    try {
        await fs.writeFile(haremFilePath, JSON.stringify(harem, null, 2));
    } catch (error) {
        throw new Error('❀ Error al guardar harem');
    }
}

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remaining = Math.ceil((cooldowns[userId] - now) / 1000);
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        return conn.reply(m.chat, `《✧》Espera *${minutes}m ${seconds}s* para usar *#rw*`, m);
    }

    try {
        const characters = await loadCharacters();
        const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
        const randomImage = randomCharacter.img[Math.floor(Math.random() * randomCharacter.img.length)];

        // Asignar nuevo valor aleatorio
        randomCharacter.value = String(generateRandomValue(randomCharacter.name));

        const harem = await loadHarem();
        const userEntry = harem.find(entry => entry.characterId === randomCharacter.id);
        const status = randomCharacter.user ? `Reclamado por @${randomCharacter.user.split('@')[0]}` : 'Libre';

        const baseMsg = `❀ Nombre » *${randomCharacter.name}*
⚥ Género » *${randomCharacter.gender}*
✰ Valor » *${randomCharacter.value}*
♡ Estado » ${status}
❖ Fuente » *${randomCharacter.source}*`;

        await conn.sendFile(m.chat, randomImage, 'character.jpg', hideIdInMessage(baseMsg, randomCharacter.id), m, {
            mentions: userEntry ? [userEntry.userId] : []
        });

        if (!randomCharacter.user) {
            harem.push({
                userId,
                characterId: randomCharacter.id,
                lastVoteTime: now,
                voteCooldown: now + 1.5 * 60 * 60 * 1000
            });
            await saveHarem(harem);
        }

        await saveCharacters(characters);
        cooldowns[userId] = now + 15 * 60 * 1000;

    } catch (error) {
        await conn.reply(m.chat, `✘ Error: ${error.message}`, m);
    }
};

handler.help = ['rw', 'rollwaifu'];
handler.tags = ['gacha'];
handler.command = ['rw', 'rollwaifu'];
handler.group = true;
handler.register = true;

export default handler;
