
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

function getProcessStatistics(command, args = [], timeout = Infinity) {

    const startTime = new Date();
    
    const timestamp = startTime.toISOString().replace(/:/g, '-');
    const logFileName = `${timestamp}${command}.json`;
    const logFilePath = path.join('logs', logFileName);

    const logData = {
        start: startTime.toISOString(),
        duration: null,
        success: false,
        commandSuccess: false,
        error: null,
    };

    const process = spawn(command, args);

    return new Promise((resolve) => {
        let processCompleted = false;

        // Handle process completion
        process.on('close', (code) => {
            const endTime = new Date();

            logData.duration = endTime - startTime;
            logData.success = code === 0;
            logData.commandSuccess = !!logData.success;

            if (!processCompleted) {
                processCompleted = true;
                writeLogData(logFilePath, logData);
                resolve(logData);
            }
        });

        // Handle process error
        process.on('error', (error) => {
            logData.error = error.message;
            //logData.commandSuccess = true;

            if (!processCompleted) {
                processCompleted = true;
                writeLogData(logFilePath, logData);
                resolve(logData);
            }
        });

        // Handle timeout
        if (timeout !== Infinity) {
            setTimeout(() => {
                if (!processCompleted) {
                    process.kill();
                    logData.error = `Process timed out after ${timeout} milliseconds.`;
                    writeLogData(logFilePath, logData);
                    resolve(logData);
                }
            }, timeout);
        }
    });
}

function writeLogData(filePath, data) {
    const logDirectory = path.dirname(filePath);

    if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}



// Usage example
getProcessStatistics('ls', ['-l']).then((stats) => {
    console.log('Process Statistics:', stats);
}).catch((error) => {
    console.error('An error occurred:', error);
});

