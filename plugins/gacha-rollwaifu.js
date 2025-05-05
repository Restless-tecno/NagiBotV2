import { promises as fs } from 'fs';
import axios from 'axios';

const haremFilePath = './src/database/harem.json';
const cooldowns = {};

// Configuración de la API de AniList
const ANILIST_API = 'https://graphql.anilist.co';

// Consulta GraphQL optimizada
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
      }
    }
  }
`;

async function fetchRandomCharacter() {
  try {
    const page = Math.floor(Math.random() * 50) + 1;
    const response = await axios.post(ANILIST_API, {
      query: GET_RANDOM_CHARACTER,
      variables: { page, perPage: 1 }
    });

    const character = response.data.data.Page.characters[0];
    if (!character) throw new Error('No se encontró personaje');

    // Determinar el género
    let gender = 'Desconocido';
    if (character.gender) {
      gender = character.gender === 'Male' ? 'Hombre' : 
               character.gender === 'Female' ? 'Mujer' : 'Desconocido';
    }

    // Obtener la fuente
    let source = 'Origen desconocido';
    if (character.media?.nodes?.[0]) {
      source = character.media.nodes[0].title.english || 
               character.media.nodes[0].title.romaji || 
               character.media.nodes[0].title.native;
    }

    // Valor completamente aleatorio entre 1 y 100000
    const value = Math.floor(Math.random() * 100000) + 1;

    return {
      id: character.id,
      name: character.name.full,
      gender,
      value, // Valor aleatorio
      source,
      img: [character.image.large]
    };
  } catch (error) {
    console.error('Error al obtener personaje:', error);
    return {
      id: 'default-' + Date.now(),
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
    const randomImage = randomCharacter.img[0];

    const harem = await loadHarem();
    const userEntry = harem.find(entry => entry.characterId === randomCharacter.id);
    
    const statusMessage = userEntry 
      ? `Reclamado por @${userEntry.userId.split('@')[0]}` 
      : 'Libre';

    const message = `❀ Nombre » *${randomCharacter.name}*
⚥ Género » *${randomCharacter.gender}*
✰ Valor » *${randomCharacter.value.toLocaleString()}*
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
        characterData: {
          name: randomCharacter.name,
          gender: randomCharacter.gender,
          value: randomCharacter.value,
          source: randomCharacter.source
        }
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
