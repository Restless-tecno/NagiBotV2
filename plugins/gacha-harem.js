import { promises as fs } from 'fs';

const DB_PATH = './src/database/harem.json';

async function loadHarem() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data) || [];
    } catch {
        return [];
    }
}

let handler = async (m, { conn, args }) => {
    try {
        const harem = await loadHarem();
        const userId = args[0]?.startsWith('@') 
            ? args[0].replace('@', '') + '@s.whatsapp.net'
            : m.quoted?.sender || m.sender;

        const userHarem = harem.filter(c => c.userId === userId);
        if (userHarem.length === 0) throw new Error(`@${userId.split('@')[0]} no tiene personajes en su harem`);

        const page = parseInt(args[1]) || 1;
        const perPage = 5;
        const totalPages = Math.ceil(userHarem.length / perPage);

        if (page < 1 || page > totalPages) {
            return conn.reply(m.chat, `📖 Página inválida (1-${totalPages})`, m);
        }

        const items = userHarem.slice((page - 1) * perPage, page * perPage);
        let message = `🌸 *Harem de @${userId.split('@')[0]}*\n` +
                     `📊 Total: ${userHarem.length} personajes\n\n`;

        items.forEach((char, i) => {
            message += `${i + 1}. ${char.name} (${char.value})\n` +
                       `   ⚥ ${char.gender} | 📺 ${char.source}\n\n`;
        });

        message += `📄 Página ${page}/${totalPages}\n` +
                   `🔍 Usa: #harem @usuario [página]`;

        await conn.reply(m.chat, message, m, { mentions: [userId] });

    } catch (error) {
        conn.reply(m.chat, `❌ ${error.message}`, m, { mentions: [m.sender] });
    }
};

handler.help = ['harem [@usuario] [página]'];
handler.tags = ['gacha'];
handler.command = ['harem', 'coleccion'];
export default handler;
