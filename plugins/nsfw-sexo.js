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
    m.react('🥵');

    let str;
    if (m.mentionedJid.length > 0) {
        str = `\`${name2}\` *tiene sexo fuertemente con* \`${name || who}\`.`;
    } else if (m.quoted) {
        str = `\`${name2}\` *tiene sexo con* \`${name || who}\`.`;
    } else {
        str = `\`${name2}\` *tiene sexo apasionadamente.*`.trim();
    }
    
    if (m.isGroup) {
        let pp = 'https://files.catbox.moe/6xwhsj.mp4'; 
        let pp2 = 'https://files.catbox.moe/0heauq.mp4'; 
        let pp3 = 'https://files.catbox.moe/9u3osk.mp4';
        let pp4 = 'https://files.catbox.moe/shkj8k.mp4';
        let pp5 = 'https://files.catbox.moe/a3ymzk.mp4';
        let pp6 = 'https://files.catbox.moe/qv67t0.mp4';
        let pp7 = 'https://files.catbox.moe/v9c6en.mp4';
        let pp8 = 'https://files.catbox.moe/ppptxp.mp4';
        let pp9 = 'https://files.catbox.moe/jq7yxl.mp4';
        
        const videos = [pp, pp2, pp3, pp4, pp5, pp6, pp8, pp9];
        const video = videos[Math.floor(Math.random() * videos.length)];

        let mentions = [who];
        conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });
    }
}

handler.help = ['sexo/sex @tag'];
handler.tags = ['nsfw'];
handler.command = ['sexo','sex'];
handler.group = true;

export default handler
