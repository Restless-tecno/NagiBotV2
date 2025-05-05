import { promises as fs } from 'fs';

const haremFilePath = './src/database/harem.json';

// Función para cargar el harem (compartida con gacha-claim.js)
async function loadHarem() {
    try {
        await fs.access(haremFilePath);
        const data = await fs.readFile(haremFilePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

let handler = async (m, { conn, args }) => {
    try {
        const harem = await loadHarem();
        let userId;

        if (m.quoted && m.quoted.sender) {
            userId = m.quoted.sender;
        } else if (args[0] && args[0].startsWith('@')) {
            userId = args[0].replace('@', '') + '@s.whatsapp.net';
        } else {
            userId = m.sender;
        }

        const userHarem = harem.filter(entry => entry.userId === userId);

        if (userHarem.length === 0) {
            await conn.reply(m.chat, '❀ No tienes personajes reclamados en tu harem.', m);
            return;
        }

        const page = parseInt(args[1]) || 1;
        const charactersPerPage = 10;
        const totalCharacters = userHarem.length;
        const totalPages = Math.ceil(totalCharacters / charactersPerPage);
        const startIndex = (page - 1) * charactersPerPage;
        const endIndex = Math.min(startIndex + charactersPerPage, totalCharacters);

        if (page < 1 || page > totalPages) {
            await conn.reply(m.chat, `❀ Página no válida. Hay un total de *${totalPages}* páginas.`, m);
            return;
        }

        let message = `✿ Harem de @${userId.split('@')[0]} ✿\n`;
        message += `♡ Total de personajes: *${totalCharacters}*\n\n`;

        for (let i = startIndex; i < endIndex; i++) {
            const character = userHarem[i];
            message += `» ${character.name} (${character.value}) - ${character.source}\n`;
        }

        message += `\n📖 Página ${page} de ${totalPages}`;

        await conn.reply(m.chat, message, m, { mentions: [userId] });

    } catch (error) {
        await conn.reply(m.chat, `✘ Error al cargar el harem: ${error.message}`, m);
    }
};

handler.help = ['harem [@usuario] [página]'];
handler.tags = ['gacha'];
handler.command = ['harem', 'claims', 'waifus'];
export default handler;
