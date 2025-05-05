import { promises as fs } from 'fs';

const haremFilePath = './src/database/harem.json';

async function loadHarem() {
    try {
        const data = await fs.readFile(haremFilePath, 'utf-8');
        const parsed = JSON.parse(data);
        // Asegurarnos que siempre sea un array
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error loading harem:', error);
        return []; // Retornar array vacío si hay error
    }
}

async function saveHarem(harem) {
    try {
        // Validar que harem sea un array antes de guardar
        if (!Array.isArray(harem)) {
            throw new Error('Datos de harem no válidos');
        }
        await fs.writeFile(haremFilePath, JSON.stringify(harem, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving harem:', error);
        throw new Error('No se pudo guardar el harem');
    }
}

let handler = async (m, { conn, args }) => {
    try {
        const senderId = m.sender;
        
        // Validación básica de argumentos
        if (args.length < 2) {
            return await conn.reply(
                m.chat, 
                '✧ Formato incorrecto. Uso correcto:\n*!regalar <nombre personaje> @usuario*', 
                m
            );
        }

        // Extraer nombre del personaje (todos los argumentos excepto el último)
        const characterName = args.slice(0, -1).join(' ').trim();
        const mentionedUser = args[args.length - 1];

        // Validar mención
        if (!mentionedUser.startsWith('@') || mentionedUser.length < 2) {
            return await conn.reply(
                m.chat, 
                '✧ Debes mencionar un usuario válido (ej: @usuario)', 
                m
            );
        }

        const recipientId = mentionedUser.replace('@', '') + '@s.whatsapp.net';

        // Cargar harem con validación
        let harem;
        try {
            harem = await loadHarem();
        } catch (error) {
            console.error('Error loading harem:', error);
            return await conn.reply(
                m.chat, 
                '✘ Error al cargar los datos. Intenta nuevamente.', 
                m
            );
        }

        // Buscar personaje en el harem del remitente
        const characterIndex = harem.findIndex(entry => {
            return entry?.userId === senderId && 
                   entry?.name && 
                   entry.name.toLowerCase() === characterName.toLowerCase();
        });

        if (characterIndex === -1) {
            return await conn.reply(
                m.chat, 
                `✧ No tienes un personaje llamado *${characterName}* en tu harem.`, 
                m
            );
        }

        // Verificar si el receptor ya tiene el personaje
        const alreadyOwned = harem.some(entry => {
            return entry?.userId === recipientId && 
                   entry?.name && 
                   entry.name.toLowerCase() === characterName.toLowerCase();
        });

        if (alreadyOwned) {
            return await conn.reply(
                m.chat, 
                `✧ ${mentionedUser} ya tiene a *${harem[characterIndex].name}* en su harem.`, 
                m,
                { mentions: [recipientId] }
            );
        }

        // Clonar el personaje para mantener integridad de datos
        const characterToTransfer = { ...harem[characterIndex] };
        
        // Actualizar datos
        characterToTransfer.userId = recipientId;
        characterToTransfer.claimDate = Date.now();

        // Eliminar del harem original y agregar el nuevo
        harem.splice(characterIndex, 1);
        harem.push(characterToTransfer);

        // Guardar cambios
        try {
            await saveHarem(harem);
        } catch (error) {
            console.error('Error saving harem:', error);
            return await conn.reply(
                m.chat, 
                '✘ Error al guardar los cambios. Intenta nuevamente.', 
                m
            );
        }

        // Notificar éxito
        return await conn.reply(
            m.chat, 
            `✧ ¡*${characterToTransfer.name}* ha sido regalado a ${mentionedUser} con éxito!`, 
            m,
            { mentions: [recipientId] }
        );

    } catch (error) {
        console.error('Error in regalar command:', error);
        return await conn.reply(
            m.chat, 
            '✘ Error interno al procesar el regalo. Por favor reporta este error.', 
            m
        );
    }
};

handler.help = ['regalar <nombre personaje> @usuario'];
handler.tags = ['gacha'];
handler.command = ['regalar', 'givewaifu', 'givechar'];
handler.group = true;
handler.register = true;

export default handler;
