let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    if (cooldowns[userId] && now < cooldowns[userId]) {
        const remaining = Math.ceil((cooldowns[userId] - now) / 1000);
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        return conn.reply(m.chat, `⌛ Espera *${mins}m ${secs}s* para usar #rw de nuevo.`, m);
    }

    try {
        const [harem, tempClaim] = await Promise.all([loadHarem(), loadTempClaim()]);
        let character;
        let attempts = 0;

        while (attempts < 5) {
            character = await fetchRandomAnimeCharacter();
            const isClaimed = harem.some(entry => entry.characterId === character.id) || 
                             Object.values(tempClaim).some(c => c.id === character.id);
            if (!isClaimed) break;
            attempts++;
        }

        if (attempts >= 5) {
            return conn.reply(m.chat, "🔍 Demasiados intentos. Usa #rw otra vez.", m);
        }

        const message = `🎌 *Personaje Disponible* 🎴\n\n` +
                       `🌸 *Nombre:* ${character.name}\n` +
                       `⚥ *Género:* ${character.gender}\n` +
                       `💎 *Valor:* ${character.value}\n` +
                       `📺 *Fuente:* ${character.source}\n\n` +
                       `⚠️ *Responde con* *#claim* *para reclamarlo.*`;

        // Guardar TODOS los campos necesarios
        tempClaim[userId] = {
            id: character.id,
            name: character.name,
            gender: character.gender,
            img: character.img,
            value: character.value,
            source: character.source,
            expires: now + 120000
        };
        
        await saveTempClaim(tempClaim);
        await conn.sendFile(m.chat, character.img, 'anime.jpg', message, m);
        cooldowns[userId] = now + 15 * 60 * 1000;

    } catch (error) {
        console.error("Error en #rw:", error);
        conn.reply(m.chat, `❌ Error: ${error.message}`, m);
    }
};
