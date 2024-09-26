function formatMessage(role, message) {
    return `${role}: ${message}`;
}

function formatPrevMessages(messageArr) {
    let formattedArr = [];
    messageArr.forEach((message) => {
        console.log(message.author.username)
        formattedArr.push(formatMessage(
            message.author.username
                .replace(/\s+/g, '_')
                .replace(/[^\w\s]/gi, ''), 
            message.content
        ));
    });
    return formattedArr.join('\n');
}

module.exports = { formatPrevMessages, formatMessage };