const { ethers } = require('ethers');
const { create } = require('ipfs-http-client');
const Canvas = require('canvas');
const sharp = require('sharp');

async function generateNFT(analysisData) {
  // 1. Créer l'artwork cymatique unique
  const artwork = await generateCymaticArt(analysisData);
  
  // 2. Calculer la rareté basée sur Golden Ratio
  const rarity = calculateVincianRarity(analysisData.goldenRatioScore);
  
  // 3. Métadonnées NFT
  const metadata = {
    name: `Cymatic Pattern #${Date.now()}`,
    description: `Generated from audio analysis with Vincian Score: ${analysisData.vincianScore}`,
    attributes: [
      { trait_type: "Vincian Score", value: analysisData.vincianScore },
      { trait_type: "Golden Ratio", value: analysisData.goldenRatioScore },
      { trait_type: "Rarity", value: rarity },
      { trait_type: "Sfumato Level", value: analysisData.sfumatoLevel }
    ],
    image: artwork.ipfsHash
  };
  
  // 4. Prix dynamique selon rareté
  const price = calculateNFTPrice(rarity); // 5-50€
  
  return {
    metadata,
    price,
    rarity,
    mintingUrl: `https://opensea.io/mint/${metadata.contract}`
  };
}

async function generateCymaticArt(analysisData) {
  const canvas = Canvas.createCanvas(1024, 1024);
  const ctx = canvas.getContext('2d');
  
  // Fond dégradé basé sur Vincian Score
  const gradient = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
  gradient.addColorStop(0, `hsl(${analysisData.vincianScore * 36}, 70%, 50%)`);
  gradient.addColorStop(1, `hsl(${analysisData.vincianScore * 36}, 30%, 20%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 1024);
  
  // Pattern cymatique basé sur Golden Ratio
  const centerX = 512, centerY = 512;
  const goldenRatio = 1.618;
  
  for (let i = 0; i < analysisData.frequencyData.length; i++) {
    const angle = (i / analysisData.frequencyData.length) * Math.PI * 2;
    const radius = analysisData.frequencyData[i] * goldenRatio;
    
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${angle * 57.3}, 80%, 60%, 0.7)`;
    ctx.fill();
  }
  
  // Upload vers IPFS
  const buffer = canvas.toBuffer('image/png');
  const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
  const result = await ipfs.add(buffer);
  
  return {
    ipfsHash: result.path,
    imageUrl: `https://ipfs.io/ipfs/${result.path}`
  };
}

function calculateVincianRarity(goldenRatioScore) {
  if (goldenRatioScore >= 0.95) return "Legendary";
  if (goldenRatioScore >= 0.85) return "Epic";
  if (goldenRatioScore >= 0.70) return "Rare";
  if (goldenRatioScore >= 0.50) return "Uncommon";
  return "Common";
}

function calculateNFTPrice(rarity) {
  const basePrices = {
    "Legendary": 50,
    "Epic": 25,
    "Rare": 15,
    "Uncommon": 8,
    "Common": 5
  };
  return basePrices[rarity];
}

module.exports = { generateNFT, generateCymaticArt, calculateVincianRarity };