import axios from 'axios';
import { promises as fs } from 'fs';

// Archivos de base de datos
const haremFilePath = './src/database/harem.json';
const tempClaimPath = './src/database/tempClaim.json';
const cooldowns = {};

// Configuración de APIs
const ANILIST_API = 'https://graphql.anilist.co';
const IMAGE_API = 'https://api.waifu.im/search';

// Función para cargar el harem
async function loadHarem() {
    try {
        await fs.access(haremFilePath);
        const data = await fs.readFile(haremFilePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Función para guardar el harem
async function saveHarem(harem) {
    await fs.writeFile(haremFilePath, JSON.stringify(harem, null, 2));
}

// Función para cargar claims temporales
async function loadTempClaim() {
    try {
        await fs.access(tempClaimPath);
        const data = await fs.readFile(tempClaimPath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// Función para guardar claims temporales
async function saveTempClaim(tempClaim) {
    await fs.writeFile(tempClaimPath, JSON.stringify(tempClaim, null, 2));
}

// Obtener personaje aleatorio de AniList + Waifu.im
async function fetchRandomAnimeCharacter() {
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

        // Obtener imagen (con fallback a AniList)
        let imageUrl = character.image.large;
        try {
            const imgResponse = await axios.get(IMAGE_API, {
                params: { included_tags: character.name.full }
            });
            imageUrl = imgResponse.data.images?.[0]?.url || imageUrl;
        } catch {}

        return {
            id: character.id.toString(),
            name: character.name.full,
            gender: character.gender === 'Male' ? 'Hombre' : 'Mujer',
            source: character.media.nodes[0]?.title.romaji || 'Desconocido',
            img: [imageUrl],
            value: Math.floor(Math.random() * 9950) + 50
        };
    } catch (error) {
        console.error("Error al obtener personaje:", error);
        throw new Error("Error en la API. Intenta de nuevo.");
    }
}

// Handler principal
let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    // Cooldown de 15 minutos
    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remaining = Math.ceil((cooldowns[userId] - now) / 1000);
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        return conn.reply(m.chat, `⌛ Espera *${mins}m ${secs}s* para usar #rw de nuevo.`, m);
    }

    try {
        const [harem, tempClaim] = await Promise.all([loadHarem(), loadTempClaim()]);
        let character;
        let attempts = 0;

        // Buscar personaje no reclamado (máx. 5 intentos)
        while (attempts < 5) {
            character = await fetchRandomAnimeCharacter();
            const isClaimed = harem.some(entry => entry.characterId === character.id) || 
                             Object.values(tempClaim).some(c => c.id === character.id);
            if (!isClaimed) break;
            attempts++;
        }

        if (attempts >= 5) {
            return conn.reply(m.chat, "🔍 Demasiados intentos. Usa #rw otra vez.", m);
        }

        // Mensaje para reclamar
        const message = `🎌 *Personaje Disponible* 🎴\n\n` +
                       `🌸 *Nombre:* ${character.name}\n` +
                       `⚥ *Género:* ${character.gender}\n` +
                       `💎 *Valor:* ${character.value}\n` +
                       `📺 *Fuente:* ${character.source}\n\n` +
                       `⚠️ *Responde con* *#claim* *para reclamarlo.*`;

        // Guardar en tempClaim (válido por 2 minutos)
        tempClaim[userId] = {
            id: character.id,
            name: character.name,
            img: character.img[0],
            expires: now + 120000 // 2 minutos
        };
        await saveTempClaim(tempClaim);

        // Enviar imagen
        await conn.sendFile(m.chat, character.img[0], 'anime.jpg', message, m);
        cooldowns[userId] = now + 15 * 60 * 1000; // 15 min cooldown

    } catch (error) {
        console.error("Error en #rw:", error);
        conn.reply(m.chat, `❌ Error: ${error.message}`, m);
    }
};

handler.help = ['rw', 'rollwaifu'];
handler.tags = ['gacha'];
handler.command = ['rw', 'rollwaifu'];
export default handler;
