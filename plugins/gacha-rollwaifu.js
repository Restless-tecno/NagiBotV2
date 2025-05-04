import { promises as fs } from 'fs';
import axios from 'axios';

const haremFilePath = './src/database/harem.json';
const cooldowns = {};

// Lista de APIs para obtener personajes aleatorios
const CHARACTER_APIS = [
    {
        name: 'Waifu.im',
        url: 'https://api.waifu.im/random',
        parser: (data) => ({
            id: data.images[0].image_id.toString(),
            name: data.images[0].character || 'Desconocido',
            gender: data.images[0].gender || 'Desconocido',
            source: data.images[0].source || 'Desconocido',
            img: [data.images[0].url],
            value: Math.floor(Math.random() * (10000 - 50 + 1)) + 50
        })
    },
    {
        name: 'Animechan',
        url: 'https://animechan.xyz/api/random',
        parser: (data) => ({
            id: `animechan-${Date.now()}`,
            name: data.character,
            gender: 'Desconocido',
            source: data.anime,
            img: [`https://api.waifu.pics/sfw/${Math.random() > 0.5 ? 'waifu' : 'husbando'}`],
            value: Math.floor(Math.random() * (5000 - 50 + 1)) + 50
        })
    },
    {
        name: 'Waifu.pics',
        url: 'https://api.waifu.pics/sfw/waifu',
        parser: (data) => ({
            id: `waifupics-${Date.now()}`,
            name: 'Waifu Aleatoria',
            gender: 'Femenino',
            source: 'Desconocido',
            img: [data.url],
            value: Math.floor(Math.random() * (8000 - 50 + 1)) + 50
        })
    }
];

// Función para obtener un personaje aleatorio
async function getRandomCharacter() {
    try {
        // Seleccionar una API aleatoria
        const api = CHARACTER_APIS[Math.floor(Math.random() * CHARACTER_APIS.length)];
        const response = await axios.get(api.url);
        
        // Parsear los datos según la API
        const character = api.parser(response.data);
        character.user = null; // Asegurar que no tenga dueño inicialmente
        
        return character;
        
    } catch (error) {
        console.error('Error al obtener personaje:', error);
        // Datos de respaldo si fallan todas las APIs
        return {
            id: `fallback-${Date.now()}`,
            name: ['Sakura', 'Naruto', 'Goku', 'Hinata', 'Sasuke'][Math.floor(Math.random() * 5)],
            gender: ['Femenino', 'Masculino'][Math.floor(Math.random() * 2)],
            source: ['Naruto', 'Dragon Ball', 'One Piece', 'Bleach', 'Attack on Titan'][Math.floor(Math.random() * 5)],
            img: ['https://i.imgur.com/undefined.jpg'],
            value: Math.floor(Math.random() * (10000 - 50 + 1)) + 50,
            user: null
        };
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
        await fs.writeFile(haremFilePath, JSON.stringify(harem, null, 2), 'utf-8');
    } catch (error) {
        throw new Error('❀ No se pudo guardar el archivo harem.json.');
    }
}

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remainingTime = Math.ceil((cooldowns[userId] - now) / 1000);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        return await conn.reply(m.chat, `《✧》Debes esperar *${minutes} minutos y ${seconds} segundos* para usar *#rw* de nuevo.`, m);
    }

    try {
        const harem = await loadHarem();
        let randomCharacter;
        let attempts = 0;
        const maxAttempts = 5;

        // Buscar un personaje no reclamado
        do {
            randomCharacter = await getRandomCharacter();
            attempts++;
            
            // Verificar si el personaje ya está reclamado
            const isClaimed = harem.some(entry => entry.characterId === randomCharacter.id);
            if (!isClaimed || attempts >= maxAttempts) break;
            
        } while (true);

        const randomImage = randomCharacter.img[0];
        const userEntry = harem.find(entry => entry.characterId === randomCharacter.id);
        const statusMessage = userEntry 
            ? `Reclamado por @${userEntry.userId.split('@')[0]}` 
            : 'Libre';

        const message = `❀ Nombre » *${randomCharacter.name}*
⚥ Género » *${randomCharacter.gender}*
✰ Valor » *${randomCharacter.value}*
♡ Estado » ${statusMessage}
❖ Fuente » *${randomCharacter.source}*`;

        const mentions = userEntry ? [userEntry.userId] : [];
        await conn.sendFile(m.chat, randomImage, `${randomCharacter.name}.jpg`, message, m, { mentions });

        if (!userEntry) {
            const newEntry = {
                userId: userId,
                characterId: randomCharacter.id,
                lastVoteTime: now,
                voteCooldown: now + 1.5 * 60 * 60 * 1000
            };
            harem.push(newEntry);
            await saveHarem(harem);
        }

        cooldowns[userId] = now + 15 * 60 * 1000;

    } catch (error) {
        console.error('Error en el handler:', error);
        await conn.reply(m.chat, `✘ Error al cargar el personaje: ${error.message}`, m);
    }
};

handler.help = ['ver', 'rw', 'rollwaifu'];
handler.tags = ['gacha'];
handler.command = ['ver', 'rw', 'rollwaifu'];
handler.group = true;
handler.register = true;

export default handler;
