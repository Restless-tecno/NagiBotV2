import { promises as fs } from 'fs';

const haremFilePath = './src/database/harem.json';

async function loadHarem() {
    try {
        const data = await fs.readFile(haremFilePath, 'utf-8');
        const parsedData = JSON.parse(data);
        // Asegurar que siempre trabajamos con un array
        return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
        console.error('Error loading harem:', error);
        return [];
    }
}

let handler = async (m, { conn, args }) => {
    if (!args || args.length === 0) {
        return await conn.reply(
            m.chat, 
            '✧ Debes especificar un personaje para ver su información.\nEjemplo: *!winfo Naruto Uzumaki*', 
            m
        );
    }

    const characterName = args.join(' ').trim().toLowerCase();

    try {
        const harem = await loadHarem();
        
        // Buscar todas las instancias del personaje (puede estar reclamado por varios usuarios)
        const characterEntries = harem.filter(entry => 
            entry?.name && 
            entry.name.toLowerCase() === characterName
        );

        if (characterEntries.length === 0) {
            return await conn.reply(
                m.chat, 
                `✧ No se encontró información para *${args.join(' ')}*`, 
                m
            );
        }

        // Tomar la primera instancia para mostrar la información base
        const characterData = characterEntries[0];
        
        // Encontrar todos los usuarios que tienen este personaje
        const owners = [...new Set(
            characterEntries
                .filter(entry => entry.userId)
                .map(entry => entry.userId)
        )];

        // Construir mensaje de estado
        let statusMessage;
        if (owners.length === 0) {
            statusMessage = 'Libre';
        } else if (owners.length === 1) {
            statusMessage = `Reclamado por @${owners[0].split('@')[0]}`;
        } else {
            statusMessage = `Reclamado por ${owners.length} usuarios`;
        }

        // Construir mensaje de información
        const message = `✧ *INFORMACIÓN DEL PERSONAJE* ✧\n\n` +
                       `❀ Nombre » *${characterData.name || 'Desconocido'}*\n` +
                       `⚥ Género » *${characterData.gender || 'Desconocido'}*\n` +
                       `✰ Valor » *${characterData.value?.toLocaleString() || '0'}*\n` +
                       `❖ Fuente » *${characterData.source || 'Desconocida'}*\n` +
                       `♡ Estado » ${statusMessage}\n\n` +
                       `ℹ️ Basado en ${characterEntries.length} registro(s)`;

        // Preparar menciones
        const mentions = owners.length > 0 ? owners.slice(0, 1) : [];

        await conn.reply(
            m.chat, 
            message, 
            m, 
            { mentions }
        );

    } catch (error) {
        console.error('Error en winfo:', error);
        await conn.reply(
            m.chat, 
            '✘ Error al cargar la información. Intenta nuevamente.', 
            m
        );
    }
};

handler.help = ['winfo <nombre del personaje>'];
handler.tags = ['gacha'];
handler.command = ['charinfo', 'winfo', 'waifuinfo'];
handler.group = true;
handler.register = true;

export default handler;
