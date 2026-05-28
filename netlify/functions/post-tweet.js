import { TwitterApi } from 'twitter-api-v2';

export const handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Check for required environment variables
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Twitter API credentials not configured' }),
    };
  }

  try {
    // Parse the request body
    const { text } = JSON.parse(event.body);

    if (!text || typeof text !== 'string' || text.length > 280) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid tweet text. Must be a string under 280 characters.' }),
      };
    }

    // Initialize Twitter client
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    });

    // Post the tweet
    const tweet = await client.v2.tweet(text);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        tweet: {
          id: tweet.data.id,
          text: tweet.data.text,
        },
      }),
    };
  } catch (error) {
    console.error('Twitter API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to post tweet',
        details: error.message,
      }),
    };
  }
};