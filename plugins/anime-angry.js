//Codígo creado por Destroy wa.me/584120346669

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, usedPrefix }) => {
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
    m.react('😡');

    let str;
    if (m.mentionedJid.length > 0) {
        str = `\`${name2}\` *está enojado/a con* \`${name || who}\`.`; 
    } else if (m.quoted) {
        str = `\`${name2}\` *está enojado/a con* \`${name || who}\`.`; 
    } else {
        str = `\`${name2}\` *está enojado/a.*`.trim();
    }
    
    if (m.isGroup) {
        let pp = 'https://files.catbox.moe/2aedd3.mp4'; 
        let pp2 = 'https://files.catbox.moe/fqf4ey.mp4'; 
        let pp3 = 'https://files.catbox.moe/v7ldgq.mp4';
        let pp4 = 'https://files.catbox.moe/uedd7l.mp4';
        let pp5 = 'https://files.catbox.moe/5stubg.mp4';
        let pp6 = 'https://files.catbox.moe/phaft3.mp4';
        let pp7 = 'https://files.catbox.moe/mcx9t3.mp4';
        let pp8 = 'https://files.catbox.moe/wth6so.mp4';
        let pp9 = 'https://files.catbox.moe/tsd4ey.mp4';
        let pp10 = 'https://files.catbox.moe/3a5clp.mp4';
        let pp11 = 'https://files.catbox.moe/05lkkw.jpg';
        let pp12 = 'https://files.catbox.moe/m2sss8.jpg';
        
        const videos = [pp, pp2, pp3, pp4, pp5, pp6, pp7, pp8, pp9, pp10, pp11, pp12];
        const video = videos[Math.floor(Math.random() * videos.length)];
     
        let mentions = [who]; 
        conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });
    }
}

handler.help = ['angry/enojado @tag'];
handler.tags = ['anime'];
handler.command = ['angry','enojado'];
handler.group = true;

export default handler;
