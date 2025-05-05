import { promises as fs } from 'fs';

const haremFilePath = './src/database/harem.json';

async function loadHarem() {
    try {
        const data = await fs.readFile(haremFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

let handler = async (m, { conn, args }) => {
    try {
        const harem = await loadHarem();
        let userId;

        // Determinar el usuario objetivo
        if (m.quoted && m.quoted.sender) {
            userId = m.quoted.sender;
        } else if (args[0] && args[0].startsWith('@')) {
            userId = args[0].replace('@', '') + '@s.whatsapp.net';
        } else {
            userId = m.sender;
        }

        // Filtrar personajes del usuario
        const userClaims = harem.filter(entry => entry.userId === userId);

        if (userClaims.length === 0) {
            await conn.reply(m.chat, '❀ No tienes personajes reclamados en tu harem.', m);
            return;
        }

        // Configuración de paginación
        const page = parseInt(args[1]) || 1;
        const charactersPerPage = 10; // Reducido para mejor visualización
        const totalCharacters = userClaims.length;
        const totalPages = Math.ceil(totalCharacters / charactersPerPage);
        const startIndex = (page - 1) * charactersPerPage;
        const endIndex = Math.min(startIndex + charactersPerPage, totalCharacters);

        if (page < 1 || page > totalPages) {
            await conn.reply(m.chat, `❀ Página no válida. Hay un total de *${totalPages}* páginas.`, m);
            return;
        }

        // Construir el mensaje
        let message = `✧ *HAREM PERSONAL* ✧\n`;
        message += `⌦ Usuario: @${userId.split('@')[0]}\n`;
        message += `♡ Total: *${totalCharacters} personajes*\n\n`;

        // Agregar personajes de la página actual
        for (let i = startIndex; i < endIndex; i++) {
            const claim = userClaims[i];
            message += `❀ *${claim.name}*\n`;
            message += `⚥ ${claim.gender} | ✰ ${claim.value.toLocaleString()}\n`;
            message += `❖ ${claim.source}\n`;
            message += `⏱️ ${new Date(claim.claimDate).toLocaleDateString()}\n\n`;
        }

        message += `⌦ Página *${page}* de *${totalPages}*\n`;
        message += `✧ Usa *${handler.command[0]} @usuario [página]* para ver otros harem`;

        await conn.reply(m.chat, message, m, { mentions: [userId] });

    } catch (error) {
        console.error('Error en comando harem:', error);
        await conn.reply(m.chat, `✘ Error al cargar el harem: ${error.message}`, m);
    }
};

handler.help = ['harem [@usuario] [página]'];
handler.tags = ['gacha'];
handler.command = ['harem', 'miharem', 'waifus'];
handler.group = true;
handler.register = true;

export default handler;
