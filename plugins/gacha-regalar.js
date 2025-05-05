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

async function saveHarem(harem) {
    try {
        await fs.writeFile(haremFilePath, JSON.stringify(harem, null, 2), 'utf-8');
    } catch (error) {
        throw new Error('❀ No se pudo guardar el archivo harem.json.');
    }
}

let handler = async (m, { conn, args }) => {
    const senderId = m.sender;

    if (args.length < 2) {
        return await conn.reply(
            m.chat, 
            '《✧》Formato incorrecto. Usa: *regalar <nombre personaje> @usuario*', 
            m
        );
    }

    // Extraer nombre del personaje (todos los argumentos excepto el último)
    const characterName = args.slice(0, -1).join(' ').trim();
    const mentionedUser = args[args.length - 1];

    if (!mentionedUser.startsWith('@')) {
        return await conn.reply(
            m.chat, 
            '《✧》Debes mencionar a un usuario válido (ej: @usuario).', 
            m
        );
    }

    const recipientId = mentionedUser.replace('@', '') + '@s.whatsapp.net';

    try {
        const harem = await loadHarem();

        // Buscar el personaje en el harem del remitente
        const characterIndex = harem.findIndex(entry => 
            entry.userId === senderId && 
            entry.name.toLowerCase() === characterName.toLowerCase()
        );

        if (characterIndex === -1) {
            return await conn.reply(
                m.chat, 
                `《✧》No tienes un personaje llamado *${characterName}* en tu harem.`, 
                m
            );
        }

        // Verificar si el receptor ya tiene ese personaje
        const alreadyOwned = harem.some(entry => 
            entry.userId === recipientId && 
            entry.name.toLowerCase() === characterName.toLowerCase()
        );

        if (alreadyOwned) {
            return await conn.reply(
                m.chat, 
                `《✧》El usuario ya tiene a *${characterName}* en su harem.`, 
                m
            );
        }

        // Transferir el personaje
        harem[characterIndex].userId = recipientId;
        harem[characterIndex].claimDate = Date.now(); // Actualizar fecha

        await saveHarem(harem);

        await conn.reply(
            m.chat, 
            `✰ *${harem[characterIndex].name}* ha sido regalado a ${mentionedUser} con éxito!`, 
            m,
            { mentions: [recipientId] }
        );

    } catch (error) {
        console.error('Error al regalar personaje:', error);
        await conn.reply(
            m.chat, 
            '✘ Error al procesar el regalo. Intenta nuevamente.', 
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
