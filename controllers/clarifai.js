import fetch from 'node-fetch';

/*Peparing the API request from Clarifai*/
/*
  We are sending a POST request to send data to the Clarifai face-detection endpoint (method: 'Post')
  In headers, we we specify what kinf of data we send and include the API key (Authorization)
  body: rwa is the actual data we are sending. 
  Raw is created with a JSON.stringify(), which turn a JavaScript Object into a JSON string -> that JSON describes: who we are (user_id, app_id) and what image Clarifai should analyze.
*/

const buildClarifaiRequestOptions = (imageURL) => {
  const PAT = process.env.CLARIFAI_PAT;
  const USER_ID = process.env.CLARIFAI_USER_ID;
  const APP_ID = process.env.CLARIFAI_APP_ID;

  const raw = JSON.stringify({
    "user_app_id": {
        "user_id": USER_ID,
        "app_id": APP_ID
    },
    "inputs": [
        {
            "data": {
                "image": {
                    "url": imageURL
                }
            }
        }
    ]
  });

  const requestOptions = {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Authorization': 'Key ' + PAT
    },
    body: raw
  };

  return requestOptions;
}

const handleClarifaiAPI = async (URL) => {
    const REQUEST_OPTIONS = buildClarifaiRequestOptions(URL);
    const MODEL_ID = 'face-detection';
    const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105';

    const response = await fetch(
      `https://api.clarifai.com/v2/models/${MODEL_ID}/versions/${MODEL_VERSION_ID}/outputs`,
      REQUEST_OPTIONS
    );

    return await response.json();
}

export { handleClarifaiAPI };