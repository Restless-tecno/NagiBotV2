import axios from 'axios';
import { promises as fs } from 'fs';

const haremFilePath = './src/database/harem.json';
const cooldowns = {};

// API Config
const ANILIST_API = 'https://graphql.anilist.co';
const IMAGE_API = 'https://api.waifu.im/search'; // Alternativa: Danbooru

// Consulta GraphQL para personajes populares aleatorios
const RANDOM_CHARACTER_QUERY = `
  query {
    Page(page: ${Math.floor(Math.random() * 50)}, perPage: 1) {
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

async function fetchRandomAnimeCharacter() {
  try {
    // 1. Obtener personaje aleatorio de AniList
    const anilistResponse = await axios.post(ANILIST_API, {
      query: RANDOM_CHARACTER_QUERY
    });

    const character = anilistResponse.data.data.Page.characters[0];
    if (!character) throw new Error("No se encontró personaje");

    // 2. Obtener imagen (usando Waifu.im o Danbooru)
    let imageUrl;
    try {
      const imageResponse = await axios.get(`${IMAGE_API}?included_tags=${encodeURIComponent(character.name.full)}`);
      imageUrl = imageResponse.data.images[0].url;
    } catch {
      imageUrl = character.image.large; // Fallback a imagen de AniList
    }

    return {
      id: character.id,
      name: character.name.full,
      gender: character.gender === 'Male' ? 'Hombre' : 'Mujer',
      source: character.media.nodes[0]?.title.romaji || 'Desconocido',
      img: [imageUrl],
      user: null
    };
  } catch (error) {
    console.error("Error al buscar personaje:", error);
    throw new Error("No se pudo generar un personaje. Intenta de nuevo.");
  }
}

// (Las funciones loadHarem() y saveHarem() se mantienen igual que antes)

let handler = async (m, { conn }) => {
  const userId = m.sender;
  const now = Date.now();

  // Verificar cooldown (igual que antes)
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

    // Buscar personaje no reclamado
    while (attempts < 5) {
      randomCharacter = await fetchRandomAnimeCharacter();
      const isClaimed = harem.some(entry => entry.characterId === randomCharacter.id);
      if (!isClaimed) break;
      attempts++;
    }

    if (attempts >= 5) {
      return await conn.reply(m.chat, "✘ Demasiados intentos. Usa el comando nuevamente.", m);
    }

    // Asignar valor aleatorio (50-10000)
    randomCharacter.value = Math.floor(Math.random() * 9950) + 50;

    // Enviar mensaje
    const message = `❀ Nombre » *${randomCharacter.name}*\n` +
                   `⚥ Género » *${randomCharacter.gender}*\n` +
                   `✰ Valor » *${randomCharacter.value}*\n` +
                   `♡ Estado » Libre\n` +
                   `❖ Fuente » *${randomCharacter.source}*`;

    await conn.sendFile(m.chat, randomCharacter.img[0], 'anime.jpg', message, m);

    // Guardar en harem
    randomCharacter.user = userId;
    harem.push({
      userId: userId,
      characterId: randomCharacter.id,
      lastVoteTime: now
    });
    await saveHarem(harem);

    cooldowns[userId] = now + 15 * 60 * 1000; // 15 min de cooldown

  } catch (error) {
    await conn.reply(m.chat, `✘ Error: ${error.message}`, m);
  }
};

handler.help = ['rw', 'rollwaifu'];
handler.tags = ['gacha'];
handler.command = ['rw', 'rollwaifu'];
export default handler;
