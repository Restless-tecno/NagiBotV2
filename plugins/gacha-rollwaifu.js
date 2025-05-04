import axios from 'axios';
import { promises as fs } from 'fs';

const haremFilePath = './src/database/harem.json';
const cooldowns = {};

// 1. Configuración de APIs
const ANILIST_API = 'https://graphql.anilist.co';
const IMAGE_API = 'https://api.waifu.im/search'; // Alternativa: 'https://danbooru.donmai.us/posts.json'

// 2. Función para cargar el harem
async function loadHarem() {
    try {
        await fs.access(haremFilePath);
        const data = await fs.readFile(haremFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Si el archivo no existe, retornar array vacío
        return [];
    }
}

// 3. Función para guardar el harem
async function saveHarem(harem) {
    try {
        await fs.writeFile(haremFilePath, JSON.stringify(harem, null, 2));
    } catch (error) {
        console.error("Error al guardar harem:", error);
        throw new Error("No se pudo guardar la información del harem");
    }
}

// 4. Consulta GraphQL optimizada para personajes aleatorios
const getRandomCharacterQuery = (page) => `
  query {
    Page(page: ${page}, perPage: 1) {
      characters(sort: FAVOURITES_DESC) {
        id
        name { full }
        gender
        media {
          nodes {
            title { romaji }
          }
        }
        image { large }
      }
    }
  }
`;

// 5. Función principal para obtener personajes
async function fetchRandomAnimeCharacter() {
    try {
        const randomPage = Math.floor(Math.random() * 500); // Amplio rango para más variedad
        const response = await axios.post(ANILIST_API, {
            query: getRandomCharacterQuery(randomPage)
        });

        const character = response.data?.data?.Page?.characters?.[0];
        if (!character) throw new Error("Personaje no encontrado");

        // Obtener imagen (con fallbacks)
        let imageUrl = character.image.large;
        try {
            const imgResponse = await axios.get(IMAGE_API, {
                params: {
                    included_tags: character.name.full,
                    many: 'true'
                }
            });
            imageUrl = imgResponse.data.images?.[0]?.url || imageUrl;
        } catch (imgError) {
            console.log("Usando imagen de AniList como fallback");
        }

        return {
            id: character.id.toString(),
            name: character.name.full,
            gender: character.gender === 'Male' ? 'Hombre' : 'Mujer',
            source: character.media.nodes[0]?.title.romaji || 'Desconocido',
            img: [imageUrl],
            user: null,
            value: Math.floor(Math.random() * 9950) + 50 // Valor aleatorio aquí
        };
    } catch (error) {
        console.error("Error en fetchRandomAnimeCharacter:", error);
        throw new Error("Error al obtener personaje aleatorio");
    }
}

// 6. Handler principal
let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    // Sistema de cooldown
    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remaining = Math.ceil((cooldowns[userId] - now) / 1000);
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        return await conn.reply(m.chat, `⌛ Espera *${mins}m ${secs}s* para usar #rw de nuevo.`, m);
    }

    try {
        const harem = await loadHarem();
        let character;
        let attempts = 0;

        // Buscar personaje no reclamado
        while (attempts < 5) {
            character = await fetchRandomAnimeCharacter();
            const isClaimed = harem.some(entry => entry.characterId === character.id);
            if (!isClaimed) break;
            attempts++;
        }

        if (attempts >= 5) {
            return await conn.reply(m.chat, "🔍 Demasiados intentos. Intenta con #rw otra vez.", m);
        }

        // Construir mensaje
        const message = `🌸 *${character.name}*\n` +
                       `⚥ ${character.gender}\n` +
                       `💎 Valor: ${character.value}\n` +
                       `📺 Fuente: ${character.source}\n` +
                       `🔓 Estado: Libre`;

        // Enviar con mención
        await conn.sendFile(
            m.chat, 
            character.img[0], 
            'anime.jpg', 
            message, 
            m, 
            { mentions: [userId] }
        );

        // Actualizar harem
        harem.push({
            userId: userId,
            characterId: character.id,
            claimedAt: now
        });
        await saveHarem(harem);

        // Establecer cooldown
        cooldowns[userId] = now + 15 * 60 * 1000; // 15 minutos

    } catch (error) {
        console.error("Error en handler:", error);
        await conn.reply(m.chat, `❌ Error: ${error.message}`, m);
    }
};

handler.help = ['rw', 'rollwaifu'];
handler.tags = ['gacha'];
handler.command = ['rw', 'rollwaifu'];
handler.group = true;
export default handler;
