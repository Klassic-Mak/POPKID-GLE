import config from '../../config.cjs';

const onlinelist = async (m, sock) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix) ? m.body.slice(prefix.length).split(' ')[0].toLowerCase() : '';

  if (cmd === "onlinelist") {
    try {
      const groupMetadata = await sock.groupMetadata(m.from);
      const participants = groupMetadata.participants;
      const total = participants.length;

      let onlineMembers = [];

      // Loop and subscribe to each user's presence
      for (const user of participants) {
        const jid = user.id;

        try {
          await sock.presenceSubscribe(jid); // Subscribe
          await new Promise(resolve => setTimeout(resolve, 250)); // Delay to allow response

          const presence = sock.presence[m.from]?.[jid];
          if (presence?.lastKnownPresence === 'available') {
            onlineMembers.push(jid);
          }
        } catch (e) {
          console.log(`Failed to get presence for ${jid}`);
        }
      }

      if (onlineMembers.length === 0) {
        return await sock.sendMessage(m.from, {
          text: "🟡 *No online members detected right now.*",
        }, { quoted: m });
      }

      const lines = onlineMembers.map((jid, i) => `${i + 1}. @${jid.split('@')[0]}`);
      const message = `🟢 *Online Members* (${onlineMembers.length}/${total}):\n\n` + lines.join('\n');

      await sock.sendMessage(m.from, {
        text: message,
        mentions: onlineMembers
      }, { quoted: m });

    } catch (err) {
      console.error("onlinelist error:", err);
      await sock.sendMessage(m.from, {
        text: "❌ *Error:* Unable to fetch online users at this time.",
      }, { quoted: m });
    }
  }
};

export default onlinelist;
