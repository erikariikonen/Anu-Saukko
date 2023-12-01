if (command === 'poistaviestit') {
    try {
        // Extract the maximum number of messages to delete from the command
        const args = message.content.split(' ');
        const maxToDelete = parseInt(args[1]) || 100; // Default to 100 if no argument is provided

        let totalDeleted = 0;
        let beforeMessageId = '1180068784992686080';

        while (totalDeleted < maxToDelete) {
            const messages = await message.channel.messages.fetch({ limit: 100, before: beforeMessageId });
            const botOwnMessages = messages.filter(m => m.author.id === client.user.id);

            if (botOwnMessages.size === 0) {
                break;
            }

            for (const msg of botOwnMessages.values()) {
                await msg.delete();
                totalDeleted++;

                await new Promise(resolve => setTimeout(resolve, 1000));

                if (totalDeleted % 20 === 0) {
                    console.log(`Deleted ${totalDeleted} messages...`);
                }
            }

            beforeMessageId = botOwnMessages.lastKey();
        }

        console.log(`Total messages deleted: ${totalDeleted}`);
    } catch (error) {
        console.error(`Error clearing messages: ${error}`);
    }
}
