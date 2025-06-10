const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  try {
    const path = event.path || event.pathParameters?.proxy || '';
    const method = event.httpMethod;

    // Route handling
    if (path.includes('/api/usage') || path === '/api/usage') {
      if (method === 'GET') {
        return await getUsageStats();
      } else if (method === 'POST') {
        return await incrementUsage();
      }
    }

    // Health check endpoint
    if (path.includes('/api/health') || path === '/api/health') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: 'kube-composer-api'
        })
      };
    }

    // Default response for unknown routes
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Not Found',
        message: `Route ${method} ${path} not found`
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};

async function getUsageStats() {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: 'usage-counter' }
    };

    const result = await dynamodb.get(params).promise();
    
    const stats = result.Item || {
      id: 'usage-counter',
      totalGenerations: 0,
      lastUpdated: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        totalGenerations: stats.totalGenerations || 0,
        lastUpdated: stats.lastUpdated || new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    throw error;
  }
}

async function incrementUsage() {
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: 'usage-counter' },
      UpdateExpression: 'ADD totalGenerations :inc SET lastUpdated = :timestamp',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':timestamp': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(params).promise();

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        totalGenerations: result.Attributes.totalGenerations,
        lastUpdated: result.Attributes.lastUpdated
      })
    };
  } catch (error) {
    console.error('Error incrementing usage:', error);
    throw error;
  }
}