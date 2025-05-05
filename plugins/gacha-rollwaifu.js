import { promises as fs } from 'fs';
import axios from 'axios';

const haremFilePath = './src/database/harem.json';
const cooldowns = {};

// Configuración de la API de AniList
const ANILIST_API = 'https://graphql.anilist.co';

// Consulta GraphQL para obtener personajes aleatorios
const GET_RANDOM_CHARACTER = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      characters(sort: FAVOURITES_DESC) {
        id
        name {
          full
        }
        gender
        media {
          nodes {
            title {
              romaji
              english
              native
            }
          }
        }
        image {
          large
        }
        favourites
      }
    }
  }
`;

async function fetchRandomCharacter() {
  try {
    const page = Math.floor(Math.random() * 50) + 1; // Páginas aleatorias para variedad
    const response = await axios.post(ANILIST_API, {
      query: GET_RANDOM_CHARACTER,
      variables: { page, perPage: 1 }
    });

    const character = response.data.data.Page.characters[0];
    if (!character) throw new Error('No se encontró personaje');

    // Determinar el género (la API puede devolver null)
    let gender = 'Desconocido';
    if (character.gender) {
      gender = character.gender === 'Male' ? 'Hombre' : 
               character.gender === 'Female' ? 'Mujer' : 'Desconocido';
    }

    // Obtener la fuente (primer anime/manga asociado)
    let source = 'Origen desconocido';
    if (character.media && character.media.nodes && character.media.nodes[0]) {
      source = character.media.nodes[0].title.english || 
               character.media.nodes[0].title.romaji || 
               character.media.nodes[0].title.native;
    }

    // Calcular valor basado en favoritos (1-100000)
    const value = Math.min(Math.floor((character.favourites || 1) * 10), 100000);

    return {
      id: character.id,
      name: character.name.full,
      gender,
      value,
      source,
      img: [character.image.large]
    };
  } catch (error) {
    console.error('Error al obtener personaje:', error);
    // Personaje de respaldo en caso de error
    return {
      id: 'default',
      name: 'Personaje Desconocido',
      gender: 'Desconocido',
      value: Math.floor(Math.random() * 100000) + 1,
      source: 'Origen desconocido',
      img: ['https://i.imgur.com/6Z7DZ9m.jpg']
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
    const randomCharacter = await fetchRandomCharacter();
    const randomImage = randomCharacter.img[0]; // AniList solo devuelve una imagen

    const harem = await loadHarem();
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
        voteCooldown: now + 1.5 * 60 * 60 * 1000,
        characterData: randomCharacter // Guardamos todos los datos por si acaso
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
