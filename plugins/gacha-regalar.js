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
    const userId = m.sender;

    if (args.length < 2) {
        await conn.reply(m.chat, '《✧》Debes especificar el nombre del personaje y mencionar a quien quieras regalarlo.', m);
        return;
    }

    const characterName = args.slice(0, -1).join(' ').toLowerCase().trim();
    const mentionedUser = args[args.length - 1];

    if (!mentionedUser.startsWith('@')) {
        await conn.reply(m.chat, '《✧》Debes mencionar a un usuario válido.', m);
        return;
    }

    try {
        const harem = await loadHarem();
        const characterIndex = harem.findIndex(c => 
            c.name.toLowerCase() === characterName && 
            c.userId === userId
        );

        if (characterIndex === -1) {
            await conn.reply(m.chat, `《✧》*${characterName}* no está reclamado por ti.`, m);
            return;
        }

        const newOwner = mentionedUser.replace('@', '') + '@s.whatsapp.net';
        harem[characterIndex].userId = newOwner;
        await saveHarem(harem);

        await conn.reply(
            m.chat, 
            `✰ *${harem[characterIndex].name}* ha sido regalado a ${mentionedUser}!`, 
            m, 
            { mentions: [newOwner] }
        );
    } catch (error) {
        await conn.reply(m.chat, `✘ Error al regalar el personaje: ${error.message}`, m);
    }
};

handler.help = ['regalar <nombre del personaje> @usuario'];
handler.tags = ['anime'];
handler.command = ['regalar', 'givewaifu', 'givechar'];
handler.group = true;
handler.register = true;

export default handler;
