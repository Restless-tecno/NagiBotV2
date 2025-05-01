//Codígo creado por Destroy wa.me/584120346669

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, usedPrefix }) => {
if (!db.data.chats[m.chat].nsfw && m.isGroup) {
    return m.reply(`${emoji} El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#nsfw*`);
    }

    let who;
    if (m.mentionedJid.length > 0) {
        who = m.mentionedJid[0];
    } else if (m.quoted) {
        who = m.quoted.sender;
    } else {
        who = m.sender;
    }

    let name = conn.getName(who);
    let name2 = conn.getName(m.sender);
    m.react('👊');

    let str;
    if (m.mentionedJid.length > 0) {
        str = `\`${name2}\` *Golpeó a* \`${name || who}\`.`;
    } else if (m.quoted) {
        str = `\`${name2}\` *Le dió un coñazo a* \`${name || who}\`.`;
    } else {
        str = `\`${name2}\` *"Eso le tuvo que doler a"*`.trim();
    }
    
    if (m.isGroup) {
        let pp = 'https://files.catbox.moe/dv9vb6.gif'; 
        let pp2 = 'https://files.catbox.moe/2v91dg.gif'; 
        let pp3 = 'https://files.catbox.moe/y2mzgf.gif';
        let pp4 = 'https://files.catbox.moe/4okxba.gif';
        let pp5 = 'https://files.catbox.moe/b221o7.gif';
        let pp6 = 'https://files.catbox.moe/1hoe4n.gif';
        let pp7 = 'https://files.catbox.moe/5g2niu.gif';
        let pp8 = 'https://files.catbox.moe/ruenwb.gif';
        let pp9 = 'https://files.catbox.moe/fi0xhd.gif';
        let pp10 = 'https://files.catbox.moe/cakk69.gif';
        let pp11 = 'https://files.catbox.moe/vr83b0.gif';
        
        const videos = [pp, pp2, pp3, pp4, pp5, pp6, pp7, pp8, pp9, pp10, pp11];
        const video = videos[Math.floor(Math.random() * videos.length)];

        let mentions = [who];
        conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });
    }
}

handler.help = ['golpear/coñazo @tag'];
handler.tags = ['nsfw'];
handler.command = ['golpear','coñazo'];
handler.group = true;

export default handler;
