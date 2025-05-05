import axios from 'axios';
import { promises as fs } from 'fs';

const DB_PATH = './src/database/';
const cooldowns = {};

// Configuración de APIs
const ANILIST_API = 'https://graphql.anilist.co';
const IMAGE_API = 'https://api.waifu.im/search';

async function fetchRandomCharacter() {
    try {
        const randomPage = Math.floor(Math.random() * 500);
        const response = await axios.post(ANILIST_API, {
            query: `query {
                Page(page: ${randomPage}, perPage: 1) {
                    characters(sort: FAVOURITES_DESC) {
                        id
                        name { full }
                        gender
                        media { nodes { title { romaji } } }
                        image { large }
                    }
                }
            }`
        });

        const character = response.data?.data?.Page?.characters?.[0];
        if (!character) throw new Error("No se encontró personaje");

        // Obtener imagen
        let imageUrl = character.image.large;
        try {
            const imgRes = await axios.get(IMAGE_API, {
                params: { included_tags: character.name.full }
            });
            imageUrl = imgRes.data.images?.[0]?.url || imageUrl;
        } catch {}

        return {
            id: character.id.toString(),
            name: character.name.full,
            gender: character.gender === 'Male' ? 'Hombre' : 'Mujer',
            source: character.media.nodes[0]?.title.romaji || 'Desconocido',
            img: imageUrl,
            value: Math.floor(Math.random() * 9500) + 500
        };
    } catch (error) {
        console.error("Error al obtener personaje:", error);
        throw new Error("Error en la API. Intenta de nuevo.");
    }
}

async function saveTempClaim(data) {
    await fs.writeFile(`${DB_PATH}tempClaim.json`, JSON.stringify(data, null, 2));
}

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    // Cooldown de 15 minutos
    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remaining = Math.ceil((cooldowns[userId] - now) / 1000);
        return conn.reply(m.chat, `⏳ Espera *${Math.floor(remaining / 60)}m ${remaining % 60}s* para usar #rw de nuevo.`, m);
    }

    try {
        const character = await fetchRandomCharacter();
        await saveTempClaim({ [userId]: { ...character, expires: now + 120000 } });
        cooldowns[userId] = now + 15 * 60 * 1000;

        await conn.sendFile(
            m.chat, 
            character.img, 
            'anime.jpg', 
            `🎴 *${character.name}*\n` +
            `⚥ ${character.gender} | 💎 ${character.value}\n` +
            `📺 ${character.source}\n\n` +
            `⚠️ Responde con *${handler.prefix}claim* para reclamar\n` +
            `⏳ Válido por 2 minutos`, 
            m
        );

    } catch (error) {
        conn.reply(m.chat, `❌ Error: ${error.message}`, m);
    }
};

handler.help = ['rw'];
handler.tags = ['gacha'];
handler.command = ['rw', 'rollwaifu'];
handler.prefix = '#';
export default handler;
