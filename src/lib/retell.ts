import { RetellWebClient } from 'retell-client-js-sdk';

const retellWebClient = new RetellWebClient();

export const initializeRetellClient = () => {
    retellWebClient.on('call_started', () => {
        console.log('call started');
    });

    retellWebClient.on('call_ended', () => {
        console.log('call ended');
    });

    retellWebClient.on('agent_start_talking', () => {
        console.log('agent_start_talking');
    });

    retellWebClient.on('agent_stop_talking', () => {
        console.log('agent_stop_talking');
    });

    retellWebClient.on('audio', audio => {
        // Handle audio data if needed
    });

    retellWebClient.on('update', update => {
        // Handle updates if needed
    });

    retellWebClient.on('metadata', metadata => {
        // Handle metadata if needed
    });

    retellWebClient.on('error', error => {
        console.error('An error occurred:', error);
        retellWebClient.stopCall();
    });

    return retellWebClient;
};

export const registerCall = async (agentId: string) => {
    try {
        const response = await fetch('http://localhost:8080/create-web-call', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agent_id: agentId
            })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Error registering call:', err);
        throw err;
    }
};