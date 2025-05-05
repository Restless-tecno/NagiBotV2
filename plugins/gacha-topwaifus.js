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
        
        // Procesar y agrupar personajes (pueden estar reclamados por múltiples usuarios)
        const characterMap = new Map();
        
        harem.forEach(entry => {
            if (!entry.name || entry.value === undefined) return;
            
            const key = `${entry.name.toLowerCase()}-${entry.value}`;
            
            if (!characterMap.has(key)) {
                characterMap.set(key, {
                    name: entry.name,
                    value: entry.value,
                    owners: []
                });
            }
            
            if (entry.userId) {
                characterMap.get(key).owners.push(entry.userId);
            }
        });

        // Convertir a array y ordenar por valor (mayor a menor)
        const sortedCharacters = Array.from(characterMap.values())
            .sort((a, b) => b.value - a.value);

        // Configurar paginación
        const page = Math.max(1, parseInt(args[0]) || 1);
        const itemsPerPage = 10;
        const totalPages = Math.ceil(sortedCharacters.length / itemsPerPage);
        const currentPage = Math.min(page, totalPages);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, sortedCharacters.length);
        const charactersToShow = sortedCharacters.slice(startIndex, endIndex);

        // Construir mensaje
        let message = '✧ *TOP PERSONAJES POR VALOR* ✧\n\n';
        
        charactersToShow.forEach((character, index) => {
            const position = startIndex + index + 1;
            message += `✰ *${position}.* ${character.name}\n`;
            message += `   ⚥ Valor: *${character.value.toLocaleString()}*\n`;
            
            if (character.owners.length > 0) {
                if (character.owners.length === 1) {
                    message += `   ♡ Dueño: @${character.owners[0].split('@')[0]}\n\n`;
                } else {
                    message += `   ♡ Dueños: ${character.owners.length} usuarios\n\n`;
                }
            } else {
                message += `   ♡ Estado: Libre\n\n`;
            }
        });

        message += `⌦ Página *${currentPage}* de *${totalPages}*\n`;
        message += `✧ Usa *${handler.command[0]} [página]* para navegar`;

        // Preparar menciones (solo primeros dueños para no saturar)
        const mentions = charactersToShow
            .filter(c => c.owners.length > 0)
            .flatMap(c => c.owners.slice(0, 1));

        await conn.reply(
            m.chat, 
            message, 
            m,
            { mentions }
        );

    } catch (error) {
        console.error('Error en topwaifus:', error);
        await conn.reply(
            m.chat, 
            '✘ Error al cargar el ranking. Intenta nuevamente.', 
            m
        );
    }
};

handler.help = ['topwaifus [página]'];
handler.tags = ['gacha'];
handler.command = ['topwaifus', 'waifustop', 'topchar'];
handler.group = true;
handler.register = true;

export default handler;
