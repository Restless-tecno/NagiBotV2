import { promises as fs } from 'fs';

const haremFilePath = './src/database/harem.json';

async function loadHarem() {
    try {
        const data = await fs.readFile(haremFilePath, 'utf-8');
        const parsedData = JSON.parse(data);
        return Array.isArray(parsedData) ? parsedData : [];
    } catch (error) {
        console.error('Error loading harem:', error);
        return [];
    }
}

let handler = async (m, { conn, args }) => {
    try {
        const harem = await loadHarem();
        let userId = m.sender;

        // Manejo de menciones y mensajes citados
        if (args[0]?.startsWith('@')) {
            userId = args[0].replace('@', '') + '@s.whatsapp.net';
        } else if (m.quoted?.sender) {
            userId = m.quoted.sender;
        }

        // Filtramos y mapeamos solo los nombres
        const characterNames = harem
            .filter(entry => entry?.userId === userId)
            .map(claim => claim.name || 'Desconocido');

        if (characterNames.length === 0) {
            return await conn.reply(
                m.chat, 
                '❀ No tienes personajes reclamados en tu harem.', 
                m
            );
        }

        // Configuración de paginación
        const page = Math.max(1, parseInt(args[1]) || 1);
        const perPage = 15; // 15 nombres por página
        const totalPages = Math.ceil(characterNames.length / perPage);
        const currentPage = Math.min(page, totalPages);
        
        const startIdx = (currentPage - 1) * perPage;
        const endIdx = Math.min(startIdx + perPage, characterNames.length);
        const pageNames = characterNames.slice(startIdx, endIdx);

        // Construcción del mensaje simplificado
        let message = `✧ *PERSONAJES RECLAMADOS* ✧\n`;
        message += `⌦ Usuario: @${userId.split('@')[0]}\n`;
        message += `♡ Total: *${characterNames.length} personajes*\n\n`;
        
        message += pageNames.map(name => `❀ ${name}`).join('\n');
        
        message += `\n\n⌦ Página *${currentPage}* de *${totalPages}*`;
        message += `\n✧ Usa *${handler.command[0]} @usuario [página]* para ver más`;

        await conn.reply(
            m.chat, 
            message, 
            m, 
            { mentions: [userId] }
        );

    } catch (error) {
        console.error('Error en comando harem:', error);
        await conn.reply(
            m.chat, 
            '✘ Error al cargar la lista de personajes.', 
            m
        );
    }
};

handler.help = ['harem [@usuario] [página]'];
handler.tags = ['gacha'];
handler.command = ['harem', 'miharem', 'waifus'];
handler.group = true;
handler.register = true;

export default handler;
