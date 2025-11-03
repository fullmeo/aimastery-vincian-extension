const axios = require('axios');

async function testConnections() {
    console.log('🧪 Testing Reaper Toolkit connections...');
    
    try {
        const response = await axios.get('http://localhost:3000/status');
        console.log('✅ Bridge Server: Connected');
        console.log(`📊 Status:`, response.data);
        
        // Test sending analysis
        const testAnalysis = {
            codeHealthScore: 0.85,
            audioPatterns: [
                { name: 'async/await', frequency: 5 },
                { name: 'error handling', frequency: 3 }
            ]
        };
        
        await axios.post('http://localhost:3000/vscode/analysis', testAnalysis);
        console.log('✅ Analysis sending: Success');
        
    } catch (error) {
        console.log('❌ Bridge Server: Connection failed');
        console.log('💡 Make sure to run: ./start-bridge.sh');
    }
}

testConnections();
