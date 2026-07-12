const Anthropic = require('@anthropic-ai/sdk');

// The Worden Paving Constants
const ASPHALT_DENSITY = 115; // lbs per square yard per inch
const STONE_BASE_COST_PER_TON = 28.50; 
const ASPHALT_COST_PER_TON = 85.00;

exports.handler = async (event) => {
  let address, sqft, soilType, region;
  try {
    ({ address, sqft, soilType, region } = JSON.parse(event.body));
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request data. Please provide address, sqft, soilType, and region.' }),
    };
  }

  // 1. Regional Logic Gate
  let depthSpec = 2; // Default residential
  let stoneBaseDepth = 4; // Default
  
  if (region === 'Chicago' || region === 'Illinois') {
    depthSpec = 3; // Frost-Heave Heavy Duty
    stoneBaseDepth = 8;
  } else if (soilType === 'Clay' || region === '23221') {
    stoneBaseDepth = 6; // Worden Clay Stabilization
  }

  // 2. The Yield Math
  const asphaltTons = (sqft * depthSpec * ASPHALT_DENSITY) / 2000;
  const stoneTons = (sqft * (stoneBaseDepth / 12) * 150) / 2000; // 150lb/cuft for stone

  // 3. The Claude Intelligent Proposal Engine
  try {
    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      system: "You are the J. Worden Paving Estimator. Write in a professional, 4th-generation contractor tone.",
      messages: [{
        role: "user",
        content: `Create a bid for ${address}. Specs: ${sqft}sqft, ${depthSpec}" Asphalt, ${stoneBaseDepth}" Stone Base. Mention why our ${region} engineering prevents failure.`
      }]
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        estimate: response.content[0].text,
        metrics: { asphaltTons, stoneTons, totalProjected: (asphaltTons * ASPHALT_COST_PER_TON) + (stoneTons * STONE_BASE_COST_PER_TON) }
      })
    };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unable to generate estimate. Please try again or contact us directly at 804-446-1296.' }),
    };
  }
};
