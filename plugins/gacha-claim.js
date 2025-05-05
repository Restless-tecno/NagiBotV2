import { promises as fs } from 'fs';

const haremFilePath = './src/database/harem.json';
const cooldowns = {};

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

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remainingTime = Math.ceil((cooldowns[userId] - now) / 1000);
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        return await conn.reply(m.chat, `《✧》Debes esperar *${minutes} minutos y ${seconds} segundos* para usar *#c* de nuevo.`, m);
    }

    if (m.quoted && m.quoted.sender === conn.user.jid) {
        try {
            const harem = await loadHarem();
            
            // Extraer datos del mensaje citado usando un regex más completo
            const quotedText = m.quoted.text;
            const characterDataMatch = quotedText.match(
                /❀ Nombre » \*(.+?)\*\n⚥ Género » \*(.+?)\*\n✰ Valor » \*([\d,]+)\*\n♡ Estado » (.+?)\n❖ Fuente » \*(.+?)\*/
            );

            if (!characterDataMatch) {
                await conn.reply(m.chat, '《✧》No se pudo encontrar la información del personaje en el mensaje citado.', m);
                return;
            }

            const [, name, gender, valueStr, status, source] = characterDataMatch;
            const value = parseInt(valueStr.replace(/,/g, ''));

            // Verificar si el personaje ya está reclamado
            const existingClaim = harem.find(entry => 
                entry.name === name && 
                entry.gender === gender && 
                entry.value === value && 
                entry.source === source
            );

            if (existingClaim) {
                if (existingClaim.userId !== userId) {
                    await conn.reply(
                        m.chat, 
                        `《✧》El personaje ya ha sido reclamado por @${existingClaim.userId.split('@')[0]}, inténtalo a la próxima :v.`, 
                        m, 
                        { mentions: [existingClaim.userId] }
                    );
                    return;
                } else {
                    await conn.reply(m.chat, '《✧》Ya has reclamado este personaje anteriormente.', m);
                    return;
                }
            }

            // Crear nuevo registro en el harem
            const newClaim = {
                userId,
                name,
                gender,
                value,
                source,
                status: "Reclamado",
                claimDate: now,
                cooldown: now + 30 * 60 * 1000
            };

            harem.push(newClaim);
            await saveHarem(harem);

            await conn.reply(m.chat, `✦ Has reclamado a *${name}* con éxito.`, m);
            cooldowns[userId] = now + 30 * 60 * 1000;

        } catch (error) {
            console.error('Error al reclamar personaje:', error);
            await conn.reply(m.chat, `✘ Error al reclamar el personaje: ${error.message}`, m);
        }

    } else {
        await conn.reply(m.chat, '《✧》Debes citar un personaje válido para reclamar.', m);
    }
};

handler.help = ['claim'];
handler.tags = ['gacha'];
handler.command = ['c', 'claim', 'reclamar'];
handler.group = true;
handler.register = true;

export default handler;
