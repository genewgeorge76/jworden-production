import { TwitterApi } from 'twitter-api-v2';

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // dryRun support — skip the actual tweet post and just return what *would* be posted.
  // Use ?dryRun=1 in the URL or {"dryRun":true} in the JSON body to verify creds + Grok
  // without spamming the X timeline.
  const queryDryRun = event.queryStringParameters && event.queryStringParameters.dryRun;
  let bodyDryRun = false;
  try {
    if (event.body) {
      const parsed = JSON.parse(event.body);
      bodyDryRun = parsed && parsed.dryRun === true;
    }
  } catch {
    // body wasn't JSON — ignore
  }
  const dryRun = Boolean(queryDryRun) || bodyDryRun;

  // Check for required environment variables
  const xaiApiKey = process.env.XAI_API_KEY;
  const twitterApiKey = process.env.TWITTER_API_KEY;
  const twitterApiSecret = process.env.TWITTER_API_SECRET;
  const twitterAccessToken = process.env.TWITTER_ACCESS_TOKEN;
  const twitterAccessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  // In dryRun, only require XAI key; report Twitter creds presence in response.
  const credsPresent = {
    XAI_API_KEY: Boolean(xaiApiKey),
    TWITTER_API_KEY: Boolean(twitterApiKey),
    TWITTER_API_SECRET: Boolean(twitterApiSecret),
    TWITTER_ACCESS_TOKEN: Boolean(twitterAccessToken),
    TWITTER_ACCESS_TOKEN_SECRET: Boolean(twitterAccessTokenSecret),
  };

  if (dryRun) {
    if (!xaiApiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'XAI_API_KEY not configured', dryRun: true, credsPresent }),
      };
    }
  } else if (!xaiApiKey || !twitterApiKey || !twitterApiSecret || !twitterAccessToken || !twitterAccessTokenSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API credentials not configured', credsPresent }),
    };
  }

  try {
    // Generate tweet content using Grok
    const prompt = "Generate a short, engaging tweet (under 280 characters) about asphalt paving tips, industry news, or construction advice for J Worden & Sons Asphalt Paving. Make it professional and helpful.";
    
    const grokResponse = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4.3',
        max_output_tokens: 300,
        stream: false,
        input: prompt,
      }),
    });

    if (!grokResponse.ok) {
      throw new Error(`Grok API error: ${grokResponse.status} ${grokResponse.statusText}`);
    }

    const grokData = await grokResponse.json();
    // Grok-4 reasoning models return an array of output blocks. The first block
    // can be a "reasoning" summary; the actual assistant message lives in the
    // first block whose type === "message" (or any block exposing content[].text).
    // Falling back to grokData.response keeps compatibility with older shapes.
    const extractGrokText = (data) => {
      if (!data) return '';
      if (typeof data.response === 'string') return data.response;
      const blocks = Array.isArray(data.output) ? data.output : [];
      for (const block of blocks) {
        if (block?.type === 'message' && Array.isArray(block.content)) {
          const piece = block.content.find((c) => typeof c?.text === 'string' && c.text.trim());
          if (piece) return piece.text;
        }
      }
      // Last-resort scan: any block with content[].text (skips reasoning summaries).
      for (const block of blocks) {
        if (block?.type === 'reasoning') continue;
        if (Array.isArray(block?.content)) {
          const piece = block.content.find((c) => typeof c?.text === 'string' && c.text.trim());
          if (piece) return piece.text;
        }
      }
      return '';
    };
    const tweetText = extractGrokText(grokData).trim();

    if (!tweetText || tweetText.length > 280) {
      // In dryRun, return the raw Grok payload so we can see what shape it actually returned.
      if (dryRun) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: false,
            dryRun: true,
            reason: !tweetText ? 'empty_text' : 'too_long',
            extractedText: tweetText,
            extractedLength: tweetText.length,
            credsPresent,
            rawGrokResponse: grokData,
          }),
        };
      }
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Generated tweet is invalid or too long' }),
      };
    }

    // dryRun: stop here — verified Grok works without posting to X.
    if (dryRun) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          dryRun: true,
          generated: tweetText,
          credsPresent,
          note: 'Grok generated tweet successfully. Tweet was NOT posted to X. Remove dryRun to post live.',
        }),
      };
    }

    // Initialize Twitter client
    const client = new TwitterApi({
      appKey: twitterApiKey,
      appSecret: twitterApiSecret,
      accessToken: twitterAccessToken,
      accessSecret: twitterAccessTokenSecret,
    });

    // Post the tweet
    const tweet = await client.v2.tweet(tweetText);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        tweet: {
          id: tweet.data.id,
          text: tweet.data.text,
        },
        generated: tweetText,
      }),
    };
  } catch (error) {
    console.error('Auto-post error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate and post tweet',
        details: error.message,
      }),
    };
  }
};