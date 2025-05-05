import { promises as fs } from 'fs';

const haremFilePath = './src/database/harem.json';

async function loadHarem() {
    try {
        const data = await fs.readFile(haremFilePath, 'utf-8');
        const parsedData = JSON.parse(data);
        
        // Validación extrema de la estructura del archivo
        if (!Array.isArray(parsedData)) {
            console.warn('harem.json no es un array, inicializando nuevo array');
            return [];
        }
        return parsedData;
    } catch (error) {
        console.error('Error cargando harem.json:', error);
        return [];
    }
}

let handler = async (m, { conn, args }) => {
    try {
        let harem = await loadHarem();
        
        // Validación adicional por si acaso
        if (!Array.isArray(harem)) {
            console.error('harem no es array, forzando reinicio');
            harem = [];
        }

        let userId = m.sender;
        
        // Manejo robusto de mencionados y citados
        if (args[0]?.startsWith('@')) {
            userId = args[0].replace('@', '') + '@s.whatsapp.net';
        } else if (m.quoted?.sender) {
            userId = m.quoted.sender;
        }

        // Procesamiento ultra-seguro de los claims
        const userClaims = harem
            .filter(entry => entry?.userId === userId)
            .map(claim => {
                // Garantizar que todos los campos existan
                return {
                    userId: claim.userId,
                    name: claim.name || 'Desconocido',
                    gender: claim.gender || 'Desconocido',
                    value: typeof claim.value === 'number' ? claim.value : 
                          parseInt(claim.value) || 0,
                    source: claim.source || 'Fuente desconocida',
                    claimDate: claim.claimDate || Date.now()
                };
            });

        if (userClaims.length === 0) {
            return await conn.reply(
                m.chat, 
                '❀ No tienes personajes reclamados en tu harem.', 
                m
            );
        }

        // Paginación a prueba de errores
        const page = Math.max(1, parseInt(args[1]) || 1);
        const charsPerPage = 10;
        const totalPages = Math.ceil(userClaims.length / charsPerPage);
        const currentPage = Math.min(page, totalPages);
        
        const startIdx = (currentPage - 1) * charsPerPage;
        const endIdx = Math.min(startIdx + charsPerPage, userClaims.length);
        const pageClaims = userClaims.slice(startIdx, endIdx);

        // Construcción del mensaje con validaciones
        let message = `✧ *HAREM PERSONAL* ✧\n`;
        message += `⌦ Usuario: @${userId.split('@')[0]}\n`;
        message += `♡ Total: *${userClaims.length} personajes*\n\n`;

        pageClaims.forEach(claim => {
            message += `❀ *${claim.name}*\n`;
            message += `⚥ ${claim.gender} | ✰ ${claim.value.toLocaleString()}\n`;
            message += `❖ ${claim.source}\n`;
            message += `⏱️ ${new Date(claim.claimDate).toLocaleDateString('es-ES')}\n\n`;
        });

        message += `⌦ Página *${currentPage}* de *${totalPages}*\n`;
        message += `✧ Usa *${handler.command[0]} @usuario [página]* para ver otros harem`;

        await conn.reply(
            m.chat, 
            message, 
            m, 
            { mentions: [userId] }
        );

    } catch (error) {
        console.error('ERROR CRÍTICO en comando harem:', error);
        await conn.reply(
            m.chat, 
            '✘ Error crítico al cargar el harem. Por favor reporta este error.', 
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
