// This file provides functions to connect to the server for ollama comms.
import config from '../config.json' with { type: "json" };
const endpoint = config.endpoint;

export const generateResponse = async (message) => {
    const response = await fetch(`http://${endpoint}:3030/francium`, {
        method: 'POST',
        body: JSON.stringify({
            message: message
        }),
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (response.statusCode == 500) {
        console.log("Error in API request: ", response.error);
        return;
    }

    const responseJSON = await response.json();

    return responseJSON;
}