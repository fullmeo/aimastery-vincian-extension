import * as vscode from 'vscode';
import fetch from 'node-fetch';

const BACKEND_API_URL = 'https://aimastery-backend-ku8lgf82f-aimastery.vercel.app';
let outputChannel: vscode.OutputChannel;

export class AIMasteryAPITester {
    private baseUrl = 'https://aimastery-backend-ku8lgf82f-aimastery.vercel.app';

    async testUserPlan(userId: string = 'test123') {
        try {
            const response = await fetch(`${this.baseUrl}/api/user/${userId}/plan`);
            const data = await response.json();
            
            vscode.window.showInformationMessage(
                `Plan utilisateur ${userId}: ${JSON.stringify(data)}`
            );
            
            return data;
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur API: ${error}`);
            return null;
        }
    }

    async testUpgrade(planType: 'social_pack' | 'pro_vincien', userId: string = 'test123') {
        try {
            const response = await fetch(`${this.baseUrl}/api/payments/create-checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planType,
                    userId
                })
            });

            const data = await response.json() as any;
            
            vscode.window.showInformationMessage(
                `Upgrade ${planType}: ${data.url || 'Succes'}`
            );
            
            return data;
        } catch (error) {
            vscode.window.showErrorMessage(`Erreur upgrade: ${error}`);
            return null;
        }
    }
}

export function initializeAPITester(channel: vscode.OutputChannel) {
    outputChannel = channel;
}

export const testAPICommand = vscode.commands.registerCommand('aimastery.testAPI', async () => {
    try {
        if (!outputChannel) {
            outputChannel = vscode.window.createOutputChannel('AIMastery API Test');
        }
        
        outputChannel.appendLine('Testing AIMastery Backend API...');
        
        const response = await fetch(`${BACKEND_API_URL}/api/user/test123/plan`);
        const data = await response.json();
        
        vscode.window.showInformationMessage(
            `API Success! Plan: ${JSON.stringify(data)}`,
            'Test Social Pack',
            'Test Pro Vincien'
        ).then(selection => {
            if (selection === 'Test Social Pack') {
                vscode.commands.executeCommand('aimastery.testSocialPack');
            } else if (selection === 'Test Pro Vincien') {
                vscode.commands.executeCommand('aimastery.testProVincien');
            }
        });
        
        outputChannel.appendLine(`API Response: ${JSON.stringify(data)}`);
    } catch (error) {
        vscode.window.showErrorMessage(`API Failed: ${error}`);
        if (outputChannel) {
            outputChannel.appendLine(`API Error: ${error}`);
        }
    }
});