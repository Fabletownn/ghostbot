module.exports = (client) => {
    const consoleError = console.error;
    const errorLog = (type, error) => {
        const unixTS = `<t:${Math.round(Date.now() / 1000)}:F>`;
        const errorMessage = (error instanceof Error ? `${error.stack}` : `${error}`);
        const logChannel = client.channels.cache.get('1029169352378941502');

        if (logChannel) return logChannel.send({ content: `${unixTS} **${type}** error log:\n\`\`\`${errorMessage}\`\`\`` });
    };

    process.on('unhandledRejection', (reason, promise) => {
        trailError(reason, promise);
        errorLog('Unhandled Rejection', reason);
    });

    process.on('uncaughtException', (error) => {
        trailError(error);
        errorLog('Uncaught Exception', error);
    });

    process.on('uncaughtExceptionMonitor', (error) => {
        trailError(error);
        errorLog('Monitor', error);
    });

    process.on('rejectionHandled', (promise) => {
        trailError(promise);
        errorLog('Promise Rejection', promise);
    });

    console.error = (...args) => {
        consoleError.apply(console, args);

        args.forEach((arg) => errorLog('Console Error', arg));
    };
};