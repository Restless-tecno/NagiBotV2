import { promises as fs } from 'fs';

// ... (las funciones loadHarem, saveHarem, etc. se mantienen igual)

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();
    const username = conn.getName(m.sender); // Obtener nombre del usuario

    try {
        const [harem, tempClaim] = await Promise.all([loadHarem(), loadTempClaim()]);
        const character = tempClaim[userId];

        if (!character) {
            return conn.reply(m.chat, "❌ No hay personajes pendientes. Usa #rw primero.", m);
        }

        if (now > character.expires) {
            delete tempClaim[userId];
            await saveTempClaim(tempClaim);
            return conn.reply(m.chat, "⌛ Tiempo agotado. Usa #rw de nuevo.", m);
        }

        if (harem.some(c => c.characterId === character.id)) {
            delete tempClaim[userId];
            await saveTempClaim(tempClaim);
            return conn.reply(m.chat, "⚠️ Este personaje ya fue reclamado.", m);
        }

        // Añadir al harem
        harem.push({
            userId: userId,
            username: username,
            characterId: character.id,
            name: character.name,
            gender: character.gender,
            img: character.img,
            value: character.value,
            source: character.source,
            claimedAt: now
        });

        delete tempClaim[userId];
        await Promise.all([saveHarem(harem), saveTempClaim(tempClaim)]);

        // Mensaje de confirmación CON USUARIO EN EL TÍTULO
        await conn.sendMessage(m.chat, {
            text: `🎉 *¡Personaje Reclamado por ${username}!*\n\n` +  // Usuario aquí
                  `🌸 *Nombre:* ${character.name}\n` +
                  `⚥ *Género:* ${character.gender}\n` +
                  `💎 *Valor:* ${character.value}\n` +
                  `📺 *Fuente:* ${character.source}\n\n` +
                  `✅ Ahora forma parte de tu harem.`,
            mentions: [m.sender]
        });

    } catch (error) {
        console.error("Error en #claim:", error);
        conn.reply(m.chat, "❌ Error al reclamar: " + error.message, m);
    }
};

handler.help = ['c/claim'];
handler.tags = ['gacha'];
handler.command = ['c', 'claim'];
export default handler;
