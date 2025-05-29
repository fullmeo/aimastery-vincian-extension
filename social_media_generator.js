const { Configuration, OpenAIApi } = require('openai');

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

async function generateSocialMediaPack(analysisData) {
  const pack = {};
  
  // Instagram Story
  pack.instagram = {
    caption: await generateInstagramCaption(analysisData),
    hashtags: generateHashtags(analysisData),
    visualElements: await generateVisualElements(analysisData, 'instagram')
  };
  
  // LinkedIn Post
  pack.linkedin = {
    post: await generateLinkedInPost(analysisData),
    professionalInsights: generateProfessionalInsights(analysisData)
  };
  
  // TikTok Content
  pack.tiktok = {
    script: await generateTikTokScript(analysisData),
    trending_sounds: suggestTrendingSounds(analysisData),
    effects: suggestEffects(analysisData)
  };
  
  // YouTube Elements
  pack.youtube = {
    title: await generateYouTubeTitle(analysisData),
    description: await generateYouTubeDescription(analysisData),
    thumbnail: await generateThumbnail(analysisData)
  };
  
  return pack;
}

async function generateInstagramCaption(analysisData) {
  const prompt = `
    Créer une caption Instagram engageante pour une analyse musicale cymatique.
    Score Da Vinci: ${analysisData.vincianScore}/10
    Golden Ratio: ${analysisData.goldenRatioScore}
    
    Style: Inspirant, mystique, éducatif
    Inclure: émojis pertinents, call-to-action, aspect artistique
  `;
  
  const response = await openai.createCompletion({
    model: "gpt-3.5-turbo",
    prompt,
    max_tokens: 200
  });
  
  return response.data.choices[0].text.trim();
}

module.exports = { generateSocialMediaPack };